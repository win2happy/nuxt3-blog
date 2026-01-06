<script setup lang="ts">
import type { ArticleItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { Visitors, Words } from "~/utils/nuxt/public/components";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";
import { fetchMd } from "~/utils/nuxt/fetch";
import { extractArticlePreview } from "~/utils/common/extract-preview";

definePageMeta({
  alias: "/"
});

const tags = useRouteQuery("tag", (tags) => {
  try {
    return tags ? tags.split(",") : [];
  } catch {
    return [];
  }
});

const articlesList = await useListPage<ArticleItem>();

const githubToken = useGithubToken();
const encryptor = useEncryptor();

// 加密文章筛选器
const showEncryptedOnly = ref(false);

// 判断用户是否已认证（有token或密码正确）
const isAuthenticated = computed(() => !!githubToken.value || encryptor.passwdCorrect.value);

// 存储文章预览信息的响应式对象
const articlePreviews = reactive<Record<number, { excerpt: string; coverImage: string }>>({});

const articleTagList = new Map<string, number>();

watch(articlesList, () => {
  articleTagList.clear();
  articlesList.forEach((item) => {
    item.tags.forEach(v => articleTagList.set(v, (articleTagList.get(v) || 0) + 1));
  });
}, { immediate: true });

const filteredList = computed(() => {
  let items = articlesList.filter(item =>
    !tags.value.length || tags.value.some(tag => item.tags.includes(tag))
  );

  // 如果开启了"仅显示加密"过滤器，只显示加密的文章
  if (showEncryptedOnly.value) {
    items = items.filter(i => i.encrypt || i.encryptBlocks);
  }

  return items;
});

const toggleTags = (tag: string) => {
  const newTags = tags.value.slice();
  const searchIdx = newTags.indexOf(tag);
  if (searchIdx > -1) {
    newTags.splice(searchIdx, 1);
  } else {
    newTags.push(tag);
  }
  navigateTo({ query: { tag: newTags.join(",") } }, { replace: true });
};

// 分页相关
const pageSize = usePageSize("articles-page-size", 10);
const currentPage = ref(1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredList.value.slice(start, end);
});

// 当筛选条件变化时，重置到第一页
watch(tags, () => {
  currentPage.value = 1;
});

// 当加密筛选器变化时，重置到第一页
watch(showEncryptedOnly, () => {
  currentPage.value = 1;
});

// 已加载预览的文章ID集合
const loadedPreviews = new Set<number>();

// 加载文章预览信息（摘要和封面图片）
const loadArticlePreviews = async () => {
  const itemsToLoad = paginatedList.value.filter(
    item => !loadedPreviews.has(item.id) && !articlePreviews[item.id]
  );

  if (itemsToLoad.length === 0) return;

  // 使用 Promise.all 并行加载
  await Promise.all(
    itemsToLoad.map(async (item) => {
      try {
        const md = await fetchMd("/articles", String(item.customSlug || item.id));
        const preview = extractArticlePreview(md);

        // 存储到响应式对象中
        articlePreviews[item.id] = preview;
        loadedPreviews.add(item.id);
      } catch (error) {
        console.error(`Failed to load preview for article ${item.id}:`, error);
        // 即使失败也标记为已加载，避免重复请求
        articlePreviews[item.id] = { excerpt: "", coverImage: "" };
        loadedPreviews.add(item.id);
      }
    })
  );
};

// 监听分页列表变化，加载预览信息
watch(paginatedList, loadArticlePreviews, { immediate: true });
</script>

