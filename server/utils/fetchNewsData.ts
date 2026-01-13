import https from "node:https";
import * as cheerio from "cheerio";

const NEWS_URL = "https://www.soso365.com/news/index.php";

// 缓存数据
interface CacheData {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheData> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 检查缓存是否有效
 */
function isCacheValid(key: string): boolean {
  const cached = cache[key];
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

/**
 * 获取缓存数据
 */
function getCache(key: string): any {
  if (isCacheValid(key)) {
    return cache[key].data;
  }
  return null;
}

/**
 * 设置缓存数据
 */
function setCache(key: string, data: any): void {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

/**
 * 获取网页HTML
 */
async function fetchHTML(): Promise<string> {
  const cacheKey = "html";
  const cached = getCache(cacheKey);
  if (cached) return cached;

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

    setCache(cacheKey, html);
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
  const cacheKey = "quickNews";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);
    const news: any[] = [];

    // 查找 "60秒读懂世界" 部分的内容
    $("h1:contains('60秒读懂世界')").first().parent().find("a").each((index, element) => {
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
    setCache(cacheKey, result);
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
  const cacheKey = "hotTrends";
  const cached = getCache(cacheKey);
  if (cached) return cached;

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

    setCache(cacheKey, trends);
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
  const cacheKey = "historyToday";
  const cached = getCache(cacheKey);
  if (cached) return cached;

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

    setCache(cacheKey, history);
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
  const cacheKey = "calendar";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);

    // 查找 "今日黄历" 部分
    const calendarSection = $("h1:contains('今日黄历')").first().parent();
    const fullText = calendarSection.text();

    // 提取各项信息
    const lunar = fullText.match(/农历[\s\S]*?[年月日]/)?.[0] || "农历冬月廿五";
    const animal = fullText.match(/乙巳蛇年|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]蛇年/)?.[0] || "乙巳蛇年";
    const month = fullText.match(/己丑月|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]月/)?.[0] || "己丑月";
    const day = fullText.match(/丁亥日|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/)?.[0] || "丁亥日";

    const element = fullText.match(/五行[\s\S]*?土|五行[\s\S]*?金|五行[\s\S]*?水|五行[\s\S]*?木|五行[\s\S]*?火/)?.[0]?.replace("五行", "").trim() || "屋上土";
    const conflict = fullText.match(/冲[\s\S]*?煞西|冲[\s\S]*?煞东|冲[\s\S]*?煞南|冲[\s\S]*?煞北/)?.[0] || "冲(辛巳)蛇 煞西";

    // 提取宜和忌
    const suitableMatch = fullText.match(/宜[\s\S]*?(?=忌)/);
    const avoidMatch = fullText.match(/忌[\s\S]*?(?=吉神|凶神|$)/);

    const suitable = suitableMatch
      ? suitableMatch[0].replace("宜", "").trim().split(/[\s,，、]/).filter(Boolean)
      : ["开市", "交易", "纳财"];
    const avoid = avoidMatch
      ? avoidMatch[0].replace("忌", "").trim().split(/[\s,，、]/).filter(Boolean)
      : ["嫁娶", "安葬"];

    const luckyGod = fullText.match(/吉神[\s\S]*?(?=凶神|$)/)?.[0]?.replace("吉神", "").trim() || "月德合 王日";
    const badGod = fullText.match(/凶神[\s\S]*?$/)?.[0]?.replace("凶神", "").trim() || "游祸 血支 重日 朱雀";

    const luckyDirection = fullText.match(/喜神[\s\S]*?(东南|东北|西南|西北|正东|正西|正南|正北)/)?.[1] || "正南";
    const wealthDirection = fullText.match(/财神[\s\S]*?(东南|东北|西南|西北|正东|正西|正南|正北)/)?.[1] || "西南";

    const result = {
      lunar,
      animal,
      month,
      day,
      element,
      conflict,
      suitable,
      avoid,
      luckyGod,
      badGod,
      luckyDirection,
      wealthDirection
    };

    setCache(cacheKey, result);
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
  const cacheKey = "dailyQuote";
  const cached = getCache(cacheKey);
  if (cached) return cached;

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

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("解析每日一语失败:", error);
    return null;
  }
}

/**
 * 解析农历日期
 */
export async function fetchLunarDate() {
  const cacheKey = "lunarDate";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchHTML();
    const $ = cheerio.load(html);

    // 从页面顶部提取农历日期
    const dateText = $("h2").first().text();
    const lunarMatch = dateText.match(/农历[\s\S]*?[年月日]/);
    const lunarDate = lunarMatch ? lunarMatch[0] : "农历冬月廿五";

    setCache(cacheKey, lunarDate);
    return lunarDate;
  } catch (error) {
    console.error("解析农历日期失败:", error);
    return "农历冬月廿五";
  }
}
