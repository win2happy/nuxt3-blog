<script setup lang="ts">
import { addScrollListener, rmScrollListener } from "~/utils/common/scroll-event";
import type { ArticleItem } from "~/utils/common/types";
import { useContentPage } from "~/utils/nuxt/public/detail";
import { Comments, Visitors, WroteDate } from "~/utils/nuxt/public/components";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";
import { initViewer } from "~/utils/nuxt/viewer";

const { originList, item, menuItems, htmlContent, markdownRef } = await useContentPage<ArticleItem>(() => {
  const hash = useRoute().hash;
  if (hash) {
    window.scrollTo({
      top: document
        .getElementById(hash.slice(1))
        ?.getBoundingClientRect().y
    });
  }
});
const relativeArticles = originList.filter(i => i.id !== item.id)
  .map<{ count: number; item: ArticleItem }>(i => ({ item: i, count: i.tags.filter(t => item.tags.includes(t)).length }))
  .filter(i => i && i.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

// 计算上一篇和下一篇文章
// 获取URL中的tag参数
const route = useRoute();
const tagParam = route.query.tag as string | undefined;
const selectedTags = tagParam ? tagParam.split(",") : [];

// 如果有标签筛选，则在该标签的文章列表中查找上一篇和下一篇
const filteredList = selectedTags.length > 0
  ? originList.filter(i => selectedTags.some(tag => i.tags.includes(tag)))
  : originList;

const currentIndex = filteredList.findIndex(i => i.id === item.id);
const prevArticle = currentIndex > 0 ? filteredList[currentIndex - 1] : null;
const nextArticle = currentIndex < filteredList.length - 1 ? filteredList[currentIndex + 1] : null;

useCommonSEOTitle(computed(() => item.title), computed(() => item.tags));
const activeAnchor = ref<string>();

const onScroll = () => {
  try {
    const links = Array.from(markdownRef.value!.querySelectorAll<HTMLLinkElement>("h1>a, h2>a, h3>a, h4>a, h5>a, h6>a")).reverse();
    for (const link of links) {
      if (link.getBoundingClientRect().y <= 52) {
        const hash = link.getAttribute("href");
        activeAnchor.value = menuItems.value.find(anchor => anchor.url === hash?.slice(1))?.url;
        return;
      }
    }
    // 未找到
    activeAnchor.value = menuItems.value[0]?.url;
  } catch { /* empty */ }
};

onMounted(() => {
  nextTick(() => {
    if (!useRoute().hash) {
      onScroll();
    }
    addScrollListener(onScroll);
  });
});

onBeforeUnmount(() => {
  rmScrollListener(onScroll);
});

const root = ref<HTMLElement>();
initViewer(root);
</script>

<template>
  <div
    ref="root"
    class="container mx-auto px-4 py-8 max-md:px-1 max-md:py-2"
  >
    <div class="flex w-full justify-center gap-6">
      <!-- <aside
        v-if="menuItems.length > 2"
        class="shrink-0 max-xl:hidden lg:w-52"
      >
        <div class="sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto p-4">
          <nav class="space-y-1 text-sm">
            <a
              v-for="(anchor, idx) in menuItems"
              :key="idx"
              :href="`#${anchor.url}`"
              :class="twMerge(
                $style.menuItem,
                anchor.size === 'small' && $style.menuItemSmall,
                activeAnchor === anchor.url && $style.menuItemActive
              )"
              :title="anchor.text"
            >
              <span v-html="anchor.text" />
            </a>
          </nav>
        </div>
      </aside> -->

      <main class="max-w-6xl flex-1 overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-dark-800 max-md:px-2">
        <h1 class="mb-4 text-2xl font-medium text-dark-900 dark:text-white">
          <span
            v-if="item.encrypt || item.encryptBlocks"
            class="mr-2 text-yellow-600 dark:text-yellow-500"
            :title="$t('encrypted')"
          >🔒</span>
          {{ item.title }}
        </h1>

        <!-- Partial encryption notice -->
        <div
          v-if="item.encryptBlocks && item.encryptBlocks.length > 0"
          class="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20"
        >
          <p class="text-sm text-yellow-800 dark:text-yellow-300">
            {{ $t('encrypted-partial-notice') }}
          </p>
        </div>

        <div class="mb-6 flex flex-wrap items-center gap-4 border-b border-dark-300 pb-3 text-sm text-dark-500 dark:border-dark-600 dark:text-dark-400">
          <WroteDate :item="item" />
          <Visitors :visitors="item._visitors" />
          <div class="flex flex-wrap gap-2">
            <the-tag
              v-for="tag in item.tags"
              :key="tag"
              :href="'/articles?tag=' + tag"
            >
              {{ tag }}
            </the-tag>
          </div>
        </div>

        <article
          ref="markdownRef"
          :class="twMerge('--markdown', 'mb-8 pb-8 border-b border-dark-200 dark:border-dark-700 max-w-full')"
          v-html="htmlContent"
        />

        <!-- 上一篇/下一篇导航 -->
        <nav
          v-if="prevArticle || nextArticle"
          class="my-8"
        >
          <div class="flex gap-4 max-md:flex-col">
            <NuxtLink
              v-if="prevArticle"
              :to="{ path: `/articles/${prevArticle.customSlug || prevArticle.id}`, query: tagParam ? { tag: tagParam } : {} }"
              :title="prevArticle.title"
              class="group flex-1 rounded-lg border border-dark-300 p-4 transition hover:border-primary-500 hover:shadow-md dark:border-dark-600 dark:hover:border-primary-400"
            >
              <div class="flex items-start gap-3">
                <div class="mt-1 shrink-0 text-2xl">←</div>
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-dark-500 dark:text-dark-400">{{ $t('prevArticle') }}</div>
                  <div class="line-clamp-2 text-sm font-medium text-dark-700 group-hover:text-primary-600 dark:text-dark-300 dark:group-hover:text-primary-400">
                    {{ prevArticle.title }}
                  </div>
                </div>
              </div>
            </NuxtLink>
            <div
              v-else
              class="flex-1"
            />
            <NuxtLink
              v-if="nextArticle"
              :to="{ path: `/articles/${nextArticle.customSlug || nextArticle.id}`, query: tagParam ? { tag: tagParam } : {} }"
              :title="nextArticle.title"
              class="group flex-1 rounded-lg border border-dark-300 p-4 transition hover:border-primary-500 hover:shadow-md dark:border-dark-600 dark:hover:border-primary-400"
            >
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1 text-right">
                  <div class="mb-1 text-xs text-dark-500 dark:text-dark-400">{{ $t('nextArticle') }}</div>
                  <div class="line-clamp-2 text-sm font-medium text-dark-700 group-hover:text-primary-600 dark:text-dark-300 dark:group-hover:text-primary-400">
                    {{ nextArticle.title }}
                  </div>
                </div>
                <div class="mt-1 shrink-0 text-2xl">→</div>
              </div>
            </NuxtLink>
            <div
              v-else
              class="flex-1"
            />
          </div>
        </nav>

        <aside
          v-if="relativeArticles.length"
          class="mt-8"
        >
          <div class="rounded-lg border border-dark-300 p-4 dark:border-dark-600">
            <h3 class="mb-4 text-lg font-medium text-dark-700 dark:text-dark-300">
              {{ $t('relativeArticles') }}
            </h3>
            <div class="max-h-40 space-y-4 overflow-auto">
              <NuxtLink
                v-for="{ item: i } in relativeArticles"
                :key="i.id"
                :to="{ path: `/articles/${i.customSlug || i.id}`, query: tagParam ? { tag: tagParam } : {} }"
                class="block rounded-md bg-dark-50 p-3 transition hover:bg-dark-100 dark:bg-dark-700 dark:hover:bg-dark-600"
              >
                <h4 class="text-sm font-medium text-dark-700 dark:text-dark-300">{{ i.title }}</h4>
              </NuxtLink>
            </div>
          </div>
        </aside>

        <Comments
          v-if="item.showComments"
          class="mt-8"
        />
      </main>
    </div>
  </div>
</template>

<style module>
.menuItem {
  @apply block py-2 px-3 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-md font-medium;
}

.menuItemActive {
  @apply text-primary-600 dark:text-primary-400;
}

.menuItemSmall {
  @apply py-1.5 px-3 pl-6 text-xs;
}
</style>
