import { marked } from "marked";

// 同步解析Markdown为HTML
export const parseMarkdownSync = (content: string): string => {
  if (!content || typeof content !== "string") {
    return "";
  }

  try {
    // 配置marked选项
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    });

    return marked(content);
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return content;
  }
};
