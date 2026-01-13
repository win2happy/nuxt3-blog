import { fetchHotTrends } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
  try {
    const data = await fetchHotTrends();
    return { data };
  } catch (error) {
    console.error("获取热搜失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
