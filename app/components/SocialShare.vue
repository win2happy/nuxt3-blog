<script setup lang="ts">
import { Share2, X, Check, Copy, Mail, MessageCircle, Twitter, Linkedin, Facebook, Send, BookOpen, Heart, Share, Image as ImageIcon } from "lucide-vue-next";
import type { ShareData, SharePlatform } from "~/utils/social-share";
import { translate } from "~/utils/nuxt/i18n";
import config from "~/../config";

const props = defineProps<{
  shareData: ShareData;
}>();

const { handleShare, sharePanelVisible, showCopiedToast, toggleSharePanel, closeSharePanel, setShareData } = useSocialShare();
const showCardPreview = ref(false);

onMounted(() => {
  setShareData(props.shareData);
});

watch(() => props.shareData, (newData) => {
  setShareData(newData);
}, { deep: true });

interface PlatformConfig {
  key: string;
  icon: any;
  label: string;
  color: string;
  bgClass: string;
  isCustom?: boolean;
  customHandler?: () => void;
}

const allPlatforms: PlatformConfig[] = [
  {
    key: "weibo",
    icon: MessageCircle,
    label: "weibo",
    color: "#E6162D",
    bgClass: "bg-red-500 hover:bg-red-600"
  },
  {
    key: "qq",
    icon: Share,
    label: "QQ",
    color: "#12B7F5",
    bgClass: "bg-cyan-400 hover:bg-cyan-500",
    isCustom: true,
    customHandler: () => {
      const url = encodeURIComponent(props.shareData.url);
      const title = encodeURIComponent(props.shareData.title);
      window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`, "_blank");
    }
  },
  {
    key: "zhihu",
    icon: BookOpen,
    label: "zhihu",
    color: "#0084FF",
    bgClass: "bg-blue-500 hover:bg-blue-600",
    isCustom: true,
    customHandler: () => {
      const url = encodeURIComponent(props.shareData.url);
      const title = encodeURIComponent(props.shareData.title);
      window.open(`https://www.zhihu.com/sharer?url=${url}&title=${title}`, "_blank");
    }
  },
  {
    key: "douban",
    icon: Heart,
    label: "douban",
    color: "#41AC5C",
    bgClass: "bg-green-500 hover:bg-green-600",
    isCustom: true,
    customHandler: () => {
      const url = encodeURIComponent(props.shareData.url);
      const title = encodeURIComponent(props.shareData.title);
      window.open(`https://www.douban.com/share/service?href=${url}&name=${title}`, "_blank");
    }
  },
  {
    key: "twitter",
    icon: Twitter,
    label: "twitter",
    color: "#1DA1F2",
    bgClass: "bg-sky-500 hover:bg-sky-600"
  },
  {
    key: "linkedin",
    icon: Linkedin,
    label: "linkedin",
    color: "#0A66C2",
    bgClass: "bg-blue-600 hover:bg-blue-700"
  },
  {
    key: "facebook",
    icon: Facebook,
    label: "facebook",
    color: "#1877F2",
    bgClass: "bg-blue-500 hover:bg-blue-600"
  },
  {
    key: "telegram",
    icon: Send,
    label: "telegram",
    color: "#0088CC",
    bgClass: "bg-cyan-500 hover:bg-cyan-600"
  },
  {
    key: "email",
    icon: Mail,
    label: "email",
    color: "#EA4335",
    bgClass: "bg-orange-500 hover:bg-orange-600"
  },
  {
    key: "copy",
    icon: Copy,
    label: "copyLink",
    color: "#6B7280",
    bgClass: "bg-gray-500 hover:bg-gray-600"
  }
];

const enabledPlatforms = computed(() => {
  const configPlatforms = (config.socialShare?.platforms || []).map(p => p.toLowerCase());
  return allPlatforms.filter(p => configPlatforms.includes(p.key.toLowerCase()));
});

const handlePlatformClick = (platform: PlatformConfig) => {
  if (platform.isCustom && platform.customHandler) {
    platform.customHandler();
    closeSharePanel();
  } else {
    handleShare(platform.key as SharePlatform);
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const panel = document.getElementById("share-panel");
  const button = document.getElementById("share-button");
  if (panel && !panel.contains(event.target as Node) && button && !button.contains(event.target as Node)) {
    closeSharePanel();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="relative">
    <button
      id="share-button"
      class="icon-button group flex items-center gap-2 transition-all"
      :title="translate('share')"
      @click.stop="toggleSharePanel"
    >
      <Share2 class="size-5 transition-transform group-hover:rotate-12" />
      <span class="hidden text-sm font-medium max-md:inline">{{ translate('share') }}</span>
    </button>

    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="sharePanelVisible"
          class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          @click="closeSharePanel"
        />
      </Transition>

      <Transition name="modal">
        <div
          v-if="sharePanelVisible"
          id="share-panel"
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800"
        >
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="dark:bg-primary-900/30 flex size-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:text-primary-400">
                <Share2 class="size-5" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-dark-900 dark:text-white">
                  {{ translate('shareTo') }}
                </h3>
                <p class="text-xs text-dark-500 dark:text-dark-400">
                  {{ shareData.title }}
                </p>
              </div>
            </div>
            <button
              class="flex size-9 items-center justify-center rounded-full text-dark-400 transition hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-700 dark:hover:text-dark-200"
              @click="closeSharePanel"
            >
              <X class="size-5" />
            </button>
          </div>

          <div class="grid grid-cols-5 gap-3">
            <button
              v-for="platform in enabledPlatforms"
              :key="platform.key"
              class="group flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105"
              @click="handlePlatformClick(platform)"
            >
              <div
                :class="['flex size-12 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110 group-hover:shadow-lg', platform.bgClass]"
              >
                <component
                  :is="platform.icon"
                  class="size-6"
                />
              </div>
              <span class="text-xs font-medium text-dark-600 dark:text-dark-300">
                {{ translate(platform.label) }}
              </span>
            </button>
          </div>

          <div class="mt-4 border-t border-dark-200 pt-4 dark:border-dark-700">
            <button
              class="dark:bg-primary-900/20 dark:hover:bg-primary-900/30 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-3 font-medium text-primary-600 transition hover:bg-primary-100 dark:text-primary-400"
              @click="showCardPreview = true; closeSharePanel();"
            >
              <ImageIcon class="size-5" />
              <span>{{ translate('generateShareCard') }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ShareCardPreview
      :show="showCardPreview"
      :share-data="shareData"
      @close="showCardPreview = false"
    />

    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showCopiedToast"
          class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-green-500 px-6 py-3 text-white shadow-xl"
        >
          <div class="flex size-6 items-center justify-center rounded-full bg-white/20">
            <Check class="size-4" />
          </div>
          <span class="font-medium">{{ translate('linkCopied') }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
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

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 30px);
}
</style>
