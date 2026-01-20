import { fetchHistoryToday } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600"
  });

  try {
    const data = await fetchHistoryToday();
    return { data };
  } catch (error) {
    console.error("获取历史事件失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
