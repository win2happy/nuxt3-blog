import { fetchQuickNews } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
  try {
    const data = await fetchQuickNews();
    return { data };
  } catch (error) {
    console.error("获取60秒新闻失败:", error);
    return {
      data: [],
      error: "获取数据失败"
    };
  }
});
