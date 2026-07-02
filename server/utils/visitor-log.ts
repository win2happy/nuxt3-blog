import fs from "fs";
import path from "path";
import axios from "axios";
import config from "../../config";

const isVercel = !!process.env.VERCEL;
const DATA_DIR = process.env.VISITOR_DATA_DIR || (isVercel ? "/tmp/visitor-logs" : path.join(process.cwd(), "data"));
const LOG_FILE = path.join(DATA_DIR, "visitor-logs.jsonl");
const GITHUB_LOG_PATH = "visitor-logs.jsonl";
const API_URL = config.githubApiUrl || "https://api.github.com";

let cachedLogs: { entries: LogEntry[]; mtime: number; githubEtag: string } | null = null;
const CACHE_TTL = 30000;
let restoreGuard = false;

export interface LogEntry {
  nid: number;
  ntype: string;
  t: number;
}

export interface SnapshotData {
  articles: { nid: number; ntype: string; visitors: number }[];
  total: number;
  generatedAt: number;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function getGitHubToken(): Promise<string | null> {
  const token = process.env.VISITOR_LOG_GITHUB_TOKEN;
  if (token) return token;
  try {
    const tokenPath = path.join(process.cwd(), ".github-token");
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf-8").trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function isValidLogRepoConfig(): boolean {
  const { owner, repo, branch } = config.visitorLogRepo || {};
  return !!owner && !!repo && !!branch;
}

async function fetchFileFromGitHub(): Promise<{ content: string; sha: string } | null> {
  const token = await getGitHubToken();
  if (!token || !isValidLogRepoConfig()) return null;

  const { owner, repo, branch } = config.visitorLogRepo;

  try {
    const url = `${API_URL}/repos/${owner}/${repo}/contents/${GITHUB_LOG_PATH}`;
    const res = await axios.get(url, {
      headers: { Authorization: `token ${token}` },
      params: { ref: branch }
    });
    if (res.status === 200 && res.data.content) {
      return {
        content: Buffer.from(res.data.content, "base64").toString("utf-8"),
        sha: res.data.sha
      };
    }
  } catch (e: any) {
    if (e.response?.status !== 404) {
      console.error("fetchFileFromGitHub error:", e.message);
    }
  }
  return null;
}

async function writeFileToGitHub(content: string, sha: string | null): Promise<boolean> {
  const token = await getGitHubToken();
  if (!token || !isValidLogRepoConfig()) return false;

  const { owner, repo, branch } = config.visitorLogRepo;

  try {
    const url = `${API_URL}/repos/${owner}/${repo}/contents/${GITHUB_LOG_PATH}`;
    const res = await axios.put(url, {
      message: "chore: update visitor logs",
      content: Buffer.from(content).toString("base64"),
      branch,
      ...(sha && { sha })
    }, {
      headers: { Authorization: `token ${token}` }
    });
    return res.status === 200 || res.status === 201;
  } catch (e: any) {
    console.error("writeFileToGitHub error:", e.message);
    return false;
  }
}

async function appendToGitHub(nid: number, ntype: string, retryCount: number = 0) {
  if (!isValidLogRepoConfig()) {
    console.warn("[VisitorLog] GitHub repo config not set, skipping GitHub sync");
    return;
  }

  const token = await getGitHubToken();
  if (!token) {
    console.warn("[VisitorLog] VISITOR_LOG_GITHUB_TOKEN not found, skipping GitHub sync");
    return;
  }

  try {
    const entry: LogEntry = { nid, ntype, t: Date.now() };
    const entryLine = JSON.stringify(entry) + "\n";

    const existing = await fetchFileFromGitHub();
    let content = "";
    let sha = null;

    if (existing) {
      content = existing.content;
      sha = existing.sha;
    }

    content += entryLine;
    const success = await writeFileToGitHub(content, sha);

    if (success) {
      console.log("[VisitorLog] Successfully synced log to GitHub");
    } else if (retryCount < 2) {
      console.warn("[VisitorLog] GitHub write failed, retrying...", retryCount + 1);
      await new Promise(r => setTimeout(r, 100));
      await appendToGitHub(nid, ntype, retryCount + 1);
    } else {
      console.error("[VisitorLog] GitHub write failed after retries");
    }
  } catch (e) {
    if (retryCount < 2) {
      console.warn("[VisitorLog] GitHub sync error, retrying...", e);
      await new Promise(r => setTimeout(r, 100));
      await appendToGitHub(nid, ntype, retryCount + 1);
    } else {
      console.error("[VisitorLog] GitHub sync error after retries:", e);
    }
  }
}

function readLogsFresh(): LogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    if (!content.trim()) {
      return [];
    }
    return content.split("\n").filter(Boolean).map((line) => {
      try {
        return JSON.parse(line) as LogEntry;
      } catch {
        return null;
      }
    }).filter(Boolean) as LogEntry[];
  } catch (e) {
    console.warn("[VisitorLog] Failed to read local log:", e);
    return [];
  }
}

export async function readLogs(): Promise<LogEntry[]> {
  const now = Date.now();
  if (cachedLogs && now - cachedLogs.mtime < CACHE_TTL) {
    console.log("[VisitorLog] Returning cached logs:", cachedLogs.entries.length);
    return cachedLogs.entries;
  }

  const token = await getGitHubToken();
  if (token) {
    try {
      const result = await fetchFileFromGitHub();
      if (result) {
        const entries = result.content.split("\n").filter(Boolean).map((line) => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return null;
          }
        }).filter(Boolean) as LogEntry[];
        cachedLogs = { entries, mtime: now, githubEtag: result.sha };
        console.log("[VisitorLog] Read", entries.length, "entries from GitHub");
        return entries;
      } else {
        console.log("[VisitorLog] GitHub file not found, falling back to local");
      }
    } catch (e) {
      console.warn("[VisitorLog] GitHub read error, falling back to local:", e);
    }
  }

  const entries = readLogsFresh();
  cachedLogs = { entries, mtime: now, githubEtag: "" };
  console.log("[VisitorLog] Read", entries.length, "entries from local file");
  return entries;
}

