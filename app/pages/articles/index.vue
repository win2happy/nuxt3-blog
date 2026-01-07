<script setup lang="ts">
import type { ArticleItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { Visitors, Words } from "~/utils/nuxt/public/components";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";
import { fetchMd } from "~/utils/nuxt/fetch";
import { extractArticlePreview } from "~/utils/common/extract-preview";

definePageMeta({
  alias: "/"
});

const tags = useRouteQuery("tag", (tags) => {
  try {
    return tags ? tags.split(",") : [];
  } catch {
    return [];
  }
});

const articlesList = await useListPage<ArticleItem>();

const githubToken = useGithubToken();
const encryptor = useEncryptor();

// 加密文章筛选器
const showEncryptedOnly = ref(false);

// 标签折叠状态
const showTags = ref(true);

// 判断用户是否已认证（有token或密码正确）
const isAuthenticated = computed(() => !!githubToken.value || encryptor.passwdCorrect.value);

// 存储文章预览信息的响应式对象
const articlePreviews = reactive<Record<number, { excerpt: string; coverImage: string }>>({});

const articleTagList = new Map<string, number>();

watch(articlesList, () => {
  articleTagList.clear();
  articlesList.forEach((item) => {
    item.tags.forEach(v => articleTagList.set(v, (articleTagList.get(v) || 0) + 1));
  });
}, { immediate: true });

const filteredList = computed(() => {
  let items = articlesList.filter(item =>
    !tags.value.length || tags.value.some(tag => item.tags.includes(tag))
  );

  // 如果开启了"仅显示加密"过滤器，只显示加密的文章
  if (showEncryptedOnly.value) {
    items = items.filter(i => i.encrypt || i.encryptBlocks);
  }

  return items;
});

const toggleTags = (tag: string) => {
  const newTags = tags.value.slice();
  const searchIdx = newTags.indexOf(tag);
  if (searchIdx > -1) {
    newTags.splice(searchIdx, 1);
  } else {
    newTags.push(tag);
  }
  navigateTo({ query: { tag: newTags.join(",") } }, { replace: true });
};

// 分页相关
const pageSize = usePageSize("articles-page-size", 10);
const currentPage = ref(1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredList.value.slice(start, end);
});

// 当筛选条件变化时，重置到第一页
watch(tags, () => {
  currentPage.value = 1;
});

// 当加密筛选器变化时，重置到第一页
watch(showEncryptedOnly, () => {
  currentPage.value = 1;
});

// 已加载预览的文章ID集合
const loadedPreviews = new Set<number>();

// 加载文章预览信息（摘要和封面图片）
const loadArticlePreviews = async () => {
  const itemsToLoad = paginatedList.value.filter(
    item => !loadedPreviews.has(item.id) && !articlePreviews[item.id]
  );

  if (itemsToLoad.length === 0) return;

  // 使用 Promise.all 并行加载
  await Promise.all(
    itemsToLoad.map(async (item) => {
      try {
        const md = await fetchMd("/articles", String(item.customSlug || item.id));
        const preview = extractArticlePreview(md);

        // 存储到响应式对象中
        articlePreviews[item.id] = preview;
        loadedPreviews.add(item.id);
      } catch (error) {
        console.error(`Failed to load preview for article ${item.id}:`, error);
        // 即使失败也标记为已加载，避免重复请求
        articlePreviews[item.id] = { excerpt: "", coverImage: "" };
        loadedPreviews.add(item.id);
      }
    })
  );
};

// 监听分页列表变化，加载预览信息
watch(paginatedList, loadArticlePreviews, { immediate: true });

// 快速导航相关
const showYearNav = ref(false);

// 按年份和月份分组文章
interface TimelineGroup {
  year: number;
  months: {
    month: number;
    articles: ArticleItem[];
  }[];
}

