<script setup lang="ts">
import { Eye, FileText, Hash, Tags, BookOpen } from "lucide-vue-next";
import type { DashboardOverview, ContentStatsJSON } from "~/utils/common/types";

defineProps<{
  overview: DashboardOverview;
  contentStats: ContentStatsJSON | null;
}>();
</script>

<template>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
    <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ overview.total.toLocaleString() }}
        </span>
        <Eye class="size-8 text-primary-500 opacity-60" />
      </div>
      <p class="mt-1 text-sm text-dark-500">
        {{ $t("total-visitors") }}
      </p>
      <div class="mt-1 flex gap-3 text-xs text-dark-400">
        <span>{{ $t("today") }}: {{ overview.today.toLocaleString() }}</span>
        <span>{{ $t("week") }}: {{ overview.thisWeek.toLocaleString() }}</span>
      </div>
    </div>

    <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ contentStats?.totalArticles ?? "-" }}
        </span>
        <FileText class="size-8 text-blue-500 opacity-60" />
      </div>
      <p class="mt-1 text-sm text-dark-500">
        {{ $t("articles") }}
      </p>
      <div
        v-if="contentStats"
        class="mt-1 flex gap-3 text-xs text-dark-400"
      >
        <span>{{ $t("records") }}/{{ $t("knowledges") }}: {{ contentStats.totalRecords }}/{{ contentStats.totalKnowledges }}</span>
      </div>
    </div>

    <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ contentStats ? contentStats.totalWords.toLocaleString() : "-" }}
        </span>
        <Hash class="size-8 text-emerald-500 opacity-60" />
      </div>
      <p class="mt-1 text-sm text-dark-500">
        {{ $t("total-words") }}
      </p>
      <p class="mt-1 text-xs text-dark-400">
        {{ $t("avg-words") }}: {{ contentStats?.avgWordsPerArticle ?? "-" }}
      </p>
    </div>

    <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ contentStats?.tagsCount ?? "-" }}
        </span>
        <Tags class="size-8 text-purple-500 opacity-60" />
      </div>
      <p class="mt-1 text-sm text-dark-500">
        {{ $t("tags-count") }}
      </p>
      <div
        v-if="contentStats"
        class="mt-1 flex gap-3 text-xs text-dark-400"
      >
        <span>{{ $t("pinned") }}: {{ contentStats.articlesPinned }}</span>
        <span>{{ $t("encrypted") }}: {{ contentStats.articlesEncrypted }}</span>
      </div>
    </div>

    <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ overview.articleCount }}
        </span>
        <BookOpen class="size-8 text-amber-500 opacity-60" />
      </div>
      <p class="mt-1 text-sm text-dark-500">
        {{ $t("tracked-articles") }}
      </p>
      <p class="mt-1 text-xs text-dark-400">
        {{ $t("avg-visitors") }}: {{ overview.total > 0 ? Math.round(overview.total / Math.max(overview.articleCount, 1)).toLocaleString() : "-" }}
      </p>
    </div>
  </div>
</template>
