import { getFunnyJoke } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getFunnyJoke();
    return { data };
  } catch (error) {
    console.error("获取搞笑段子失败:", error);
    return {
      data: "加载中...",
      error: "获取数据失败"
    };
  }
});
