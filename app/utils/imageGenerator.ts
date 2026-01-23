import html2canvas from "html2canvas";
import { Solar } from "lunar-javascript";
import globalConfig from "~~/config";

/**
 * 计算公历日期对应的农历日期
 * @param date 可选，要计算的日期，默认为当前日期
 * @returns 农历日期字符串，如 "农历冬月廿九"
 */
function calculateLunarDate(date: Date = new Date()): string {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 使用 lunar-javascript 库计算农历日期
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    // 获取农历月份和日期
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();

    // 农历月份名称
    const lunarMonths = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
    // 农历日期名称
    const lunarDays = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
      "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
      "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

    // 计算索引（注意：lunar-javascript 返回的月份和日期从1开始）
    const monthIndex = lunarMonth - 1;
    const dayIndex = lunarDay - 1;

    // 确保索引在有效范围内
    const validMonthIndex = Math.max(0, Math.min(monthIndex, lunarMonths.length - 1));
    const validDayIndex = Math.max(0, Math.min(dayIndex, lunarDays.length - 1));

    return `农历${lunarMonths[validMonthIndex]}${lunarDays[validDayIndex]}`;
  } catch (error) {
    console.error("计算农历日期失败:", error);
    // 出错时返回一个合理的默认值
    return "";
  }
}

/**
 * 新闻卡片配置选项
 */
interface NewsCardOptions {
  date?: string;
  weekDay?: string;
  lunarDate?: string;
  gradientStart?: string; // 背景渐变起始色
  gradientEnd?: string; // 背景渐变结束色
  contentBackgroundColor?: string; // 内容区域背景色
  headerTextColor?: string; // 头部文字颜色
  contentTextColor?: string; // 内容文字颜色
}

/**
 * 从 DOM 元素生成图片
 */
export async function generateFromElement(element: HTMLElement, options?: {
  backgroundColor?: string;
  scale?: number;
  width?: number;
  height?: number;
  skipVisibilityCheck?: boolean; // 跳过可见性检查（用于临时元素）
}): Promise<string> {
  try {
    // 等待一小段时间确保 DOM 完全渲染
    await new Promise(resolve => setTimeout(resolve, 100));

    // 确保元素存在
    if (!element) {
      throw new Error("元素不存在");
    }

    // 对于非临时元素，检查是否可见
    if (!options?.skipVisibilityCheck && !element.offsetParent) {
      throw new Error("元素不可见");
    }

    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor || "#ffffff",
      scale: options?.scale || 2, // 高清图片
      useCORS: true,
      allowTaint: false,
      width: options?.width,
      height: options?.height,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // 确保克隆的文档中的样式正确应用
        const clonedElement = clonedDoc.getElementById(element.id);
        if (clonedElement) {
          clonedElement.style.transform = "none";
          clonedElement.style.position = "static";
        }
      }
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("生成图片失败:", error);
    throw error;
  }
}

/**
 * 下载图片
 */
export function downloadImage(dataUrl: string, filename: string = "image.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 使用 Canvas API 直接绘制60秒读懂世界卡片
 */
export async function generateNewsCard(
  news: Array<{ id: number; content: string }>,
  options?: NewsCardOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("无法创建 canvas context");
      }

      // 配置常量
      const config = {
        scale: 3,
        width: 520,
        headerPaddingTop: 20,
        contentPadding: 15,
        contentMargin: 5,
        lineHeight: 12,
        itemSpacing: 10,
        numberSize: 14,
        numberTextGap: 8,
        headerHeight: 180
      };

      // 先设置字体以便正确测量文本
      ctx.font = "400 8px \"Microsoft YaHei\", sans-serif";

      // 计算内容高度和预先计算所有文本行（在 scale 之前计算，避免坐标系变换影响）
      const maxTextWidth = config.width - config.contentMargin * 2 - config.contentPadding * 2 - 20;
      const newsWithLines = calculateNewsLines(ctx, news, maxTextWidth);
      const contentHeight = calculateContentHeight(newsWithLines, config);

      const totalHeight = config.headerHeight + contentHeight + config.contentMargin;

      // 设置画布尺寸并缩放
      canvas.width = config.width * config.scale;
      canvas.height = totalHeight * config.scale;
      ctx.scale(config.scale, config.scale);

      // 绘制背景渐变
      const gradient = createGradient(ctx, config.width, totalHeight, options);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.width, totalHeight);

      // 绘制头部
      drawHeader(ctx, config, options);

      // 绘制白色内容区域
      const contentBgColor = options?.contentBackgroundColor || globalConfig.newsCard?.contentBackgroundColor || "white";
      ctx.fillStyle = contentBgColor;
      ctx.fillRect(config.contentMargin, config.headerHeight, config.width - config.contentMargin * 2, contentHeight);

      // 绘制新闻列表
      drawNewsList(ctx, newsWithLines, gradient, config, options);

      // 返回 base64
      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error("生成红色卡片失败:", error);
      reject(error);
    }
  });
}

