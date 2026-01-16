import { getAiNews } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getAiNews();
    return { data };
  } catch (error) {
    console.error("获取AI资讯快报失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
