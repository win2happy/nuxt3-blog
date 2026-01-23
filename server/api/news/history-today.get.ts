import { fetchHistoryToday, clearCache } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const noCache = query.noCache === "true";

  // 当 noCache 为 true 时，清除缓存
  if (noCache) {
    clearCache("historyToday");
    clearCache("html"); // 同时清除HTML缓存，确保所有数据都更新
  }

  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": noCache ? "no-cache, no-store, must-revalidate" : "public, s-maxage=3600, stale-while-revalidate=600"
  });

  try {
    const data = await fetchHistoryToday();
    return { data };
  } catch (error) {
    console.error("获取历史上的今天失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