/**
 * 创建渐变色
 */
function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options?: NewsCardOptions
): CanvasGradient {
  // 优先使用传入的参数，否则使用 globalConfig 中的配置，最后使用默认值
  const gradientStart = options?.gradientStart || globalConfig.newsCard?.gradientStart || "#ff6b6b";
  const gradientEnd = options?.gradientEnd || globalConfig.newsCard?.gradientEnd || "#ee5a6f";
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, gradientStart);
  gradient.addColorStop(1, gradientEnd);
  return gradient;
}

/**
 * 绘制头部
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  config: any,
  options?: NewsCardOptions
) {
  ctx.textAlign = "center";
  // 优先使用传入的参数，否则使用全局 globalConfig 中的配置
  ctx.fillStyle = options?.headerTextColor || globalConfig.newsCard?.headerTextColor || "white";

  // 第一行：日期
  ctx.font = "bold 24px \"Microsoft YaHei\", sans-serif";
  ctx.letterSpacing = "6px";
  const currentDate = options?.date || new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  ctx.fillText(currentDate, config.width / 2, config.headerPaddingTop + 32);

  // 第二行：标题
  ctx.font = "bold 36px \"Microsoft YaHei\", sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("60秒读懂世界", config.width / 2, config.headerPaddingTop + 86);

  // 第三行：星期和农历
  ctx.font = "500 18px \"Microsoft YaHei\", sans-serif";
  ctx.letterSpacing = "4px";
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const currentWeekDay = options?.weekDay || weekDays[new Date().getDay()];
  ctx.fillText(`${currentWeekDay} ${options?.lunarDate || calculateLunarDate()}`, config.width / 2, config.headerPaddingTop + 116);
}

/**
 * 计算新闻行
 */
function calculateNewsLines(
  ctx: CanvasRenderingContext2D,
  news: Array<{ id: number; content: string }>,
  maxTextWidth: number
) {
  return news.map((item) => {
    const lines = calculateTextLines(ctx, item.content, maxTextWidth, 10);
    return { ...item, lines };
  });
}

/**
 * 计算内容高度
 */
function calculateContentHeight(
  newsWithLines: Array<{ id: number; content: string; lines: string[] }>,
  config: any
): number {
  let height = config.contentPadding * 2;
  newsWithLines.forEach((item) => {
    height += item.lines.length * config.lineHeight + config.itemSpacing;
  });
  return height - config.itemSpacing;
}

/**
 * 绘制新闻列表
 */
function drawNewsList(
  ctx: CanvasRenderingContext2D,
  newsWithLines: Array<{ id: number; content: string; lines: string[] }>,
  gradient: CanvasGradient,
  config: any,
  options?: NewsCardOptions
) {
  ctx.textAlign = "left";
  let currentY = config.headerHeight + config.contentPadding;

  newsWithLines.forEach((item) => {
    const x = config.contentMargin + config.contentPadding;
    const numberX = x;
    const textX = x + config.numberSize + config.numberTextGap;

    // 绘制圆形序号
    const numberY = currentY + config.numberSize / 2 + 8;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(numberX + config.numberSize / 2, numberY, config.numberSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制序号文字
    ctx.fillStyle = options?.headerTextColor || globalConfig.newsCard?.headerTextColor || "white";
    ctx.font = "bold 8px \"Microsoft YaHei\", sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.id.toString(), numberX + config.numberSize / 2, numberY + 3);

    // 绘制新闻内容
    ctx.fillStyle = options?.contentTextColor || globalConfig.newsCard?.contentTextColor || "#333333";
    ctx.font = "400 10px \"Microsoft YaHei\", sans-serif";
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";

    item.lines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, currentY + lineIndex * config.lineHeight + 18);
    });

    currentY += item.lines.length * config.lineHeight + config.itemSpacing;
  });
}

