import { fetchDailyQuote } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
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
