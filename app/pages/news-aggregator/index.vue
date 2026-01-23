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

        <!-- 操作按钮 -->
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

          <!-- 样式配置按钮 -->
          <button
            class="group inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-pink-700 hover:shadow-xl"
            @click="showConfigModal = true"
          >
            <span class="text-xl">🎨</span>
            <span>样式配置</span>
          </button>
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

    <!-- 保存图片模态框 -->
    <SaveImageModal
      v-model="showSaveModal"
      config-key="news-aggregator"
      @save="handleSaveImage"
      @download-all="handleDownloadAll"
    />

    <!-- 卡片样式配置模态框 -->
    <CardConfigModal
      :show="showConfigModal"
      config-key="news-aggregator"
      message="配置会应用到：每天60秒读懂世界、AI资讯快报、实时热搜、历史上的今天、农历信息、随机一言、随机搞笑段子、随机冷笑话"
      @close="showConfigModal = false"
    />

    <!-- 图片生成加载状态 -->
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
import { ref, computed, onMounted } from "vue";
import { Solar } from "lunar-javascript";
import SaveImageModal from "~/components/SaveImageModal.vue";
import CardConfigModal from "~/components/CardConfigModal.vue";
import * as ImageGenerator from "~/utils/imageGenerator";
import { useCardConfig } from "~/composables/useCardConfig";

// 响应式数据
const isLoading = ref(true);
const loadError = ref("");
const showSaveModal = ref(false);
const showConfigModal = ref(false);
const isGenerating = ref(false);
const generatingText = ref("正在生成图片");

// 使用卡片配置
const { cardConfig } = useCardConfig("news-aggregator");

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
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 使用 lunar-javascript 库计算农历信息
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    // 农历日期
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();

    // 农历月份名称
    const lunarMonths = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
    // 农历日期名称
    const lunarDays = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
      "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
      "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

    // 计算索引（注意：lunar-javascript 返回的月份和日期从1开始）
    const monthIndex = lunarMonth - 1;
    const dayIndex = lunarDay - 1;

    // 确保索引在有效范围内
    const validMonthIndex = Math.max(0, Math.min(monthIndex, lunarMonths.length - 1));
    const validDayIndex = Math.max(0, Math.min(dayIndex, lunarDays.length - 1));

    // 组装农历日期
    const lunarDateStr = `农历${lunarMonths[validMonthIndex]}${lunarDays[validDayIndex]}`;

    // 天干地支信息
    const ganZhiYear = lunar.getYearInGanZhi();
    const ganZhiMonth = lunar.getMonthInGanZhi();
    const ganZhiDay = lunar.getDayInGanZhi();

    // 生肖
    const zodiac = lunar.getYearShengXiao();

    // 节气
    const solarTerm = lunar.getCurrentJieQi() || "";

    // 月相
    const lunarPhase = lunar.getYueXiang() || "";

    // 节日
    const festival = lunar.getFestivals().join("、") || "";

    // 宜事项
    const auspicious = lunar.getDayYi();

    // 忌事项
    const inauspicious = lunar.getDayJi();

    return {
      date: `${year}年${month}月${day}日`,
      year: lunar.getYear().toString(),
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
      auspicious: auspicious.length > 0 ? auspicious : [],
      inauspicious: inauspicious.length > 0 ? inauspicious : []
    };
  } catch (error) {
    console.error("计算农历信息失败:", error);
    // 出错时返回默认值
    const date = new Date();
    return {
      date: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString(),
      day: date.getDate().toString(),
      ganZhiYear: "",
      ganZhiMonth: "",
      ganZhiDay: "",
      solarTerm: "",
      lunarPhase: "",
      zodiac: "",
      festival: "",
      lunarDate: "计算失败",
      auspicious: [],
      inauspicious: []
    };
  }
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

