<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-vue-next";

interface Props {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  pageSizeOptions: () => [5, 10, 20, 50, 100],
  showPageSizeSelector: true
});

const emit = defineEmits<{
  (e: "update:currentPage" | "update:pageSize", value: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

// 页码跳转输入
const jumpPageInput = ref("");

// 计算显示的页码范围
// 规则：始终显示第一页和最后一页，当前页的前后各一页，其他用省略号
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const current = props.currentPage;
  const total = totalPages.value;

  // 调试信息
  // console.log(`分页调试 - 当前页: ${current}, 总页数: ${total}`);

  // 如果总页数小于等于7，显示所有页码（1 ... 前 当前 后 ... 尾）
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    // console.log('总页数≤7，显示所有页码:', pages);
    return pages;
  }

  // 始终显示第一页
  pages.push(1);

  // 计算需要显示的范围：当前页的前后各一页
  const showStart = current - 1; // 当前页的前一页
  const showEnd = current + 1; // 当前页的后一页

  // 判断是否需要在第一页后添加省略号
  if (showStart > 2) {
    pages.push("...");
  }

  // 添加当前页附近的页码
  for (let i = Math.max(2, showStart); i <= Math.min(total - 1, showEnd); i++) {
    pages.push(i);
  }

  // 判断是否需要在最后一页前添加省略号
  if (showEnd < total - 1) {
    pages.push("...");
  }

  // 始终显示最后一页
  pages.push(total);

  // console.log('优化后的页码显示:', pages);
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

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPageInput.value, 10);
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    goToPage(page);
    jumpPageInput.value = "";
  }
};

// 处理输入框回车
const handleJumpKeypress = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    handleJumpPage();
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
      <span class="whitespace-nowrap">{{ $t('items-per-page') }}:</span>
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
      <span class="text-dark-500 dark:text-dark-400 max-sm:hidden">
        {{ $t('total-items', [totalItems]) }}
      </span>
    </div>

    <!-- 分页导航 -->
    <nav
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <!-- 首页 -->
      <button
        :disabled="currentPage === 1"
        :class="[
          'flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition',
          currentPage === 1
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        :title="$t('first-page')"
        @click="goToPage(1)"
      >
        <ChevronsLeft class="size-4" />
      </button>

      <!-- 上一页 -->
      <button
        :disabled="currentPage === 1"
        :class="[
          'flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition',
          currentPage === 1
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        :title="$t('prev')"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft class="size-4" />
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
          'flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition',
          currentPage === totalPages
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        :title="$t('next')"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRight class="size-4" />
      </button>

      <!-- 尾页 -->
      <button
        :disabled="currentPage === totalPages"
        :class="[
          'flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition',
          currentPage === totalPages
            ? 'cursor-not-allowed text-dark-300 dark:text-dark-600'
            : 'dark:hover:bg-primary-900/20 text-dark-600 hover:bg-primary-50 hover:text-primary-600 dark:text-dark-300 dark:hover:text-primary-400'
        ]"
        :title="$t('last-page')"
        @click="goToPage(totalPages)"
      >
        <ChevronsRight class="size-4" />
      </button>

      <!-- 页码跳转 - 移动端隐藏 -->
      <div class="ml-2 hidden items-center gap-2 sm:flex">
        <span class="whitespace-nowrap text-sm text-dark-600 dark:text-dark-300">{{ $t('go-to') }}</span>
        <input
          v-model="jumpPageInput"
          type="number"
          :min="1"
          :max="totalPages"
          :placeholder="String(currentPage)"
          class="focus:ring-primary-500/20 w-16 rounded-lg border border-dark-300 bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 dark:border-dark-600 dark:bg-dark-800 dark:focus:border-primary-400"
          @keypress="handleJumpKeypress"
        >
        <button
          class="whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          @click="handleJumpPage"
        >
          {{ $t('go') }}
        </button>
      </div>
    </nav>
  </div>
</template>
