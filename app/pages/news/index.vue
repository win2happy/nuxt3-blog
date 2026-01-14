<template>
  <div class="news-aggregator min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
    <!-- 加载状态 -->
    <Transition name="fade">
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-800">
          <div class="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            正在加载数据
          </p>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            请稍候...
          </p>
        </div>
      </div>
    </Transition>

    <!-- 错误提示 -->
    <Transition name="fade">
      <div
        v-if="loadError"
        class="fixed right-4 top-4 z-[70] max-w-md rounded-lg bg-red-500 p-4 text-white shadow-lg"
      >
        <div class="flex items-center space-x-2">
          <span class="text-2xl">⚠️</span>
          <div>
            <p class="font-bold">
              加载失败
            </p>
            <p class="text-sm">
              {{ loadError }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <div class="container mx-auto max-w-7xl px-4 py-8">
      <!-- 头部标题 -->
      <div class="relative mb-12 text-center">
        <!-- 装饰元素 -->
        <div class="absolute inset-0 -z-10 overflow-hidden">
          <div class="absolute left-1/4 top-0 size-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div class="absolute right-1/4 top-20 size-64 rounded-full bg-purple-400/10 blur-3xl" />
        </div>

        <div class="mb-4 inline-flex items-center justify-center">
          <div class="mr-4 h-1 w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <span class="text-5xl">📰</span>
          <div class="ml-4 h-1 w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>

        <h1 class="mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 md:text-6xl">
          每日新闻聚合
        </h1>
        <p class="mb-4 text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Daily News Aggregation
        </p>

        <div class="inline-flex items-center space-x-3 rounded-full bg-white/80 px-6 py-3 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">📅</span>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ currentDate }}</span>
          </div>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div class="flex items-center space-x-2">
            <span class="text-xl">🌙</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ lunarDate }}</span>
          </div>
        </div>

        <!-- 保存图片按钮 -->
        <div class="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            class="group inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
            @click="showSaveModal = true"
          >
            <span class="text-xl">💾</span>
            <span>保存图片</span>
            <svg
              class="size-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <!-- 卡片样式配置按钮 -->
          <button
            class="group inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-pink-700 hover:shadow-xl"
            @click="showConfigModal = true"
          >
            <span class="text-xl">🎨</span>
            <span>样式配置</span>
          </button>
        </div>
      </div>

      <!-- 60秒读懂世界 -->
      <NewsQuickRead
        v-if="quickNews && quickNews.length > 0"
        ref="newsRef"
        :news="quickNews"
      />

      <!-- 实时热搜 -->
      <HotTrends
        v-if="hotTrends && hotTrends.length > 0"
        ref="trendsRef"
        :trends="hotTrends"
      />

      <!-- 底部区域 -->
      <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- 历史上的今天 -->
        <HistoryToday
          v-if="historyEvents && historyEvents.length > 0"
          ref="historyRef"
          :events="historyEvents"
        />

        <!-- 右侧栏 -->
        <div class="space-y-8">
          <!-- 今日黄历 -->
          <DailyCalendar
            v-if="calendarInfo"
            ref="calendarRef"
            :calendar="calendarInfo"
          />

          <!-- 每日一语 -->
          <DailyQuote
            v-if="dailyQuote"
            ref="quoteRef"
            :quote="dailyQuote"
          />
        </div>
      </div>
    </div>

    <!-- 保存图片模态框 -->
    <SaveImageModal
      v-model="showSaveModal"
      @save="handleSaveImage"
    />

    <!-- 卡片样式配置模态框 -->
    <CardConfigModal
      :show="showConfigModal"
      @close="showConfigModal = false"
    />

    <!-- Loading -->
    <Transition name="fade">
      <div
        v-if="isGenerating"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-800">
          <div class="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ generatingText }}
          </p>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            请稍候...
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import * as ImageGenerator from "~/utils/imageGenerator";

const newsRef = ref();
const trendsRef = ref();
const historyRef = ref();
const calendarRef = ref();
const quoteRef = ref();

const showSaveModal = ref(false);
const showConfigModal = ref(false);
const isGenerating = ref(false);
const generatingText = ref("正在生成图片");

const currentDate = computed(() => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
});

// 数据加载状态
const loadError = ref("");

