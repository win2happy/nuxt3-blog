<script setup lang="ts">
import type { ContentStatsJSON } from "~/utils/common/types";

const props = defineProps<{
  contentStats: ContentStatsJSON;
}>();

const maxTag = computed(() => Math.max(...props.contentStats.tagDistribution.map(t => t.count), 1));
</script>

<template>
  <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
    <h3 class="mb-4 text-sm font-semibold text-dark-700 dark:text-dark-300">
      {{ $t("content-stats") }}
    </h3>

    <div class="mb-4 space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-dark-600 dark:text-dark-400">{{ $t("publish-trend") }}</span>
      </div>
      <div
        v-for="m in contentStats.publishByMonth.slice(-6)"
        :key="m.label"
        class="flex items-center gap-2"
      >
        <span class="w-14 shrink-0 text-xs text-dark-400">{{ m.label }}</span>
        <div class="flex-1">
          <div
            class="dark:bg-primary-900/40 h-5 rounded bg-primary-200"
            :style="{ width: `${Math.max((m.count / Math.max(...contentStats.publishByMonth.map(x => x.count), 1)) * 100, 5)}%` }"
          >
            <span class="ml-1.5 text-xs leading-5 text-dark-700 dark:text-dark-300">{{ m.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-dark-600 dark:text-dark-400">{{ $t("tag-distribution") }}</span>
      </div>
      <div
        v-for="t in contentStats.tagDistribution.slice(0, 8)"
        :key="t.tag"
        class="flex items-center gap-2"
      >
        <span class="w-20 truncate text-xs text-dark-500">{{ t.tag }}</span>
        <div class="flex-1">
          <div
            class="h-5 rounded bg-purple-300 dark:bg-purple-800"
            :style="{ width: `${(t.count / maxTag) * 100}%` }"
          >
            <span class="ml-1.5 text-xs leading-5 text-white">{{ t.count }} ({{ t.percentage }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
