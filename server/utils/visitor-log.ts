import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VISITOR_DATA_DIR || path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "visitor-logs.jsonl");

let cachedLogs: { entries: LogEntry[]; mtime: number } | null = null;
const CACHE_TTL = 5000;
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

function readLogsFresh(): LogEntry[] {
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
}

function readLogsCached(): { entries: LogEntry[]; mtime: number } {
  const stat = fs.statSync(LOG_FILE, { throwIfNoEntry: false });
  const mtime = stat?.mtimeMs || 0;
  if (cachedLogs && cachedLogs.mtime === mtime && Date.now() - cachedLogs.mtime < CACHE_TTL) {
    return cachedLogs;
  }
  const entries = readLogsFresh();
  cachedLogs = { entries, mtime };
  return cachedLogs;
}

export function readLogs(): LogEntry[] {
  return readLogsCached().entries;
}

export function appendLog(nid: number, ntype: string) {
  ensureDir();
  const entry: LogEntry = { nid, ntype, t: Date.now() };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
  cachedLogs = null;
}

export function restoreFromSnapshot(snapshot: SnapshotData) {
  if (!snapshot?.articles?.length) {
    return;
  }
  ensureDir();
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

export function getTotalVisitors(since?: number): number {
  const entries = readLogs();
  if (!since) return entries.length;
  return entries.filter(l => l.t >= since).length;
}

export function getVisitorsByPeriod(period: "day" | "week" | "month", range: number = 30) {
  const entries = readLogs();
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

export function getVisitorsByMonth(year: number) {
  const entries = readLogs();
  const result: { label: string; count: number }[] = [];

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1).getTime();
    const end = m === 11 ? new Date(year + 1, 0, 1).getTime() : new Date(year, m + 1, 1).getTime();
    const count = entries.filter(l => l.t >= start && l.t < end).length;
    result.push({ label: `${m + 1}月`, count });
  }

  return result;
}

export function getVisitorsByArticle(type?: string) {
  const entries = readLogs();
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

export function getArticleVisitors(nid: number, ntype: string) {
  const logs = readLogs().filter(l => l.nid === nid && l.ntype === ntype);
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

export function getSnapshot(): SnapshotData {
  const byArticle = getVisitorsByArticle();
  return {
    articles: byArticle,
    total: readLogs().length,
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

export function buildOverview(since?: number) {
  const entries = readLogs();
  const now = Date.now();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const today = entries.filter(l => l.t >= todayStart.getTime()).length;

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = entries.filter(l => l.t >= weekStart.getTime()).length;

  const byArticle = getVisitorsByArticle();
  const total = since ? entries.filter(l => l.t >= since).length : entries.length;
  const daily = getVisitorsByPeriod("day", 30);
  const monthly = getVisitorsByPeriod("month", 12);

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
