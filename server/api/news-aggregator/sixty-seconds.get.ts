import { getSixtySecondsNews } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async () => {
  try {
    const data = await getSixtySecondsNews();
    return { data };
  } catch (error) {
    console.error("获取60秒读懂世界失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
