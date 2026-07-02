<script setup lang="ts">
import { Eye, FileText, Image, BookOpen } from "lucide-vue-next";
import { fetchList } from "~/utils/nuxt/fetch";

defineProps<{
  articles: { ntype: string; nid: number; visitors: number }[];
}>();

const typeIcon: Record<string, any> = {
  "/articles": FileText,
  "/records": Image,
  "/knowledges": BookOpen
};

type TitleMap = Record<string, string>;
const titleMap = ref<TitleMap>({});
let unmounted = false;

function getItemTitle(item: any, _type: string) {
  return item.title || item.images?.map((img: any) => img.alt).filter(Boolean).join(", ") || `#${item.id}`;
}

async function loadTitles() {
  const map: TitleMap = {};
  const types = ["/articles", "/records", "/knowledges"] as const;
  const results = await Promise.allSettled(types.map(t => fetchList<any>(t)));
  for (let i = 0; i < types.length; i++) {
    if (results[i].status === "fulfilled") {
      for (const item of results[i].value) {
        map[`${types[i]}:${item.id}`] = getItemTitle(item, types[i]);
      }
    }
  }
  if (!unmounted) {
    titleMap.value = map;
  }
}

onMounted(loadTitles);
onUnmounted(() => {
  unmounted = true;
});

function getTitle(a: { ntype: string; nid: number }) {
  return titleMap.value[`${a.ntype}:${a.nid}`] || `#${a.nid}`;
}
</script>

<template>
  <div class="rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
    <h3 class="mb-4 text-sm font-semibold text-dark-700 dark:text-dark-300">
      {{ $t("top-articles") }}
    </h3>
    <div
      v-if="articles.length === 0"
      class="py-8 text-center text-sm text-dark-400"
    >
      {{ $t("no-data") }}
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="(a, i) in articles.slice(0, 10)"
        :key="`${a.ntype}:${a.nid}`"
        class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700"
      >
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :class="i < 3 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'bg-dark-100 text-dark-500 dark:bg-dark-700 dark:text-dark-400'"
        >
          {{ i + 1 }}
        </span>
        <span class="flex size-6 shrink-0 items-center justify-center">
          <component
            :is="typeIcon[a.ntype] || FileText"
            class="size-4 text-dark-400"
          />
        </span>
        <a
          :href="`${a.ntype}/${a.nid}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 truncate text-sm text-dark-700 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400"
        >
          {{ getTitle(a) }}
        </a>
        <span class="flex shrink-0 items-center gap-1 text-sm text-dark-500">
          <Eye class="size-3.5" />
          {{ a.visitors.toLocaleString() }}
        </span>
      </div>
    </div>
  </div>
</template>
