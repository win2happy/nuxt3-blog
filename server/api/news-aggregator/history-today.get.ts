import { getHistoryToday } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getHistoryToday();
    return { data };
  } catch (error) {
    console.error("获取历史上的今天失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
