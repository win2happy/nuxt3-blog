import { fetchLunarDate } from "../../utils/fetchNewsData";

export default defineEventHandler(async (event) => {
  // Set cache control headers to prevent excessive caching
  setResponseHeaders(event, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600"
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
