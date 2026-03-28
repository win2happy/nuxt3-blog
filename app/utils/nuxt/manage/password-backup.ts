/**
 * 密码备份服务
 * 支持 Telegram 通知和 GitHub 加密存储
 */

import axios from "axios";
import { encode } from "js-base64";
import type { TelegramConfig, PasswordNotifyPayload } from "../notify/telegram";
import { sendPasswordToTelegram } from "../notify/telegram";
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
  filePath: string;
  masterKey: string;
}

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
 */
function getGithubToken(): string {
  return useGithubToken().value;
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
    if (error.response?.status === 404) {
      return null;
    }
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

  await axios.put(
    `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}`,
    body,
    {
      headers: { Authorization: `token ${token}` }
    }
  );

  console.log("[PasswordBackup] File created/updated successfully");
}

/**
 * 备份密码到 GitHub（加密存储）
 */
async function backupToGithub(
  payload: PasswordNotifyPayload,
  githubConfig: GithubBackupConfig
): Promise<boolean> {
  console.log("[PasswordBackup] Starting GitHub backup:", {
    enabled: githubConfig.enabled,
    hasMasterKey: !!githubConfig.masterKey,
    owner: githubConfig.owner,
    repo: githubConfig.repo
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
    // 获取现有备份数据
    console.log("[PasswordBackup] Fetching existing file...");
    const existingFile = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
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

    // 查找是否已存在相同 ID 和类型的条目
    const existingIndex = backupData.entries.findIndex(
      e => e.id === payload.id && e.contentType === payload.contentType
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
      githubConfig.filePath,
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
    hasGithub: !!backupConfig.github
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
 * 从 GitHub 获取密码备份列表
 */
export async function getPasswordBackups(
  githubConfig: GithubBackupConfig
): Promise<PasswordBackupData | null> {
  if (!githubConfig.enabled) {
    return null;
  }

  try {
    const fileContent = await getFileContent(
      githubConfig.owner,
      githubConfig.repo,
      githubConfig.filePath,
      githubConfig.branch
    );

    if (!fileContent) {
      return null;
    }

    const data: PasswordBackupData = JSON.parse(fileContent.content);

    // 解密密码
    if (githubConfig.masterKey) {
      data.entries = data.entries.map(entry => ({
        ...entry,
        password: xorDecrypt(entry.encryptedPassword, githubConfig.masterKey)
      }));
    }

    return data;
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
