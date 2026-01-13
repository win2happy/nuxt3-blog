<template>
  <div
    id="hot-trends"
    class="hot-trends mb-8"
  >
    <div class="mb-6 flex items-center justify-between">
      <h2 class="flex items-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
        <span class="mr-3 text-3xl">🔥</span>
        实时热搜
      </h2>
    </div>

    <!-- 热搜榜单网格 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="platform in trends"
        :key="platform.platform"
        class="platform-card rounded-2xl bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800"
      >
        <!-- 平台标题 -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center text-lg font-bold text-gray-900 dark:text-white">
            <span class="mr-2 text-2xl">{{ platform.icon }}</span>
            {{ platform.platform }}
          </h3>
        </div>

        <!-- 热搜列表 -->
        <div class="space-y-2">
          <div
            v-for="item in platform.items"
            :key="item.rank"
            class="trend-item group flex cursor-pointer items-center rounded-xl border-2 border-transparent p-3 transition-all duration-300 hover:border-blue-200/50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:border-blue-700/50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/80"
            @click="handleTrendClick(item.link)"
          >
            <!-- 排名 -->
            <span
              class="mr-3 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-sm transition-transform duration-300 group-hover:scale-110"
              :class="getRankClass(item.rank)"
            >
              {{ item.rank }}
            </span>

            <!-- 标题 -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-700 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                {{ item.title }}
              </p>
            </div>

            <!-- 热度 -->
            <span
              v-if="item.heat"
              class="ml-2 shrink-0 rounded-full px-2 py-1 text-xs"
              :class="getHeatClass(item.heat)"
            >
              {{ item.heat }}
            </span>
          </div>
        </div>

        <!-- 更新时间 -->
        <div class="mt-4 border-t border-gray-200 pt-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          更新于 {{ updateTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TrendItem {
  rank: number;
  title: string;
  heat: string;
  link: string;
}

interface PlatformTrend {
  platform: string;
  icon: string;
  link: string;
  items: TrendItem[];
}

interface Props {
  trends: PlatformTrend[];
}

defineProps<Props>();

const updateTime = computed(() => {
  const date = new Date();
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
});

const getRankClass = (rank: number) => {
  if (rank === 1) {
    return "bg-gradient-to-br from-red-500 to-red-600 text-white";
  } else if (rank === 2) {
    return "bg-gradient-to-br from-orange-500 to-orange-600 text-white";
  } else if (rank === 3) {
    return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white";
  }
  return "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
};

const getHeatClass = (heat: string) => {
  if (heat.includes("w") || heat.includes("万")) {
    const num = parseInt(heat);
    if (num >= 1000) {
      return "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 font-semibold";
    } else if (num >= 500) {
      return "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 font-semibold";
    }
    return "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300";
  }

  // 特殊标签
  const specialTags = ["HOT", "爆", "新", "热", "沸"];
  if (specialTags.includes(heat)) {
    return "bg-red-500 text-white font-bold animate-pulse";
  }

  return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
};

const handleTrendClick = (link: string) => {
  if (link && link !== "#") {
    window.open(link, "_blank");
  }
};
</script>

<style scoped>
.platform-card {
  animation: fadeInScale 0.5s ease-out backwards;
  animation-delay: calc(var(--card-index, 0) * 0.1s);
}

.platform-card:nth-child(1) { --card-index: 0; }
.platform-card:nth-child(2) { --card-index: 1; }
.platform-card:nth-child(3) { --card-index: 2; }
.platform-card:nth-child(4) { --card-index: 3; }
.platform-card:nth-child(5) { --card-index: 4; }
.platform-card:nth-child(6) { --card-index: 5; }

.trend-item {
  animation: slideInLeft 0.3s ease-out backwards;
  animation-delay: calc(var(--item-index, 0) * 0.05s);
}

.trend-item:nth-child(1) { --item-index: 0; }
.trend-item:nth-child(2) { --item-index: 1; }
.trend-item:nth-child(3) { --item-index: 2; }
.trend-item:nth-child(4) { --item-index: 3; }
.trend-item:nth-child(5) { --item-index: 4; }

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
