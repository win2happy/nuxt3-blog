export interface MarkdownShortcut {
  trigger: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  insertText: string;
  insertTextEn: string;
  category: "basic" | "media" | "advance" | "container";
  cursorOffset?: number;
  lineOffset?: number;
}

export const markdownShortcuts: MarkdownShortcut[] = [
  {
    trigger: "/h1",
    label: "一级标题",
    labelEn: "Heading 1",
    description: "插入一级标题",
    descriptionEn: "Insert heading 1",
    icon: "H1",
    insertText: "# ",
    insertTextEn: "# ",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/h2",
    label: "二级标题",
    labelEn: "Heading 2",
    description: "插入二级标题",
    descriptionEn: "Insert heading 2",
    icon: "H2",
    insertText: "## ",
    insertTextEn: "## ",
    category: "basic",
    cursorOffset: 3
  },
  {
    trigger: "/h3",
    label: "三级标题",
    labelEn: "Heading 3",
    description: "插入三级标题",
    descriptionEn: "Insert heading 3",
    icon: "H3",
    insertText: "### ",
    insertTextEn: "### ",
    category: "basic",
    cursorOffset: 4
  },
  {
    trigger: "/bold",
    label: "粗体",
    labelEn: "Bold",
    description: "插入粗体文本",
    descriptionEn: "Insert bold text",
    icon: "B",
    insertText: "**${text}**",
    insertTextEn: "**${text}**",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/italic",
    label: "斜体",
    labelEn: "Italic",
    description: "插入斜体文本",
    descriptionEn: "Insert italic text",
    icon: "I",
    insertText: "*${text}*",
    insertTextEn: "*${text}*",
    category: "basic",
    cursorOffset: 1
  },
  {
    trigger: "/underline",
    label: "下划线",
    labelEn: "Underline",
    description: "插入下划线文本",
    descriptionEn: "Insert underlined text",
    icon: "U",
    insertText: "_(${text})_",
    insertTextEn: "_(${text})_",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/link",
    label: "链接",
    labelEn: "Link",
    description: "插入链接 [text](url)",
    descriptionEn: "Insert link [text](url)",
    icon: "🔗",
    insertText: "[${text}](${url})",
    insertTextEn: "[${text}](${url})",
    category: "basic",
    cursorOffset: 1
  },
  {
    trigger: "/image",
    label: "图片",
    labelEn: "Image",
    description: "插入图片 ![alt](url)",
    descriptionEn: "Insert image ![alt](url)",
    icon: "🖼️",
    insertText: "![${alt}](${url})",
    insertTextEn: "![${alt}](${url})",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/code",
    label: "代码块",
    labelEn: "Code Block",
    description: "插入代码块",
    descriptionEn: "Insert code block",
    icon: "</>",
    insertText: "```\n${code}\n```",
    insertTextEn: "```\n${code}\n```",
    category: "basic",
    cursorOffset: 4,
    lineOffset: 1
  },
  {
    trigger: "/inline-code",
    label: "行内代码",
    labelEn: "Inline Code",
    description: "插入行内代码",
    descriptionEn: "Insert inline code",
    icon: "`",
    insertText: "`${code}`",
    insertTextEn: "`${code}`",
    category: "basic",
    cursorOffset: 1
  },
  {
    trigger: "/quote",
    label: "引用",
    labelEn: "Quote",
    description: "插入引用块",
    descriptionEn: "Insert quote block",
    icon: "❝",
    insertText: "> ",
    insertTextEn: "> ",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/list",
    label: "无序列表",
    labelEn: "Bullet List",
    description: "插入无序列表",
    descriptionEn: "Insert bullet list",
    icon: "•",
    insertText: "- ",
    insertTextEn: "- ",
    category: "basic",
    cursorOffset: 2
  },
  {
    trigger: "/numlist",
    label: "有序列表",
    labelEn: "Numbered List",
    description: "插入有序列表",
    descriptionEn: "Insert numbered list",
    icon: "1.",
    insertText: "1. ",
    insertTextEn: "1. ",
    category: "basic",
    cursorOffset: 3
  },
  {
    trigger: "/task",
    label: "任务列表",
    labelEn: "Task List",
    description: "插入任务列表",
    descriptionEn: "Insert task list",
    icon: "☐",
    insertText: "- [ ] ",
    insertTextEn: "- [ ] ",
    category: "basic",
    cursorOffset: 5
  },
  {
    trigger: "/table",
    label: "表格",
    labelEn: "Table",
    description: "插入表格",
    descriptionEn: "Insert table",
    icon: "⊞",
    insertText: "| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |",
    insertTextEn: "| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |",
    category: "basic",
    cursorOffset: 4,
    lineOffset: 2
  },
  {
    trigger: "/hr",
    label: "分割线",
    labelEn: "Horizontal Rule",
    description: "插入分割线",
    descriptionEn: "Insert horizontal rule",
    icon: "—",
    insertText: "\n---\n",
    insertTextEn: "\n---\n",
    category: "basic",
    cursorOffset: 4,
    lineOffset: 1
  },
  {
    trigger: "/youtube",
    label: "YouTube",
    labelEn: "YouTube",
    description: "嵌入 YouTube 视频",
    descriptionEn: "Embed YouTube video",
    icon: "▶️",
    insertText: "[youtube][${text}](${url})[/youtube]",
    insertTextEn: "[youtube][${text}](${url})[/youtube]",
    category: "media",
    cursorOffset: 9
  },
  {
    trigger: "/bili",
    label: "Bilibili",
    labelEn: "Bilibili",
    description: "嵌入 Bilibili 视频",
    descriptionEn: "Embed Bilibili video",
    icon: "📺",
    insertText: "[bili][${text}](${url})[/bili]",
    insertTextEn: "[bili][${text}](${url})[/bili]",
    category: "media",
    cursorOffset: 6
  },
  {
    trigger: "/video",
    label: "视频",
    labelEn: "Video",
    description: "嵌入视频",
    descriptionEn: "Embed video",
    icon: "🎬",
    insertText: "[video][${text}][${poster}](${url})[/video]",
    insertTextEn: "[video][${text}][${poster}](${url})[/video]",
    category: "media",
    cursorOffset: 8
  },
  {
    trigger: "/audio",
    label: "音频",
    labelEn: "Audio",
    description: "嵌入音频",
    descriptionEn: "Embed audio",
    icon: "🎵",
    insertText: "[audio][${text}](${url})[/audio]",
    insertTextEn: "[audio][${text}](${url})[/audio]",
    category: "media",
    cursorOffset: 8
  },
  {
    trigger: "/sticker",
    label: "表情",
    labelEn: "Sticker",
    description: "插入表情",
    descriptionEn: "Insert sticker",
    icon: "😊",
    insertText: "![sticker](${url})",
    insertTextEn: "![sticker](${url})",
    category: "media",
    cursorOffset: 11
  },
  {
    trigger: "/math",
    label: "行内公式",
    labelEn: "Inline Math",
    description: "插入行内数学公式",
    descriptionEn: "Insert inline math formula",
    icon: "∑",
    insertText: "$${formula}$$",
    insertTextEn: "$${formula}$$",
    category: "advance",
    cursorOffset: 2
  },
  {
    trigger: "/math-block",
    label: "块级公式",
    labelEn: "Math Block",
    description: "插入块级数学公式",
    descriptionEn: "Insert block math formula",
    icon: "∫",
    insertText: "$$\n${formula}\n$$",
    insertTextEn: "$$\n${formula}\n$$",
    category: "advance",
    cursorOffset: 3,
    lineOffset: 1
  },
  {
    trigger: "/mermaid",
    label: "Mermaid图表",
    labelEn: "Mermaid Diagram",
    description: "插入 Mermaid 图表",
    descriptionEn: "Insert Mermaid diagram",
    icon: "📊",
    insertText: "```mermaid\n${diagram}\n```",
    insertTextEn: "```mermaid\n${diagram}\n```",
    category: "advance",
    cursorOffset: 12,
    lineOffset: 1
  },
  {
    trigger: "/color",
    label: "彩色文字",
    labelEn: "Colored Text",
    description: "插入彩色文字 -(color: text)-",
    descriptionEn: "Insert colored text -(color: text)-",
    icon: "🎨",
    insertText: "-(${color}: ${text})-",
    insertTextEn: "-(${color}: ${text})-",
    category: "advance",
    cursorOffset: 2
  },
  {
    trigger: "/blank",
    label: "全角空格",
    labelEn: "Full-width Space",
    description: "插入全角空格缩进",
    descriptionEn: "Insert full-width space",
    icon: "□",
    insertText: "<<>>",
    insertTextEn: "<<>>",
    category: "advance"
  },
  {
    trigger: "/html",
    label: "HTML代码",
    labelEn: "HTML Code",
    description: "插入原始 HTML",
    descriptionEn: "Insert raw HTML",
    icon: "</>",
    insertText: "[html]\n${html}\n[/html]",
    insertTextEn: "[html]\n${html}\n[/html]",
    category: "advance",
    cursorOffset: 7,
    lineOffset: 1
  },
  {
    trigger: "/newtab",
    label: "新标签链接",
    labelEn: "New Tab Link",
    description: "插入新标签页打开的链接",
    descriptionEn: "Insert new tab link",
    icon: "↗",
    insertText: "#[${text}](${url})",
    insertTextEn: "#[${text}](${url})",
    category: "advance",
    cursorOffset: 2
  },
  {
    trigger: "/hide",
    label: "隐藏文字",
    labelEn: "Hidden Text",
    description: "插入隐藏文字 [!content!]",
    descriptionEn: "Insert hidden text [!content!]",
    icon: "👁️",
    insertText: "[!${text}!]",
    insertTextEn: "[!${text}!]",
    category: "advance",
    cursorOffset: 2
  },
  {
    trigger: "/fieldset",
    label: "字段集",
    labelEn: "Fieldset",
    description: "插入字段集块",
    descriptionEn: "Insert fieldset block",
    icon: "▦",
    insertText: "--${title}--\n${content}\n-- --",
    insertTextEn: "--${title}--\n${content}\n-- --",
    category: "container",
    cursorOffset: 2,
    lineOffset: 1
  },
  {
    trigger: "/encrypt",
    label: "加密块",
    labelEn: "Encrypted Block",
    description: "插入加密内容块",
    descriptionEn: "Insert encrypted content block",
    icon: "🔒",
    insertText: "[encrypt]\n${content}\n[/encrypt]",
    insertTextEn: "[encrypt]\n${content}\n[/encrypt]",
    category: "container",
    cursorOffset: 10,
    lineOffset: 1
  },
  {
    trigger: "/info",
    label: "信息提示",
    labelEn: "Info Box",
    description: "插入信息提示容器",
    descriptionEn: "Insert info box",
    icon: "ℹ️",
    insertText: ":::info\n${content}\n:::",
    insertTextEn: ":::info\n${content}\n:::",
    category: "container",
    cursorOffset: 9,
    lineOffset: 1
  },
  {
    trigger: "/tip",
    label: "提示",
    labelEn: "Tip Box",
    description: "插入提示容器",
    descriptionEn: "Insert tip box",
    icon: "💡",
    insertText: ":::tip\n${content}\n:::",
    insertTextEn: ":::tip\n${content}\n:::",
    category: "container",
    cursorOffset: 8,
    lineOffset: 1
  },
  {
    trigger: "/warning",
    label: "警告",
    labelEn: "Warning Box",
    description: "插入警告容器",
    descriptionEn: "Insert warning box",
    icon: "⚠️",
    insertText: ":::warning\n${content}\n:::",
    insertTextEn: ":::warning\n${content}\n:::",
    category: "container",
    cursorOffset: 11,
    lineOffset: 1
  },
  {
    trigger: "/danger",
    label: "危险",
    labelEn: "Danger Box",
    description: "插入危险警告容器",
    descriptionEn: "Insert danger box",
    icon: "⛔",
    insertText: ":::danger\n${content}\n:::",
    insertTextEn: ":::danger\n${content}\n:::",
    category: "container",
    cursorOffset: 10,
    lineOffset: 1
  },
  {
    trigger: "/details",
    label: "折叠内容",
    labelEn: "Details Box",
    description: "插入可折叠详情容器",
    descriptionEn: "Insert collapsible details box",
    icon: "📁",
    insertText: ":::details ${title}\n${content}\n:::",
    insertTextEn: ":::details ${title}\n${content}\n:::",
    category: "container",
    cursorOffset: 16,
    lineOffset: 1
  }
];

export const shortcutCategories = [
  { key: "basic", label: "基础", labelEn: "Basic" },
  { key: "media", label: "媒体", labelEn: "Media" },
  { key: "advance", label: "高级", labelEn: "Advance" },
  { key: "container", label: "容器", labelEn: "Container" }
] as const;
