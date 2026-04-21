<script setup lang="ts">
import { markdownShortcuts, type MarkdownShortcut } from "~/utils/manage/markdown-shortcuts";

defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: "update:show", val: boolean): void;
  (e: "select", shortcut: MarkdownShortcut): void;
}>();

const searchQuery = ref("");

const filteredShortcuts = computed(() => {
  if (!searchQuery.value) return markdownShortcuts;
  const q = searchQuery.value.toLowerCase();
  return markdownShortcuts.filter(s =>
    s.trigger.includes(q) || s.label.includes(q)
  );
});

const selectShortcut = (shortcut: MarkdownShortcut) => {
  emit("select", shortcut);
  emit("update:show", false);
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      style="position: fixed; left: 400px; top: 200px; width: 320px; background: white; border: 2px solid red; z-index: 9999; max-height: 400px; overflow-y: auto;"
    >
      <div style="padding: 8px; border-bottom: 1px solid #ccc;">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          style="width: 100%; padding: 8px; border: 1px solid #ccc;"
        >
      </div>
      <div
        v-for="shortcut in filteredShortcuts"
        :key="shortcut.trigger"
        style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;"
      >
        <div @click="selectShortcut(shortcut)">
          {{ shortcut.label }} - {{ shortcut.trigger }}
        </div>
      </div>
    </div>
  </Teleport>
</template>
