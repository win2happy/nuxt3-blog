<script setup lang="ts">
import { markdownShortcuts, shortcutCategories, type MarkdownShortcut } from "~/utils/manage/markdown-shortcuts";

const props = defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: "update:show", val: boolean): void;
  (e: "select", shortcut: MarkdownShortcut): void;
}>();

const searchQuery = ref("");
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement>();
const menuHeight = 400;
const menuWidth = 320;

const adjustedX = computed(() => {
  if (typeof window === "undefined") return props.x;
  const viewportWidth = window.innerWidth;
  if (props.x + menuWidth > viewportWidth - 20) {
    return Math.max(20, viewportWidth - menuWidth - 20);
  }
  return Math.max(20, props.x);
});

const adjustedY = computed(() => {
  if (typeof window === "undefined") return props.y;
  const viewportHeight = window.innerHeight;
  const menuBottom = props.y + menuHeight;
  if (menuBottom > viewportHeight - 20) {
    return Math.max(20, props.y - (menuBottom - viewportHeight) - 20);
  }
  return Math.max(20, props.y);
});

const filteredShortcuts = computed(() => {
  if (!searchQuery.value) return markdownShortcuts;
  const q = searchQuery.value.toLowerCase();
  return markdownShortcuts.filter(s =>
    s.trigger.toLowerCase().includes(q)
    || s.label.toLowerCase().includes(q)
    || s.labelEn.toLowerCase().includes(q)
  );
});

const groupedShortcuts = computed(() => {
  const groups: Record<string, MarkdownShortcut[]> = {};
  for (const category of shortcutCategories) {
    const items = filteredShortcuts.value.filter(s => s.category === category.key);
    if (items.length > 0) {
      groups[category.key] = items;
    }
  }
  return groups;
});

const flatShortcuts = computed(() => filteredShortcuts.value);

watch(
  () => props.show,
  (show) => {
    if (show) {
      searchQuery.value = "";
      selectedIndex.value = 0;
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }
);

watch(filteredShortcuts, () => {
  selectedIndex.value = 0;
});

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value = Math.min(selectedIndex.value + 1, flatShortcuts.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (flatShortcuts.value[selectedIndex.value]) {
      selectShortcut(flatShortcuts.value[selectedIndex.value]);
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    emit("update:show", false);
  }
};

const selectShortcut = (shortcut: MarkdownShortcut) => {
  emit("select", shortcut);
  emit("update:show", false);
};

const isSelected = (shortcut: MarkdownShortcut) => {
  return flatShortcuts.value[selectedIndex.value] === shortcut;
};

const getCategoryLabel = (key: string) => {
  const category = shortcutCategories.find(c => c.key === key);
  return category ? category.label : key;
};

const closeMenu = () => {
  emit("update:show", false);
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed z-[9999] flex flex-col rounded-lg border border-dark-200 bg-white shadow-xl dark:border-dark-700 dark:bg-dark-800"
      :style="{ left: `${adjustedX}px`, top: `${adjustedY}px`, width: '320px', maxHeight: '400px' }"
      @click.stop
    >
      <div class="flex items-center justify-between border-b border-dark-200 px-3 py-2 dark:border-dark-700">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索快捷命令..."
          class="flex-1 rounded border border-dark-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
          @keydown="handleKeydown"
        >
        <button
          class="ml-2 rounded p-1.5 hover:bg-dark-100 dark:hover:bg-dark-700"
          title="关闭 (ESC)"
          @click="closeMenu"
        >
          <svg
            class="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="max-h-[320px] overflow-y-auto p-1">
        <template
          v-for="(shortcuts, category) in groupedShortcuts"
          :key="category"
        >
          <div class="px-2 py-1 text-xs font-semibold text-dark-400 dark:text-dark-500">
            {{ getCategoryLabel(category) }}
          </div>
          <div
            v-for="shortcut in shortcuts"
            :key="shortcut.trigger"
            class="flex cursor-pointer items-center gap-3 rounded p-2 transition-colors"
            :class="isSelected(shortcut) ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'hover:bg-dark-100 dark:hover:bg-dark-700'"
            @click="selectShortcut(shortcut)"
            @mouseenter="selectedIndex = flatShortcuts.indexOf(shortcut)"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded bg-dark-100 text-sm font-bold dark:bg-dark-700">
              {{ shortcut.icon }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ shortcut.label }}</span>
                <code class="rounded bg-dark-100 px-1.5 py-0.5 text-xs dark:bg-dark-700">{{ shortcut.trigger }}</code>
              </div>
              <p class="truncate text-xs text-dark-400 dark:text-dark-500">
                {{ shortcut.description }}
              </p>
            </div>
          </div>
        </template>
        <div
          v-if="filteredShortcuts.length === 0"
          class="p-4 text-center text-sm text-dark-400 dark:text-dark-500"
        >
          未找到匹配的快捷命令
        </div>
      </div>
    </div>
    <div
      v-if="show"
      class="fixed inset-0 z-[9998]"
      @click="closeMenu"
    />
  </Teleport>
</template>
