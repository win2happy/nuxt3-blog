<script setup lang="ts">
const props = defineProps<{
  monthly: { label: string; count: number }[];
}>();

const maxCount = computed(() => Math.max(...props.monthly.map(m => m.count), 1));
</script>

<template>
  <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
    <h3 class="mb-4 text-sm font-semibold text-dark-700 dark:text-dark-300">
      {{ $t("monthly-visitors") }}
    </h3>
    <div
      v-if="monthly.length === 0"
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
        v-for="m in monthly"
        :key="m.label"
        class="group relative flex flex-1 flex-col items-center justify-end"
      >
        <div
          class="w-full rounded-t bg-emerald-400 transition-all hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          :style="{ height: `${(m.count / maxCount) * 140}px`, minHeight: m.count > 0 ? '2px' : '0' }"
        >
          <div
            class="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-dark-800 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dark-200 dark:text-dark-800"
          >
            {{ m.count }}
          </div>
        </div>
        <span class="mt-1 text-[10px] text-dark-400">{{ m.label }}</span>
      </div>
    </div>
  </div>
</template>