const timelineData = computed<TimelineGroup[]>(() => {
  // 使用 filteredList 而不是 articlesList，这样导航会根据筛选条件更新
  const sortedArticles = [...filteredList.value].sort((a, b) => b.time - a.time);

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

// 获取年份月份导航数据
const yearMonthNav = computed(() => {
  const navData: {
    year: number;
    months: { month: number; count: number }[];
  }[] = [];

  timelineData.value.forEach((yearGroup) => {
    const months = yearGroup.months.map(monthGroup => ({
      month: monthGroup.month,
      count: monthGroup.articles.length
    }));
    navData.push({
      year: yearGroup.year,
      months
    });
  });

  return navData;
});

// 滚动到指定年月的文章
const scrollToYearMonth = (year: number, month: number) => {
  // 找到该年月的第一篇文章
  const targetArticle = timelineData.value
    .find(y => y.year === year)
    ?.months.find(m => m.month === month)
    ?.articles[0];

  if (!targetArticle) return;

  // 找到该文章在 filteredList 中的位置
  const articleIndex = filteredList.value.findIndex(a => a.id === targetArticle.id);
  if (articleIndex === -1) return;

  // 计算应该跳转到哪一页
  const targetPage = Math.floor(articleIndex / pageSize.value) + 1;
  currentPage.value = targetPage;

  // 等待页面渲染后再滚动
  nextTick(() => {
    // 关闭导航
    showYearNav.value = false;

    // 滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
};

// 月份颜色主题（与时间轴页面保持一致）
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

const getMonthColorClass = (month: number) => {
  return monthColors[(month - 1) % monthColors.length];
};
</script>

<template>
  <main class="relative mx-auto max-w-7xl grow px-4 py-8 max-md:px-3">
    <div class="relative mx-auto max-w-7xl space-y-10">
      <!-- 年份/月份快速导航 -->
      <section
        v-if="yearMonthNav.length > 0"
        class="sticky top-0 z-30"
      >
        <div class="rounded-3xl border border-dark-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-dark-700 dark:bg-dark-800/95">
          <!-- 导航切换按钮 -->
          <button
            class="flex w-full items-center justify-between gap-2 px-6 py-4 transition hover:bg-dark-50 dark:hover:bg-dark-700/50"
            @click="showYearNav = !showYearNav"
          >
            <div class="flex items-center gap-3">
              <svg
                class="size-5 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span class="text-sm font-semibold text-dark-900 dark:text-dark-50">快速导航</span>
              <span class="dark:bg-primary-900/30 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:text-primary-400">
                {{ yearMonthNav.length }} 年 · {{ yearMonthNav.reduce((sum, y) => sum + y.months.length, 0) }} 月
              </span>
            </div>
            <svg
              :class="[
                'size-5 text-dark-400 transition-transform duration-200',
                showYearNav ? 'rotate-180' : 'rotate-0'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- 展开的导航内容 -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[500px] opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="max-h-[500px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div
              v-if="showYearNav"
              class="max-h-[500px] overflow-y-auto border-t border-dark-100 dark:border-dark-700"
            >
              <div class="space-y-4 p-5">
                <div
                  v-for="yearData in yearMonthNav"
                  :key="yearData.year"
                  class="space-y-2.5"
                >
                  <!-- 年份标题 -->
                  <div class="flex items-center gap-2.5">
                    <div class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 shadow-md">
                      <svg
                        class="size-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span class="text-base font-bold text-white">{{ yearData.year }}{{ $t('year') }}</span>
                    </div>
                    <span class="text-sm text-dark-400 dark:text-dark-500">
                      {{ yearData.months.reduce((sum, m) => sum + m.count, 0) }} {{ $t('articles-num') }}
                    </span>
                  </div>

                  <!-- 月份按钮 -->
                  <div class="flex flex-wrap gap-2 pl-2">
                    <button
                      v-for="monthData in yearData.months"
                      :key="`${yearData.year}-${monthData.month}`"
                      :class="[
                        'group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:shadow-lg',
                        getMonthColorClass(monthData.month),
                        'text-white hover:-translate-y-1'
                      ]"
                      @click="scrollToYearMonth(yearData.year, monthData.month)"
                    >
                      <span>{{ monthData.month }}{{ $t('month') }}</span>
                      <span class="flex size-6 items-center justify-center rounded-full bg-white/25 text-xs font-bold backdrop-blur-sm">
                        {{ monthData.count }}
                      </span>

                      <!-- 悬停提示 -->
                      <div class="pointer-events-none absolute -top-9 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-dark-900 px-3 py-1.5 text-xs text-white shadow-xl group-hover:block dark:bg-dark-700">
                        点击查看 {{ monthData.count }} 篇文章
                        <div class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-dark-900 dark:bg-dark-700" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 标签筛选区域 -->
      <section
        v-if="articleTagList.size"
      >
        <div class="rounded-3xl border border-dark-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800">
          <!-- 标签切换按钮 -->
          <button
            class="flex w-full items-center justify-between gap-2 px-6 py-4 transition hover:bg-dark-50 dark:hover:bg-dark-700/50"
            @click="showTags = !showTags"
          >
            <div class="flex items-center gap-3">
              <svg
                class="size-5 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span class="text-sm font-semibold text-dark-900 dark:text-dark-50">{{ $t('tags') }}</span>
              <span class="dark:bg-primary-900/30 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:text-primary-400">
                {{ articleTagList.size }} 个标签 · {{ filteredList.length }} {{ $t('articles-num') }}
              </span>
            </div>
            <svg
              :class="[
                'size-5 text-dark-400 transition-transform duration-200',
                showTags ? 'rotate-180' : 'rotate-0'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- 展开的标签内容 -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[500px] opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="max-h-[500px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div
              v-if="showTags"
              class="max-h-[500px] overflow-y-auto border-t border-dark-100 dark:border-dark-700"
            >
              <div class="space-y-3 p-5">
                <div class="flex flex-wrap gap-2">
                  <the-tag
                    v-for="[tag, count] in articleTagList"
                    :key="tag"
                    :num="count"
                    :active="tags.includes(tag)"
                    @click="toggleTags(tag)"
                  >
                    {{ tag }}
                  </the-tag>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 加密筛选按钮 - 仅在已认证时显示 -->
      <section
        v-if="isAuthenticated"
        class="flex justify-center"
      >
        <button
          :class="twMerge($style.filterButton, showEncryptedOnly && $style.filterButtonActive)"
          @click="showEncryptedOnly = !showEncryptedOnly"
        >
          🔒 {{ $t('show-encrypted-only') }}
        </button>
      </section>

      <section
        v-if="filteredList.length"
        class="space-y-6"
      >
        <article
          v-for="item in paginatedList"
          v-show="item._show"
          :key="item.id"
          class="group relative overflow-hidden rounded-3xl border border-dark-100/70 bg-white/80 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:bg-white dark:border-dark-700 dark:bg-dark-900/60 dark:hover:border-primary-500"
        >
          <NuxtLink
            :to="{ path: `/articles/${item.customSlug || item.id}`, query: tags.length > 0 ? { tag: tags.join(',') } : {} }"
            no-prefetch
            class="flex flex-col gap-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <h3 class="title-text max-w-xl transition group-hover:text-primary-600 dark:group-hover:text-primary-400">
                <span
                  v-if="item.encrypt || item.encryptBlocks"
                  class="mr-2 text-yellow-600 dark:text-yellow-500"
                  :title="$t('encrypted')"
                >🔒</span>
                {{ item.title }}
              </h3>
              <span
                class="text-sm text-dark-400 transition group-hover:text-primary-500 dark:text-dark-400 dark:group-hover:text-primary-300"
                :title="formatTime(item.time)"
              >
                {{ formatTime(item.time, "date") }}
              </span>
            </div>

            <!-- 文章预览：左侧封面图片，右侧摘要文本 -->
            <div
              v-if="articlePreviews[item.id]?.coverImage || articlePreviews[item.id]?.excerpt"
              class="flex flex-col gap-4 sm:flex-row"
            >
              <!-- 封面图片 -->
              <div
                v-if="articlePreviews[item.id]?.coverImage"
                class="shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  :src="articlePreviews[item.id]!.coverImage"
                  :alt="item.title"
                  class="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-48"
                  loading="lazy"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                >
              </div>

              <!-- 摘要文本 -->
              <div
                v-if="articlePreviews[item.id]?.excerpt"
                class="flex-1 overflow-hidden"
              >
                <p class="line-clamp-3 text-sm leading-relaxed text-dark-600 dark:text-dark-300 sm:line-clamp-4">
                  {{ articlePreviews[item.id]!.excerpt }}
                </p>
              </div>
            </div>

            <div
              v-if="item.tags.length"
              class="flex flex-wrap gap-2"
            >
              <span
                v-for="innerTag in item.tags"
                :key="innerTag"
                class="rounded-full border border-dark-100/80 px-3 py-1 text-[12px] text-dark-500 transition group-hover:border-primary-200 group-hover:text-primary-600 dark:border-dark-700 dark:text-dark-300 dark:group-hover:border-primary-400"
              >
                {{ innerTag }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-[13px] text-dark-500 dark:text-dark-300">
              <Words :len="item.len" />
              <Visitors :visitors="item._visitors" />
            </div>
          </NuxtLink>
        </article>

        <!-- 分页组件 -->
        <common-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total-items="filteredList.length"
          class="mt-8"
        />
      </section>

      <section
        v-else
        class="flex items-center justify-center rounded-3xl border border-dashed border-dark-100/80 py-20 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300"
      >
        {{ $t('nothing-here') }}
      </section>
    </div>
  </main>
</template>

<style module>
.filterButton {
  @apply px-5 py-2 rounded-full font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 transition-all border-2 border-transparent;
}

.filterButtonActive {
  @apply !bg-yellow-500 !text-white dark:!bg-yellow-600 font-bold border-yellow-600 dark:border-yellow-500 shadow-lg;
}
</style>
