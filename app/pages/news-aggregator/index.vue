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
          新闻聚合中心
        </h1>
        <p class="mb-4 text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          News Aggregation Center
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
      </div>

      <!-- 每天 60 秒读懂世界 -->
      <div
        v-if="sixtySecondsNews.length > 0"
        class="mb-8 rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
      >
        <div class="mb-8 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
              <span class="text-3xl">📰</span>
            </div>
            <div>
              <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                每天 60 秒读懂世界
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
            v-for="(item, index) in sixtySecondsNews"
            :key="index"
            class="news-item group flex cursor-pointer items-start rounded-2xl border-2 border-transparent p-5 transition-all duration-300 hover:border-blue-300/50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-lg dark:hover:border-blue-700/50 dark:hover:from-gray-700 dark:hover:to-gray-700/80"
          >
            <span class="mr-4 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
              {{ index + 1 }}
            </span>
            <p class="flex-1 text-[15px] leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
              {{ item }}
            </p>
          </div>
        </div>
      </div>

      <!-- AI 资讯快报 -->
      <div
        v-if="aiNews.length > 0"
        class="mb-8 rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
      >
        <div class="mb-8 flex items-center space-x-3">
          <div class="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
            <span class="text-3xl">🤖</span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
              AI 资讯快报
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              AI News Brief
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="(item, index) in aiNews"
            :key="index"
            class="news-item group flex cursor-pointer items-start rounded-2xl border-2 border-transparent p-5 transition-all duration-300 hover:border-purple-300/50 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:shadow-lg dark:hover:border-purple-700/50 dark:hover:from-gray-700 dark:hover:to-gray-700/80"
          >
            <span class="mr-4 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
              {{ index + 1 }}
            </span>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ item.title }}
              </h3>
              <p class="mt-1 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                {{ item.detail }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 实时热搜 -->
      <div
        class="mb-8 rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
      >
        <div class="mb-8 flex items-center space-x-3">
          <div class="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-3 shadow-lg">
            <span class="text-3xl">🔥</span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
              实时热搜
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hot Trends
            </p>
          </div>
        </div>

        <!-- 热搜平台内容 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="platform in hotSearchPlatforms"
            :key="platform.key"
            class="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-red-300/50 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-700/50"
          >
            <h3 class="mb-4 text-center text-lg font-bold text-red-600 dark:text-red-400">
              {{ platform.name }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="(item, index) in hotSearchData[platform.key] || []"
                :key="index"
                class="group flex cursor-pointer items-start rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900/50 dark:hover:bg-gray-700"
              >
                <span class="mr-3 mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-xs font-bold text-white shadow transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                  {{ index + 1 }}
                </span>
                <p class="flex-1 text-sm leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                  {{ item.title }}
                </p>
              </div>
              <div
                v-if="!hotSearchData[platform.key] || hotSearchData[platform.key].length === 0"
                class="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                暂无数据
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- 左侧栏 -->
        <div class="space-y-8">
          <!-- 历史上的今天 -->
          <div
            v-if="historyToday.length > 0"
            class="rounded-3xl border border-gray-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:from-gray-800/90 dark:to-gray-700/90"
          >
            <div class="mb-8 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 shadow-lg">
                  <span class="text-3xl">📜</span>
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                    历史上的今天
                  </h2>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Today in History
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  On This Day
                </div>
                <div class="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {{ currentDate }}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="(item, index) in historyToday"
                :key="index"
                class="news-item group relative flex cursor-pointer items-start overflow-hidden rounded-2xl border-2 border-transparent bg-white/80 p-6 shadow-lg transition-all duration-300 hover:border-amber-300/50 hover:bg-white hover:shadow-xl dark:bg-gray-700/80 dark:hover:bg-gray-700"
              >
                <!-- 装饰元素 -->
                <div class="absolute -left-4 -top-4 size-16 rounded-full bg-amber-100 opacity-50 dark:bg-amber-900/20" />

                <span class="z-10 mr-4 mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                  {{ index + 1 }}
                </span>
                <div class="z-10 flex-1">
                  <div class="mb-2 flex items-center space-x-2">
                    <span class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      {{ item.year }}年
                    </span>
                    <span class="size-1 rounded-full bg-amber-400 dark:bg-amber-500" />
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ Math.abs(new Date().getFullYear() - parseInt(item.year)) }}年前
                    </span>
                  </div>
                  <p class="text-[15px] leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                    {{ item.event }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 底部装饰 -->
            <div class="mt-8 flex justify-center">
              <div class="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-70" />
            </div>
          </div>
        </div>

        <!-- 右侧栏 -->
        <div class="space-y-8">
          <!-- 农历信息 -->
          <div
            class="rounded-3xl border border-gray-200/50 bg-white/90 p-6 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
          >
            <!-- 绿色头部 -->
            <div class="mb-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white shadow-lg">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">🌙</span>
                <div>
                  <h2 class="text-xl font-bold">
                    农历信息
                  </h2>
                  <p class="text-xs opacity-90">
                    Lunar Calendar
                  </p>
                </div>
              </div>
            </div>

            <!-- 主体内容 -->
            <div class="space-y-4">
              <!-- 公历和农历日期 -->
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                  <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    公历日期
                  </p>
                  <p class="text-center text-lg font-semibold text-gray-800 dark:text-white">
                    {{ lunarInfo.date }}
                  </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                  <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    农历日期
                  </p>
                  <p class="text-center text-lg font-semibold text-green-700 dark:text-green-400">
                    {{ lunarInfo.lunarDate }}
                  </p>
                </div>
              </div>

              <!-- 天干地支 (一行显示) -->
              <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                <p class="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">
                  天干地支
                </p>
                <div class="flex items-center justify-around">
                  <div class="text-center">
                    <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      年柱
                    </p>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">
                      {{ lunarInfo.ganZhiYear }}
                    </p>
                  </div>
                  <div class="h-6 w-px bg-gray-200 dark:bg-gray-600" />
                  <div class="text-center">
                    <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      月柱
                    </p>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">
                      {{ lunarInfo.ganZhiMonth }}
                    </p>
                  </div>
                  <div class="h-6 w-px bg-gray-200 dark:bg-gray-600" />
                  <div class="text-center">
                    <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      日柱
                    </p>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">
                      {{ lunarInfo.ganZhiDay }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 节气/月相/生肖 (一行显示) -->
              <div class="grid grid-cols-3 gap-4">
                <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                  <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    节气
                  </p>
                  <p class="text-center text-sm font-medium text-green-700 dark:text-green-400">
                    {{ lunarInfo.solarTerm }}
                  </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                  <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    月相
                  </p>
                  <p class="text-center text-sm font-medium text-blue-700 dark:text-blue-400">
                    {{ lunarInfo.lunarPhase }}
                  </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                  <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    生肖
                  </p>
                  <p class="text-center text-sm font-medium text-red-700 dark:text-red-400">
                    {{ lunarInfo.zodiac }}年
                  </p>
                </div>
              </div>

              <!-- 节日信息 -->
              <div
                v-if="lunarInfo.festival"
                class="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-4 shadow-sm dark:from-gray-700/70 dark:to-gray-600/70"
              >
                <p class="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                  节日
                </p>
                <p class="text-center text-lg font-bold text-orange-700 dark:text-orange-400">
                  {{ lunarInfo.festival }}
                </p>
              </div>

              <!-- 宜事项 (一行显示) -->
              <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                <p class="mb-3 text-center text-xs font-medium text-green-700 dark:text-green-400">
                  宜
                </p>
                <div class="flex flex-wrap justify-center gap-2">
                  <span
                    v-for="(item, index) in lunarInfo.auspicious"
                    :key="index"
                    class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {{ item }}
                  </span>
                  <span
                    v-if="lunarInfo.auspicious.length === 0"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    无特别推荐
                  </span>
                </div>
              </div>

              <!-- 忌事项 (一行显示) -->
              <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-700">
                <p class="mb-3 text-center text-xs font-medium text-red-700 dark:text-red-400">
                  忌
                </p>
                <div class="flex flex-wrap justify-center gap-2">
                  <span
                    v-for="(item, index) in lunarInfo.inauspicious"
                    :key="index"
                    class="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {{ item }}
                  </span>
                  <span
                    v-if="lunarInfo.inauspicious.length === 0"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    无特别禁忌
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 随机一言 -->
          <div
            v-if="randomQuote"
            class="rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
          >
            <div class="mb-6 flex items-center space-x-3">
              <div class="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 shadow-lg">
                <span class="text-3xl">💭</span>
              </div>
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                  随机一言
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Random Quote
                </p>
              </div>
            </div>

            <div class="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-md dark:from-gray-700/50 dark:to-gray-700">
              <p class="text-lg italic text-gray-700 dark:text-gray-300">
                {{ randomQuote }}
              </p>
            </div>
          </div>

          <!-- 随机搞笑段子 -->
          <div
            v-if="funnyJoke"
            class="rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
          >
            <div class="mb-6 flex items-center space-x-3">
              <div class="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 shadow-lg">
                <span class="text-3xl">😂</span>
              </div>
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                  随机搞笑段子
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Funny Joke
                </p>
              </div>
            </div>

            <div class="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 p-6 shadow-md dark:from-gray-700/50 dark:to-gray-700">
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {{ funnyJoke }}
              </p>
            </div>
          </div>

          <!-- 随机冷笑话 -->
          <div
            v-if="dadJoke"
            class="rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
          >
            <div class="mb-6 flex items-center space-x-3">
              <div class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                <span class="text-3xl">🤨</span>
              </div>
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                  随机冷笑话
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Dad Joke
                </p>
              </div>
            </div>

            <div class="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:from-gray-700/50 dark:to-gray-700">
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {{ dadJoke }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 响应式数据
const isLoading = ref(true);
const loadError = ref("");

// 日期计算
const currentDate = computed(() => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
});

// 新闻日期
const newsDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

// 计算详细农历信息
const calculateLunarInfo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 农历年计算 (简化版)
  const lunarYear = year;
  const lunarMonth = month;
  const lunarDay = day;

  // 天干地支
  const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const zodiacs = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

  // 计算天干地支年
  const yearIndex = (year - 4) % 60;
  const ganZhiYear = tianGan[yearIndex % 10] + diZhi[yearIndex % 12];
  const zodiac = zodiacs[yearIndex % 12];

  // 计算天干地支月
  const monthIndex = (year * 12 + month + 3) % 60;
  const ganZhiMonth = tianGan[monthIndex % 10] + diZhi[monthIndex % 12];

  // 计算天干地支日 (简化版)
  const dayIndex = (year * 365 + month * 30 + day) % 60;
  const ganZhiDay = tianGan[dayIndex % 10] + diZhi[dayIndex % 12];

  // 节气计算 (简化版)
  const solarTerms = [
    "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
    "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
    "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
    "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
  ];
  const termIndex = Math.floor((month * 2 + day / 15) % 24);
  const solarTerm = solarTerms[termIndex];

  // 月相计算 (简化版)
  const lunarPhaseNames = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"];
  const moonAge = (year * 365 + month * 30 + day) % 29.53;
  const phaseIndex = Math.floor((moonAge / 29.53) * 8);
  const lunarPhase = lunarPhaseNames[phaseIndex];

  // 节日信息 (简化版)
  let festival = "";
  if (month === 1 && day === 1) festival = "元旦";
  if (month === 2 && day === 14) festival = "情人节";
  if (month === 5 && day === 1) festival = "劳动节";
  if (month === 10 && day === 1) festival = "国庆节";

  // 宜/忌事项计算 (基于传统农历原则简化版)
  const auspicious = [
    "祭祀", "祈福", "求嗣", "嫁娶", "纳采",
    "出行", "开市", "交易", "立券", "安床",
    "安葬", "破土", "启钻", "修造", "动土"
  ];

  const inauspicious = [
    "开市", "安葬", "嫁娶", "移徙", "入宅",
    "安床", "修造", "动土", "破土", "开光"
  ];

  // 根据日期计算宜/忌事项 (简化版)
  const dayHash = (year * 1000 + month * 100 + day) % 12;
  const auspiciousActivities = auspicious.filter((_, index) => index % 3 === dayHash);
  const inauspiciousActivities = inauspicious.filter((_, index) => index % 2 === dayHash % 2);

  // 组装农历日期
  const lunarDateStr = `农历${lunarMonth}月${lunarDay}日`;

  return {
    date: `${year}年${month}月${day}日`,
    year: lunarYear.toString(),
    month: lunarMonth.toString(),
    day: lunarDay.toString(),
    ganZhiYear,
    ganZhiMonth,
    ganZhiDay,
    solarTerm,
    lunarPhase,
    zodiac,
    festival,
    lunarDate: lunarDateStr,
    auspicious: auspiciousActivities,
    inauspicious: inauspiciousActivities
  };
};

