<script setup lang="ts">
import type { ArticleItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";

definePageMeta({
  layout: "default"
});

const articlesList = await useListPage<ArticleItem>();

// 按年份和月份分组文章
interface TimelineGroup {
  year: number;
  months: {
    month: number;
    articles: ArticleItem[];
  }[];
}

const timelineData = computed<TimelineGroup[]>(() => {
  // 按时间倒序排序
  const sortedArticles = [...articlesList].sort((a, b) => b.time - a.time);

  const grouped = new Map<number, Map<number, ArticleItem[]>>();

  sortedArticles.forEach((article) => {
    const date = new Date(article.time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (!grouped.has(year)) {
      grouped.set(year, new Map());
    }

    const yearGroup = grouped.get(year)!;
    if (!yearGroup.has(month)) {
      yearGroup.set(month, []);
    }

    yearGroup.get(month)!.push(article);
  });

  // 转换为数组格式
  const result: TimelineGroup[] = [];

  Array.from(grouped.keys())
    .sort((a, b) => b - a)
    .forEach((year) => {
      const months = Array.from(grouped.get(year)!.keys())
        .sort((a, b) => b - a)
        .map(month => ({
          month,
          articles: grouped.get(year)!.get(month)!
        }));

      result.push({ year, months });
    });

  return result;
});

// 统计总文章数
const totalArticles = computed(() => articlesList.length);

// 月份颜色主题（循环使用）
const monthColors = [
  "bg-cyan-400 dark:bg-cyan-500",
  "bg-slate-600 dark:bg-slate-700",
  "bg-green-500 dark:bg-green-600",
  "bg-slate-700 dark:bg-slate-800",
  "bg-yellow-400 dark:bg-yellow-500",
  "bg-purple-500 dark:bg-purple-600"
];

// 圆点边框颜色（空心圆点）
const monthDotColors = [
  "border-cyan-400 dark:border-cyan-500",
  "border-slate-600 dark:border-slate-700",
  "border-green-500 dark:border-green-600",
  "border-slate-700 dark:border-slate-800",
  "border-yellow-400 dark:border-yellow-500",
  "border-purple-500 dark:border-purple-600"
];

// 卡片背景颜色（与月份标签一致）
const monthCardBgColors = [
  "bg-cyan-400 dark:bg-cyan-500",
  "bg-slate-600 dark:bg-slate-700",
  "bg-green-500 dark:bg-green-600",
  "bg-slate-700 dark:bg-slate-800",
  "bg-yellow-400 dark:bg-yellow-500",
  "bg-purple-500 dark:bg-purple-600"
];

// 时间线颜色（与月份标签一致）
const monthLineColors = [
  "bg-cyan-400 dark:bg-cyan-500",
  "bg-slate-600 dark:bg-slate-700",
  "bg-green-500 dark:bg-green-600",
  "bg-slate-700 dark:bg-slate-800",
  "bg-yellow-400 dark:bg-yellow-500",
  "bg-purple-500 dark:bg-purple-600"
];

const monthTriangleColors = [
  "border-r-cyan-400 dark:border-r-cyan-500",
  "border-r-slate-600 dark:border-r-slate-700",
  "border-r-green-500 dark:border-r-green-600",
  "border-r-slate-700 dark:border-r-slate-800",
  "border-r-yellow-400 dark:border-r-yellow-500",
  "border-r-purple-500 dark:border-r-purple-600"
];

// 获取月份对应的颜色类
const getMonthColorClass = (monthIndex: number) => {
  return monthColors[monthIndex % monthColors.length];
};

const getMonthDotColorClass = (monthIndex: number) => {
  return monthDotColors[monthIndex % monthDotColors.length];
};

const getMonthCardBgColorClass = (monthIndex: number) => {
  return monthCardBgColors[monthIndex % monthCardBgColors.length];
};

const getMonthLineColorClass = (monthIndex: number) => {
  return monthLineColors[monthIndex % monthLineColors.length];
};

const getTriangleColorClass = (monthIndex: number) => {
  return monthTriangleColors[monthIndex % monthTriangleColors.length];
};
</script>

<template>
  <main class="relative mx-auto max-w-7xl grow px-4 py-8 max-md:px-3">
    <div class="relative mx-auto max-w-5xl">
      <!-- 页面标题 -->
      <header class="mb-12 text-center">
        <h1 class="mb-3 text-4xl font-bold text-dark-900 dark:text-dark-50">
          📅 {{ $t('timeline') }}
        </h1>
        <p class="text-base text-dark-500 dark:text-dark-400">
          {{ $t('timeline-description') }}
        </p>
        <div class="mt-4 text-sm text-dark-400 dark:text-dark-500">
          {{ $t('total') }}: <span class="font-semibold text-primary-600 dark:text-primary-400">{{ totalArticles }}</span> {{ $t('articles-num') }}
        </div>
      </header>

      <!-- 时间轴内容 -->
      <div class="relative ml-32 max-md:ml-20">
        <!-- 年份和月份分组 -->
        <div
          v-for="yearGroup in timelineData"
          :key="yearGroup.year"
          class="relative"
        >
          <div
            v-for="(monthGroup, monthIndex) in yearGroup.months"
            :key="`${yearGroup.year}-${monthGroup.month}`"
            class="relative mb-6"
          >
            <!-- 月份对应的时间线段 -->
            <div
              :class="[
                'absolute left-0 top-0 w-[3px] max-md:w-[2px]',
                getMonthLineColorClass(monthIndex)
              ]"
              :style="{ height: 'calc(100% + 24px)' }"
            />

            <!-- 月份标签（在时间轴上） -->
            <div class="relative mb-8 flex items-center">
              <div
                :class="[
                  'absolute left-[-52px] z-20 rounded-md px-4 py-2 text-center text-white shadow-lg max-md:left-[-42px] max-md:px-3 max-md:py-1.5',
                  getMonthColorClass(monthIndex)
                ]"
              >
                <div class="whitespace-nowrap text-sm font-bold max-md:text-xs">
                  {{ yearGroup.year }}{{ $t('year') }}{{ monthGroup.month }}{{ $t('month') }}
                </div>
              </div>
            </div>

            <!-- 文章列表 -->
            <div
              v-for="(article, articleIndex) in monthGroup.articles"
              :key="article.id"
              class="relative mb-6 flex items-start gap-6 max-md:gap-4"
            >
              <!-- 左侧日期（只在同一天的第一篇显示） -->
              <div
                v-if="articleIndex === 0 || new Date(article.time).getDate() !== new Date(monthGroup.articles[articleIndex - 1]!.time).getDate()"
                class="absolute -left-24 top-[13px] w-16 text-right max-md:-left-16 max-md:top-[11px] max-md:w-12"
              >
                <div class="text-sm font-semibold text-dark-600 dark:text-dark-400 max-md:text-xs">
                  {{ new Date(article.time).getDate() }}{{ $t('day') }}
                </div>
              </div>

              <!-- 时间轴上的圆点（空心） -->
              <div class="absolute left-[-6px] top-[13px] z-10 max-md:left-[-5px] max-md:top-[11px]">
                <div
                  :class="[
                    'size-3.5 rounded-full border-[3px] bg-white shadow-md dark:bg-dark-900 max-md:size-3 max-md:border-2',
                    getMonthDotColorClass(monthIndex)
                  ]"
                />
              </div>

              <!-- 内容卡片 -->
              <div class="relative ml-6 flex-1 max-md:ml-4">
                <!-- 简洁的三角指示器 -->
                <div
                  :class="[
                    'absolute -left-2 top-[13px]',
                    'size-0 border-y-[6px] border-r-8 border-y-transparent',
                    getTriangleColorClass(monthIndex)
                  ]"
                />

                <NuxtLink
                  :to="`/articles/${article.customSlug || article.id}`"
                  :class="[
                    'block rounded-lg border-0 p-5 transition-all duration-200 hover:shadow-lg max-md:p-4',
                    getMonthCardBgColorClass(monthIndex)
                  ]"
                >
                  <h4 class="text-[17px] font-semibold leading-snug text-white transition hover:text-white/90 max-md:text-[15px]">
                    <span
                      v-if="article.encrypt || article.encryptBlocks"
                      class="mr-1.5 text-yellow-300"
                      :title="$t('encrypted')"
                    >🔒</span>
                    {{ article.title }}
                  </h4>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间轴底部"开始"标识 -->
        <div
          v-if="timelineData.length"
          class="relative pb-4"
        >
          <!-- "开始"标识（独特的颜色，居中在时间轴线上） -->
          <div class="absolute left-[1.5px] top-0 z-10 -translate-x-1/2 rounded-md bg-gray-400 px-3 py-1.5 text-center text-white shadow-lg dark:bg-gray-500 max-md:left-px max-md:px-2.5 max-md:py-1">
            <div class="whitespace-nowrap text-xs font-bold max-md:text-[10px]">
              {{ $t('start') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <section
        v-if="!timelineData.length"
        class="flex items-center justify-center rounded-3xl border border-dashed border-dark-100/80 py-20 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300"
      >
        {{ $t('nothing-here') }}
      </section>
    </div>
  </main>
</template>

<style scoped>
/* 移除动画，使用更简洁的样式 */
</style>
