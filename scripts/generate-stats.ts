import fs from "fs";
import path from "path";
import type { ArticleItem, RecordItem, KnowledgeItem } from "../app/utils/common/types";
import { getAbsolutePath, nbLog } from "./utils";

export interface ContentStats {
  totalArticles: number;
  totalRecords: number;
  totalKnowledges: number;
  totalWords: number;
  avgWordsPerArticle: number;
  tagsCount: number;
  tagDistribution: { tag: string; count: number; percentage: string }[];
  publishByMonth: { label: string; count: number }[];
  articlesWithCover: number;
  articlesEncrypted: number;
  articlesPinned: number;
  commentsEnabled: number;
  lenDistribution: { range: string; count: number }[];
  topWords: { id: number; title: string; len: number }[];
  contentBreakdown: { type: string; count: number; percentage: string }[];
}

export function generateStatsJSON(publicDir?: string) {
  nbLog("stats");
  const outDir = publicDir || getAbsolutePath("public");

  const articlesPath = path.join(outDir, "rebuild", "json", "articles.json");
  const recordsPath = path.join(outDir, "rebuild", "json", "records.json");
  const knowledgesPath = path.join(outDir, "rebuild", "json", "knowledges.json");

  if (!fs.existsSync(articlesPath)) {
    nbLog("articles.json not found, skipping stats generation");
    return;
  }

  const articles: ArticleItem[] = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
  const records: RecordItem[] = fs.existsSync(recordsPath) ? JSON.parse(fs.readFileSync(recordsPath, "utf-8")) : [];
  const knowledges: KnowledgeItem[] = fs.existsSync(knowledgesPath) ? JSON.parse(fs.readFileSync(knowledgesPath, "utf-8")) : [];

  const tagMap = new Map<string, number>();
  for (const a of articles) {
    if (a.tags) {
      for (const t of a.tags) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }
  }
  const total = articles.length || 1;
  const tagDistribution = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count, percentage: (count / total * 100).toFixed(1) + "%" }))
    .sort((a, b) => b.count - a.count);

  const pubByMonth = new Map<string, number>();
  for (const a of articles) {
    const d = new Date(a.time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    pubByMonth.set(key, (pubByMonth.get(key) || 0) + 1);
  }
  const publishByMonth = [...pubByMonth.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const lenRanges = [
    { range: "< 500", min: 0, max: 500 },
    { range: "500 - 2k", min: 500, max: 2000 },
    { range: "2k - 5k", min: 2000, max: 5000 },
    { range: "> 5k", min: 5000, max: Infinity }
  ];
  const lenDistribution = lenRanges.map(r => ({
    range: r.range,
    count: articles.filter(a => (a.len || 0) >= r.min && (a.len || 0) < r.max).length
  }));

  const topWords = [...articles]
    .sort((a, b) => (b.len || 0) - (a.len || 0))
    .slice(0, 10)
    .map(a => ({ id: a.id, title: a.title, len: a.len || 0 }));

  const allCount = articles.length + records.length + knowledges.length || 1;
  const contentBreakdown = [
    { type: "文章", count: articles.length, percentage: (articles.length / allCount * 100).toFixed(1) + "%" },
    { type: "记录", count: records.length, percentage: (records.length / allCount * 100).toFixed(1) + "%" },
    { type: "文化", count: knowledges.length, percentage: (knowledges.length / allCount * 100).toFixed(1) + "%" }
  ];

  const stats: ContentStats = {
    totalArticles: articles.length,
    totalRecords: records.length,
    totalKnowledges: knowledges.length,
    totalWords: articles.reduce((s, a) => s + (a.len || 0), 0),
    avgWordsPerArticle: Math.round(articles.reduce((s, a) => s + (a.len || 0), 0) / total),
    tagsCount: tagMap.size,
    tagDistribution,
    publishByMonth,
    articlesWithCover: articles.filter(a => a.coverImage).length,
    articlesEncrypted: articles.filter(a => a.encrypt).length,
    articlesPinned: articles.filter(a => a.isPinned).length,
    commentsEnabled: articles.filter(a => a.showComments).length,
    lenDistribution,
    topWords,
    contentBreakdown
  };

  const outPath = path.join(outDir, "rebuild", "json", "stats.json");
  fs.writeFileSync(outPath, JSON.stringify(stats));
  nbLog(`stats generated: ${outPath}`);
}
