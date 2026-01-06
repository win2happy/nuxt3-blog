<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import { KnowledgeColorMap, KnowledgeIconMap, type KnowledgeItem, type KnowledgeTab, KnowledgeTabs, KnowledgeTabsList } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";

const currentTab = useRouteQuery("type");

const knowledgeList = await useListPage<KnowledgeItem>();

const githubToken = useGithubToken();
const encryptor = useEncryptor();

// 加密文章筛选器
const showEncryptedOnly = ref(false);

// 判断用户是否已认证（有token或密码正确）
const isAuthenticated = computed(() => !!githubToken.value || encryptor.passwdCorrect.value);

const isAll = computed(
  () => !(KnowledgeTabs as string[]).includes(currentTab.value)
);

const tabs = computed(() => [
  { name: "all", key: "", active: isAll.value },
  ...KnowledgeTabsList.map(item => ({ ...item, active: currentTab.value === item.key }))
]);

const filteredList = computed(() => {
  let items = (isAll.value ? knowledgeList : knowledgeList.filter(item => item.type === currentTab.value)).filter(i => !!i._show);

  // 如果开启了"仅显示加密"过滤器，只显示加密的文化
  if (showEncryptedOnly.value) {
    items = items.filter(i => i.encrypt || i.encryptBlocks);
  }

  return items;
});

const tabLengthMap = computed(() => {
  const map = new Map<string, number>();
  tabs.value.forEach((tab) => {
    map.set(tab.key, knowledgeList.filter(item => item._show && (!tab.key || item.type === tab.key)).length);
  });
  return map;
});

// 分页相关
const pageSize = usePageSize("knowledges-page-size", 10);
const currentPage = ref(1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredList.value.slice(start, end);
});

// 当筛选条件变化时，重置到第一页
watch(currentTab, () => {
  currentPage.value = 1;
});

// 当加密筛选器变化时，重置到第一页
watch(showEncryptedOnly, () => {
  currentPage.value = 1;
});
</script>

<template>
  <main class="container mx-auto grow px-4 py-8 max-md:px-2 max-md:py-4">
    <div class="mx-auto max-w-6xl">
      <div class="mb-8 border-b border-dark-200 dark:border-dark-700">
        <nav
          class="flex space-x-8 overflow-auto"
          aria-label="Tabs"
        >
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :class="twMerge(
              'flex break-keep items-center py-2 px-1 border-b-2 border-transparent font-semibold text-base text-dark-500 dark:text-dark-400',
              tab.active ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'hover:text-dark-700 dark:hover:text-dark-300 hover:border-dark-300 dark:hover:border-dark-600'
            )"
            :to="`?type=${tab.key}`"
          >
            <component
              :is="KnowledgeIconMap[tab.key as KnowledgeTab]"
              class="mr-1 size-4"
            />
            {{ $t(tab.name) }}
            <client-only>
              <span class="ml-1">{{ tabLengthMap.get(tab.key) }}</span>
            </client-only>
          </NuxtLink>
        </nav>
      </div>

      <!-- 加密筛选按钮 - 仅在已认证时显示 -->
      <div
        v-if="isAuthenticated"
        class="mb-8 flex justify-center"
      >
        <button
          :class="twMerge($style.filterButton, showEncryptedOnly && $style.filterButtonActive)"
          @click="showEncryptedOnly = !showEncryptedOnly"
        >
          🔒 {{ $t('show-encrypted-only') }}
        </button>
      </div>

      <div
        v-if="filteredList.length"
        class="space-y-8"
      >
        <NuxtLink
          v-for="item in paginatedList"
          :key="item.id"
          no-prefetch
          class="group flex items-center justify-between overflow-hidden rounded-2xl border border-transparent bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary-400 dark:bg-dark-800 dark:hover:border-primary-600"
          :to="`/knowledges/${item.customSlug || item.id}`"
        >
          <div class="flex items-center space-x-3 overflow-hidden">
            <div
              :class="twMerge(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                KnowledgeColorMap[item.type]
              )"
            >
              <component
                :is="KnowledgeIconMap[item.type]"
                class="size-6"
              />
            </div>
            <div class="space-y-2">
              <h3 class="title-text line-clamp-1 overflow-hidden text-ellipsis break-all transition group-hover:text-primary-700 dark:group-hover:text-primary-500">
                <span
                  v-if="item.encrypt || item.encryptBlocks"
                  class="mr-2 text-yellow-600 dark:text-yellow-500"
                  :title="$t('encrypted')"
                >🔒</span>
                {{ item.title }}
              </h3>
              <div class="mt-1 flex items-center">
                <span
                  :class="twMerge(
                    'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium',
                    KnowledgeColorMap[item.type]
                  )"
                >
                  {{ $t(item.type) }}
                </span>
                <span class="ml-2 text-sm text-dark-500 dark:text-dark-400">{{ formatTime(item.time, "date") }}</span>
              </div>
            </div>
          </div>
          <ChevronRight class="size-7 text-dark-400 transition group-hover:translate-x-1 group-hover:text-primary-500" />
        </NuxtLink>

        <!-- 分页组件 -->
        <common-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total-items="filteredList.length"
          :page-size-options="[5, 10, 20, 50, 100]"
          class="mt-8"
        />
      </div>

      <div
        v-else
        class="flex items-center justify-center pt-10 text-dark-600 dark:text-dark-400"
      >
        {{ $t('nothing-here') }}
      </div>
    </div>
  </main>
</template>

<style module>
.filterButton {
  @apply px-5 py-2 rounded-full font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 transition-all border-2 border-transparent;
}

.filterButtonActive {
  @apply !bg-yellow-500 !text-white dark:!bg-yellow-600 font-bold border-yellow-600 dark:border-yellow-500 shadow-lg;
}
</style>
