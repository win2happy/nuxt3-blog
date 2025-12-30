<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

interface Props {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 30, 50, 100],
  showPageSizeSelector: true
});

const emit = defineEmits<{
  (e: "update:currentPage" | "update:pageSize", value: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

// 计算显示的页码范围
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const current = props.currentPage;
  const total = totalPages.value;

  if (total <= 7) {
    // 总页数少于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // 总页数大于7，显示省略号
    if (current <= 3) {
      // 当前页在前面
      pages.push(1, 2, 3, 4, "...", total);
    } else if (current >= total - 2) {
      // 当前页在后面
      pages.push(1, "...", total - 3, total - 2, total - 1, total);
    } else {
      // 当前页在中间
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
  }

  return pages;
});

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) {
    return;
  }
  emit("update:currentPage", page);
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const changePageSize = (newSize: number) => {
  emit("update:pageSize", newSize);
  // 调整当前页码，确保不超出范围
  const newTotalPages = Math.ceil(props.totalItems / newSize);
  if (props.currentPage > newTotalPages) {
    emit("update:currentPage", Math.max(1, newTotalPages));
  }
};
</script>

<template>
  <div
    v-if="totalPages > 1 || showPageSizeSelector"
    class="flex flex-col items-center gap-4 md:flex-row md:justify-between"
  >
    <!-- 每页数量选择器 -->
    <div
      v-if="showPageSizeSelector"
      class="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300"
    >
      <span>{{ $t('items-per-page') }}:</span>
      <select
        :value="pageSize"
        class="focus:ring-primary-500/20 rounded-lg border border-dark-300 bg-white px-3 py-1.5 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 dark:border-dark-600 dark:bg-dark-800 dark:focus:border-primary-400"
        @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
      >
        <option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>
      <span class="text-dark-500 dark:text-dark-400">
        {{ $t('total-items', [totalItems]) }}
      </span>
    </div>

    <!-- 分页导航 -->
    <nav
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <!-- 上一页 -->
      <button
        :disabled="currentPage === 1"
        :class="[
          'flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition',
          currentPage === 1
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft class="size-4" />
        <span class="ml-1 max-md:hidden">{{ $t('prev') }}</span>
      </button>

      <!-- 页码 -->
      <div class="flex gap-1">
        <button
          v-for="(page, index) in visiblePages"
          :key="index"
          :disabled="page === '...'"
          :class="[
            'flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm font-medium transition',
            page === '...'
              ? 'cursor-default text-dark-400 dark:text-dark-500'
              : page === currentPage
                ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
          ]"
          @click="typeof page === 'number' && goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- 下一页 -->
      <button
        :disabled="currentPage === totalPages"
        :class="[
          'flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition',
          currentPage === totalPages
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        @click="goToPage(currentPage + 1)"
      >
        <span class="mr-1 max-md:hidden">{{ $t('next') }}</span>
        <ChevronRight class="size-4" />
      </button>
    </nav>
  </div>
</template>
