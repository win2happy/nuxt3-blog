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

// 批量预加载文章预览信息
const loadArticlePreviewsBatch = (articles: ArticleItem[]) => {
  articles.forEach((article) => {
    if (!loadedPreviews.has(article.id)) {
      loadArticlePreview(article.id, article.customSlug);
    }
  });
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

// 视图模式
type ViewMode = "classic" | "compact" | "card" | "calendar";
const viewMode = ref<ViewMode>("classic");

// 保存/读取视图模式偏好
const VIEW_MODE_KEY = "timeline-view-mode";

// 只在客户端执行
if (import.meta.client) {
  onMounted(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (savedMode && ["classic", "compact", "card", "calendar"].includes(savedMode)) {
      viewMode.value = savedMode;

      // 如果保存的模式是卡片模式，预加载图片
      if (savedMode === "card") {
        nextTick(() => {
          loadArticlePreviewsBatch(articlesList.slice(0, 20));
        });
      }
    }

    // 监听卡片模式的滚动事件，懒加载更多预览
    let scrollHandler: (() => void) | null = null;

    watch(viewMode, (newMode) => {
      // 移除旧的滚动监听器
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        scrollHandler = null;
      }

      // 如果是卡片模式，添加滚动监听器
      if (newMode === "card") {
        scrollHandler = () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // 当滚动到距离底部 500px 时，加载更多预览
          if (scrollTop + windowHeight >= documentHeight - 500) {
            // 找到下一批未加载的文章
            const nextBatch = articlesList.filter(article => !loadedPreviews.has(article.id)).slice(0, 10);
            if (nextBatch.length > 0) {
              loadArticlePreviewsBatch(nextBatch);
            }
          }
        };

        window.addEventListener("scroll", scrollHandler, { passive: true });
      }
    }, { immediate: true });

    // 组件卸载时清理
    onUnmounted(() => {
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
      }
    });
  });
}

const switchViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
  if (import.meta.client) {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  // 切换到卡片模式时，预加载前20篇文章的预览
  if (mode === "card") {
    nextTick(() => {
      loadArticlePreviewsBatch(articlesList.slice(0, 20));
    });
  }
};

// 日历视图相关
interface CalendarDay {
  date: Date;
  year: number;
  month: number;
  day: number;
  articles: ArticleItem[];
  isCurrentMonth: boolean;
  lunarDay?: string;
  lunarMonth?: string;
  festivals?: string[];
  solarTerms?: string;
}

const selectedMonth = ref(new Date().getMonth());
const selectedYear = ref(new Date().getFullYear());

// 获取日期的农历和节日信息
const getLunarInfo = async (date: Date) => {
  // 只在客户端执行
  if (!import.meta.client) {
    return {
      lunarDay: undefined,
      lunarMonth: undefined,
      festivals: undefined,
      solarTerms: undefined
    };
  }

  try {
    // 动态导入 lunar-javascript
    const { Solar, HolidayUtil } = await import("lunar-javascript");

    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    // 获取农历日期
    const lunarDay = lunar.getDayInChinese();
    const lunarMonth = lunar.getMonthInChinese();

    // 获取节日
    const festivals: string[] = [];

    // 公历节日 - 使用HolidayUtil
    const holiday = HolidayUtil.getHoliday(date.getFullYear(), date.getMonth() + 1, date.getDate());
    if (holiday && holiday.getName) {
      festivals.push(holiday.getName());
    }

    // 农历节日
    const lunarFestivals = lunar.getFestivals();
    if (lunarFestivals && lunarFestivals.length > 0) {
      festivals.push(...lunarFestivals);
    }

    // 公历其他节日
    const solarFestivals = solar.getFestivals();
    if (solarFestivals && solarFestivals.length > 0) {
      festivals.push(...solarFestivals);
    }

    // 节气 - 使用lunar的getJieQi方法
    const solarTerms = lunar.getJieQi();

    return {
      lunarDay,
      lunarMonth,
      festivals: festivals.length > 0 ? festivals : undefined,
      solarTerms: solarTerms || undefined
    };
  } catch (error) {
    console.error("获取农历信息失败:", error);
    return {
      lunarDay: undefined,
      lunarMonth: undefined,
      festivals: undefined,
      solarTerms: undefined
    };
  }
};

// 获取日历数据
const calendarData = ref<CalendarDay[]>([]);