<template>
  <main class="relative mx-auto max-w-7xl grow px-4 py-8 max-md:px-3">
    <div class="relative mx-auto max-w-7xl space-y-10">
      <section
        v-if="articleTagList.size"
        class="rounded-3xl border border-transparent bg-white/70 p-6 shadow-card ring-1 ring-dark-100/70 backdrop-blur-md transition dark:bg-dark-900/50 dark:ring-dark-700"
      >
        <header class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-sm font-medium text-dark-700 dark:text-dark-200 max-md:text-xs">
            {{ $t('tags') }}
          </h2>
          <span class="text-[13px] text-dark-400 dark:text-dark-400">{{ filteredList.length }} {{ $t('articles-num') }}</span>
        </header>
        <div class="flex flex-wrap gap-2">
          <the-tag
            v-for="[tag, count] in articleTagList"
            :key="tag"
            :num="count"
            :active="tags.includes(tag)"
            @click="toggleTags(tag)"
          >
            {{ tag }}
          </the-tag>
        </div>
      </section>

      <!-- 加密筛选按钮 - 仅在已认证时显示 -->
      <section
        v-if="isAuthenticated"
        class="flex justify-center"
      >
        <button
          :class="twMerge($style.filterButton, showEncryptedOnly && $style.filterButtonActive)"
          @click="showEncryptedOnly = !showEncryptedOnly"
        >
          🔒 {{ $t('show-encrypted-only') }}
        </button>
      </section>

      <section
        v-if="filteredList.length"
        class="space-y-6"
      >
        <article
          v-for="item in paginatedList"
          v-show="item._show"
          :key="item.id"
          class="group relative overflow-hidden rounded-3xl border border-dark-100/70 bg-white/80 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:bg-white dark:border-dark-700 dark:bg-dark-900/60 dark:hover:border-primary-500"
        >
          <NuxtLink
            :to="{ path: `/articles/${item.customSlug || item.id}`, query: tags.length > 0 ? { tag: tags.join(',') } : {} }"
            no-prefetch
            class="flex flex-col gap-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <h3 class="title-text max-w-xl transition group-hover:text-primary-600 dark:group-hover:text-primary-400">
                <span
                  v-if="item.encrypt || item.encryptBlocks"
                  class="mr-2 text-yellow-600 dark:text-yellow-500"
                  :title="$t('encrypted')"
                >🔒</span>
                {{ item.title }}
              </h3>
              <span
                class="text-sm text-dark-400 transition group-hover:text-primary-500 dark:text-dark-400 dark:group-hover:text-primary-300"
                :title="formatTime(item.time)"
              >
                {{ formatTime(item.time, "date") }}
              </span>
            </div>

            <!-- 文章预览：左侧封面图片，右侧摘要文本 -->
            <div
              v-if="articlePreviews[item.id]?.coverImage || articlePreviews[item.id]?.excerpt"
              class="flex flex-col gap-4 sm:flex-row"
            >
              <!-- 封面图片 -->
              <div
                v-if="articlePreviews[item.id]?.coverImage"
                class="shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  :src="articlePreviews[item.id]!.coverImage"
                  :alt="item.title"
                  class="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-48"
                  loading="lazy"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                >
              </div>

              <!-- 摘要文本 -->
              <div
                v-if="articlePreviews[item.id]?.excerpt"
                class="flex-1 overflow-hidden"
              >
                <p class="line-clamp-3 text-sm leading-relaxed text-dark-600 dark:text-dark-300 sm:line-clamp-4">
                  {{ articlePreviews[item.id]!.excerpt }}
                </p>
              </div>
            </div>

            <div
              v-if="item.tags.length"
              class="flex flex-wrap gap-2"
            >
              <span
                v-for="innerTag in item.tags"
                :key="innerTag"
                class="rounded-full border border-dark-100/80 px-3 py-1 text-[12px] text-dark-500 transition group-hover:border-primary-200 group-hover:text-primary-600 dark:border-dark-700 dark:text-dark-300 dark:group-hover:border-primary-400"
              >
                {{ innerTag }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-[13px] text-dark-500 dark:text-dark-300">
              <Words :len="item.len" />
              <Visitors :visitors="item._visitors" />
            </div>
          </NuxtLink>
        </article>

        <!-- 分页组件 -->
        <common-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total-items="filteredList.length"
          class="mt-8"
        />
      </section>

      <section
        v-else
        class="flex items-center justify-center rounded-3xl border border-dashed border-dark-100/80 py-20 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300"
      >
        {{ $t('nothing-here') }}
      </section>
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