// 使用 useAsyncData 在服务端和客户端都获取数据
const { data: newsData, pending: isLoading } = await useAsyncData("newsData", async () => {
  try {
    // 并行请求所有数据
    const [
      lunarRes,
      newsRes,
      trendsRes,
      historyRes,
      calendarRes,
      quoteRes
    ] = await Promise.all([
      $fetch("/api/news/lunar-date"),
      $fetch("/api/news/quick-news"),
      $fetch("/api/news/hot-trends"),
      $fetch("/api/news/history-today"),
      $fetch("/api/news/calendar"),
      $fetch("/api/news/daily-quote")
    ]);

    return {
      lunarDate: lunarRes.data.lunarDate,
      quickNews: newsRes.data,
      hotTrends: trendsRes.data,
      historyEvents: historyRes.data,
      calendarInfo: calendarRes.data,
      dailyQuote: quoteRes.data
    };
  } catch (error) {
    console.error("加载数据失败:", error);
    loadError.value = "加载数据失败，请刷新页面重试";
    // 返回默认值
    return {
      lunarDate: "农历日期",
      quickNews: [],
      hotTrends: [],
      historyEvents: [],
      calendarInfo: {
        lunar: "农历",
        animal: "年",
        month: "月",
        day: "日",
        element: "五行",
        conflict: "冲煞",
        suitable: [],
        avoid: [],
        luckyGod: "",
        badGod: "",
        luckyDirection: "",
        wealthDirection: "",
        blessDirection: ""
      },
      dailyQuote: {
        text: "",
        content: "",
        author: ""
      }
    };
  }
});

// 从 newsData 中解构数据
const lunarDate = computed(() => newsData.value?.lunarDate || "");
const quickNews = computed(() => newsData.value?.quickNews || []);
const hotTrends = computed(() => newsData.value?.hotTrends || []);
const historyEvents = computed(() => newsData.value?.historyEvents || []);
const calendarInfo = computed(() => newsData.value?.calendarInfo || null);
const dailyQuote = computed(() => newsData.value?.dailyQuote || null);

// 使用统一的前端配置
const { cardConfig } = useCardConfig();

