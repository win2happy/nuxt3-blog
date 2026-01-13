<template>
  <common-modal
    v-model="showModal"
    modal-title="🎨 卡片样式配置"
    :show-ok="false"
    :show-cancel="false"
    modal-width="700px"
    @close="handleClose"
  >
    <template #body>
      <!-- 提示信息 -->
      <div class="mb-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
        <div class="flex items-start space-x-3">
          <span class="text-2xl">💡</span>
          <div>
            <p class="font-medium text-blue-900 dark:text-blue-200">
              统一样式配置
            </p>
            <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
              配置会应用到：60秒读懂世界、实时热搜、历史上的今天、今日黄历、每日一语
            </p>
          </div>
        </div>
      </div>

      <!-- 预设配色方案 -->
      <div class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
            🎨 预设配色方案
          </h4>
          <span class="text-xs text-gray-500 dark:text-gray-400">点击应用</span>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="(preset, index) in presets"
            :key="index"
            class="group relative overflow-hidden rounded-xl border-2 border-gray-200 p-3 transition-all hover:border-blue-400 hover:shadow-lg dark:border-gray-700 dark:hover:border-blue-500"
            @click="applyPreset(preset)"
          >
            <div
              class="mb-2 h-16 rounded-lg shadow-md"
              :style="{ background: `linear-gradient(135deg, ${preset.gradientStart} 0%, ${preset.gradientEnd} 100%)` }"
            >
              <div class="flex size-full items-center justify-center">
                <div
                  class="rounded px-2 py-1 text-xs font-bold shadow"
                  :style="{ backgroundColor: preset.contentBackgroundColor, color: preset.headerTextColor }"
                >
                  预览
                </div>
              </div>
            </div>
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ preset.name }}
            </p>
            <div class="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <!-- 自定义配置 -->
      <div class="mb-6">
        <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          ⚙️ 自定义配置
        </h4>
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- 背景渐变起始色 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label class="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="mr-2">🌅</span>
              渐变起始色
            </label>
            <div class="flex items-center space-x-3">
              <input
                v-model="localConfig.gradientStart"
                type="color"
                class="size-12 cursor-pointer rounded-lg border-2 border-gray-300 transition-all hover:scale-105 dark:border-gray-600"
              >
              <input
                v-model="localConfig.gradientStart"
                type="text"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="#0000ff"
              >
            </div>
          </div>

          <!-- 背景渐变结束色 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label class="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="mr-2">🌄</span>
              渐变结束色
            </label>
            <div class="flex items-center space-x-3">
              <input
                v-model="localConfig.gradientEnd"
                type="color"
                class="size-12 cursor-pointer rounded-lg border-2 border-gray-300 transition-all hover:scale-105 dark:border-gray-600"
              >
              <input
                v-model="localConfig.gradientEnd"
                type="text"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="#66ee5a"
              >
            </div>
          </div>

          <!-- 内容区域背景色 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label class="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="mr-2">📄</span>
              内容背景色
            </label>
            <div class="flex items-center space-x-3">
              <input
                v-model="localConfig.contentBackgroundColor"
                type="color"
                class="size-12 cursor-pointer rounded-lg border-2 border-gray-300 transition-all hover:scale-105 dark:border-gray-600"
              >
              <input
                v-model="localConfig.contentBackgroundColor"
                type="text"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="white"
              >
            </div>
          </div>

          <!-- 头部文字颜色 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label class="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="mr-2">✏️</span>
              头部文字色
            </label>
            <div class="flex items-center space-x-3">
              <input
                v-model="localConfig.headerTextColor"
                type="color"
                class="size-12 cursor-pointer rounded-lg border-2 border-gray-300 transition-all hover:scale-105 dark:border-gray-600"
              >
              <input
                v-model="localConfig.headerTextColor"
                type="text"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="white"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 实时预览 -->
      <div class="mb-6">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          👁️ 实时预览
        </h4>
        <div class="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl dark:border-gray-700">
          <div
            class="p-8 transition-all duration-300"
            :style="{ background: `linear-gradient(135deg, ${localConfig.gradientStart} 0%, ${localConfig.gradientEnd} 100%)` }"
          >
            <div
              class="rounded-xl p-6 shadow-2xl transition-all duration-300"
              :style="{ backgroundColor: localConfig.contentBackgroundColor }"
            >
              <div class="mb-4 flex items-center space-x-3">
                <div class="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg">
                  📰
                </div>
                <div>
                  <h3
                    class="text-xl font-bold transition-all duration-300"
                    :style="{ color: localConfig.headerTextColor }"
                  >
                    60秒读懂世界
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Today's News Brief
                  </p>
                </div>
              </div>
              <div class="space-y-2">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    1. 这是一条示例新闻内容
                  </p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    2. 用于预览卡片效果
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between space-x-3 border-t border-gray-200 pt-6 dark:border-gray-700">
        <button
          class="group flex items-center space-x-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          @click="handleReset"
        >
          <span class="text-lg transition-transform group-hover:rotate-180">🔄</span>
          <span>恢复默认</span>
        </button>
        <div class="flex space-x-3">
          <button
            class="rounded-xl border-2 border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            @click="handleClose"
          >
            取消
          </button>
          <button
            class="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
            @click="handleSave"
          >
            <span class="text-lg">💾</span>
            <span>保存配置</span>
          </button>
        </div>
      </div>
    </template>
  </common-modal>
</template>

<script setup lang="ts">
import type { CardConfig } from "~/composables/useCardConfig";

interface Props {
  show: boolean;
}

interface Emits {
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用 v-model 绑定
const showModal = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit("close");
    }
  }
});

const { cardConfig, updateConfig, resetConfig } = useCardConfig();

// 本地副本，用于编辑
const localConfig = ref<CardConfig>({ ...cardConfig.value });

// 预设配色方案
const presets = [
  {
    name: "经典蓝绿",
    gradientStart: "#0000ff",
    gradientEnd: "#66ee5a",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "热情红橙",
    gradientStart: "#ff6b6b",
    gradientEnd: "#feca57",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "紫罗兰",
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "海洋蓝",
    gradientStart: "#2193b0",
    gradientEnd: "#6dd5ed",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "日落橙",
    gradientStart: "#ff512f",
    gradientEnd: "#f09819",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "薄荷绿",
    gradientStart: "#00b09b",
    gradientEnd: "#96c93d",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "樱花粉",
    gradientStart: "#f857a6",
    gradientEnd: "#ff5858",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  },
  {
    name: "深邃紫",
    gradientStart: "#4e54c8",
    gradientEnd: "#8f94fb",
    contentBackgroundColor: "white",
    headerTextColor: "white"
  }
];

// 监听 show 变化，重新加载配置
watch(() => props.show, (newShow) => {
  if (newShow) {
    localConfig.value = { ...cardConfig.value };
  }
});

const handleClose = () => {
  emit("close");
};

const handleSave = () => {
  updateConfig(localConfig.value);
  // 显示成功提示
  if (import.meta.client) {
    // 可以添加一个简单的提示
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 z-[9999] rounded-lg bg-green-500 px-6 py-3 text-white shadow-lg";
    notification.textContent = "✅ 配置已保存";
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
  emit("close");
};

const handleReset = () => {
  if (confirm("确定要恢复为默认配置吗？")) {
    resetConfig();
    localConfig.value = { ...cardConfig.value };
  }
};

const applyPreset = (preset: any) => {
  localConfig.value = { ...preset };
};
</script>

<style scoped>
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 0.5rem;
}
</style>