/**
 * 计算文本需要多少行（根据实际宽度智能换行）
 */
function calculateTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  let currentLine = "";

  // 设置字体确保正确测量
  ctx.font = `400 ${fontSize}px "Microsoft YaHei", sans-serif`;

  for (let i = 0; i < text.length; i++) {
    const char = text[i] || "";
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * 分享图片
 */
export async function shareImage(dataUrl: string, title: string = "分享图片") {
  try {
    // 将 base64 转换为 blob
    const blob = await fetch(dataUrl).then(res => res.blob());
    const file = new File([blob], "share-image.png", { type: "image/png" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        files: [file]
      });
    } else {
      // 降级方案：复制到剪贴板或下载
      downloadImage(dataUrl, `${title}.png`);
    }
  } catch (error) {
    console.error("分享失败:", error);
    // 降级方案
    downloadImage(dataUrl, `${title}.png`);
  }
}

/**
 * 生成通用列表卡片（用于历史、热搜等）
 */
export async function generateListCard(
  items: Array<{ id?: number; title?: string; content?: string; year?: number; event?: string; hideNumber?: boolean }>,
  options?: {
    title?: string;
    date?: string;
    weekDay?: string;
    lunarDate?: string;
    hideNumbers?: boolean; // 是否隐藏所有序号
    gradientStart?: string;
    gradientEnd?: string;
    contentBackgroundColor?: string;
    headerTextColor?: string;
    contentTextColor?: string;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("无法创建 canvas context");
      }

      const config = {
        scale: 3,
        width: 520,
        headerPaddingTop: 20,
        contentPadding: 15,
        contentMargin: 5,
        lineHeight: 12,
        itemSpacing: 10,
        numberSize: 14,
        numberTextGap: 8,
        headerHeight: 180
      };

      ctx.font = "400 8px \"Microsoft YaHei\", sans-serif";

      const maxTextWidth = config.width - config.contentMargin * 2 - config.contentPadding * 2 - 20;
      const itemsWithLines = items.map((item, index) => {
        const text = item.content || item.event || item.title || "";
        const lines = calculateTextLines(ctx, text, maxTextWidth, 10);
        return { ...item, id: item.id || index + 1, lines };
      });

      let contentHeight = config.contentPadding * 2;
      itemsWithLines.forEach((item) => {
        contentHeight += item.lines.length * config.lineHeight + config.itemSpacing;
      });
      contentHeight -= config.itemSpacing;

      const totalHeight = config.headerHeight + contentHeight + config.contentMargin;

      canvas.width = config.width * config.scale;
      canvas.height = totalHeight * config.scale;
      ctx.scale(config.scale, config.scale);

      // 绘制背景渐变
      const gradientStart = options?.gradientStart || globalConfig.newsCard?.gradientStart || "#ff6b6b";
      const gradientEnd = options?.gradientEnd || globalConfig.newsCard?.gradientEnd || "#ee5a6f";
      const gradient = ctx.createLinearGradient(0, 0, config.width, totalHeight);
      gradient.addColorStop(0, gradientStart);
      gradient.addColorStop(1, gradientEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.width, totalHeight);

      // 绘制头部
      ctx.textAlign = "center";
      ctx.fillStyle = options?.headerTextColor || globalConfig.newsCard?.headerTextColor || "white";

      ctx.font = "bold 24px \"Microsoft YaHei\", sans-serif";
      ctx.letterSpacing = "6px";
      const currentDate = options?.date || new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      ctx.fillText(currentDate, config.width / 2, config.headerPaddingTop + 32);

      // 只有当 title 不是空字符串时才显示标题
      if (options?.title !== "") {
        ctx.font = "bold 36px \"Microsoft YaHei\", sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText(options?.title || "每日资讯", config.width / 2, config.headerPaddingTop + 86);
      }

      ctx.font = "500 18px \"Microsoft YaHei\", sans-serif";
      ctx.letterSpacing = "4px";
      const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      const currentWeekDay = options?.weekDay || weekDays[new Date().getDay()];
      ctx.fillText(`${currentWeekDay} ${options?.lunarDate || calculateLunarDate()}`, config.width / 2, config.headerPaddingTop + 116);

      // 绘制内容区域
      const contentBgColor = options?.contentBackgroundColor || globalConfig.newsCard?.contentBackgroundColor || "white";
      ctx.fillStyle = contentBgColor;
      ctx.fillRect(config.contentMargin, config.headerHeight, config.width - config.contentMargin * 2, contentHeight);

      // 绘制列表
      ctx.textAlign = "left";
      let currentY = config.headerHeight + config.contentPadding;

      itemsWithLines.forEach((item) => {
        const x = config.contentMargin + config.contentPadding;
        const showNumber = !options?.hideNumbers && !item.hideNumber;
        const numberX = x;
        const textX = showNumber ? (x + config.numberSize + config.numberTextGap) : x;

        if (showNumber) {
          // 绘制圆形序号
          const numberY = currentY + config.numberSize / 2 + 8;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(numberX + config.numberSize / 2, numberY, config.numberSize / 2, 0, Math.PI * 2);
          ctx.fill();

          // 绘制序号文字
          ctx.fillStyle = options?.headerTextColor || globalConfig.newsCard?.headerTextColor || "white";
          const idStr = (item.id || "").toString();
          // 根据数字长度调整字体大小
          const fontSize = idStr.length > 1 ? 5 : 8;
          ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(idStr, numberX + config.numberSize / 2, numberY + fontSize / 2 - 0.5);
        }

        // 绘制内容
        const contentTextColor = options?.contentTextColor || globalConfig.newsCard?.contentTextColor || "#333333";
        ctx.fillStyle = contentTextColor;
        ctx.font = "400 10px \"Microsoft YaHei\", sans-serif";
        ctx.textAlign = "left";
        ctx.letterSpacing = "0px";

        item.lines.forEach((line, lineIndex) => {
          const lineY = currentY + lineIndex * config.lineHeight + 18;

          // 检查是否包含标签（冒号分隔）
          if (line.includes("：")) {
            const parts = line.split("：");
            const label = parts[0] || "";
            const content = parts.slice(1).join("："); // 处理内容中可能包含冒号的情况

            // 测量标签宽度
            ctx.font = "600 10px \"Microsoft YaHei\", sans-serif";
            const labelWidth = ctx.measureText(label).width;
            const padding = 6;
            const labelHeight = 16;

            // 根据标签内容选择背景颜色
            let bgColor;
            if (label === "宜" || label === "吉神") {
              bgColor = "#10b981"; // 绿色
            } else if (label === "忌" || label === "凶神") {
              bgColor = "#ef4444"; // 红色
            } else {
              bgColor = gradient; // 其他标签使用渐变色
            }

            // 绘制标签背景（圆角矩形）
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(textX, lineY - 12, labelWidth + padding * 2, labelHeight, 4);
            ctx.fill();

            // 绘制标签文字（宜、忌、吉神、凶神保持白色，其他使用头部文字颜色）
            if (label === "宜" || label === "忌" || label === "吉神" || label === "凶神") {
              ctx.fillStyle = "white";
            } else {
              ctx.fillStyle = options?.headerTextColor || globalConfig.newsCard?.headerTextColor || "white";
            }
            ctx.fillText(label, textX + padding, lineY);

            // 绘制内容文字
            ctx.fillStyle = contentTextColor;
            ctx.font = "400 10px \"Microsoft YaHei\", sans-serif";
            ctx.fillText(content, textX + labelWidth + padding * 2 + 6, lineY);
          } else {
            // 普通文本直接绘制
            ctx.fillText(line, textX, lineY);
          }
        });

        currentY += item.lines.length * config.lineHeight + config.itemSpacing;
      });

      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error("生成列表卡片失败:", error);
      reject(error);
    }
  });
}
