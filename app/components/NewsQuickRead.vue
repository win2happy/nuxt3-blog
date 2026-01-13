<template>
  <div
    id="news-quick-read"
    class="news-quick-read mb-8 rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
  >
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
          <span class="text-3xl">📰</span>
        </div>
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
            60秒读懂世界
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Today's News Brief
          </p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Date
        </div>
        <div class="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {{ newsDate }}
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div
        v-for="item in news"
        :key="item.id"
        class="news-item group flex cursor-pointer items-start rounded-2xl border-2 border-transparent p-5 transition-all duration-300 hover:border-blue-300/50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-lg dark:hover:border-blue-700/50 dark:hover:from-gray-700 dark:hover:to-gray-700/80"
        @click="handleNewsClick(item.link)"
      >
        <span class="mr-4 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
          {{ item.id }}
        </span>
        <p class="flex-1 text-[15px] leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
          {{ item.content }}
        </p>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-gray-200 pt-6 dark:border-gray-700">
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 dark:from-blue-900/30 dark:to-purple-900/30">
          <span class="text-lg">📊</span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ news.length }} 条新闻</span>
        </div>
        <div class="flex items-center space-x-2 rounded-full bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 dark:from-green-900/30 dark:to-blue-900/30">
          <span class="text-lg">🕐</span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ updateTime }}</span>
        </div>
      </div>
      <!-- 操作按钮全部移除 -->
    </div>
  </div>
</template>

<script setup lang="ts">
interface NewsItem {
  id: number;
  content: string;
  link: string;
}

interface Props {
  news: NewsItem[];
}

defineProps<Props>();

const newsDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

const updateTime = computed(() => {
  const date = new Date();
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
});

const handleNewsClick = (link: string) => {
  if (link && link !== "#") {
    window.open(link, "_blank");
  }
};
</script>

<style scoped>
.news-item {
  animation: fadeInUp 0.4s ease-out backwards;
  animation-delay: calc(var(--item-index, 0) * 0.03s);
}

.news-item:nth-child(1) { --item-index: 0; }
.news-item:nth-child(2) { --item-index: 1; }
.news-item:nth-child(3) { --item-index: 2; }
.news-item:nth-child(4) { --item-index: 3; }
.news-item:nth-child(5) { --item-index: 4; }
.news-item:nth-child(6) { --item-index: 5; }
.news-item:nth-child(7) { --item-index: 6; }
.news-item:nth-child(8) { --item-index: 7; }
.news-item:nth-child(9) { --item-index: 8; }
.news-item:nth-child(10) { --item-index: 9; }
.news-item:nth-child(11) { --item-index: 10; }
.news-item:nth-child(12) { --item-index: 11; }
.news-item:nth-child(13) { --item-index: 12; }
.news-item:nth-child(14) { --item-index: 13; }
.news-item:nth-child(15) { --item-index: 14; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
