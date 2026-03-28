/**
 * 密码备份服务
 * 支持 Telegram 通知和 GitHub 加密存储
 */

import axios from "axios";
import { encode } from "js-base64";
import type { TelegramConfig, PasswordNotifyPayload } from "../notify/telegram";
import { sendPasswordToTelegram } from "../notify/telegram";
import { GithubTokenKey } from "~/utils/common/constants";
import config from "~~/config";

export interface PasswordBackupConfig {
  telegram?: TelegramConfig;
  github?: GithubBackupConfig;
}

export interface GithubBackupConfig {
  enabled: boolean;
  owner: string;
  repo: string;
  branch: string;
  basePath: string;
  masterKey: string;
}

// 内容类型到文件名的映射
const CONTENT_TYPE_FILES: Record<string, string> = {
  article: "articles.json",
  record: "records.json",
  knowledge: "knowledges.json"
};

export interface PasswordBackupEntry {
  id: number;
  contentType: "article" | "knowledge" | "record";
  title?: string;
  password: string;
  encryptedPassword: string;
  isNew: boolean;
  timestamp: number;
  date: string;
}

export interface PasswordBackupData {
  version: number;
  lastUpdated: number;
  entries: PasswordBackupEntry[];
}

// 简单的 XOR 加密（用于演示，生产环境建议使用更强的加密）
function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encryptedText: string, key: string): string {
  const text = atob(encryptedText);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * 获取 GitHub API 基础 URL
 */
function getGithubApiUrl(): string {
  return config.githubApiUrl || "https://api.github.com";
}

/**
 * 获取 GitHub Token
 * 优先从 localStorage 读取，如果不存在则尝试使用 useGithubToken
 */
function getGithubToken(): string {
  // 首先尝试从 localStorage 读取
  if (typeof localStorage !== "undefined") {
    const token = localStorage.getItem(GithubTokenKey);
    if (token) {
      return token;
    }
  }

  // 备选：尝试使用 useGithubToken（如果在 Vue 上下文中）
  try {
    return useGithubToken().value;
  } catch {
    return "";
  }
}

/**
 * 获取文件内容（如果存在）
 */
async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const token = getGithubToken();
    console.log("[PasswordBackup] Getting file content:", { owner, repo, path, branch });
    console.log("[PasswordBackup] Token available:", !!token);

    const response = await axios.get(
      `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: { Authorization: `token ${token}` }
      }
    );

    console.log("[PasswordBackup] File content retrieved successfully");
    return {
      content: atob(response.data.content.replace(/\n/g, "")),
      sha: response.data.sha
    };
  } catch (error: any) {
    console.log("[PasswordBackup] Get file error:", error.response?.status, error.response?.data?.message);
    console.log("[PasswordBackup] Error details:", error.message);
    if (error.response?.status === 404) {
      console.log("[PasswordBackup] File not found (404)");
      return null;
    }
    console.log("[PasswordBackup] Throwing error");
    throw error;
  }
}

/**
 * 创建或更新文件
 */
async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string,
  sha?: string
): Promise<void> {
  const token = getGithubToken();
  const body: any = {
    message,
    content: encode(content),
    branch
  };

  if (sha) {
    body.sha = sha;
  }

  console.log("[PasswordBackup] Creating/updating file:", { owner, repo, path, branch, hasSha: !!sha });
  console.log("[PasswordBackup] API URL:", `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}`);
  console.log("[PasswordBackup] Token available:", !!token);

  try {
    await axios.put(
      `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}`,
      body,
      {
        headers: { Authorization: `token ${token}` }
      }
    );
    console.log("[PasswordBackup] File created/updated successfully");
  } catch (error: any) {
    console.error("[PasswordBackup] Create/update file failed:", error);
    console.error("[PasswordBackup] Error status:", error.response?.status);
    console.error("[PasswordBackup] Error message:", error.response?.data?.message);
    throw error;
  }
}

/**
 * 获取类型对应的文件路径
 */
function getTypeFilePath(basePath: string, contentType: string): string {
  const filename = CONTENT_TYPE_FILES[contentType];
  if (!filename) {
    throw new Error(`Unknown content type: ${contentType}`);
  }
  return `${basePath}/${filename}`;
}

/**
 * 备份密码到 GitHub（按类型分别存储）
 */
async function backupToGithub(
  payload: PasswordNotifyPayload,
  githubConfig: GithubBackupConfig
): Promise<boolean> {
  console.log("[PasswordBackup] Starting GitHub backup:", {
    enabled: githubConfig.enabled,
    hasMasterKey: !!githubConfig.masterKey,
    owner: githubConfig.owner,
    repo: githubConfig.repo,
    contentType: payload.contentType
  });

  if (!githubConfig.enabled) {
    console.log("[PasswordBackup] GitHub backup disabled");
    return false;
  }

  if (!githubConfig.masterKey) {
    console.log("[PasswordBackup] No master key provided");
    return false;
  }

  if (!githubConfig.owner || !githubConfig.repo) {
    console.log("[PasswordBackup] Missing owner or repo");
    return false;
  }

  try {
    // 获取该类型对应的文件路径
    const filePath = getTypeFilePath(githubConfig.basePath, payload.contentType);
    console.log("[PasswordBackup] Target file:", filePath);

    // 获取现有备份数据
    console.log("[PasswordBackup] Fetching existing file...");
    const existingFile = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      filePath,
      githubConfig.branch
    );

    let backupData: PasswordBackupData;

    if (existingFile) {
      console.log("[PasswordBackup] Existing file found, parsing...");
      try {
        backupData = JSON.parse(existingFile.content);
      } catch {
        console.log("[PasswordBackup] Failed to parse existing file, creating new");
        backupData = {
          version: 1,
          lastUpdated: Date.now(),
          entries: []
        };
      }
    } else {
      console.log("[PasswordBackup] No existing file, creating new");
      backupData = {
        version: 1,
        lastUpdated: Date.now(),
        entries: []
      };
    }

    // 创建新条目
    console.log("[PasswordBackup] Creating new entry for:", payload.contentType, "#", payload.id);
    const newEntry: PasswordBackupEntry = {
      id: payload.id,
      contentType: payload.contentType,
      title: payload.title,
      password: payload.password,
      encryptedPassword: xorEncrypt(payload.password, githubConfig.masterKey),
      isNew: payload.isNew,
      timestamp: payload.timestamp,
      date: new Date(payload.timestamp).toISOString()
    };

    // 查找是否已存在相同 ID 的条目
    const existingIndex = backupData.entries.findIndex(
      e => e.id === payload.id
    );

    if (existingIndex >= 0) {
      console.log("[PasswordBackup] Updating existing entry at index:", existingIndex);
      backupData.entries[existingIndex] = newEntry;
    } else {
      console.log("[PasswordBackup] Adding new entry");
      backupData.entries.push(newEntry);
    }

    // 按时间倒序排序
    backupData.entries.sort((a, b) => b.timestamp - a.timestamp);

    // 更新最后更新时间
    backupData.lastUpdated = Date.now();

    // 保存到 GitHub
    console.log("[PasswordBackup] Saving to GitHub...");
    await createOrUpdateFile(
      githubConfig.owner,
      githubConfig.repo,
      filePath,
      JSON.stringify(backupData, null, 2),
      githubConfig.branch,
      `Backup password for ${payload.contentType} #${payload.id}`,
      existingFile?.sha
    );

    console.log("[PasswordBackup] GitHub backup successful!");
    return true;
  } catch (error: any) {
    console.error("[PasswordBackup] GitHub backup failed:", error);
    console.error("[PasswordBackup] Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}

/**
 * 主函数：发送密码备份
 */
export async function sendPasswordBackup(
  payload: PasswordNotifyPayload,
  backupConfig: PasswordBackupConfig
): Promise<{ telegram: boolean; github: boolean }> {
  console.log("[PasswordBackup] Starting password backup:", {
    contentType: payload.contentType,
    id: payload.id,
    hasTelegram: !!backupConfig.telegram,
    hasGithub: !!backupConfig.github,
    githubConfig: backupConfig.github
  });

  const results = {
    telegram: false,
    github: false
  };

  // 发送 Telegram 通知
  if (backupConfig.telegram) {
    console.log("[PasswordBackup] Telegram config:", {
      enabled: backupConfig.telegram.enabled,
      hasBotToken: !!backupConfig.telegram.botToken,
      hasChatId: !!backupConfig.telegram.chatId
    });

    if (backupConfig.telegram.enabled) {
      try {
        results.telegram = await sendPasswordToTelegram(payload, backupConfig.telegram);
        console.log("[PasswordBackup] Telegram result:", results.telegram);
      } catch (error) {
        console.error("[PasswordBackup] Telegram backup failed:", error);
      }
    } else {
      console.log("[PasswordBackup] Telegram disabled");
    }
  } else {
    console.log("[PasswordBackup] No Telegram config");
  }

  // 备份到 GitHub
  if (backupConfig.github) {
    console.log("[PasswordBackup] GitHub config:", {
      enabled: backupConfig.github.enabled,
      owner: backupConfig.github.owner,
      repo: backupConfig.github.repo,
      hasMasterKey: !!backupConfig.github.masterKey
    });

    if (backupConfig.github.enabled) {
      try {
        results.github = await backupToGithub(payload, backupConfig.github);
        console.log("[PasswordBackup] GitHub result:", results.github);
      } catch (error) {
        console.error("[PasswordBackup] GitHub backup failed:", error);
      }
    } else {
      console.log("[PasswordBackup] GitHub disabled");
    }
  } else {
    console.log("[PasswordBackup] No GitHub config");
  }

  console.log("[PasswordBackup] Final results:", results);
  return results;
}

/**
 * 从 GitHub 获取指定类型的密码备份列表
 */
export async function getPasswordBackupsByType(
  githubConfig: GithubBackupConfig,
  contentType: "article" | "knowledge" | "record"
): Promise<PasswordBackupEntry[]> {
  console.log("[PasswordBackup] getPasswordBackupsByType called:", {
    enabled: githubConfig.enabled,
    contentType,
    basePath: githubConfig.basePath
  });

  if (!githubConfig.enabled) {
    console.log("[PasswordBackup] GitHub backup not enabled");
    return [];
  }

  try {
    const filePath = getTypeFilePath(githubConfig.basePath, contentType);
    console.log("[PasswordBackup] Fetching file:", filePath);

    const fileContent = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      filePath,
      githubConfig.branch
    );

    if (!fileContent) {
      console.log("[PasswordBackup] No file content received for type:", contentType);
      return [];
    }

    console.log("[PasswordBackup] Parsing file content...");
    const data: PasswordBackupData = JSON.parse(fileContent.content);
    console.log("[PasswordBackup] Parsed entries count:", data.entries?.length);

    // 解密密码
    if (githubConfig.masterKey) {
      console.log("[PasswordBackup] Decrypting passwords...");
      data.entries = data.entries.map(entry => ({
        ...entry,
        password: xorDecrypt(entry.encryptedPassword, githubConfig.masterKey)
      }));
    }

    console.log("[PasswordBackup] Returning entries:", data.entries?.length);
    return data.entries || [];
  } catch (error) {
    console.error("[PasswordBackup] Get password backups failed:", error);
    return [];
  }
}

/**
 * 从 GitHub 获取所有密码备份列表（兼容旧版本）
 */
export async function getPasswordBackups(
  githubConfig: GithubBackupConfig
): Promise<PasswordBackupData | null> {
  console.log("[PasswordBackup] getPasswordBackups called (legacy):", {
    enabled: githubConfig.enabled,
    owner: githubConfig.owner,
    repo: githubConfig.repo,
    basePath: githubConfig.basePath,
    branch: githubConfig.branch
  });

  if (!githubConfig.enabled) {
    console.log("[PasswordBackup] GitHub backup not enabled");
    return null;
  }

  try {
    // 尝试从新的分类型文件读取
    const allEntries: PasswordBackupEntry[] = [];

    for (const contentType of ["article", "record", "knowledge"] as const) {
      const entries = await getPasswordBackupsByType(githubConfig, contentType);
      allEntries.push(...entries);
    }

    // 按时间倒序排序
    allEntries.sort((a, b) => b.timestamp - a.timestamp);

    console.log("[PasswordBackup] Total entries from all types:", allEntries.length);

    return {
      version: 1,
      lastUpdated: Date.now(),
      entries: allEntries
    };
  } catch (error) {
    console.error("[PasswordBackup] Get password backups failed:", error);
    return null;
  }
}

/**
 * 获取内容类型名称
 */
export function getContentTypeName(type: "article" | "knowledge" | "record"): string {
  const map = {
    article: "文章",
    knowledge: "文化",
    record: "记录"
  };
  return map[type];
}

/**
 * 获取备份配置
 */
export function getBackupConfig(): PasswordBackupConfig {
  const cfg = config as any;
  return {
    telegram: cfg.telegramNotify,
    github: cfg.passwordBackupGithub
  };
}

/**
 * 更新密码（修改密码后重新加密所有内容）
 * @param entry 要更新的密码条目
 * @param newPassword 新密码
 * @param githubConfig GitHub 配置
 * @returns 是否成功
 */
export async function updatePassword(
  entry: PasswordBackupEntry,
  newPassword: string,
  githubConfig: GithubBackupConfig
): Promise<boolean> {
  if (!githubConfig.enabled || !githubConfig.masterKey) {
    console.error("[PasswordBackup] GitHub backup not enabled or no master key");
    return false;
  }

  try {
    console.log("[PasswordBackup] Updating password for:", entry.contentType, "#", entry.id);

    // 获取现有备份数据
    const existingFile = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
      githubConfig.branch
    );

    if (!existingFile) {
      console.error("[PasswordBackup] No existing backup file found");
      return false;
    }

    let backupData: PasswordBackupData;
    try {
      backupData = JSON.parse(existingFile.content);
    } catch {
      console.error("[PasswordBackup] Failed to parse existing backup file");
      return false;
    }

    // 查找要更新的条目
    const entryIndex = backupData.entries.findIndex(
      e => e.id === entry.id && e.contentType === entry.contentType
    );

    if (entryIndex < 0) {
      console.error("[PasswordBackup] Entry not found:", entry.contentType, "#", entry.id);
      return false;
    }

    // 更新密码
    const updatedEntry: PasswordBackupEntry = {
      ...backupData.entries[entryIndex],
      password: newPassword,
      encryptedPassword: xorEncrypt(newPassword, githubConfig.masterKey),
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    backupData.entries[entryIndex] = updatedEntry;
    backupData.lastUpdated = Date.now();

    // 保存到 GitHub
    await createOrUpdateFile(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
      JSON.stringify(backupData, null, 2),
      githubConfig.branch,
      `Update password for ${entry.contentType} #${entry.id}`,
      existingFile.sha
    );

    console.log("[PasswordBackup] Password updated successfully");
    return true;
  } catch (error) {
    console.error("[PasswordBackup] Update password failed:", error);
    return false;
  }
}

/**
 * 触发重新部署（通过创建空提交）
 * @param githubConfig GitHub 配置
 * @returns 是否成功
 */
export async function triggerRedeploy(githubConfig: GithubBackupConfig): Promise<boolean> {
  if (!githubConfig.enabled) {
    console.error("[PasswordBackup] GitHub backup not enabled");
    return false;
  }

  try {
    console.log("[PasswordBackup] Triggering redeploy...");

    const token = getGithubToken();

    // 创建触发部署的文件（.redeploy 文件，使用时间戳作为内容）
    const redeployPath = ".redeploy-trigger";
    const timestamp = Date.now().toString();

    // 先尝试获取现有文件（如果存在）
    let existingSha: string | undefined;
    try {
      const response = await axios.get(
        `${getGithubApiUrl()}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${redeployPath}?ref=${githubConfig.branch}`,
        {
          headers: { Authorization: `token ${token}` }
        }
      );
      existingSha = response.data.sha;
    } catch {
      // 文件不存在，忽略错误
    }

    // 创建或更新触发文件
    const body: any = {
      message: `Trigger redeploy at ${new Date().toISOString()}`,
      content: encode(timestamp),
      branch: githubConfig.branch
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    await axios.put(
      `${getGithubApiUrl()}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${redeployPath}`,
      body,
      {
        headers: { Authorization: `token ${token}` }
      }
    );

    console.log("[PasswordBackup] Redeploy triggered successfully");
    return true;
  } catch (error) {
    console.error("[PasswordBackup] Trigger redeploy failed:", error);
    return false;
  }
}

/**
 * 删除密码条目
 * @param entry 要删除的密码条目
 * @param githubConfig GitHub 配置
 * @returns 是否成功
 */
export async function deletePasswordEntry(
  entry: PasswordBackupEntry,
  githubConfig: GithubBackupConfig
): Promise<boolean> {
  if (!githubConfig.enabled) {
    console.error("[PasswordBackup] GitHub backup not enabled");
    return false;
  }

  try {
    console.log("[PasswordBackup] Deleting password entry:", entry.contentType, "#", entry.id);

    // 获取现有备份数据
    const existingFile = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
      githubConfig.branch
    );

    if (!existingFile) {
      console.error("[PasswordBackup] No existing backup file found");
      return false;
    }

    let backupData: PasswordBackupData;
    try {
      backupData = JSON.parse(existingFile.content);
    } catch {
      console.error("[PasswordBackup] Failed to parse existing backup file");
      return false;
    }

    // 过滤掉要删除的条目
    const originalLength = backupData.entries.length;
    backupData.entries = backupData.entries.filter(
      e => !(e.id === entry.id && e.contentType === entry.contentType)
    );

    if (backupData.entries.length === originalLength) {
      console.error("[PasswordBackup] Entry not found for deletion");
      return false;
    }

    backupData.lastUpdated = Date.now();

    // 保存到 GitHub
    await createOrUpdateFile(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
      JSON.stringify(backupData, null, 2),
      githubConfig.branch,
      `Delete password for ${entry.contentType} #${entry.id}`,
      existingFile.sha
    );

    console.log("[PasswordBackup] Password entry deleted successfully");
    return true;
  } catch (error) {
    console.error("[PasswordBackup] Delete password entry failed:", error);
    return false;
  }
}
