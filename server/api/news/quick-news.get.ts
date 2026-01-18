import { fetchQuickNews } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600"
  });

  try {
    const data = await fetchQuickNews();
    return { data };
  } catch (error) {
    console.error("获取60秒新闻失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
