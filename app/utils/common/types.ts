import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";

export type EncryptBlock = {
  start: number;
  end: number;
};

export type ItemBase<T> = T & {
  id: number;
  customSlug: string;
  time: number;
  modifyTime: number;
  encrypt: boolean;
  encryptBlocks?: EncryptBlock[];
  showComments: boolean;
  _visitors?: number;
  _show?: boolean;
};

export type ArticleItem = ItemBase<{
  title: string;
  len: number;
  tags: string[];
  excerpt?: string; // 文章摘要（分割线前的内容）
  coverImage?: string; // 封面图片（第一张图片的URL）
  isPinned?: boolean; // 是否置顶
}>;

export type RecordItem = ItemBase<{
  images: { src: string; alt: string; id?: number }[];
}>;

export const KnowledgeTabsList = [
  { key: "book", name: "book" },
  { key: "film", name: "film" },
  { key: "game", name: "game" }
] as const;
export const KnowledgeTabs = KnowledgeTabsList.map(item => item.key);
export type KnowledgeTab = typeof KnowledgeTabs[number];

export type KnowledgeItem = ItemBase<{
  title: string;
  type: KnowledgeTab;
  link: string;
  cover: string;
  summary: string;
}>;

export const KnowledgeIconMap = {
  game: Gamepad2,
  film: Film,
  book: BookOpen
} as Record<KnowledgeTab, FunctionalComponent>;

export const KnowledgeColorMap = {
  game: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  film: "bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400",
  book: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
} as Record<KnowledgeTab, string>;

export type CommonItem = ArticleItem | RecordItem | KnowledgeItem;

export const HeaderTabs = [
  "/articles",
  "/records",
  "/knowledges",
  "/news"
] as const;

export type HeaderTabUrl = typeof HeaderTabs[number];
export type CommonItemByHeaderType<T extends HeaderTabUrl> = T extends "/articles"
  ? ArticleItem
  : T extends "/records"
    ? RecordItem : KnowledgeItem;

export type DecryptFunction = (_s: string) => Promise<string>;

export type CommitParamsAddition = { path: string; content: string };
export type CommitParamsDeletion = { path: string; content: string };

export type CommitParams = {
  additions?: CommitParamsAddition[];
  deletions?: CommitParamsDeletion[];
};

export type AlgoliaBody = {
  title: string;
  content: string;
  cover: string;
  metaData: any;
};

export interface DashboardOverview {
  total: number;
  today: number;
  thisWeek: number;
  daily: { label: string; count: number }[];
  monthly: { label: string; count: number }[];
  topArticles: { ntype: string; nid: number; visitors: number }[];
  articleCount: number;
}

export interface ContentStatsJSON {
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

export interface SnapshotData {
  articles: { nid: number; ntype: string; visitors: number }[];
  total: number;
  generatedAt: number;
}