// 处理保存图片
const handleSaveImage = async (type: string, customConfig?: any) => {
  // 检查数据是否已加载
  if (isLoading.value) {
    alert("数据正在加载中，请稍候再试");
    return;
  }

  if (!newsData.value?.calendarInfo || !newsData.value?.dailyQuote) {
    alert("数据未加载完成，请稍候再试");
    return;
  }
  isGenerating.value = true;

  try {
    let dataUrl = "";
    let filename = "";

    switch (type) {
      case "news-card": {
        generatingText.value = "正在生成60秒读懂世界红色卡片";
        const newsCardDate = new Date();
        filename = `${newsCardDate.getFullYear()}年${newsCardDate.getMonth() + 1}月${newsCardDate.getDate()}日-60秒读懂世界.png`;
        const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        dataUrl = await ImageGenerator.generateNewsCard(
          quickNews.value,
          {
            date: `${newsCardDate.getFullYear()}年${newsCardDate.getMonth() + 1}月${newsCardDate.getDate()}日`,
            weekDay: weekDays[newsCardDate.getDay()],
            lunarDate: lunarDate.value,
            // 使用前端配置（customConfig 如果有则使用，否则使用全局前端配置）
            ...(customConfig || cardConfig.value)
          }
        );
        break;
      }

      case "trends": {
        generatingText.value = "正在生成实时热搜";
        const trendsDate = new Date();
        filename = `${trendsDate.getFullYear()}年${trendsDate.getMonth() + 1}月${trendsDate.getDate()}日-实时热搜.png`;
        // 使用Canvas生成卡片 - 合并所有平台的热搜
        const trendsWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const allTrends: any[] = [];
        hotTrends.value.forEach((platform) => {
          platform.items.forEach((item: any) => {
            allTrends.push({
              id: allTrends.length + 1,
              content: `【${platform.platform}】${item.title}`
            });
          });
        });
        dataUrl = await ImageGenerator.generateListCard(
          allTrends.slice(0, 15), // 只取前15条
          {
            title: "实时热搜",
            date: `${trendsDate.getFullYear()}年${trendsDate.getMonth() + 1}月${trendsDate.getDate()}日`,
            weekDay: trendsWeekDays[trendsDate.getDay()],
            lunarDate: lunarDate.value,
            // 使用前端配置
            gradientStart: cardConfig.value.gradientStart,
            gradientEnd: cardConfig.value.gradientEnd,
            contentBackgroundColor: cardConfig.value.contentBackgroundColor,
            headerTextColor: cardConfig.value.headerTextColor,
            contentTextColor: cardConfig.value.contentTextColor
          }
        );
        break;
      }

      case "history": {
        generatingText.value = "正在生成历史上的今天";
        const historyDate = new Date();
        filename = `${historyDate.getFullYear()}年${historyDate.getMonth() + 1}月${historyDate.getDate()}日-历史上的今天.png`;
        // 使用Canvas生成卡片，格式化历史事件（年份 + 事件）
        const historyWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const formattedHistory = historyEvents.value.map((item, index) => ({
          id: index + 1,
          content: `${item.year}年 ${item.event}`,
          hideNumber: true // 标记不显示序号
        }));
        dataUrl = await ImageGenerator.generateListCard(
          formattedHistory,
          {
            title: "历史上的今天",
            date: `${historyDate.getFullYear()}年${historyDate.getMonth() + 1}月${historyDate.getDate()}日`,
            weekDay: historyWeekDays[historyDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true, // 全局控制不显示序号
            // 使用前端配置
            gradientStart: cardConfig.value.gradientStart,
            gradientEnd: cardConfig.value.gradientEnd,
            contentBackgroundColor: cardConfig.value.contentBackgroundColor,
            headerTextColor: cardConfig.value.headerTextColor,
            contentTextColor: cardConfig.value.contentTextColor
          }
        );
        break;
      }

      case "calendar": {
        generatingText.value = "正在生成今日黄历";
        const calendarFileDate = new Date();
        filename = `${calendarFileDate.getFullYear()}年${calendarFileDate.getMonth() + 1}月${calendarFileDate.getDate()}日-今日黄历.png`;
        // 使用Canvas生成卡片，按页面展示格式排版
        const calendarDate = new Date();
        const calendarWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const calendarItems = [
          { id: 1, content: `${calendarInfo.value.lunar}  ${calendarInfo.value.animal}  ${calendarInfo.value.month}  ${calendarInfo.value.day}` },
          { id: 2, content: "" }, // 空行
          { id: 3, content: `五行：${calendarInfo.value.element}` },
          { id: 4, content: `冲煞：${calendarInfo.value.conflict}` },
          { id: 5, content: "" }, // 空行
          { id: 6, content: `喜神：${calendarInfo.value.luckyDirection}` },
          { id: 7, content: `福神：${calendarInfo.value.blessDirection}` },
          { id: 8, content: `财神：${calendarInfo.value.wealthDirection}` },
          { id: 9, content: "" }, // 空行
          { id: 10, content: `宜：${calendarInfo.value.suitable.join("  ")}` },
          { id: 11, content: `忌：${calendarInfo.value.avoid.join("  ")}` },
          { id: 12, content: "" }, // 空行
          { id: 13, content: `吉神：${calendarInfo.value.luckyGod}` },
          { id: 14, content: `凶神：${calendarInfo.value.badGod}` }
        ];
        dataUrl = await ImageGenerator.generateListCard(
          calendarItems,
          {
            title: "今日黄历",
            date: `${calendarDate.getFullYear()}年${calendarDate.getMonth() + 1}月${calendarDate.getDate()}日`,
            weekDay: calendarWeekDays[calendarDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true, // 不显示序号
            // 使用前端配置
            gradientStart: cardConfig.value.gradientStart,
            gradientEnd: cardConfig.value.gradientEnd,
            contentBackgroundColor: cardConfig.value.contentBackgroundColor,
            headerTextColor: cardConfig.value.headerTextColor,
            contentTextColor: cardConfig.value.contentTextColor
          }
        );
        break;
      }

      case "quote": {
        generatingText.value = "正在生成每日一语";
        const quoteFileDate = new Date();
        filename = `${quoteFileDate.getFullYear()}年${quoteFileDate.getMonth() + 1}月${quoteFileDate.getDate()}日-每日一语.png`;
        // 使用Canvas生成卡片
        const quoteDate = new Date();
        const quoteWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const quoteItems = [
          { id: 1, content: dailyQuote.value.content }
        ];
        dataUrl = await ImageGenerator.generateListCard(
          quoteItems,
          {
            title: "每日一语",
            date: `${quoteDate.getFullYear()}年${quoteDate.getMonth() + 1}月${quoteDate.getDate()}日`,
            weekDay: quoteWeekDays[quoteDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true, // 不显示序号
            // 使用前端配置
            gradientStart: cardConfig.value.gradientStart,
            gradientEnd: cardConfig.value.gradientEnd,
            contentBackgroundColor: cardConfig.value.contentBackgroundColor,
            headerTextColor: cardConfig.value.headerTextColor,
            contentTextColor: cardConfig.value.contentTextColor
          }
        );
        break;
      }
    }

    if (dataUrl) {
      ImageGenerator.downloadImage(dataUrl, filename);
    }
  } catch (error) {
    console.error("生成图片失败:", error);
    alert("生成图片失败，请重试");
  } finally {
    isGenerating.value = false;
  }
};

// 设置页面元数据
useHead({
  title: "每日新闻聚合 - 60秒读懂世界",
  meta: [
    { name: "description", content: "聚合每日新闻、热搜榜单、历史事件、黄历信息等内容" }
  ]
});
</script>

<style scoped>
.news-aggregator {
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
