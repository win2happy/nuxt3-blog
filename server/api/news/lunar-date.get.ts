import { fetchLunarDate } from "../../utils/fetchNewsData";

export default defineEventHandler(async () => {
  try {
    const lunarDate = await fetchLunarDate();
    return {
      data: {
        lunarDate
      }
    };
  } catch (error) {
    console.error("获取农历日期失败:", error);
    return {
      data: {
        lunarDate: "农历日期"
      },
      error: "获取数据失败"
    };
  }
});
