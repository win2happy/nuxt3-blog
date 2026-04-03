export interface PublishArticleParams {
  token: string;
  title: string;
  content: string;
  tags?: string[];
  customSlug?: string;
  encrypt?: boolean;
  showComments?: boolean;
  isPinned?: boolean;
}

export interface PublishArticleResult {
  success: boolean;
  data: {
    id: number;
    title: string;
    url: string;
    time: number;
  };
}

/**
 * 发布文章 API
 * @param params 发布文章参数
 * @returns 发布结果
 */
export async function publishArticle(params: PublishArticleParams): Promise<PublishArticleResult> {
  const response = await fetch("/api/articles/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ statusMessage: "Unknown error" }));
    throw new Error(error.statusMessage || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 使用 GitHub Token 发布文章（便捷方法）
 * @param token GitHub Token
 * @param title 文章标题
 * @param content 文章内容（Markdown）
 * @param options 可选参数
 * @returns 发布结果
 */
export async function publishArticleWithToken(
  token: string,
  title: string,
  content: string,
  options?: Omit<PublishArticleParams, "token" | "title" | "content">
): Promise<PublishArticleResult> {
  return publishArticle({
    token,
    title,
    content,
    ...options
  });
}
