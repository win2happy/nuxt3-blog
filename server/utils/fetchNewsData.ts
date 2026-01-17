import https from "node:https";
import * as cheerio from "cheerio";
import { Solar } from "lunar-javascript";

const NEWS_URL = "https://www.soso365.com/news/index.php";

/**
 * 获取网页HTML
 */
async function fetchHTML(): Promise<string> {
  try {
    // 使用 Node.js 原生 https 模块来避免 SSL 证书问题
    const html = await new Promise<string>((resolve, reject) => {
      https.get(NEWS_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        rejectUnauthorized: false // 跳过 SSL 证书验证
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      }).on("error", (err) => {
        reject(err);
      });
    });

    return html;
  } catch (error) {
    console.error("获取网页失败:", error);
    throw error;
  }
}

/**
 * 解析60秒读懂世界新闻
 */
export async function fetchQuickNews() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);
    const news: any[] = [];

    // 查找 "60秒读懂世界" 部分的内容
    $("h1:contains('60秒读懂世界')").first().parent().find("li").each((index, element) => {
      const text = $(element).text().trim();
      const link = $(element).attr("href") || "#";

      // 提取序号和内容
      const match = text.match(/^(\d+)[、，.](.+)$/);
      if (match) {
        news.push({
          id: Number.parseInt(match[1]),
          content: match[2].trim(),
          link
        });
      } else if (text && index < 15) {
        // 如果没有序号，按顺序添加
        news.push({
          id: index + 1,
          content: text,
          link
        });
      }
    });

    const result = news.slice(0, 15); // 只取前15条
    return result;
  } catch (error) {
    console.error("解析60秒新闻失败:", error);
    return [];
  }
}

/**
 * 解析实时热搜
 */
export async function fetchHotTrends() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);
    const trends: any[] = [];

    const platformMap: Record<string, { name: string; icon: string }> = {
      baidu: { name: "百度热搜", icon: "🔍" },
      weibo: { name: "微博热搜", icon: "📱" },
      douyin: { name: "抖音热点", icon: "🎵" },
      bilibili: { name: "B站热搜", icon: "📺" },
      zhihu: { name: "知乎日报", icon: "💡" },
      qqnews_hot: { name: "腾讯新闻热点", icon: "📰" }
    };

    // 遍历各个平台
    for (const [_platform, info] of Object.entries(platformMap)) {
      // 找到包含平台名称的h2标题
      const h2 = $(`h2:contains('${info.name}')`).first();
      if (!h2.length) continue;

      const items: any[] = [];

      // 找到h2之后的下一个元素（通常是包含列表的容器）
      let currentElement = h2.next();

      // 遍历h2后的元素，直到遇到下一个h1或h2标题
      while (currentElement.length && !currentElement.is("h1, h2")) {
        currentElement.find("a").each((index, element) => {
          const text = $(element).text().trim();
          const link = $(element).attr("href") || "#";

          // 跳过"完整榜单"、"更多"等导航链接
          if (text.includes("完整榜单") || text.includes("更多") || text.match(/^[>\]】]/)) {
            return;
          }

          // 跳过空链接或只有符号的链接
          if (!text || text.length < 2) {
            return;
          }

          // 移除序号和热度标签
          let cleanText = text.replace(/^\d+\./, "").replace(/\d+w$/, "").trim();
          // 移除可能的热度标签（在末尾）
          cleanText = cleanText.replace(/(HOT|爆|新|热|沸)$/, "").trim();
          const heatMatch = text.match(/(\d+w|HOT|爆|新|热|沸)$/);

          // 只添加有效的内容，且限制为前5条
          if (cleanText && cleanText.length > 2 && items.length < 5) {
            items.push({
              rank: items.length + 1,
              title: cleanText,
              heat: heatMatch ? heatMatch[1] : "",
              link
            });
          }
        });

        // 移动到下一个兄弟元素
        currentElement = currentElement.next();
      }

      if (items.length > 0) {
        trends.push({
          platform: info.name,
          icon: info.icon,
          link: "#",
          items
        });
      }
    }

    return trends;
  } catch (error) {
    console.error("解析热搜失败:", error);
    return [];
  }
}

/**
 * 解析历史上的今天
 */
export async function fetchHistoryToday() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);
    const history: any[] = [];

    // 查找 "历史上的今天" 部分
    $("h1:contains('历史上的今天')").first().parent().find("a").each((index, element) => {
      const text = $(element).text().trim();
      const link = $(element).attr("href") || "#";

      // 解析年份和事件
      const match = text.match(/^(\d+)\s*[·・]\s*(.+)$/);
      if (match) {
        history.push({
          year: Number.parseInt(match[1]),
          event: match[2].trim(),
          link
        });
      }
    });

    return history;
  } catch (error) {
    console.error("解析历史事件失败:", error);
    return [];
  }
}

/**
 * 解析今日黄历
 */
