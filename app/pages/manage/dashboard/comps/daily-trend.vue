<script setup lang="ts">
const props = defineProps<{
  daily: { label: string; count: number }[];
}>();

const maxCount = computed(() => Math.max(...props.daily.map(d => d.count), 1));
</script>

<template>
  <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
    <h3 class="mb-4 text-sm font-semibold text-dark-700 dark:text-dark-300">
      {{ $t("daily-trend") }}
    </h3>
    <div
      v-if="daily.length === 0"
      class="flex items-center justify-center text-sm text-dark-400"
      style="height: 160px"
    >
      {{ $t("no-data") }}
    </div>
    <div
      v-else
      class="flex items-end gap-1"
      style="height: 160px"
    >
      <div
        v-for="d in daily"
        :key="d.label"
        class="group relative flex flex-1 flex-col items-center justify-end"
      >
        <div
          class="w-full rounded-t bg-primary-400 transition-all hover:bg-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500"
          :style="{ height: `${(d.count / maxCount) * 140}px`, minHeight: d.count > 0 ? '2px' : '0' }"
        >
          <div
            class="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-dark-800 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dark-200 dark:text-dark-800"
          >
            {{ d.count }}
          </div>
        </div>
        <span class="mt-1 text-[10px] text-dark-400">{{ d.label }}</span>
      </div>
    </div>
  </div>
</template>
