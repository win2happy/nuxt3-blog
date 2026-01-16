import { useState } from "#app";
import config from "~~/config";

export interface CardConfig {
  gradientStart: string;
  gradientEnd: string;
  contentBackgroundColor: string;
  headerTextColor: string;
  contentTextColor: string;
}

// 默认存储键
const DEFAULT_STORAGE_KEY = "nuxt3-blog-card-config";

// 从 localStorage 加载配置
function loadConfigFromStorage(key: string = DEFAULT_STORAGE_KEY): CardConfig | null {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load card config from storage:", error);
    }
  }
  return null;
}

// 保存配置到 localStorage
function saveConfigToStorage(cardConfig: CardConfig, key: string = DEFAULT_STORAGE_KEY): void {
  if (import.meta.client) {
    try {
      localStorage.setItem(key, JSON.stringify(cardConfig));
    } catch (error) {
      console.error("Failed to save card config to storage:", error);
    }
  }
}

// 获取默认配置（从 config.ts）
function getDefaultConfig(): CardConfig {
  return {
    gradientStart: config.newsCard.gradientStart,
    gradientEnd: config.newsCard.gradientEnd,
    contentBackgroundColor: config.newsCard.contentBackgroundColor,
    headerTextColor: config.newsCard.headerTextColor,
    contentTextColor: config.newsCard.contentTextColor
  };
}

// 全局状态
export const useCardConfig = (configKey: string = DEFAULT_STORAGE_KEY) => {
  const cardConfig = useState<CardConfig>(`card-config-${configKey}`, () => {
    // 优先使用 localStorage 的配置，否则使用默认配置
    return loadConfigFromStorage(configKey) || getDefaultConfig();
  });

  // 更新配置
  const updateConfig = (newConfig: Partial<CardConfig>) => {
    cardConfig.value = { ...cardConfig.value, ...newConfig };
    saveConfigToStorage(cardConfig.value, configKey);
  };

  // 重置为默认配置
  const resetConfig = () => {
    cardConfig.value = getDefaultConfig();
    saveConfigToStorage(cardConfig.value, configKey);
  };

  // 检查是否使用了自定义配置
  const isCustomized = computed(() => {
    const defaultConfig = getDefaultConfig();
    return JSON.stringify(cardConfig.value) !== JSON.stringify(defaultConfig);
  });

  // 获取渐变背景样式
  const getGradientStyle = () => {
    return {
      background: `linear-gradient(135deg, ${cardConfig.value.gradientStart} 0%, ${cardConfig.value.gradientEnd} 100%)`
    };
  };

  // 获取内容背景色样式
  const getContentBackgroundStyle = () => {
    return {
      backgroundColor: cardConfig.value.contentBackgroundColor
    };
  };

  // 获取头部文字颜色样式
  const getHeaderTextColorStyle = () => {
    return {
      color: cardConfig.value.headerTextColor
    };
  };

  return {
    cardConfig,
    updateConfig,
    resetConfig,
    isCustomized,
    getGradientStyle,
    getContentBackgroundStyle,
    getHeaderTextColorStyle
  };
};
