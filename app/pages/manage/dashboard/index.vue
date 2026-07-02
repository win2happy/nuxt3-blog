<script setup lang="ts">
import { RefreshCw, TrendingUp } from "lucide-vue-next";
import OverviewCards from "./comps/overview-cards.vue";
import DailyTrend from "./comps/daily-trend.vue";
import MonthlyBreakdown from "./comps/monthly-breakdown.vue";
import TopArticles from "./comps/top-articles.vue";
import PerArticleStats from "./comps/per-article-stats.vue";
import ContentStats from "./comps/content-stats.vue";
import type { DashboardOverview, ContentStatsJSON } from "~/utils/common/types";
import { fetchAny } from "~/utils/nuxt/fetch";

const loading = ref(true);
const overview = ref<DashboardOverview | null>(null);
const contentStats = ref<ContentStatsJSON | null>(null);
const error = ref("");

async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const [overviewRes, contentStatsRes] = await Promise.all([
      $fetch<DashboardOverview>("/api/db/stats/overview", {
        headers: { "Cache-Control": "no-cache" }
      }),
      fetchAny<ContentStatsJSON>("public/rebuild/json/stats.json").catch(() => null)
    ]);
    overview.value = overviewRes;
    contentStats.value = contentStatsRes;
  } catch (e: any) {
    error.value = e?.message || "Failed to load stats";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <main class="p-4 max-md:px-2">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-xl font-bold text-dark-800 dark:text-dark-200">
        <TrendingUp class="size-6" />
        {{ $t("dashboard") }}
      </h1>
      <button
        class="icon-button"
        :title="$t('refresh')"
        :disabled="loading"
        @click="loadData"
      >
        <RefreshCw :class="loading ? 'animate-spin' : ''" />
      </button>
    </div>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="i in 5"
          :key="i"
          class="h-24 animate-pulse rounded-lg bg-dark-100 dark:bg-dark-700"
        />
      </div>
      <div class="h-64 animate-pulse rounded-lg bg-dark-100 dark:bg-dark-700" />
    </div>

    <div
      v-else-if="error"
      class="flex min-h-[40vh] items-center justify-center"
    >
      <div class="text-center">
        <p class="mb-4 text-lg text-red-500">
          {{ error }}
        </p>
        <button
          class="rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
          @click="loadData"
        >
          {{ $t("click-to-retry") }}
        </button>
      </div>
    </div>

    <template v-else>
      <OverviewCards
        :overview="overview!"
        :content-stats="contentStats"
      />

      <div class="mt-6 space-y-6">
        <DailyTrend :daily="overview!.daily" />
        <MonthlyBreakdown :monthly="overview!.monthly" />
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopArticles :articles="overview!.topArticles" />
        <ContentStats
          v-if="contentStats"
          :content-stats="contentStats"
        />
      </div>

      <PerArticleStats class="mt-6" />
    </template>
  </main>
</template>

<style scoped>
.icon-button {
  @apply flex items-center justify-center rounded-lg p-2 text-dark-500 transition-colors hover:bg-dark-100 hover:text-primary-600 dark:text-dark-300 dark:hover:bg-dark-700 dark:hover:text-primary-400;
}
</style>
