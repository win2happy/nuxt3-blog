import { fetchLunarDate, clearCache } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const noCache = query.noCache === "true";

  // 当 noCache 为 true 时，清除缓存
  if (noCache) {
    clearCache("lunarDate");
    clearCache("html"); // 同时清除HTML缓存
  }

  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": noCache ? "no-cache, no-store, must-revalidate" : "public, s-maxage=3600, stale-while-revalidate=600"
  });

  try {
    const lunarDate = await fetchLunarDate();
    return {
      data: {
        lunarDate
      }
    };
  } catch (error) {
    console.error("获取农历日期失败:", error);
    return {
      data: {
        lunarDate: "农历日期"
      },
      error: "获取数据失败"
    };
  }
});
