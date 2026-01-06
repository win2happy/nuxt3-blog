<script setup lang="ts">
import type { ArticleItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { fetchMd } from "~/utils/nuxt/fetch";
import { extractArticlePreview } from "~/utils/common/extract-preview";

definePageMeta({
  layout: "default"
});

const articlesList = await useListPage<ArticleItem>();

// 文章预览信息存储
const articlePreviews = reactive<Record<number, { excerpt: string; coverImage: string; loading: boolean }>>({});
const loadedPreviews = new Set<number>();

// 当前悬停的文章ID
const hoveredArticleId = ref<number | null>(null);
const hoverTimer = ref<NodeJS.Timeout | null>(null);

// 悬浮窗位置状态
const popoverPosition = ref<{ top?: string; bottom?: string; left?: string; right?: string }>({});

// 计算悬浮窗位置
const calculatePopoverPosition = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const popoverWidth = 400;
  const popoverHeight = 400; // 预估高度
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 16;
  const marginTop = 8; // mt-2 的像素值

  const position: { top?: string; bottom?: string; left?: string; right?: string } = {};

  // 水平位置计算
  // 优先在右侧显示
  if (rect.right + popoverWidth + padding < viewportWidth) {
    // 右侧有足够空间 - 显示在卡片右边
    position.left = `${rect.width + 16}px`;
  } else if (rect.left - popoverWidth - padding > 0) {
    // 左侧有足够空间 - 显示在卡片左边
    position.right = `${rect.width + 16}px`;
  } else if (rect.left + popoverWidth < viewportWidth) {
    // 下方对齐左边
    position.left = "0";
  } else {
    // 下方对齐右边
    position.right = "0";
  }

  // 垂直位置计算
  // 优先在下方显示
  if (rect.bottom + popoverHeight + padding < viewportHeight) {
    // 下方有足够空间
    position.top = "100%";
  } else if (rect.top - popoverHeight - padding > 0) {
    // 上方有足够空间
    position.bottom = `calc(100% + ${marginTop}px)`;
  } else {
    // 下方空间不够，但仍然显示在下方（会出现滚动条）
    position.top = "100%";
  }

  return position;
};

// 加载单篇文章的预览信息
const loadArticlePreview = async (articleId: number, customSlug?: string) => {
  // 如果已经加载过或正在加载，直接返回
  if (loadedPreviews.has(articleId) || articlePreviews[articleId]?.loading) {
    return;
  }

  // 标记为加载中
  articlePreviews[articleId] = { excerpt: "", coverImage: "", loading: true };

  try {
    const md = await fetchMd("/articles", String(customSlug || articleId));
    const preview = extractArticlePreview(md);

    // 存储预览信息
    articlePreviews[articleId] = {
      excerpt: preview.excerpt || "暂无摘要",
      coverImage: preview.coverImage,
      loading: false
    };
    loadedPreviews.add(articleId);
  } catch (error) {
    console.error(`Failed to load preview for article ${articleId}:`, error);
    // 即使失败也标记为已加载，避免重复请求
    articlePreviews[articleId] = {
      excerpt: "加载失败",
      coverImage: "",
      loading: false
    };
    loadedPreviews.add(articleId);
  }
};

// 处理鼠标悬停
const handleMouseEnter = (article: ArticleItem, event: MouseEvent) => {
  // 清除之前的定时器
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
  }

  // 延迟300ms显示悬浮窗，避免快速划过时闪烁
  hoverTimer.value = setTimeout(() => {
    hoveredArticleId.value = article.id;

    // 计算悬浮窗位置
    const target = event.currentTarget as HTMLElement;
    if (target) {
      popoverPosition.value = calculatePopoverPosition(target);
    }

    // 如果没有预览信息，则加载
    if (!loadedPreviews.has(article.id)) {
      loadArticlePreview(article.id, article.customSlug);
    }
  }, 300);
};

// 处理鼠标离开
const handleMouseLeave = () => {
  // 清除定时器
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
    hoverTimer.value = null;
  }

  // 延迟200ms隐藏悬浮窗，给用户移动到悬浮窗的时间
  setTimeout(() => {
    hoveredArticleId.value = null;
  }, 200);
};

// 组件卸载时清理定时器
onUnmounted(() => {
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
  }
});

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
  "bg-purple-500 dark:bg-purple-600",
  "bg-blue-500 dark:bg-blue-600",
  "bg-pink-500 dark:bg-pink-600",
  "bg-indigo-500 dark:bg-indigo-600",
  "bg-orange-500 dark:bg-orange-600",
  "bg-teal-500 dark:bg-teal-600",
  "bg-red-500 dark:bg-red-600"
];