export async function appendLog(nid: number, ntype: string) {
  const entry: LogEntry = { nid, ntype, t: Date.now() };

  try {
    ensureDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
    console.log("[VisitorLog] Logged visit:", nid, ntype);
  } catch (e) {
    console.warn("[VisitorLog] Failed to write local log:", e);
  }
  cachedLogs = null;

  await appendToGitHub(nid, ntype);
}

export function restoreFromSnapshot(snapshot: SnapshotData) {
  if (!snapshot?.articles?.length) {
    return;
  }
  try {
    ensureDir();
  } catch {
    console.warn("[VisitorLog] Failed to create dir for restore");
    return;
  }
  const now = snapshot.generatedAt;
  const totalVisits = snapshot.articles.reduce((s, a) => s + a.visitors, 0);
  const spreadMs = Math.min(totalVisits * 60 * 1000, 30 * 24 * 60 * 60 * 1000);
  const timeStep = totalVisits > 1 ? spreadMs / (totalVisits - 1) : spreadMs;

  const logs: LogEntry[] = [];
  let t = now - spreadMs;
  for (const a of snapshot.articles) {
    for (let i = 0; i < a.visitors; i++) {
      logs.push({ nid: a.nid, ntype: a.ntype, t: Math.round(t) });
      t += timeStep;
    }
  }
  const content = logs.map(l => JSON.stringify(l)).join("\n") + "\n";
  fs.writeFileSync(LOG_FILE, content, "utf-8");
  cachedLogs = null;
}

export async function getTotalVisitors(since?: number): Promise<number> {
  const entries = await readLogs();
  if (!since) return entries.length;
  return entries.filter(l => l.t >= since).length;
}

export async function getVisitorsByPeriod(period: "day" | "week" | "month", range: number = 30) {
  const entries = await readLogs();
  const now = Date.now();
  const result: { label: string; count: number }[] = [];
  const unit = period === "day" ? 86400000 : period === "week" ? 604800000 : 0;

  for (let i = range - 1; i >= 0; i--) {
    let start: number;
    let end: number;
    let label: string;

    if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
      if (i === 0) {
        end = now;
      } else {
        d.setMonth(d.getMonth() + 1);
        end = d.getTime();
      }
      label = `${d.getFullYear()}/${d.getMonth() + 1}`;
    } else {
      const d = new Date(now);
      if (period === "week") {
        d.setDate(d.getDate() - i * 7);
      } else {
        d.setDate(d.getDate() - i);
      }
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
      end = start + unit;
      label = `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const count = entries.filter(l => l.t >= start && l.t < end).length;
    result.push({ label, count });
  }

  return result;
}

export async function getVisitorsByMonth(year: number) {
  const entries = await readLogs();
  const result: { label: string; count: number }[] = [];

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1).getTime();
    const end = m === 11 ? new Date(year + 1, 0, 1).getTime() : new Date(year, m + 1, 1).getTime();
    const count = entries.filter(l => l.t >= start && l.t < end).length;
    result.push({ label: `${m + 1}月`, count });
  }

  return result;
}

export async function getVisitorsByArticle(type?: string) {
  const entries = await readLogs();
  const map = new Map<string, number>();

  for (const l of entries) {
    if (type && l.ntype !== type) continue;
    const key = `${l.ntype}:${l.nid}`;
    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()]
    .map(([key, count]) => {
      const [ntype, nidStr] = key.split(":");
      return { ntype, nid: parseInt(nidStr), visitors: count };
    })
    .sort((a, b) => b.visitors - a.visitors);
}

export async function getArticleVisitors(nid: number, ntype: string) {
  const logs = (await readLogs()).filter(l => l.nid === nid && l.ntype === ntype);
  const total = logs.length;

  const now = Date.now();
  const byDay: { label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86400000;
    const count = logs.filter(l => l.t >= start && l.t < end).length;
    byDay.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count });
  }

  return { total, byDay };
}

export async function getSnapshot(): Promise<SnapshotData> {
  const byArticle = await getVisitorsByArticle();
  const entries = await readLogs();
  return {
    articles: byArticle,
    total: entries.length,
    generatedAt: Date.now()
  };
}

export function tryRestoreFromPublic() {
  if (restoreGuard) return false;
  const snapshotPath = path.join(process.cwd(), "public", "rebuild", "json", "visitor-snapshot.json");
  if (!fs.existsSync(snapshotPath)) {
    restoreGuard = true;
    return false;
  }
  try {
    const content = fs.readFileSync(snapshotPath, "utf-8");
    const snapshot = JSON.parse(content) as SnapshotData;
    restoreFromSnapshot(snapshot);
    restoreGuard = true;
    return true;
  } catch {
    restoreGuard = true;
    return false;
  }
}

export async function buildOverview(since?: number) {
  const entries = await readLogs();
  const now = Date.now();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const today = entries.filter(l => l.t >= todayStart.getTime()).length;

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = entries.filter(l => l.t >= weekStart.getTime()).length;

  const byArticle = await getVisitorsByArticle();
  const total = since ? entries.filter(l => l.t >= since).length : entries.length;
  const daily = await getVisitorsByPeriod("day", 30);
  const monthly = await getVisitorsByPeriod("month", 12);

  return {
    total,
    today,
    thisWeek,
    daily,
    monthly,
    topArticles: byArticle.slice(0, 10),
    articleCount: byArticle.length
  };
}
