<script setup lang="ts">
import type { ShareData } from "~/utils/social-share";
import config from "~/../config";

const props = defineProps<{
  shareData: ShareData;
  style?: "simple" | "gradient" | "image";
  size?: "horizontal" | "vertical";
}>();

const cardStyle = computed(() => {
  const style = props.style || "gradient";
  if (style === "image" && !props.shareData.coverImage) {
    return "gradient";
  }
  return style;
});
const cardSize = computed(() => props.size || "horizontal");

// 使用 CSS 变量创建渐变，与网站主题色保持一致
// 支持自定义渐变色
const gradientStyle = computed(() => {
  if (props.shareData.gradient) {
    return {
      background: `linear-gradient(135deg, ${props.shareData.gradient.from} 0%, ${props.shareData.gradient.to} 100%)`
    };
  }
  return {
    background: "linear-gradient(135deg, var(--color-primary-300) 0%, var(--color-primary-900) 100%)"
  };
});

// A4 纸尺寸比例 1:1.414 (210mm x 297mm)
// 使用 4x 分辨率以获得高清图片
const cardClasses = computed(() => {
  const baseClasses = "relative overflow-hidden font-sans flex flex-col";
  // 横向: 宽 > 高, 纵向: 高 > 宽
  // 增加高度以确保内容完整显示
  const sizeClasses = cardSize.value === "horizontal"
    ? "w-[1680px] h-[1260px]" // 横向 A4 (增加高度)
    : "w-[840px] h-[1260px]"; // 纵向 A4 (增加高度)
  return `${baseClasses} ${sizeClasses}`;
});

const isLightStyle = computed(() => cardStyle.value === "simple");
</script>

<template>
  <div
    ref="cardRef"
    :class="cardClasses"
  >
    <!-- 背景层 -->
    <div
      v-if="cardStyle === 'gradient'"
      class="absolute inset-0"
      :style="gradientStyle"
    />

    <div
      v-else-if="cardStyle === 'image' && shareData.coverImage"
      class="absolute inset-0 flex items-center justify-center p-16"
    >
      <img
        :src="shareData.coverImage"
        class="max-h-full max-w-full object-contain"
        alt="background"
      >
      <div class="absolute inset-0 bg-black/60" />
    </div>

    <div
      v-else-if="cardStyle === 'simple'"
      class="absolute inset-0 bg-white"
    />

    <div
      v-else
      class="absolute inset-0 bg-gray-50"
    />

    <!-- 内容层 - A4纸打印边距 -->
    <div class="relative z-10 flex h-full flex-col p-16">
      <!-- 顶部：网站信息 -->
      <div class="flex shrink-0 items-center gap-5">
        <div
          :class="[
            'flex size-16 items-center justify-center rounded-xl',
            isLightStyle
              ? 'border border-primary-100 bg-primary-50'
              : 'bg-white/20 backdrop-blur-sm'
          ]"
        >
          <span
            class="text-3xl font-bold"
            :class="isLightStyle ? 'text-primary-600' : 'text-white'"
          >
            {{ config.nickName?.charAt(0)?.toUpperCase() || 'B' }}
          </span>
        </div>
        <div>
          <div
            class="text-xl font-bold"
            :class="isLightStyle ? 'text-gray-900' : 'text-white'"
          >
            {{ config.title }}
          </div>
          <div
            class="text-base opacity-70"
            :class="isLightStyle ? 'text-gray-500' : 'text-white/70'"
          >
            {{ config.domain }}
          </div>
        </div>
      </div>

      <!-- 中间：封面图(左) + 标题简介(右) -->
      <div class="my-4 flex min-h-0 flex-1 items-stretch gap-6">
        <!-- 封面图 - 占 1/3 宽度，高度自适应（图片样式时不显示） -->
        <div
          v-if="shareData.coverImage && cardStyle !== 'image'"
          class="flex w-1/3 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg"
        >
          <img
            :src="shareData.coverImage"
            class="max-h-full max-w-full object-contain"
            alt="cover"
          >
        </div>

        <!-- 标题和简介 - 图片样式时占满宽度 -->
        <div
          :class="shareData.coverImage && cardStyle !== 'image' ? 'flex-1 min-w-0 w-2/3' : 'w-full'"
          class="flex flex-col justify-center"
        >
          <h1
            :class="[
              'mb-5 font-bold leading-tight',
              cardSize === 'horizontal' ? 'text-4xl' : 'text-5xl',
              isLightStyle ? 'text-gray-900' : 'text-white'
            ]"
          >
            {{ shareData.title }}
          </h1>

          <p
            v-if="shareData.description"
            :class="[
              'leading-relaxed opacity-80',
              cardSize === 'horizontal' ? 'text-xl' : 'text-2xl',
              isLightStyle ? 'text-gray-600' : 'text-white/90'
            ]"
          >
            {{ shareData.description }}
          </p>
        </div>
      </div>

      <!-- 底部：标签和链接 -->
      <div class="flex shrink-0 items-center justify-between">
        <!-- 标签 -->
        <div
          v-if="shareData.tags && shareData.tags.length > 0"
          class="flex flex-1 flex-wrap gap-3"
        >
          <span
            v-for="tag in shareData.tags.slice(0, 4)"
            :key="tag"
            :class="[
              'rounded-full px-4 py-2 text-base font-medium',
              isLightStyle
                ? 'bg-gray-100 text-gray-600'
                : 'bg-white/20 text-white/90 backdrop-blur-sm'
            ]"
          >
            #{{ tag }}
          </span>
        </div>
        <div
          v-else
          class="flex-1"
        />

        <!-- 文章链接 -->
        <div
          class="max-w-[600px] truncate text-base opacity-60"
          :class="isLightStyle ? 'text-gray-400' : 'text-white/60'"
        >
          {{ shareData.url }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
