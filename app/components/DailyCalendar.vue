<template>
  <div
    id="daily-calendar"
    class="daily-calendar rounded-3xl border-2 border-orange-200/50 bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 p-8 shadow-xl transition-all hover:shadow-2xl dark:border-orange-800/50 dark:from-orange-950 dark:via-red-950 dark:to-pink-950"
  >
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-3 shadow-lg">
          <span class="text-3xl">📖</span>
        </div>
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white">
            今日黄历
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Chinese Calendar
          </p>
        </div>
      </div>
    </div>

    <!-- 农历信息 -->
    <div class="mb-5 rounded-2xl border border-orange-200/30 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:border-orange-800/30 dark:bg-gray-800/80">
      <div class="text-center">
        <div class="mb-3 text-xl font-black text-gray-900 dark:text-white">
          {{ calendar.lunar }}
        </div>
        <div class="flex justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span class="rounded-full bg-orange-100 px-3 py-1 dark:bg-orange-900/50">{{ calendar.animal }}</span>
          <span class="rounded-full bg-red-100 px-3 py-1 dark:bg-red-900/50">{{ calendar.month }}</span>
          <span class="rounded-full bg-pink-100 px-3 py-1 dark:bg-pink-900/50">{{ calendar.day }}</span>
        </div>
      </div>
    </div>

    <!-- 五行和冲煞 -->
    <div class="mb-4 grid grid-cols-2 gap-4">
      <div class="rounded-xl bg-white p-3 dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          五行
        </div>
        <div class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ calendar.element }}
        </div>
      </div>
      <div class="rounded-xl bg-white p-3 dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          冲煞
        </div>
        <div class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ calendar.conflict }}
        </div>
      </div>
    </div>

    <!-- 方位 -->
    <div class="mb-4 grid grid-cols-3 gap-3">
      <div class="rounded-xl bg-white p-3 text-center dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          喜神
        </div>
        <div class="text-sm font-bold text-blue-600 dark:text-blue-400">
          {{ calendar.luckyDirection }}
        </div>
      </div>
      <div class="rounded-xl bg-white p-3 text-center dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          福神
        </div>
        <div class="text-sm font-bold text-green-600 dark:text-green-400">
          {{ calendar.blessDirection }}
        </div>
      </div>
      <div class="rounded-xl bg-white p-3 text-center dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          财神
        </div>
        <div class="text-sm font-bold text-yellow-600 dark:text-yellow-400">
          {{ calendar.wealthDirection }}
        </div>
      </div>
    </div>

    <!-- 宜忌 -->
    <div class="space-y-4">
      <!-- 宜 -->
      <div class="rounded-2xl border-2 border-green-200 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:border-green-800 dark:bg-gray-800/80">
        <div class="flex items-start">
          <span class="mr-4 inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-base font-black text-white shadow-lg">
            宜
          </span>
          <div class="flex flex-1 flex-wrap gap-2">
            <span
              v-for="(item, index) in calendar.suitable"
              :key="index"
              class="cursor-default rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <!-- 忌 -->
      <div class="rounded-2xl border-2 border-red-200 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:border-red-800 dark:bg-gray-800/80">
        <div class="flex items-start">
          <span class="mr-4 inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-base font-black text-white shadow-lg">
            忌
          </span>
          <div class="flex flex-1 flex-wrap gap-2">
            <span
              v-for="(item, index) in calendar.avoid"
              :key="index"
              class="cursor-default rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 吉凶神煞 -->
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-white p-3 dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          吉神
        </div>
        <div class="text-xs text-green-600 dark:text-green-400">
          {{ calendar.luckyGod }}
        </div>
      </div>
      <div class="rounded-xl bg-white p-3 dark:bg-gray-800">
        <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">
          凶神
        </div>
        <div class="text-xs text-red-600 dark:text-red-400">
          {{ calendar.badGod }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CalendarInfo {
  lunar: string;
  animal: string;
  month: string;
  day: string;
  element: string;
  conflict: string;
  suitable: string[];
  avoid: string[];
  luckyGod: string;
  badGod: string;
  luckyDirection: string;
  wealthDirection: string;
  blessDirection: string;
}

interface Props {
  calendar: CalendarInfo;
}

defineProps<Props>();
</script>

<style scoped>
.daily-calendar {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  60% {
    opacity: 1;
    transform: scale(1.05) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
