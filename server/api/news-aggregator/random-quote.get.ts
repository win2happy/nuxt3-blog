import { getRandomQuote } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getRandomQuote();
    return { data };
  } catch (error) {
    console.error("获取随机一言失败:", error);
    return {
      data: "加载中...",
      error: "获取数据失败"
    };
  }
});