// 圆点边框颜色（空心圆点）
const monthDotColors = [
  "border-cyan-400 dark:border-cyan-500",
  "border-slate-600 dark:border-slate-700",
  "border-green-500 dark:border-green-600",
  "border-slate-700 dark:border-slate-800",
  "border-yellow-400 dark:border-yellow-500",
  "border-purple-500 dark:border-purple-600",
  "border-blue-500 dark:border-blue-600",
  "border-pink-500 dark:border-pink-600",
  "border-indigo-500 dark:border-indigo-600",
  "border-orange-500 dark:border-orange-600",
  "border-teal-500 dark:border-teal-600",
  "border-red-500 dark:border-red-600"
];

// 卡片背景颜色（与月份标签一致）
const monthCardBgColors = [
  "bg-cyan-400 dark:bg-cyan-500",
  "bg-slate-600 dark:bg-slate-700",
  "bg-green-500 dark:bg-green-600",
  "bg-slate-700 dark:bg-slate-800",
  "bg-yellow-400 dark:bg-yellow-500",
  "bg-purple-500 dark:bg-purple-600",
  "bg-blue-500 dark:bg-blue-600",
  "bg-pink-500 dark:bg-pink-600",
  "bg-indigo-500 dark:bg-indigo-600",
  "bg-orange-500 dark:bg-orange-600",
  "bg-teal-500 dark:bg-teal-600",
  "bg-red-500 dark:bg-red-600"
];

// 时间线颜色（与月份标签一致）
const monthLineColors = [
  "bg-cyan-400 dark:bg-cyan-500",
  "bg-slate-600 dark:bg-slate-700",
  "bg-green-500 dark:bg-green-600",
  "bg-slate-700 dark:bg-slate-800",
  "bg-yellow-400 dark:bg-yellow-500",
  "bg-purple-500 dark:bg-purple-600",
  "bg-blue-500 dark:bg-blue-600",
  "bg-pink-500 dark:bg-pink-600",
  "bg-indigo-500 dark:bg-indigo-600",
  "bg-orange-500 dark:bg-orange-600",
  "bg-teal-500 dark:bg-teal-600",
  "bg-red-500 dark:bg-red-600"
];

const monthTriangleColors = [
  "border-r-cyan-400 dark:border-r-cyan-500",
  "border-r-slate-600 dark:border-r-slate-700",
  "border-r-green-500 dark:border-r-green-600",
  "border-r-slate-700 dark:border-r-slate-800",
  "border-r-yellow-400 dark:border-r-yellow-500",
  "border-r-purple-500 dark:border-r-purple-600",
  "border-r-blue-500 dark:border-r-blue-600",
  "border-r-pink-500 dark:border-r-pink-600",
  "border-r-indigo-500 dark:border-r-indigo-600",
  "border-r-orange-500 dark:border-r-orange-600",
  "border-r-teal-500 dark:border-r-teal-600",
  "border-r-red-500 dark:border-r-red-600"
];

// 获取月份对应的颜色类
const getMonthColorClass = (month: number) => {
  // 使用实际月份（1-12）减1作为索引
  return monthColors[(month - 1) % monthColors.length];
};

const getMonthDotColorClass = (month: number) => {
  return monthDotColors[(month - 1) % monthDotColors.length];
};

const getMonthCardBgColorClass = (month: number) => {
  return monthCardBgColors[(month - 1) % monthCardBgColors.length];
};

const getMonthLineColorClass = (month: number) => {
  return monthLineColors[(month - 1) % monthLineColors.length];
};

const getTriangleColorClass = (month: number) => {
  return monthTriangleColors[(month - 1) % monthTriangleColors.length];
};
</script>

