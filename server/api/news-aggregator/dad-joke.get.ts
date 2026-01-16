import { getDadJoke } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getDadJoke();
    return { data };
  } catch (error) {
    console.error("获取冷笑话失败:", error);
    return {
      data: "加载中...",
      error: "获取数据失败"
    };
  }
});
