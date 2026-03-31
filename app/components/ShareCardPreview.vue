<script setup lang="ts">
import { X, Download, Image as ImageIcon, Palette, Maximize2, Minimize2 } from "lucide-vue-next";
import html2canvas from "html2canvas";
import type { ShareData } from "~/utils/social-share";
import { translate } from "~/utils/nuxt/i18n";

const props = defineProps<{
  show: boolean;
  shareData: ShareData;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const cardStyle = ref<"simple" | "gradient" | "image">("gradient");
const cardSize = ref<"horizontal" | "vertical">("horizontal");
const isGenerating = ref(false);
const innerCardRef = ref<HTMLElement>();

// 自定义渐变色
const useCustomGradient = ref(false);
const gradientFrom = ref("#3b82f6");
const gradientTo = ref("#8b5cf6");

const styleOptions = [
  { key: "simple", label: "简约", icon: "📝", desc: "简洁清爽" },
  { key: "gradient", label: "渐变", icon: "🎨", desc: "色彩渐变" },
  { key: "image", label: "图片", icon: "🖼️", desc: "封面背景" }
];

const sizeOptions = [
  { key: "horizontal", label: "横向", icon: "↔️", desc: "A4 横向" },
  { key: "vertical", label: "纵向", icon: "↕️", desc: "A4 纵向" }
];

// 预设渐变色
const presetGradients = [
  { from: "#3b82f6", to: "#8b5cf6", name: "蓝紫" },
  { from: "#f97316", to: "#ef4444", name: "橙红" },
  { from: "#10b981", to: "#06b6d4", name: "绿青" },
  { from: "#ec4899", to: "#8b5cf6", name: "粉紫" },
  { from: "#f59e0b", to: "#f97316", name: "金黄" },
  { from: "#6366f1", to: "#a855f7", name: "靛紫" }
];

// 计算带渐变色的分享数据
const shareDataWithGradient = computed(() => ({
  ...props.shareData,
  gradient: cardStyle.value === "gradient" && useCustomGradient.value
    ? {
        from: gradientFrom.value,
        to: gradientTo.value
      }
    : undefined
}));

const downloadCardRef = ref<HTMLElement>();

const downloadCard = async () => {
  // 使用隐藏的下载区域来渲染卡片
  const cardElement = downloadCardRef.value;
  if (!cardElement) {
    console.error("Card element not found for download");
    return;
  }

  isGenerating.value = true;
  try {
    console.log("Generating share card...");
    const canvas = await html2canvas(cardElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    });

    const link = document.createElement("a");
    link.download = `${props.shareData.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, "_")}_share_card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    console.log("Share card downloaded");
  } catch (error) {
    console.error("Failed to generate share card:", error);
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="show"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="modal">
      <div
        v-if="show"
        class="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800"
      >
        <div class="flex shrink-0 items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ImageIcon class="size-5 text-white" />
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-bold text-white">
                {{ translate('generateShareCard') }}
              </h3>
              <p class="max-w-xs truncate text-sm text-white/80">
                {{ shareData.title }}
              </p>
            </div>
          </div>
          <button
            class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            @click="emit('close')"
          >
            <X class="size-5" />
          </button>
        </div>

        <div class="flex flex-col gap-6 overflow-y-auto p-6 lg:flex-row">
          <!-- 左侧预览区 -->
          <div class="min-w-0 flex-1">
            <div class="mb-4 flex items-center gap-2">
              <Maximize2 class="size-4 text-primary-500" />
              <span class="text-sm font-semibold text-dark-800 dark:text-dark-200">
                实时预览
              </span>
            </div>
            <div
              :class="[
                'relative flex items-center justify-center overflow-hidden rounded-xl border border-dark-200 bg-gradient-to-br from-dark-50 to-dark-100 dark:border-dark-700 dark:from-dark-900 dark:to-dark-800',
                cardSize === 'horizontal' ? 'h-[300px] sm:h-[360px] lg:h-[420px]' : 'h-[320px] sm:h-[350px] lg:h-[380px]'
              ]"
              :style="{ padding: cardSize === 'horizontal' ? '16px' : '16px' }"
            >
              <div class="absolute left-2 top-2 flex gap-1.5">
                <div class="size-2.5 rounded-full bg-red-400" />
                <div class="size-2.5 rounded-full bg-yellow-400" />
                <div class="size-2.5 rounded-full bg-green-400" />
              </div>
              <div
                :class="[
                  'origin-center transition-transform duration-300',
                  cardSize === 'horizontal'
                    ? 'scale-[0.22] sm:scale-[0.28] lg:scale-[0.35]'
                    : 'scale-[0.24] sm:scale-[0.26] lg:scale-[0.28]'
                ]"
              >
                <ShareCard
                  ref="innerCardRef"
                  :share-data="shareDataWithGradient"
                  :style="cardStyle"
                  :size="cardSize"
                />
              </div>
            </div>
          </div>

          <!-- 右侧控制区 -->
          <div class="w-full shrink-0 space-y-4 lg:w-64">
            <div>
              <div class="mb-2 flex items-center gap-2">
                <Palette class="size-4 text-primary-500" />
                <label class="text-sm font-semibold text-dark-800 dark:text-dark-200">
                  卡片样式
                </label>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="style in styleOptions"
                  :key="style.key"
                  :class="[
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs transition-all duration-200',
                    cardStyle === style.key
                      ? 'dark:bg-primary-900/30 border-primary-500 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-400 dark:text-primary-400'
                      : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/10 border-dark-200 bg-dark-50 text-dark-600 hover:border-primary-300 dark:border-dark-700 dark:bg-dark-700 dark:text-dark-300 dark:hover:border-primary-800'
                  ]"
                  @click="cardStyle = style.key as any"
                >
                  <span class="text-lg">{{ style.icon }}</span>
                  <span class="font-medium">{{ style.label }}</span>
                  <span class="text-[10px] opacity-60">{{ style.desc }}</span>
                </button>
              </div>
            </div>

            <!-- 渐变色选择器 - 仅在渐变样式时显示 -->
            <div v-if="cardStyle === 'gradient'">
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="size-4 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
                  <label class="text-sm font-semibold text-dark-800 dark:text-dark-200">
                    自定义渐变色
                  </label>
                </div>
                <!-- 开关 -->
                <button
                  :class="[
                    'relative h-6 w-11 rounded-full transition-colors duration-200',
                    useCustomGradient ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                  ]"
                  @click="useCustomGradient = !useCustomGradient"
                >
                  <span
                    :class="[
                      'absolute left-1 top-1 size-4 rounded-full bg-white transition-transform duration-200',
                      useCustomGradient ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  />
                </button>
              </div>
              <!-- 预设渐变色 -->
              <div
                v-if="useCustomGradient"
                class="mb-3 grid grid-cols-6 gap-1"
              >
                <button
                  v-for="(preset, index) in presetGradients"
                  :key="index"
                  class="h-6 rounded border-2 transition-all duration-200"
                  :class="[
                    gradientFrom === preset.from && gradientTo === preset.to
                      ? 'border-primary-500 shadow-sm'
                      : 'border-transparent hover:border-primary-300'
                  ]"
                  :style="{ background: `linear-gradient(135deg, ${preset.from} 0%, ${preset.to} 100%)` }"
                  :title="preset.name"
                  @click="gradientFrom = preset.from; gradientTo = preset.to"
                />
              </div>
              <!-- 自定义颜色 -->
              <div
                v-if="useCustomGradient"
                class="flex items-center gap-2"
              >
                <div class="flex items-center gap-1">
                  <input
                    v-model="gradientFrom"
                    type="color"
                    class="h-8 w-12 cursor-pointer rounded border border-dark-200 bg-transparent dark:border-dark-700"
                  >
                  <span class="text-xs text-dark-500 dark:text-dark-400">起始</span>
                </div>
                <div class="h-px flex-1 bg-dark-200 dark:bg-dark-700" />
                <div class="flex items-center gap-1">
                  <input
                    v-model="gradientTo"
                    type="color"
                    class="h-8 w-12 cursor-pointer rounded border border-dark-200 bg-transparent dark:border-dark-700"
                  >
                  <span class="text-xs text-dark-500 dark:text-dark-400">结束</span>
                </div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center gap-2">
                <Minimize2 class="size-4 text-primary-500" />
                <label class="text-sm font-semibold text-dark-800 dark:text-dark-200">
                  卡片尺寸
                </label>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="size in sizeOptions"
                  :key="size.key"
                  :class="[
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs transition-all duration-200',
                    cardSize === size.key
                      ? 'dark:bg-primary-900/30 border-primary-500 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-400 dark:text-primary-400'
                      : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/10 border-dark-200 bg-dark-50 text-dark-600 hover:border-primary-300 dark:border-dark-700 dark:bg-dark-700 dark:text-dark-300 dark:hover:border-primary-800'
                  ]"
                  @click="cardSize = size.key as any"
                >
                  <span class="text-lg">{{ size.icon }}</span>
                  <span class="font-medium">{{ size.label }}</span>
                  <span class="font-mono text-[10px] opacity-60">{{ size.desc }}</span>
                </button>
              </div>
            </div>

            <div class="pt-2">
              <button
                :disabled="isGenerating"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-primary-600 hover:to-primary-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                @click="downloadCard"
              >
                <Download class="size-4" />
                <span class="text-sm">{{ isGenerating ? '正在生成...' : translate('downloadCard') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 隐藏的下载区域 - 用于 html2canvas 渲染 -->
        <div class="fixed left-[9999px] top-0">
          <div ref="downloadCardRef">
            <ShareCard
              :share-data="shareDataWithGradient"
              :style="cardStyle"
              :size="cardSize"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}
</style>
