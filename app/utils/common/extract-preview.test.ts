import { describe, it, expect } from "vitest";
import { extractArticlePreview } from "./extract-preview";

describe("extractArticlePreview", () => {
  it("应该提取分割线前的摘要和整篇文章的第一张图片", () => {
    const markdown = `热门游戏 IP《使命召唤》真人电影官宣主创！

---

![封面图片](https://example.com/image.jpg)

### 正文

更多内容...`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt).toBe("热门游戏 IP《使命召唤》真人电影官宣主创！");
    expect(result.coverImage).toBe("https://example.com/image.jpg");
  });

  it("应该提取分割线前有图片的情况", () => {
    const markdown = `![第一张图片](https://example.com/first.jpg)

这是摘要内容

---

![第二张图片](https://example.com/second.jpg)

正文内容`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt).toBe("这是摘要内容");
    expect(result.coverImage).toBe("https://example.com/first.jpg");
  });

  it("应该处理没有分割线的情况", () => {
    const markdown = `![封面图片](https://example.com/image.jpg)

这是没有分割线的文章内容`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt).toBe("");
    expect(result.coverImage).toBe("https://example.com/image.jpg");
  });

  it("应该处理没有图片的情况", () => {
    const markdown = `这是摘要内容

---

这是正文内容`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt).toBe("这是摘要内容");
    expect(result.coverImage).toBe("");
  });

  it("应该移除Markdown标记", () => {
    const markdown = `**粗体** *斜体* \`代码\` [链接](url)

---

正文`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt).toBe("粗体 斜体 代码 链接");
  });

  it("应该限制摘要长度", () => {
    const longText = "a".repeat(250);
    const markdown = `${longText}

---

正文`;

    const result = extractArticlePreview(markdown);

    expect(result.excerpt.length).toBeLessThanOrEqual(203); // 200 + "..."
    expect(result.excerpt.endsWith("...")).toBe(true);
  });

  it("应该处理空内容", () => {
    const result = extractArticlePreview("");

    expect(result.excerpt).toBe("");
    expect(result.coverImage).toBe("");
  });
});