<template>
  <main class="relative mx-auto max-w-7xl grow px-4 py-8 max-md:px-3">
    <div class="relative mx-auto max-w-7xl">
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
            v-for="monthGroup in yearGroup.months"
            :key="`${yearGroup.year}-${monthGroup.month}`"
            class="relative mb-6"
          >
            <!-- 月份对应的时间线段 -->
            <div
              :class="[
                'absolute left-0 top-0 w-[3px] max-md:w-[2px]',
                getMonthLineColorClass(monthGroup.month)
              ]"
              :style="{ height: 'calc(100% + 24px)' }"
            />

            <!-- 月份标签（在时间轴上） -->
            <div class="relative mb-8 flex items-center">
              <div
                :class="[
                  'absolute left-[-52px] z-20 rounded-md px-4 py-2 text-center text-white shadow-lg max-md:left-[-42px] max-md:px-3 max-md:py-1.5',
                  getMonthColorClass(monthGroup.month)
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
                    getMonthDotColorClass(monthGroup.month)
                  ]"
                />
              </div>

              <!-- 内容卡片 -->
              <div class="relative ml-8 max-md:ml-5">
                <!-- 对话框样式的三角指示器 -->
                <div
                  :class="[
                    'absolute -left-3 top-[15px] max-md:-left-[10px] max-md:top-[11px]',
                    'max-md:border-y-6 size-0 border-y-8 border-r-[12px] border-y-transparent max-md:border-r-[10px]',
                    getTriangleColorClass(monthGroup.month)
                  ]"
                />

                <NuxtLink
                  :to="`/articles/${article.customSlug || article.id}`"
                  :class="[
                    'inline-block w-auto max-w-2xl break-words rounded-2xl border-0 px-5 py-3.5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl max-md:max-w-[calc(100vw-7.5rem)] max-md:px-4 max-md:py-3',
                    getMonthCardBgColorClass(monthGroup.month)
                  ]"
                  @mouseenter="(e) => handleMouseEnter(article, e)"
                  @mouseleave="handleMouseLeave"
                >
                  <h4 class="break-words text-[17px] font-semibold leading-snug text-white transition hover:text-white/90 max-md:text-[15px]">
                    <span
                      v-if="article.encrypt || article.encryptBlocks"
                      class="mr-1.5 text-yellow-300"
                      :title="$t('encrypted')"
                    >🔒</span>
                    {{ article.title }}
                  </h4>
                </NuxtLink>

                <!-- 文章预览悬浮窗 -->
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="hoveredArticleId === article.id && articlePreviews[article.id]"
                    :style="{
                      top: popoverPosition.top,
                      bottom: popoverPosition.bottom,
                      left: popoverPosition.left,
                      right: popoverPosition.right
                    }"
                    class="absolute z-50 mt-2 w-[400px] max-w-[90vw] rounded-xl border border-dark-200 bg-white p-4 shadow-2xl dark:border-dark-600 dark:bg-dark-800 max-md:hidden"
                    @mouseenter="hoveredArticleId = article.id"
                    @mouseleave="handleMouseLeave"
                  >
                    <!-- 加载中状态 -->
                    <div
                      v-if="articlePreviews[article.id]?.loading"
                      class="flex items-center justify-center py-8"
                    >
                      <div class="size-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    </div>

                    <!-- 预览内容 -->
                    <div
                      v-else
                      class="space-y-3"
                    >
                      <!-- 封面图片 -->
                      <div
                        v-if="articlePreviews[article.id]?.coverImage"
                        class="overflow-hidden rounded-lg"
                      >
                        <img
                          :src="articlePreviews[article.id]?.coverImage"
                          :alt="article.title"
                          class="h-40 w-full object-cover"
                        >
                      </div>

                      <!-- 文章标题 -->
                      <h5 class="text-base font-semibold text-dark-900 dark:text-dark-50">
                        {{ article.title }}
                      </h5>

                      <!-- 文章摘要 -->
                      <p
                        v-if="articlePreviews[article.id]?.excerpt"
                        class="line-clamp-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300"
                      >
                        {{ articlePreviews[article.id]?.excerpt }}
                      </p>

                      <!-- 底部信息 -->
                      <div class="flex items-center justify-between border-t border-dark-100 pt-3 text-xs text-dark-400 dark:border-dark-700 dark:text-dark-500">
                        <span>{{ new Date(article.time).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                        <span
                          v-if="article.len"
                          class="flex items-center gap-1"
                        >
                          <svg
                            class="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          {{ Math.ceil(article.len / 400) }} {{ $t('min-read') }}
                        </span>
                      </div>

                      <!-- 标签 -->
                      <div
                        v-if="article.tags && article.tags.length"
                        class="flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="tag in article.tags.slice(0, 3)"
                          :key="tag"
                          class="dark:bg-primary-900/30 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-600 dark:text-primary-400"
                        >
                          {{ tag }}
                        </span>
                        <span
                          v-if="article.tags.length > 3"
                          class="rounded-full bg-dark-100 px-2 py-0.5 text-xs text-dark-500 dark:bg-dark-700 dark:text-dark-400"
                        >
                          +{{ article.tags.length - 3 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </Transition>
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
