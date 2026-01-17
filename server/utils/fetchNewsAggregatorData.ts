import https from "node:https";

/**
 * 发送HTTP请求
 */
async function fetchApi(url: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ...options.headers
      },
      rejectUnauthorized: false,
      ...options
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * 获取60秒读懂世界
 */
export async function getSixtySecondsNews(): Promise<any[]> {
  try {
    const data = await fetchApi("https://60s.viki.moe/v2/60s?encoding=json");
    const result = Array.isArray(data) ? data : (data.data || []);
    return result;
  } catch (error) {
    console.error("获取60秒读懂世界失败:", error);
    return [];
  }
}

/**
 * 获取AI资讯快报
 */
export async function getAiNews(): Promise<any[]> {
  try {
    // 使用昨天的日期获取AI新闻，确保有数据
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    const data = await fetchApi(`https://60s.viki.moe/v2/ai-news?encoding=json&date=${dateStr}`);
    const result = Array.isArray(data) ? data : (data.data?.news || []);

    // 如果仍然没有数据，使用all参数获取所有数据
    if (result.length === 0) {
      const allData = await fetchApi("https://60s.viki.moe/v2/ai-news?encoding=json&all=1");
      const allResult = Array.isArray(allData) ? allData : (allData.data?.news || []);
      return allResult;
    }

    return result;
  } catch (error) {
    console.error("获取AI资讯快报失败:", error);
    return [];
  }
}

/**
 * 获取历史上的今天
 */
export async function getHistoryToday(): Promise<any[]> {
  try {
    const data = await fetchApi("https://60s.viki.moe/v2/today-in-history?encoding=json");
    // API返回的是 { data: { items: [...] } } 结构
    const items = Array.isArray(data) ? data : (data.data?.items || []);
    // 转换数据结构以匹配模板期望的格式
    const result = items.map(item => ({
      year: item.year,
      event: item.description || item.title
    }));
    return result;
  } catch (error) {
    console.error("获取历史上的今天失败:", error);
    return [];
  }
}

/**
 * 获取实时热搜
 */
export async function getHotSearch(platform: string): Promise<any[]> {
  try {
    let url = "";
    switch (platform) {
      case "douyin":
        url = "https://60s.viki.moe/v2/douyin?encoding=json";
        break;
      case "rednote":
        url = "https://60s.viki.moe/v2/rednote?encoding=json";
        break;
      case "bili":
        url = "https://60s.viki.moe/v2/bili?encoding=json";
        break;
      case "weibo":
        url = "https://60s.viki.moe/v2/weibo?encoding=json";
        break;
      case "baidu":
        url = "https://60s.viki.moe/v2/baidu/hot?encoding=json";
        break;
      case "toutiao":
        url = "https://60s.viki.moe/v2/toutiao?encoding=json";
        break;
      case "zhihu":
        url = "https://60s.viki.moe/v2/zhihu?encoding=json";
        break;
      case "hackernews":
        url = "https://60s.viki.moe/v2/hacker-news/top?encoding=json";
        break;
      default:
        url = "https://60s.viki.moe/v2/douyin?encoding=json";
    }

    const data = await fetchApi(url);
    const result = Array.isArray(data) ? data : (data.data || []);
    return result;
  } catch (error) {
    console.error(`获取${platform}热搜失败:`, error);
    return [];
  }
}

/**
 * 获取随机一言
 */
export async function getRandomQuote(): Promise<string> {
  try {
    const data = await fetchApi("https://60s.viki.moe/v2/hitokoto?encoding=json");
    const result = typeof data === "string" ? data : (data.data || "");
    return result;
  } catch (error) {
    console.error("获取随机一言失败:", error);
    return "加载中...";
  }
}

/**
 * 获取随机搞笑段子
 */
export async function getFunnyJoke(): Promise<string> {
  try {
    const data = await fetchApi("https://60s.viki.moe/v2/duanzi?encoding=json");
    const result = typeof data === "string" ? data : (data.data || "");
    return result;
  } catch (error) {
    console.error("获取随机搞笑段子失败:", error);
    return "加载中...";
  }
}

/**
 * 获取随机冷笑话
 */
export async function getDadJoke(): Promise<string> {
  try {
    const data = await fetchApi("https://60s.viki.moe/v2/dad-joke?encoding=json");
    const result = typeof data === "string" ? data : (data.data || "");
    return result;
  } catch (error) {
    console.error("获取随机冷笑话失败:", error);
    return "加载中...";
  }
}
