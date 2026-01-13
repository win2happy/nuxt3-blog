<template>
  <div
    id="daily-quote"
    class="daily-quote rounded-3xl border-2 border-purple-200/50 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 p-8 shadow-xl transition-all hover:shadow-2xl dark:border-purple-800/50 dark:from-purple-950 dark:via-pink-950 dark:to-rose-950"
  >
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-3 shadow-lg">
          <span class="text-3xl">💬</span>
        </div>
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white">
            每日一语
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Daily Quote
          </p>
        </div>
      </div>
    </div>

    <div class="relative overflow-hidden rounded-2xl border border-purple-200/30 bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:border-purple-800/30 dark:bg-gray-800/80">
      <!-- 装饰引号 -->
      <div class="absolute left-4 top-4 font-serif text-7xl leading-none text-purple-200 opacity-30 dark:text-purple-800">
        “
      </div>
      <div class="absolute bottom-4 right-4 font-serif text-7xl leading-none text-purple-200 opacity-30 dark:text-purple-800">
        "
      </div>

      <!-- 引语内容 -->
      <div class="relative z-10">
        <p class="text-center text-lg font-medium italic leading-relaxed text-gray-800 dark:text-gray-200 md:text-xl">
          {{ quote.text }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Quote {
  text: string;
  author: string;
}

interface Props {
  quote: Quote;
}

defineProps<Props>();
</script>

<style scoped>
.daily-quote {
  animation: fadeInScale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.85) rotate(-2deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
</style>
