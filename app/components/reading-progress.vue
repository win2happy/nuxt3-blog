<template>
  <div
    v-if="enabled"
    class="reading-progress-container"
    :style="containerStyle"
  >
    <div
      class="reading-progress-bar"
      :style="progressStyle"
    />
  </div>
</template>

<script setup lang="ts">
import config from "~~/config";

const props = withDefaults(defineProps<{
  color?: string;
  height?: number;
  position?: "top" | "bottom";
  enabled?: boolean;
}>(), {
  color: config.readingProgress?.color || "",
  height: config.readingProgress?.height || 3,
  position: config.readingProgress?.position || "top",
  enabled: config.readingProgress?.enabled !== false
});

const progress = ref(0);

const containerStyle = computed(() => ({
  position: "fixed",
  [props.position]: "0",
  left: "0",
  right: "0",
  width: "100%",
  height: `${props.height}px`,
  zIndex: "9999",
  backgroundColor: "transparent"
}));

const progressStyle = computed(() => {
  // 支持自定义颜色或使用主题色变量
  let backgroundColor: string;
  let boxShadowColor: string;

  if (props.color) {
    // 如果有自定义颜色，直接使用
    backgroundColor = props.color.startsWith("#")
      ? props.color
      : `var(--color-${props.color}-500, var(--color-primary-500))`;
    boxShadowColor = props.color.startsWith("#")
      ? `${props.color}40`
      : `var(--color-${props.color}-500)40`;
  } else {
    // 没有自定义颜色时，使用主题色变量
    backgroundColor = "var(--color-primary-500)";
    boxShadowColor = "var(--color-primary-500)40";
  }

  return {
    width: `${progress.value}%`,
    height: "100%",
    backgroundColor,
    transition: "width 0.15s ease-out",
    boxShadow: `0 0 10px ${boxShadowColor}`
  };
});

const updateProgress = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // 计算可滚动的总高度
  const scrollableHeight = documentHeight - windowHeight;

  if (scrollableHeight <= 0) {
    progress.value = 100;
    return;
  }

  // 计算当前滚动百分比
  const scrollPercentage = (scrollTop / scrollableHeight) * 100;
  progress.value = Math.min(100, Math.max(0, scrollPercentage));
};

onMounted(() => {
  if (!props.enabled) return;

  // 初始化进度
  nextTick(() => {
    updateProgress();
  });

  // 监听滚动事件
  window.addEventListener("scroll", updateProgress, { passive: true });

  // 监听窗口大小变化
  window.addEventListener("resize", updateProgress, { passive: true });
});

onBeforeUnmount(() => {
  if (!props.enabled) return;

  window.removeEventListener("scroll", updateProgress);
  window.removeEventListener("resize", updateProgress);
});
</script>

<style scoped>
.reading-progress-container {
  pointer-events: none;
}

.reading-progress-bar {
  transform-origin: left center;
}
</style>
