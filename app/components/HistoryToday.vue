<template>
  <div
    id="history-today"
    class="history-today rounded-3xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/90"
  >
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 p-3 shadow-lg">
          <span class="text-3xl">📅</span>
        </div>
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white">
            历史上的今天
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            History Today
          </p>
        </div>
      </div>
    </div>

    <!-- 时间轴样式的历史事件 -->
    <div class="space-y-4 pr-2">
      <div
        v-for="(event, index) in events"
        :key="index"
        class="history-item group flex cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
        @click="handleEventClick(event.link)"
      >
        <!-- 时间轴线 -->
        <div class="mr-5 flex flex-col items-center">
          <div class="size-4 rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-lg ring-4 ring-green-100 transition-all duration-300 group-hover:scale-125 group-hover:from-green-600 group-hover:to-teal-700 dark:ring-green-900/30" />
          <div
            v-if="index < events.length - 1"
            class="mt-2 w-0.5 flex-1 bg-gradient-to-b from-green-400 via-teal-400 to-green-200 dark:from-green-600 dark:via-teal-600 dark:to-green-800"
          />
        </div>

        <!-- 内容 -->
        <div class="flex-1 pb-6">
          <!-- 年份标签 -->
          <div class="mb-3 inline-block rounded-full bg-gradient-to-r from-green-100 to-teal-100 px-4 py-1.5 shadow-sm transition-all duration-300 group-hover:from-green-200 group-hover:to-teal-200 dark:from-green-900 dark:to-teal-900 dark:group-hover:from-green-800 dark:group-hover:to-teal-800">
            <span class="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-sm font-bold text-transparent dark:from-green-300 dark:to-teal-300">
              {{ event.year }}年
            </span>
          </div>

          <!-- 事件描述 -->
          <p class="text-[15px] leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
            {{ event.event }}
          </p>

          <!-- 分类标签（可选） -->
          <div
            v-if="event.category"
            class="mt-2"
          >
            <span class="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {{ event.category }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface HistoryEvent {
  year: number;
  event: string;
  link: string;
  category?: string;
}

interface Props {
  events: HistoryEvent[];
}

defineProps<Props>();

const handleEventClick = (link: string) => {
  if (link && link !== "#") {
    window.open(link, "_blank");
  }
};
</script>

<style scoped>
.history-item {
  animation: fadeInRight 0.5s ease-out backwards;
  animation-delay: calc(var(--item-index, 0) * 0.05s);
}

.history-item:nth-child(1) { --item-index: 0; }
.history-item:nth-child(2) { --item-index: 1; }
.history-item:nth-child(3) { --item-index: 2; }
.history-item:nth-child(4) { --item-index: 3; }
.history-item:nth-child(5) { --item-index: 4; }
.history-item:nth-child(6) { --item-index: 5; }
.history-item:nth-child(7) { --item-index: 6; }
.history-item:nth-child(8) { --item-index: 7; }
.history-item:nth-child(9) { --item-index: 8; }
.history-item:nth-child(10) { --item-index: 9; }
.history-item:nth-child(11) { --item-index: 10; }
.history-item:nth-child(12) { --item-index: 11; }

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #10b981, #14b8a6);
  border-radius: 10px;
  transition: background 0.3s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #059669, #0d9488);
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #059669, #0d9488);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #10b981, #14b8a6);
}
</style>