export async function fetchCalendar() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);

    // 查找 "今日黄历" 部分
    const calendarSection = $("h1:contains('今日黄历')").first().parent();

    // 提取各项信息 - 直接从 HTML 元素中获取
    let lunar = "";
    let animal = "";
    let month = "";
    let day = "";
    let element = "";
    let conflict = "";
    const suitable: string[] = [];
    const avoid: string[] = [];
    let luckyGod = "";
    let badGod = "";
    let luckyDirection = "";
    let wealthDirection = "";
    let blessDirection = "";

    // 遍历黄历部分的所有文本节点和元素
    calendarSection.find("*").each((_, elem) => {
      const text = $(elem).text().trim();

      // 农历
      if (text.includes("农历") && text.match(/[年月日]/)) {
        lunar = text.match(/农历[\s\S]*?[年月日]/)?.[0] || lunar;
      }

      // 干支纪年
      if (text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥][鼠牛虎兔龙蛇马羊猴鸡狗猪]年/)) {
        animal = text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥][鼠牛虎兔龙蛇马羊猴鸡狗猪]年/)?.[0] || animal;
      }

      // 干支纪月
      if (text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]月/) && !text.includes("年")) {
        month = text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]月/)?.[0] || month;
      }

      // 干支纪日
      if (text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/)) {
        day = text.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/)?.[0] || day;
      }

      // 五行
      if (text.includes("五行")) {
        element = text.replace(/五行[：:]*/, "").trim() || element;
      }

      // 冲煞
      if (text.includes("冲") && text.match(/煞[东西南北]/)) {
        conflict = text || conflict;
      }

      // 喜神方位
      if (text.includes("喜神")) {
        const dirMatch = text.match(/[东西南北]+|正[东西南北]/);
        if (dirMatch) luckyDirection = dirMatch[0];
      }

      // 财神方位
      if (text.includes("财神")) {
        const dirMatch = text.match(/[东西南北]+|正[东西南北]/);
        if (dirMatch) wealthDirection = dirMatch[0];
      }

      // 福神方位
      if (text.includes("福神")) {
        const dirMatch = text.match(/[东西南北]+|正[东西南北]/);
        if (dirMatch) blessDirection = dirMatch[0];
      }
    });

    // 提取宜和忌 - 直接从 HTML 的 <i> 标签中获取
    const yiDiv = calendarSection.find("#yi, .yiji:has(b:contains('宜'))").first();
    if (yiDiv.length > 0) {
      yiDiv.find("i").each((_, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          suitable.push(text);
        }
      });
    }

    const jiDiv = calendarSection.find("#ji, .yiji:has(b:contains('忌'))").first();
    if (jiDiv.length > 0) {
      jiDiv.find("i").each((_, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          avoid.push(text);
        }
      });
    }

    // 提取吉神和凶神 - 直接从 HTML 的 <i> 标签中获取
    const jshenDiv = calendarSection.find("#jshen, .shen:has(b:contains('吉神'))").first();
    if (jshenDiv.length > 0) {
      const gods: string[] = [];
      jshenDiv.find("i").each((_, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          gods.push(text);
        }
      });
      if (gods.length > 0) {
        luckyGod = gods.join(" ");
      }
    }

    const xshenDiv = calendarSection.find("#xshen, .shen:has(b:contains('凶神'))").first();
    if (xshenDiv.length > 0) {
      const gods: string[] = [];
      xshenDiv.find("i").each((_, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          gods.push(text);
        }
      });
      if (gods.length > 0) {
        badGod = gods.join(" ");
      }
    }

    // 设置默认值
    const result = {
      lunar: lunar || calculateLunarDate(),
      animal: animal || "",
      month: month || "",
      day: day || "",
      element: element || "",
      conflict: conflict || "",
      suitable: suitable.length > 0 ? suitable : [],
      avoid: avoid.length > 0 ? avoid : [],
      luckyGod: luckyGod || "",
      badGod: badGod || "",
      luckyDirection: luckyDirection || "",
      wealthDirection: wealthDirection || "",
      blessDirection: blessDirection || ""
    };

    return result;
  } catch (error) {
    console.error("解析黄历失败:", error);
    return null;
  }
}

/**
 * 解析每日一语
 */
export async function fetchDailyQuote() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);

    // 查找 "每日一语" 部分
    const quoteSection = $("h1:contains('每日一语')").first().parent();
    const quoteText = quoteSection.find("p, div").not("h1").text().trim()
      || quoteSection.text().replace(/每日一语/g, "").replace(/保存图片/g, "").trim();

    const result = {
      text: quoteText,
      content: quoteText,
      author: "佚名"
    };

    return result;
  } catch (error) {
    console.error("解析每日一语失败:", error);
    return null;
  }
}

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
 * 解析农历日期
 */
export async function fetchLunarDate() {
  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);

    // 从页面顶部提取农历日期
    const dateText = $("h2").first().text();
    const lunarMatch = dateText.match(/农历[\s\S]*?[年月日]/);
    const lunarDate = lunarMatch ? lunarMatch[0] : calculateLunarDate();

    return lunarDate;
  } catch (error) {
    console.error("解析农历日期失败:", error);
    return calculateLunarDate();
  }
}
