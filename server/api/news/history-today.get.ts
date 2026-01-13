import { fetchHistoryToday } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
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