// 热搜平台 - 按指定顺序排列
const hotSearchPlatforms = [
  { key: "douyin", name: "抖音" },
  { key: "rednote", name: "小红书" },
  { key: "bili", name: "哔哩哔哩" },
  { key: "weibo", name: "微博" },
  { key: "baidu", name: "百度" },
  { key: "toutiao", name: "头条" },
  { key: "zhihu", name: "知乎" },
  { key: "hackernews", name: "Hacker News" }
];

// 数据状态
const sixtySecondsNews = ref<any[]>([]);
const aiNews = ref<any[]>([]);
const historyToday = ref<any[]>([]);
const hotSearchData = ref<Record<string, any[]>>({});
const randomQuote = ref("");
const funnyJoke = ref("");
const dadJoke = ref("");
const lunarDate = ref("");
const lunarInfo = ref({
  date: "",
  year: "",
  month: "",
  day: "",
  ganZhiYear: "",
  ganZhiMonth: "",
  ganZhiDay: "",
  solarTerm: "",
  lunarPhase: "",
  zodiac: "",
  festival: "",
  auspicious: [] as string[],
  inauspicious: [] as string[]
});

// 加载数据
const loadData = async () => {
  try {
    isLoading.value = true;
    loadError.value = "";

    // 并行请求所有数据
    const [
      sixtySecondsRes,
      aiNewsRes,
      historyTodayRes,
      quoteRes,
      jokeRes,
      dadJokeRes,
      ...hotSearchResults
    ] = await Promise.all([
      $fetch("/api/news-aggregator/sixty-seconds"),
      $fetch("/api/news-aggregator/ai-news"),
      $fetch("/api/news-aggregator/history-today"),
      $fetch("/api/news-aggregator/random-quote"),
      $fetch("/api/news-aggregator/funny-joke"),
      $fetch("/api/news-aggregator/dad-joke"),
      // Fetch hot search data for all platforms
      ...hotSearchPlatforms.map(platform =>
        $fetch(`/api/news-aggregator/hot-search?platform=${platform.key}`)
      )
    ]);

    // 计算详细农历信息
    const lunarData = calculateLunarInfo();
    lunarDate.value = lunarData.lunarDate;
    lunarInfo.value = lunarData;

    // 更新数据
    sixtySecondsNews.value = sixtySecondsRes.data?.news || [];
    aiNews.value = aiNewsRes.data || [];
    historyToday.value = historyTodayRes.data || [];

    // Store hot search data for all platforms with error handling
    hotSearchPlatforms.forEach((platform, index) => {
      try {
        const result = hotSearchResults[index];
        hotSearchData.value[platform.key] = result?.data?.slice(0, 5) || [];
      } catch (error) {
        console.error(`获取${platform.name}热搜数据失败:`, error);
        hotSearchData.value[platform.key] = [];
      }
    });

    randomQuote.value = quoteRes.data?.hitokoto || "加载中...";
    funnyJoke.value = jokeRes.data?.duanzi || "加载中...";
    dadJoke.value = dadJokeRes.data?.content || "加载中...";
  } catch (error) {
    console.error("加载数据失败:", error);
    loadError.value = "加载数据失败，请刷新页面重试";
  } finally {
    isLoading.value = false;
  }
};

// 初始化加载
onMounted(() => {
  loadData();
});

// 设置页面元数据
useHead({
  title: "新闻聚合中心 - 60秒读懂世界",
  meta: [
    { name: "description", content: "聚合每日新闻、热搜榜单、历史事件等内容" }
  ]
});
</script>

<style scoped>
.news-aggregator {
  min-height: 100vh;
}

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
