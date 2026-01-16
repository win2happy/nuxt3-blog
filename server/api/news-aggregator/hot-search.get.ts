import { getHotSearch } from "../../utils/fetchNewsAggregatorData";

export default defineEventHandler(async (event) => {
  try {
    const platform = getQuery(event).platform as string || "douyin";
    const data = await getHotSearch(platform);
    return { data };
  } catch (error) {
    console.error("获取热搜失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