// 生成基础日历数据（不含农历信息）
const generateBaseCalendarData = () => {
  const year = selectedYear.value;
  const month = selectedMonth.value;

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 获取第一天是星期几（0-6，0是星期日）
  const firstDayOfWeek = firstDay.getDay();

  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 星期一作为一周开始

  const days: CalendarDay[] = [];

  // 上个月的日期
  for (let i = prevMonthDays; i > 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i + 1);
    days.push({
      date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      articles: [],
      isCurrentMonth: false
    });
  }

  // 当月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const dayArticles = articlesList.filter((article) => {
      const articleDate = new Date(article.time);
      return (
        articleDate.getFullYear() === year
        && articleDate.getMonth() === month
        && articleDate.getDate() === i
      );
    });

    days.push({
      date,
      year,
      month: month + 1,
      day: i,
      articles: dayArticles,
      isCurrentMonth: true
    });
  }

  // 下个月的日期（补全到42天，6周）
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: i,
      articles: [],
      isCurrentMonth: false
    });
  }

  return days;
};

// 异步加载农历信息
const loadLunarInfo = async () => {
  const baseDays = generateBaseCalendarData();

  // 并行加载所有日期的农历信息
  const daysWithLunar = await Promise.all(
    baseDays.map(async (day) => {
      const lunarInfo = await getLunarInfo(day.date);
      return {
        ...day,
        ...lunarInfo
      };
    })
  );

  calendarData.value = daysWithLunar;
};

// 监听月份变化，重新加载农历信息
watch([selectedYear, selectedMonth], () => {
  if (import.meta.client) {
    loadLunarInfo();
  } else {
    calendarData.value = generateBaseCalendarData();
  }
}, { immediate: true });

// 切换月份
const changeMonth = (offset: number) => {
  selectedMonth.value += offset;
  if (selectedMonth.value > 11) {
    selectedMonth.value = 0;
    selectedYear.value += 1;
  } else if (selectedMonth.value < 0) {
    selectedMonth.value = 11;
    selectedYear.value -= 1;
  }
};

// 返回今天
const goToToday = () => {
  const today = new Date();
  selectedYear.value = today.getFullYear();
  selectedMonth.value = today.getMonth();
};

// 紧凑模式的折叠状态
const collapsedMonths = ref<Set<string>>(new Set());

// 切换月份折叠状态
const toggleMonthCollapse = (year: number, month: number) => {
  const key = `${year}-${month}`;
  if (collapsedMonths.value.has(key)) {
    collapsedMonths.value.delete(key);
  } else {
    collapsedMonths.value.add(key);
  }
};

// 检查月份是否折叠
const isMonthCollapsed = (year: number, month: number) => {
  return collapsedMonths.value.has(`${year}-${month}`);
};

// 快速导航相关
const showYearNav = ref(false);

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

// 滚动到指定年月
const scrollToYearMonth = (year: number, month: number) => {
  const elementId = `timeline-${year}-${month}`;
  const element = document.getElementById(elementId);

  if (element) {
    const offset = 100; // 顶部偏移量，避免被固定导航遮挡
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });

    showYearNav.value = false;
  }
};
</script>

