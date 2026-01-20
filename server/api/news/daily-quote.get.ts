import { fetchDailyQuote } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600"
  });

  try {
    const data = await fetchDailyQuote();
    return { data };
  } catch (error) {
    console.error("获取每日一语失败:", error);
    return {
      data: null,
      error: "获取数据失败"
    };
  }
});