// 处理保存图片
const handleSaveImage = async (type: string, customConfig?: any) => {
  if (isLoading.value) {
    alert("数据正在加载中，请稍候再试");
    return;
  }

  isGenerating.value = true;

  try {
    let dataUrl = "";
    let filename = "";
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekDay = weekDays[date.getDay()];

    switch (type) {
      case "sixty-seconds": {
        generatingText.value = "正在生成每天60秒读懂世界图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-每天60秒读懂世界.png`;
        const formattedNews = sixtySecondsNews.value.map((item: any, index: number) => ({
          id: index + 1,
          content: item
        }));
        dataUrl = await ImageGenerator.generateNewsCard(
          formattedNews,
          {
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            ...(customConfig || cardConfig.value)
          }
        );
        break;
      }

      case "ai-news": {
        generatingText.value = "正在生成AI资讯快报图片";
        const aiNewsChunk = aiNews.value.slice(0, 15); // 最多使用15条数据
        const chunks = [];
        for (let i = 0; i < aiNewsChunk.length; i += 5) {
          chunks.push(aiNewsChunk.slice(i, i + 5));
        }
        const chunksToUse = chunks.slice(0, 3); // 最多生成3张图片

        for (let i = 0; i < chunksToUse.length; i++) {
          generatingText.value = `正在生成AI资讯快报图片 ${i + 1}/${chunksToUse.length}`;
          const filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-AI资讯快报-${i + 1}.png`;
          const formattedAiNews = chunksToUse[i].map((item: any, index: number) => ({
            id: i * 5 + index + 1,
            content: `${item.title}: ${item.detail}`
          }));
          const dataUrl = await ImageGenerator.generateListCard(
            formattedAiNews,
            {
              title: "AI资讯快报",
              date: dateStr,
              weekDay,
              lunarDate: lunarDate.value,
              ...(customConfig || cardConfig.value)
            }
          );

          // 下载图片
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      }

      case "hot-search": {
        generatingText.value = "正在生成实时热搜图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-实时热搜.png`;
        const allTrends: any[] = [];
        hotSearchPlatforms.forEach((platform: any) => {
          const platformTrends = hotSearchData.value[platform.key] || [];
          platformTrends.forEach((item: any) => {
            allTrends.push({
              id: allTrends.length + 1,
              content: `【${platform.name}】${item.title}`
            });
          });
        });
        dataUrl = await ImageGenerator.generateListCard(
          allTrends.slice(0, 20),
          {
            title: "实时热搜",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            ...(customConfig || cardConfig.value)
          }
        );
        break;
      }

      case "history-today": {
        generatingText.value = "正在生成历史上的今天图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-历史上的今天.png`;
        const formattedHistory = historyToday.value.map((item: any, index: number) => ({
          id: index + 1,
          content: `${item.year}年 ${item.event}`
        }));
        dataUrl = await ImageGenerator.generateListCard(
          formattedHistory,
          {
            title: "历史上的今天",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            hideNumbers: true,
            ...(customConfig || cardConfig.value)
          }
        );
        break;
      }

      case "lunar-info": {
        generatingText.value = "正在生成农历信息图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-农历信息.png`;
        const lunarItems = [
          { id: 1, content: `${lunarInfo.value.lunarDate}` },
          { id: 2, content: "" },
          { id: 3, content: `天干地支：${lunarInfo.value.ganZhiYear}年 ${lunarInfo.value.ganZhiMonth}月 ${lunarInfo.value.ganZhiDay}日` },
          { id: 4, content: `节气：${lunarInfo.value.solarTerm}` },
          { id: 5, content: `月相：${lunarInfo.value.lunarPhase}` },
          { id: 6, content: `生肖：${lunarInfo.value.zodiac}年` },
          { id: 7, content: "" },
          { id: 8, content: `宜：${lunarInfo.value.auspicious.join("  ")}` },
          { id: 9, content: `忌：${lunarInfo.value.inauspicious.join("  ")}` }
        ];
        dataUrl = await ImageGenerator.generateListCard(
          lunarItems,
          {
            title: "农历信息",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            hideNumbers: true,
            ...(customConfig || cardConfig.value)
          }
        );
        break;
      }

      case "random-quote":
        generatingText.value = "正在生成随机一言图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机一言.png`;
        dataUrl = await ImageGenerator.generateListCard(
          [{ id: 1, content: randomQuote.value }],
          {
            title: "随机一言",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            hideNumbers: true,
            ...(customConfig || cardConfig.value)
          }
        );
        break;

      case "funny-joke":
        generatingText.value = "正在生成随机搞笑段子图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机搞笑段子.png`;
        dataUrl = await ImageGenerator.generateListCard(
          [{ id: 1, content: funnyJoke.value }],
          {
            title: "随机搞笑段子",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            hideNumbers: true,
            ...(customConfig || cardConfig.value)
          }
        );
        break;

      case "dad-joke":
        generatingText.value = "正在生成随机冷笑话图片";
        filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机冷笑话.png`;
        dataUrl = await ImageGenerator.generateListCard(
          [{ id: 1, content: dadJoke.value }],
          {
            title: "随机冷笑话",
            date: dateStr,
            weekDay,
            lunarDate: lunarDate.value,
            hideNumbers: true,
            ...(customConfig || cardConfig.value)
          }
        );
        break;
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

// 处理一键下载所有图片
const handleDownloadAll = async () => {
  if (isLoading.value) {
    alert("数据正在加载中，请稍候再试");
    return;
  }

  isGenerating.value = true;
  generatingText.value = "正在批量生成所有图片";

  try {
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekDay = weekDays[date.getDay()];

    // 定义所有需要下载的类型
    const types = ["sixty-seconds", "ai-news", "hot-search", "history-today", "lunar-info", "random-quote", "funny-joke", "dad-joke"];

    // 逐个生成并下载图片
    for (const type of types) {
      try {
        let dataUrl = "";
        let filename = "";

        switch (type) {
          case "sixty-seconds": {
            generatingText.value = "正在生成每天60秒读懂世界图片 (1/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-每天60秒读懂世界.png`;
            const formattedNews = sixtySecondsNews.value.map((item: any, index: number) => ({
              id: index + 1,
              content: item
            }));
            dataUrl = await ImageGenerator.generateNewsCard(
              formattedNews,
              {
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                ...cardConfig.value
              }
            );
            break;
          }

          case "ai-news": {
            const aiNewsChunk = aiNews.value.slice(0, 15); // 最多使用15条数据
            const chunks = [];
            for (let i = 0; i < aiNewsChunk.length; i += 5) {
              chunks.push(aiNewsChunk.slice(i, i + 5));
            }
            const chunksToUse = chunks.slice(0, 3); // 最多生成3张图片

            for (let i = 0; i < chunksToUse.length; i++) {
              generatingText.value = `正在生成AI资讯快报图片 ${i + 1}/${chunksToUse.length} (2/8)`;
              const filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-AI资讯快报-${i + 1}.png`;
              const formattedAiNews = chunksToUse[i].map((item: any, index: number) => ({
                id: i * 5 + index + 1,
                content: `${item.title}: ${item.detail}`
              }));
              const dataUrl = await ImageGenerator.generateListCard(
                formattedAiNews,
                {
                  title: "AI资讯快报",
                  date: dateStr,
                  weekDay,
                  lunarDate: lunarDate.value,
                  ...cardConfig.value
                }
              );

              // 下载图片
              const link = document.createElement("a");
              link.href = dataUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            break;
          }

          case "hot-search": {
            generatingText.value = "正在生成实时热搜图片 (3/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-实时热搜.png`;
            const allTrends: any[] = [];
            hotSearchPlatforms.forEach((platform: any) => {
              const platformTrends = hotSearchData.value[platform.key] || [];
              platformTrends.forEach((item: any) => {
                allTrends.push({
                  id: allTrends.length + 1,
                  content: `【${platform.name}】${item.title}`
                });
              });
            });
            dataUrl = await ImageGenerator.generateListCard(
              allTrends.slice(0, 20),
              {
                title: "实时热搜",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                ...cardConfig.value
              }
            );
            break;
          }

          case "history-today": {
            generatingText.value = "正在生成历史上的今天图片 (4/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-历史上的今天.png`;
            const formattedHistory = historyToday.value.map((item: any, index: number) => ({
              id: index + 1,
              content: `${item.year}年 ${item.event}`
            }));
            dataUrl = await ImageGenerator.generateListCard(
              formattedHistory,
              {
                title: "历史上的今天",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                hideNumbers: true,
                ...cardConfig.value
              }
            );
            break;
          }

          case "lunar-info": {
            generatingText.value = "正在生成农历信息图片 (5/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-农历信息.png`;
            const lunarItems = [
              { id: 1, content: `${lunarInfo.value.lunarDate}` },
              { id: 2, content: "" },
              { id: 3, content: `天干地支：${lunarInfo.value.ganZhiYear}年 ${lunarInfo.value.ganZhiMonth}月 ${lunarInfo.value.ganZhiDay}日` },
              { id: 4, content: `节气：${lunarInfo.value.solarTerm}` },
              { id: 5, content: `月相：${lunarInfo.value.lunarPhase}` },
              { id: 6, content: `生肖：${lunarInfo.value.zodiac}年` },
              { id: 7, content: "" },
              { id: 8, content: `宜：${lunarInfo.value.auspicious.join("  ")}` },
              { id: 9, content: `忌：${lunarInfo.value.inauspicious.join("  ")}` }
            ];
            dataUrl = await ImageGenerator.generateListCard(
              lunarItems,
              {
                title: "农历信息",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                hideNumbers: true,
                ...cardConfig.value
              }
            );
            break;
          }

          case "random-quote": {
            generatingText.value = "正在生成随机一言图片 (6/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机一言.png`;
            dataUrl = await ImageGenerator.generateListCard(
              [{ id: 1, content: randomQuote.value }],
              {
                title: "随机一言",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                hideNumbers: true,
                ...cardConfig.value
              }
            );
            break;
          }

          case "funny-joke": {
            generatingText.value = "正在生成随机搞笑段子图片 (7/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机搞笑段子.png`;
            dataUrl = await ImageGenerator.generateListCard(
              [{ id: 1, content: funnyJoke.value }],
              {
                title: "随机搞笑段子",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                hideNumbers: true,
                ...cardConfig.value
              }
            );
            break;
          }

          case "dad-joke": {
            generatingText.value = "正在生成随机冷笑话图片 (8/8)";
            filename = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日-随机冷笑话.png`;
            dataUrl = await ImageGenerator.generateListCard(
              [{ id: 1, content: dadJoke.value }],
              {
                title: "随机冷笑话",
                date: dateStr,
                weekDay,
                lunarDate: lunarDate.value,
                hideNumbers: true,
                ...cardConfig.value
              }
            );
            break;
          }
        }

        if (dataUrl) {
          ImageGenerator.downloadImage(dataUrl, filename);
          // 短暂延迟，避免下载请求过于密集
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`生成${type}图片失败:`, error);
        // 继续处理其他类型，不中断整个过程
      }
    }

    // 所有图片生成完成
    generatingText.value = "所有图片已生成完成";
    setTimeout(() => {
      isGenerating.value = false;
    }, 1000);
  } catch (error) {
    console.error("批量生成图片失败:", error);
    alert("批量生成图片失败，请重试");
    isGenerating.value = false;
  }
};

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
