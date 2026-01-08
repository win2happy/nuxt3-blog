/**
 * 从 Markdown 内容中提取摘要和封面图片
 */
export function extractArticlePreview(markdown: string): {
  excerpt: string;
  coverImage: string;
  contentTags: string[];
} {
  let excerpt = "";
  let coverImage = "";
  let contentTags: string[] = [];

  if (!markdown) {
    return { excerpt, coverImage, contentTags };
  }

  // 先提取整篇文章的第一张图片作为封面（无论在哪里）
  const firstImageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
  if (firstImageMatch && firstImageMatch[1]) {
    coverImage = firstImageMatch[1];
  }

  // 查找第一个 --- 分割线的位置
  const separatorMatch = markdown.match(/^([\s\S]*?)^---$/m);

  if (separatorMatch && separatorMatch[1]) {
    // 如果找到分割线，提取分割线前的内容作为摘要
    const beforeSeparator = separatorMatch[1].trim();

    // 移除图片标记，保留纯文本作为摘要
    excerpt = beforeSeparator
      .replace(/!\[.*?\]\(.*?\)/g, "") // 移除图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 移除链接，保留文本
      .replace(/#{1,6}\s+/g, "") // 移除标题标记
      .replace(/\*\*([^*]+)\*\*/g, "$1") // 移除粗体标记
      .replace(/\*([^*]+)\*/g, "$1") // 移除斜体标记
      .replace(/`([^`]+)`/g, "$1") // 移除代码标记
      .trim();
  }

  // 限制摘要长度，避免过长
  if (excerpt.length > 200) {
    excerpt = excerpt.substring(0, 200) + "...";
  }

  // 从文章末尾提取标签（格式如：#标签1 #标签2）
  const lines = markdown.trim().split("\n");
  const lastNonEmptyLines = lines
    .slice(-5) // 取最后5行
    .filter(line => line.trim())
    .reverse();

  for (const line of lastNonEmptyLines) {
    // 匹配形如 #标签1 #标签2 的行
    const tagMatches = line.match(/#([^\s#]+)/g);
    if (tagMatches && tagMatches.length > 0) {
      contentTags = tagMatches.map(tag => tag.substring(1)); // 移除 # 号
      break;
    }
  }

  return { excerpt, coverImage, contentTags };
}
