import { fetchCalendar } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
  try {
    const data = await fetchCalendar();
    return { data };
  } catch (error) {
    console.error("获取黄历失败:", error);
    return {
      data: null,
      error: "获取数据失败"
    };
  }
});
