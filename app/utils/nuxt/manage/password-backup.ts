/**
 * 密码备份服务
 * 支持 Telegram 通知和 GitHub 加密存储
 * 按内容类型（文章/记录/文化）分别存储，支持文件分片
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
  maxEntriesPerFile?: number;
  maxFileSizeKB?: number;
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
  fileIndex?: number;
  totalFiles?: number;
}

export interface FileShardInfo {
  path: string;
  sha: string;
  entryCount: number;
  fileSize: number;
  fileIndex: number;
}

// 内容类型到文件名的映射
const CONTENT_TYPE_FILE_MAP: Record<string, string> = {
  article: "articles",
  record: "records",
  knowledge: "knowledges"
};

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
 * 获取内容类型对应的文件名前缀
 */
function getContentTypeFileName(contentType: string): string {
  return CONTENT_TYPE_FILE_MAP[contentType] || "others";
}

/**
 * 获取目录下的所有文件列表
 */
async function getDirectoryContents(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<any[]> {
  try {
    const token = getGithubToken();
    const response = await axios.get(
      `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: { Authorization: `token ${token}` }
      }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
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
): Promise<{ content: string; sha: string; size: number } | null> {
  try {
    const token = getGithubToken();
    console.log("[PasswordBackup] Getting file content:", { owner, repo, path, branch });

    const response = await axios.get(
      `${getGithubApiUrl()}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: { Authorization: `token ${token}` }
      }
    );

    console.log("[PasswordBackup] File content retrieved successfully");
    return {
      content: atob(response.data.content.replace(/\n/g, "")),
      sha: response.data.sha,
      size: response.data.size || 0
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
 * 获取指定内容类型的所有文件分片信息
 */
async function getContentTypeShards(
  owner: string,
  repo: string,
  basePath: string,
  contentType: string,
  branch: string
): Promise<FileShardInfo[]> {
  const filePrefix = getContentTypeFileName(contentType);
  console.log("[PasswordBackup] getContentTypeShards:", { contentType, filePrefix });
  const dirPath = `${basePath}/${filePrefix}`;

  try {
    const files = await getDirectoryContents(owner, repo, dirPath, branch);
    const shards: FileShardInfo[] = [];

    for (const file of files) {
      if (file.type === "file" && file.name.endsWith(".json")) {
        const match = file.name.match(/^(\w+)-(\d+)\.json$/);
        if (match) {
          shards.push({
            path: file.path,
            sha: file.sha,
            entryCount: 0,
            fileSize: file.size || 0,
            fileIndex: parseInt(match[2], 10)
          });
        }
      }
    }

    // 按文件索引排序
    shards.sort((a, b) => a.fileIndex - b.fileIndex);
    return shards;
  } catch {
    console.log("[PasswordBackup] No existing shards found for:", contentType);
    return [];
  }
}

/**
 * 获取最新的文件分片（用于写入新数据）
 */
async function getLatestShard(
  owner: string,
  repo: string,
  basePath: string,
  contentType: string,
  branch: string,
  maxEntriesPerFile: number,
  maxFileSizeKB: number
): Promise<{ shard: FileShardInfo | null; data: PasswordBackupData | null }> {
  const shards = await getContentTypeShards(owner, repo, basePath, contentType, branch);

  if (shards.length === 0) {
    return { shard: null, data: null };
  }

  // 获取最后一个分片
  const latestShard = shards[shards.length - 1];
  const fileContent = await getFileContent(owner, repo, latestShard.path, branch);

  if (!fileContent) {
    return { shard: null, data: null };
  }

  try {
    const data: PasswordBackupData = JSON.parse(fileContent.content);
    latestShard.entryCount = data.entries?.length || 0;

    // 检查是否需要创建新分片
    const shouldCreateNewShard = (
      (maxEntriesPerFile > 0 && latestShard.entryCount >= maxEntriesPerFile)
      || (maxFileSizeKB > 0 && latestShard.fileSize >= maxFileSizeKB * 1024)
    );

    if (shouldCreateNewShard) {
      console.log("[PasswordBackup] Creating new shard, current shard is full:", {
        entries: latestShard.entryCount,
        size: latestShard.fileSize
      });
      return { shard: null, data: null };
    }

    return { shard: latestShard, data };
  } catch {
    return { shard: null, data: null };
  }
}

/**
 * 创建新的文件分片
 */
async function createNewShard(
  owner: string,
  repo: string,
  basePath: string,
  contentType: string,
  branch: string,
  shards: FileShardInfo[]
): Promise<{ shard: FileShardInfo; data: PasswordBackupData }> {
  const filePrefix = getContentTypeFileName(contentType);
  console.log("[PasswordBackup] Creating new shard:", { contentType, filePrefix, basePath });
  const newIndex = shards.length > 0 ? Math.max(...shards.map(s => s.fileIndex)) + 1 : 1;
  const newPath = `${basePath}/${filePrefix}/${filePrefix}-${newIndex}.json`;
  console.log("[PasswordBackup] New shard path:", newPath);

  const newData: PasswordBackupData = {
    version: 1,
    lastUpdated: Date.now(),
    entries: [],
    fileIndex: newIndex,
    totalFiles: newIndex
  };

  const newShard: FileShardInfo = {
    path: newPath,
    sha: "",
    entryCount: 0,
    fileSize: 0,
    fileIndex: newIndex
  };

  return { shard: newShard, data: newData };
}

/**
 * 备份密码到 GitHub（加密存储，按内容类型分文件存储，支持分片）
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

  const maxEntriesPerFile = githubConfig.maxEntriesPerFile || 0;
  const maxFileSizeKB = githubConfig.maxFileSizeKB || 0;

  try {
    const basePath = githubConfig.filePath;
    const contentType = payload.contentType;

    // 获取现有分片信息
    console.log("[PasswordBackup] Fetching existing shards for:", contentType);
    const shards = await getContentTypeShards(
      githubConfig.owner,
      githubConfig.repo,
      basePath,
      contentType,
      githubConfig.branch
    );

    // 获取最新的可用分片
    let { shard, data } = await getLatestShard(
      githubConfig.owner,
      githubConfig.repo,
      basePath,
      contentType,
      githubConfig.branch,
      maxEntriesPerFile,
      maxFileSizeKB
    );

    // 如果没有可用分片，创建新的
    if (!shard || !data) {
      console.log("[PasswordBackup] Creating new shard for:", contentType);
      const result = await createNewShard(
        githubConfig.owner,
        githubConfig.repo,
        basePath,
        contentType,
        githubConfig.branch,
        shards
      );
      shard = result.shard;
      data = result.data;
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
    const existingIndex = data.entries.findIndex(e => e.id === payload.id);

    if (existingIndex >= 0) {
      console.log("[PasswordBackup] Updating existing entry at index:", existingIndex);
      data.entries[existingIndex] = newEntry;
    } else {
      console.log("[PasswordBackup] Adding new entry");
      data.entries.push(newEntry);
    }

    // 按时间倒序排序
    data.entries.sort((a, b) => b.timestamp - a.timestamp);

    // 更新元数据
    data.lastUpdated = Date.now();
    data.totalFiles = Math.max(data.totalFiles || 1, shards.length + (shard.sha ? 0 : 1));

    // 保存到 GitHub
    console.log("[PasswordBackup] Saving to GitHub...");
    const contentJson = JSON.stringify(data, null, 2);

    await createOrUpdateFile(
      githubConfig.owner,
      githubConfig.repo,
      shard.path,
      contentJson,
      githubConfig.branch,
      `Backup password for ${payload.contentType} #${payload.id}${shard.fileIndex > 1 ? ` (shard ${shard.fileIndex})` : ""}`,
      shard.sha || undefined
    );

    console.log("[PasswordBackup] GitHub backup successful! Shard:", shard.fileIndex);
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
  if (backupConfig.telegram?.enabled) {
    console.log("[PasswordBackup] Telegram config:", {
      enabled: backupConfig.telegram.enabled,
      hasBotToken: !!backupConfig.telegram.botToken,
      hasChatId: !!backupConfig.telegram.chatId
    });

    try {
      results.telegram = await sendPasswordToTelegram(payload, backupConfig.telegram);
      console.log("[PasswordBackup] Telegram result:", results.telegram);
    } catch (error) {
      console.error("[PasswordBackup] Telegram backup failed:", error);
    }
  } else {
    console.log("[PasswordBackup] Telegram disabled or not configured");
  }

  // 备份到 GitHub
  if (backupConfig.github?.enabled) {
    console.log("[PasswordBackup] GitHub config:", {
      enabled: backupConfig.github.enabled,
      owner: backupConfig.github.owner,
      repo: backupConfig.github.repo,
      hasMasterKey: !!backupConfig.github.masterKey
    });

    try {
      results.github = await backupToGithub(payload, backupConfig.github);
      console.log("[PasswordBackup] GitHub result:", results.github);
    } catch (error) {
      console.error("[PasswordBackup] GitHub backup failed:", error);
    }
  } else {
    console.log("[PasswordBackup] GitHub disabled or not configured");
  }

  console.log("[PasswordBackup] Final results:", results);
  return results;
}

/**
 * 从 GitHub 获取指定内容类型的所有密码备份
 */
export async function getPasswordBackupsByType(
  githubConfig: GithubBackupConfig,
  contentType: "article" | "knowledge" | "record"
): Promise<PasswordBackupData | null> {
  if (!githubConfig.enabled) {
    return null;
  }

  try {
    const basePath = githubConfig.filePath;
    const shards = await getContentTypeShards(
      githubConfig.owner,
      githubConfig.repo,
      basePath,
      contentType,
      githubConfig.branch
    );

    if (shards.length === 0) {
      return null;
    }

    // 合并所有分片的数据
    const allEntries: PasswordBackupEntry[] = [];
    let lastUpdated = 0;

    for (const shard of shards) {
      const fileContent = await getFileContent(
        githubConfig.owner,
        githubConfig.repo,
        shard.path,
        githubConfig.branch
      );

      if (fileContent) {
        const data: PasswordBackupData = JSON.parse(fileContent.content);
        if (data.entries) {
          allEntries.push(...data.entries);
        }
        if (data.lastUpdated > lastUpdated) {
          lastUpdated = data.lastUpdated;
        }
      }
    }

    // 去重（按 ID）
    const uniqueEntries = Array.from(
      new Map(allEntries.map(e => [e.id, e])).values()
    );

    // 按时间倒序排序
    uniqueEntries.sort((a, b) => b.timestamp - a.timestamp);

    const result: PasswordBackupData = {
      version: 1,
      lastUpdated,
      entries: uniqueEntries,
      totalFiles: shards.length
    };

    // 解密密码
    if (githubConfig.masterKey) {
      result.entries = result.entries.map(entry => ({
        ...entry,
        password: xorDecrypt(entry.encryptedPassword, githubConfig.masterKey)
      }));
    }

    return result;
  } catch (error) {
    console.error("[PasswordBackup] Get password backups failed:", error);
    return null;
  }
}

/**
 * 从 GitHub 获取所有密码备份（兼容旧接口）
 */
export async function getPasswordBackups(
  githubConfig: GithubBackupConfig
): Promise<PasswordBackupData | null> {
  if (!githubConfig.enabled) {
    return null;
  }

  try {
    const allEntries: PasswordBackupEntry[] = [];
    let lastUpdated = 0;
    let totalFiles = 0;

    // 获取所有内容类型的数据
    const contentTypes: ("article" | "knowledge" | "record")[] = ["article", "knowledge", "record"];

    for (const contentType of contentTypes) {
      const data = await getPasswordBackupsByType(githubConfig, contentType);
      if (data) {
        allEntries.push(...data.entries);
        if (data.lastUpdated > lastUpdated) {
          lastUpdated = data.lastUpdated;
        }
        totalFiles += data.totalFiles || 0;
      }
    }

    // 按时间倒序排序
    allEntries.sort((a, b) => b.timestamp - a.timestamp);

    return {
      version: 1,
      lastUpdated,
      entries: allEntries,
      totalFiles
    };
  } catch (error) {
    console.error("[PasswordBackup] Get all password backups failed:", error);
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