<template>
  <main class="relative mx-auto max-w-7xl grow px-4 py-6 max-md:px-3 max-md:py-4">
    <div class="relative mx-auto max-w-7xl">
      <!-- 紧凑的页面标题和视图切换器 -->
      <header class="mb-6">
        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <!-- 左侧标题 -->
          <div class="text-center md:text-left">
            <h1 class="flex items-center justify-center gap-2 text-3xl font-bold text-dark-900 dark:text-dark-50 md:justify-start">
              <span class="text-2xl">📅</span>
              <span>{{ $t('timeline') }}</span>
            </h1>
            <p class="mt-1 text-sm text-dark-400 dark:text-dark-500">
              {{ $t('total') }} <span class="font-semibold text-primary-600 dark:text-primary-400">{{ totalArticles }}</span> {{ $t('articles-num') }}
            </p>
          </div>

          <!-- 右侧视图切换器 -->
          <div class="flex items-center gap-1.5 rounded-xl border border-dark-200 bg-white p-1 shadow-sm dark:border-dark-700 dark:bg-dark-800">
            <button
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                viewMode === 'classic'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-dark-600 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-700'
              ]"
              :title="'经典模式'"
              @click="switchViewMode('classic')"
            >
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="max-sm:hidden">经典</span>
            </button>

            <button
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                viewMode === 'compact'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-dark-600 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-700'
              ]"
              :title="'紧凑模式'"
              @click="switchViewMode('compact')"
            >
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span class="max-sm:hidden">紧凑</span>
            </button>

            <button
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                viewMode === 'card'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-dark-600 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-700'
              ]"
              :title="'卡片模式'"
              @click="switchViewMode('card')"
            >
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span class="max-sm:hidden">卡片</span>
            </button>

            <button
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                viewMode === 'calendar'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-dark-600 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-700'
              ]"
              :title="'日历模式'"
              @click="switchViewMode('calendar')"
            >
              <svg
                class="size-4"
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
              <span class="max-sm:hidden">日历</span>
            </button>
          </div>
        </div>
      </header>

      <!-- 年份/月份快速导航 -->
      <div
        v-if="(viewMode === 'classic' || viewMode === 'compact') && yearMonthNav.length > 0"
        class="sticky top-0 z-30 mb-6"
      >
        <div class="rounded-xl border border-dark-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-dark-700 dark:bg-dark-800/95">
          <!-- 导航切换按钮 -->
          <button
            class="flex w-full items-center justify-between gap-2 px-4 py-3 transition hover:bg-dark-50 dark:hover:bg-dark-700/50"
            @click="showYearNav = !showYearNav"
          >
            <div class="flex items-center gap-2">
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
              <span class="text-xs text-dark-400 dark:text-dark-500">
                {{ yearMonthNav.length }} 年
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
              <div class="space-y-3 p-4">
                <div
                  v-for="yearData in yearMonthNav"
                  :key="yearData.year"
                  class="space-y-2"
                >
                  <!-- 年份标题 -->
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 shadow-sm">
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
                      <span class="text-sm font-bold text-white">{{ yearData.year }}{{ $t('year') }}</span>
                    </div>
                    <span class="text-xs text-dark-400 dark:text-dark-500">
                      {{ yearData.months.reduce((sum, m) => sum + m.count, 0) }} {{ $t('articles-num') }}
                    </span>
                  </div>

                  <!-- 月份按钮 -->
                  <div class="flex flex-wrap gap-1.5 pl-2">
                    <button
                      v-for="monthData in yearData.months"
                      :key="`${yearData.year}-${monthData.month}`"
                      :class="[
                        'group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:shadow-md',
                        getMonthColorClass(monthData.month),
                        'text-white hover:-translate-y-0.5'
                      ]"
                      @click="scrollToYearMonth(yearData.year, monthData.month)"
                    >
                      <span>{{ monthData.month }}{{ $t('month') }}</span>
                      <span class="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold backdrop-blur-sm">
                        {{ monthData.count }}
                      </span>

                      <!-- 悬停提示 -->
                      <div class="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-dark-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block dark:bg-dark-700">
                        {{ monthData.count }} 篇文章
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 经典模式 - 原有的时间轴视图 -->
      <div
        v-if="viewMode === 'classic'"
        class="relative ml-32 max-md:ml-20"
      >
        <!-- 年份和月份分组 -->
        <div
          v-for="yearGroup in timelineData"
          :key="yearGroup.year"
          class="relative"
        >
          <div
            v-for="monthGroup in yearGroup.months"
            :id="`timeline-${yearGroup.year}-${monthGroup.month}`"
            :key="`${yearGroup.year}-${monthGroup.month}`"
            class="relative mb-6 scroll-mt-24"
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
                    'absolute -left-3 top-[15px] size-0 border-y-8 border-r-[12px] border-y-transparent max-md:left-[-10px] max-md:top-[11px] max-md:border-y-[6px] max-md:border-r-[10px]',
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

      <!-- 紧凑模式 -->
      <div
        v-if="viewMode === 'compact'"
        class="space-y-6"
      >
        <div
          v-for="yearGroup in timelineData"
          :key="yearGroup.year"
          class="space-y-4"
        >
          <div
            v-for="monthGroup in yearGroup.months"
            :id="`timeline-${yearGroup.year}-${monthGroup.month}`"
            :key="`${yearGroup.year}-${monthGroup.month}`"
            class="scroll-mt-24 rounded-xl border border-dark-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800"
          >
            <!-- 月份标题（可点击折叠） -->
            <button
              class="flex w-full items-center justify-between gap-2 border-b border-dark-100 p-4 text-left transition hover:bg-dark-50 dark:border-dark-700 dark:hover:bg-dark-700/50"
              @click="toggleMonthCollapse(yearGroup.year, monthGroup.month)"
            >
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm',
                    getMonthColorClass(monthGroup.month)
                  ]"
                >
                  {{ yearGroup.year }}{{ $t('year') }}{{ monthGroup.month }}{{ $t('month') }}
                </div>
                <span class="text-xs text-dark-400 dark:text-dark-500">
                  {{ monthGroup.articles.length }} {{ $t('articles-num') }}
                </span>
              </div>

              <!-- 折叠图标 -->
              <svg
                :class="[
                  'size-5 text-dark-400 transition-transform duration-200',
                  isMonthCollapsed(yearGroup.year, monthGroup.month) ? 'rotate-0' : 'rotate-180'
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

            <!-- 文章列表（可折叠） -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[2000px] opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-[2000px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-if="!isMonthCollapsed(yearGroup.year, monthGroup.month)"
                class="overflow-hidden"
              >
                <div class="space-y-1.5 p-4">
                  <NuxtLink
                    v-for="article in monthGroup.articles"
                    :key="article.id"
                    :to="`/articles/${article.customSlug || article.id}`"
                    class="group flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 transition hover:bg-dark-50 dark:hover:bg-dark-700/50"
                  >
                    <div class="flex min-w-0 flex-1 items-center gap-2.5">
                      <div class="shrink-0 text-xs text-dark-400 dark:text-dark-500">
                        {{ new Date(article.time).getDate().toString().padStart(2, '0') }}{{ $t('day') }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <h4 class="truncate text-sm font-medium text-dark-800 group-hover:text-primary-600 dark:text-dark-200 dark:group-hover:text-primary-400">
                          <span
                            v-if="article.encrypt || article.encryptBlocks"
                            class="mr-1 text-yellow-500"
                            :title="$t('encrypted')"
                          >🔒</span>
                          {{ article.title }}
                        </h4>
                      </div>
                    </div>
                    <svg
                      class="size-3.5 shrink-0 text-dark-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500 dark:text-dark-600"
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
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- 卡片模式 -->
      <div
        v-if="viewMode === 'card'"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <NuxtLink
          v-for="article in articlesList"
          :key="article.id"
          :to="`/articles/${article.customSlug || article.id}`"
          class="group relative flex flex-col overflow-hidden rounded-xl border border-dark-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-dark-700 dark:bg-dark-800"
        >
          <!-- 封面图片 -->
          <div
            v-if="articlePreviews[article.id]?.coverImage"
            class="relative h-40 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800"
          >
            <img
              :src="articlePreviews[article.id]?.coverImage"
              :alt="article.title"
              class="size-full object-cover transition-transform duration-300 group-hover:scale-110"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div
            v-else
            class="relative h-40 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800"
          >
            <div class="flex size-full items-center justify-center text-5xl opacity-30">
              📝
            </div>
          </div>

          <!-- 日期标签 -->
          <div class="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-sm dark:bg-dark-800/95">
            <div class="text-center">
              <div class="text-[10px] font-medium text-dark-500 dark:text-dark-400">
                {{ new Date(article.time).toLocaleDateString('zh-CN', { month: 'short' }) }}
              </div>
              <div class="text-lg font-bold text-primary-600 dark:text-primary-400">
                {{ new Date(article.time).getDate() }}
              </div>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="flex flex-1 flex-col p-4">
            <!-- 标题 -->
            <h3 class="mb-2 line-clamp-2 text-base font-semibold leading-snug text-dark-900 group-hover:text-primary-600 dark:text-dark-50 dark:group-hover:text-primary-400">
              <span
                v-if="article.encrypt || article.encryptBlocks"
                class="mr-1 text-yellow-500"
                :title="$t('encrypted')"
              >🔒</span>
              {{ article.title }}
            </h3>

            <!-- 摘要 -->
            <p
              v-if="articlePreviews[article.id]?.excerpt"
              class="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-dark-600 dark:text-dark-300"
            >
              {{ articlePreviews[article.id]?.excerpt }}
            </p>

            <!-- 底部信息 -->
            <div class="mt-auto flex items-center justify-between border-t border-dark-100 pt-2.5 text-xs text-dark-400 dark:border-dark-700 dark:text-dark-500">
              <span>{{ new Date(article.time).getFullYear() }}{{ $t('year') }}</span>
              <span
                v-if="article.len"
                class="flex items-center gap-1"
              >
                <svg
                  class="size-3"
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
              class="mt-2.5 flex flex-wrap gap-1"
            >
              <span
                v-for="tag in article.tags.slice(0, 2)"
                :key="tag"
                class="dark:bg-primary-900/30 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-600 dark:text-primary-400"
              >
                {{ tag }}
              </span>
              <span
                v-if="article.tags.length > 2"
                class="rounded-full bg-dark-100 px-2 py-0.5 text-[10px] text-dark-500 dark:bg-dark-700 dark:text-dark-400"
              >
                +{{ article.tags.length - 2 }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 日历模式 -->
      <div
        v-if="viewMode === 'calendar'"
        class="space-y-4"
      >
        <!-- 紧凑的月份切换器 -->
        <div class="flex items-center justify-between rounded-xl border border-dark-200 bg-white px-4 py-3 shadow-sm dark:border-dark-700 dark:bg-dark-800">
          <button
            class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-dark-600 transition hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-700"
            @click="changeMonth(-1)"
          >
            <svg
              class="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span class="max-sm:hidden">上月</span>
          </button>

          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-dark-900 dark:text-dark-50">
              {{ selectedYear }}{{ $t('year') }} {{ selectedMonth + 1 }}{{ $t('month') }}
            </h2>
            <button
              class="dark:!bg-primary-900/30 dark:hover:!bg-primary-900/50 flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-100 dark:text-primary-400"
              @click="goToToday"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>跳转到今天</span>
            </button>
          </div>

          <button
            class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-dark-600 transition hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-700"
            @click="changeMonth(1)"
          >
            <span class="max-sm:hidden">下月</span>
            <svg
              class="size-4"
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
        </div>

        <!-- 紧凑的日历网格 -->
        <div class="overflow-hidden rounded-xl border border-dark-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800">
          <!-- 星期标题 -->
          <div class="grid grid-cols-7 border-b border-dark-200 bg-dark-50 dark:border-dark-700 dark:bg-dark-700/50">
            <div
              v-for="day in ['一', '二', '三', '四', '五', '六', '日']"
              :key="day"
              class="py-2 text-center text-xs font-semibold text-dark-600 dark:text-dark-400"
            >
              {{ day }}
            </div>
          </div>

          <!-- 日期网格 -->
          <div class="grid grid-cols-7">
            <div
              v-for="(dayData, index) in calendarData"
              :key="index"
              :class="[
                'group relative min-h-[90px] border-b border-r border-dark-100 p-1.5 transition dark:border-dark-700 max-md:min-h-[75px]',
                !dayData.isCurrentMonth && 'bg-dark-50/50 dark:bg-dark-900/30',
                dayData.articles.length > 0 && 'cursor-pointer',
                dayData.articles.length > 0 && 'hover:bg-primary-100/50 dark:hover:bg-primary-800/30',
                (index + 1) % 7 === 0 && 'border-r-0',
                // 高亮今天
                dayData.day === new Date().getDate()
                  && dayData.month === new Date().getMonth() + 1
                  && dayData.year === new Date().getFullYear()
                  && dayData.isCurrentMonth
                  && 'bg-primary-50/30 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-400 dark:ring-primary-600'
              ]"
            >
              <!-- 日期数字和农历 -->
              <div class="mb-1 flex flex-col gap-0.5">
                <div class="flex items-center justify-between">
                  <span
                    :class="[
                      'flex items-center justify-center text-sm font-medium',
                      dayData.isCurrentMonth
                        ? 'text-dark-700 dark:text-dark-300'
                        : 'text-dark-400 dark:text-dark-600',
                      // 今天的样式 - 醒目的圆形背景
                      dayData.day === new Date().getDate()
                        && dayData.month === new Date().getMonth() + 1
                        && dayData.year === new Date().getFullYear()
                        && dayData.isCurrentMonth
                        && 'size-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white shadow-md'
                    ]"
                  >
                    {{ dayData.day }}
                  </span>

                  <!-- 文章数量标识 -->
                  <span
                    v-if="dayData.articles.length > 0"
                    :class="[
                      'flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm',
                      getMonthColorClass(dayData.month)
                    ]"
                  >
                    {{ dayData.articles.length }}
                  </span>
                </div>

                <!-- 农历日期 -->
                <div
                  v-if="dayData.lunarDay"
                  class="text-[9px] font-medium leading-tight"
                  :class="[
                    dayData.isCurrentMonth
                      ? 'text-dark-500 dark:text-dark-400'
                      : 'text-dark-400 dark:text-dark-500',
                    { 'font-bold text-primary-600 dark:text-primary-400': dayData.lunarDay === '初一' }
                  ]"
                >
                  {{ dayData.lunarDay === '初一' ? (dayData.lunarMonth + '月') : dayData.lunarDay }}
                </div>
              </div>

              <!-- 节日和节气 -->
              <div
                v-if="dayData.festivals || dayData.solarTerms"
                class="mb-0.5 space-y-0.5"
              >
                <!-- 节气 -->
                <div
                  v-if="dayData.solarTerms"
                  class="truncate rounded bg-gradient-to-r from-green-100 to-green-50 px-1 py-0.5 text-[9px] font-semibold text-green-700 shadow-sm dark:from-green-900/40 dark:to-green-900/30 dark:text-green-400"
                  :title="dayData.solarTerms"
                >
                  {{ dayData.solarTerms }}
                </div>
                <!-- 节日 -->
                <div
                  v-if="dayData.festivals && dayData.festivals.length > 0"
                  class="truncate rounded bg-gradient-to-r from-red-100 to-red-50 px-1 py-0.5 text-[9px] font-semibold text-red-700 shadow-sm dark:from-red-900/40 dark:to-red-900/30 dark:text-red-400"
                  :title="dayData.festivals.join('、')"
                >
                  {{ dayData.festivals[0] }}
                </div>
              </div>

              <!-- 文章列表（只显示1篇） -->
              <div
                v-if="dayData.articles.length > 0 && dayData.articles[0]"
                class="space-y-0.5"
              >
                <NuxtLink
                  :to="`/articles/${dayData.articles[0].customSlug || dayData.articles[0].id}`"
                  :class="[
                    'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm transition hover:opacity-80 hover:shadow-md',
                    getMonthColorClass(dayData.month)
                  ]"
                  :title="dayData.articles[0].title"
                >
                  {{ dayData.articles[0].title }}
                </NuxtLink>
                <div
                  v-if="dayData.articles.length > 1"
                  class="px-1.5 text-[10px] text-dark-400 dark:text-dark-500"
                >
                  +{{ dayData.articles.length - 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 当月文章列表 - 更紧凑美观 -->
        <div class="rounded-xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
          <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-dark-900 dark:text-dark-50">
            <svg
              class="size-4 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>本月文章</span>
            <span class="dark:bg-primary-900/30 flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-600 shadow-sm dark:text-primary-400">
              {{ calendarData.filter(d => d.isCurrentMonth && d.articles.length > 0).reduce((sum, d) => sum + d.articles.length, 0) }}
            </span>
          </h3>
          <div
            v-if="calendarData.filter(d => d.isCurrentMonth && d.articles.length > 0).length > 0"
            class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <template
              v-for="dayData in calendarData.filter(d => d.isCurrentMonth && d.articles.length > 0)"
              :key="`day-${dayData.year}-${dayData.month}-${dayData.day}`"
            >
              <NuxtLink
                v-for="article in dayData.articles"
                :key="`article-${article.id}`"
                :to="`/articles/${article.customSlug || article.id}`"
                class="group flex items-center gap-2.5 rounded-lg border border-dark-200 bg-white p-2.5 shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-dark-700 dark:bg-dark-700/50 dark:hover:border-primary-700"
              >
                <div
                  :class="[
                    'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm',
                    getMonthColorClass(dayData.month)
                  ]"
                >
                  {{ dayData.day }}
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="line-clamp-2 text-xs font-medium leading-snug text-dark-800 group-hover:text-primary-600 dark:text-dark-200 dark:group-hover:text-primary-400">
                    {{ article.title }}
                  </h4>
                </div>
              </NuxtLink>
            </template>
          </div>
          <div
            v-else
            class="py-8 text-center text-sm text-dark-400 dark:text-dark-500"
          >
            本月暂无文章
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
