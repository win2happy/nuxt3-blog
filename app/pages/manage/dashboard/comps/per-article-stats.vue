<script setup lang="ts">
import { Search, Eye } from "lucide-vue-next";
import type { HeaderTabUrl } from "~/utils/common/types";
import { formatTime } from "~/utils/nuxt/format-time";
import { fetchList } from "~/utils/nuxt/fetch";

const tabs: { key: HeaderTabUrl; label: string }[] = [
  { key: "/articles", label: "articles" },
  { key: "/records", label: "records" },
  { key: "/knowledges", label: "knowledges" }
];

const activeTab = ref<HeaderTabUrl>("/articles");
const searchStr = ref("");
const visitorMap = ref<Map<string, number>>(new Map());

async function loadVisitorMap() {
  try {
    const data = await $fetch<{ ntype: string; nid: number; visitors: number }[]>("/api/db/stats/visitors-total", {
      params: { type: activeTab.value }
    });
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(`${d.ntype}:${d.nid}`, d.visitors);
    }
    visitorMap.value = map;
  } catch {
    visitorMap.value = new Map();
  }
}

const itemList = ref<any[]>([]);
const loadingList = ref(false);

async function loadItems() {
  loadingList.value = true;
  try {
    itemList.value = await fetchList(activeTab.value);
  } catch {
    itemList.value = [];
  } finally {
    loadingList.value = false;
  }
}

const combinedLoading = computed(() => loadingList.value);

const filteredList = computed(() => {
  let items = itemList.value;
  if (searchStr.value) {
    const s = searchStr.value.toLowerCase();
    items = items.filter((item: any) => {
      const title = item.title || item.images?.map((img: any) => img.alt).join(" ") || "";
      return title.toLowerCase().includes(s);
    });
  }
  return items.map((item: any) => ({
    ...item,
    _visitors: visitorMap.value.get(`${activeTab.value}:${item.id}`) || 0
  })).sort((a: any, b: any) => b._visitors - a._visitors).slice(0, 50);
});

watch(activeTab, () => {
  loadVisitorMap();
  loadItems();
});

onMounted(() => {
  loadVisitorMap();
  loadItems();
});
</script>

<template>
  <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
    <h3 class="mb-4 text-sm font-semibold text-dark-700 dark:text-dark-300">
      {{ $t("per-article-stats") }}
    </h3>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
            : 'text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-700'"
          @click="activeTab = tab.key"
        >
          {{ $t(tab.label) }}
        </button>
      </div>
      <div class="relative ml-auto">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-dark-400" />
        <input
          v-model="searchStr"
          class="w-48 rounded-md border border-dark-300 bg-transparent py-1.5 pl-8 pr-3 text-xs dark:border-dark-600"
          :placeholder="$t('input-text-to-search')"
        >
      </div>
    </div>

    <div
      v-if="combinedLoading"
      class="flex items-center justify-center py-8"
    >
      <span class="text-sm text-dark-400">{{ $t("loading") }}...</span>
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="min-w-full divide-y divide-dark-200 dark:divide-dark-700">
        <thead>
          <tr>
            <th class="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400">
              #
            </th>
            <th class="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400">
              {{ $t("title") }}
            </th>
            <th class="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-dark-500 dark:text-dark-400">
              <span class="inline-flex items-center gap-1">
                <Eye class="size-3.5" />
                {{ $t("visitors") }}
              </span>
            </th>
            <th class="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-dark-500 dark:text-dark-400">
              {{ $t("date") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-100 dark:divide-dark-700">
          <tr
            v-for="(item, i) in filteredList"
            :key="item.id"
            class="transition-colors hover:bg-dark-50 dark:hover:bg-dark-700/50"
          >
            <td class="whitespace-nowrap px-3 py-2 text-xs text-dark-400">
              {{ i + 1 }}
            </td>
            <td class="max-w-xs truncate px-3 py-2 text-sm text-dark-700 dark:text-dark-300">
              <a
                :href="`${activeTab}/${item.customSlug || item.id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary-600 dark:hover:text-primary-400"
              >
                {{ item.title || item.images?.map((img: any) => img.alt).join(", ") || "#" + item.id }}
              </a>
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-sm text-dark-600 dark:text-dark-400">
              {{ item._visitors.toLocaleString() }}
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-right text-xs text-dark-400">
              {{ formatTime(item.time, "date") }}
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td
              colspan="4"
              class="py-8 text-center text-sm text-dark-400"
            >
              {{ $t("no-data") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
