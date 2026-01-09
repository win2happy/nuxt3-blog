<script setup lang="tsx">
import { Languages, Sun, MoonStar, Rocket, Menu, Rss, Key, Search } from "lucide-vue-next";
import config from "~~/config";
import { i18nLocales, type I18nCode } from "~/utils/common/locales";
import { HeaderTabs } from "~/utils/common/types";
import { calcRocketUrl } from "~/utils/nuxt/utils";
import { OfficialRepo } from "~/utils/common/constants";

const algoliaEnabled = __NB_ALGOLIA_ENABLED__;

const { i18nCode, changeI18n } = useI18nCode();
const { themeMode, toggleThemeMode } = useThemeMode();
const loadingState = useLoadingState();

const route = useRoute();
const mobileMenuShow = ref(false);
watch(() => route.path, () => {
  mobileMenuShow.value = false;
});

// 移动端导航菜单配置
// function-buttons: 主导航显示功能按钮（语言、主题、密码、火箭），下拉显示内容标签（Articles等）
// content-tabs: 主导航显示内容标签（Articles等），下拉显示功能按钮和时间轴
const isContentTabsMode = computed(() => config.mobileNavMode === "content-tabs");

const themeAnimate = ref(false);
const footerDomain = ref("");

const showI18n = ref(false);
const setLocale = (locale: I18nCode) => {
  changeI18n(locale);
  showI18n.value = false;
};

// 导航栏滚动显示/隐藏
const navVisible = ref(true);
const lastScrollY = ref(0);
const scrollThreshold = 10; // 滚动阈值，避免小幅滚动触发

// 回到顶部按钮显示控制
const showBackToTop = ref(false);

const handleScroll = () => {
  const currentScrollY = window.scrollY;

  // 控制回到顶部按钮显示（滚动超过300px时显示）
  showBackToTop.value = currentScrollY > 300;

  // 在顶部附近始终显示导航栏
  if (currentScrollY < 50) {
    navVisible.value = true;
    lastScrollY.value = currentScrollY;
    return;
  }

  // 判断滚动方向
  const scrollDiff = currentScrollY - lastScrollY.value;

  if (Math.abs(scrollDiff) > scrollThreshold) {
    if (scrollDiff > 0) {
      // 向下滚动 - 隐藏导航栏
      navVisible.value = false;
    } else {
      // 向上滚动 - 显示导航栏
      navVisible.value = true;
    }
    lastScrollY.value = currentScrollY;
  }
};

// 回到顶部函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

const toggleTheme = () => {
  themeAnimate.value = true;
  nextTick(() => {
    toggleThemeMode();
  });
};

const rocketUrl = computed(() => {
  return calcRocketUrl();
});

onMounted(async () => {
  footerDomain.value = window.location.hostname;

  // 添加滚动事件监听
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  // 移除滚动事件监听
  window.removeEventListener("scroll", handleScroll);
});

const encryptor = useEncryptor();
const showPwdModal = ref(false);
const inputPwd = ref(encryptor.usePasswd.value);
</script>

<template>
  <div class="m-auto flex min-h-screen flex-col">
    <div
      :class="twMerge(
        'fixed z-modeBg size-0 rounded-full right-12 top-6',
        themeMode === 'dark' ? $style.themeAnimateBgDark : $style.themeAnimateBgLight,
        themeAnimate && $style.themeAnimateBg
      )"
    />
    <nav
      :class="[
        $style.nav,
        !navVisible && $style.navHidden
      ]"
    >
      <div class="container mx-auto flex h-header items-center px-4 max-md:justify-between max-md:px-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center lg:px-8">
        <NuxtLink
          class="group shrink-0 md:justify-self-start"
          to="/about"
        >
          <span class="text-xl font-medium text-primary-700 drop-shadow hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-500">{{ config.nickName }}</span>
        </NuxtLink>

        <!-- 桌面端导航 - 保持不变 -->
        <div
          :class="$style.pcMenu"
          class="md:justify-self-center"
        >
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="item"
          >
            {{ $t(item) }}
          </NuxtLink>
          <NuxtLink to="/timeline">
            {{ $t('/timeline') }}
          </NuxtLink>
        </div>

        <!-- 移动端主导航 - content-tabs 模式显示内容标签 -->
        <div
          v-if="isContentTabsMode"
          :class="$style.mobileMainNav"
        >
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="item"
          >
            {{ $t(item) }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4 max-md:gap-2 md:justify-end md:justify-self-end">
          <NuxtLink
            v-if="algoliaEnabled && isContentTabsMode"
            class="icon-button"
            :title="$t('search-all')"
            to="/search"
          >
            <Search />
          </NuxtLink>
          <NuxtLink
            v-if="algoliaEnabled && !isContentTabsMode"
            class="icon-button max-md:hidden"
            :title="$t('search-all')"
            to="/search"
          >
            <Search />
          </NuxtLink>
          <button
            :class="['icon-button relative !overflow-visible', isContentTabsMode && 'max-md:hidden']"
            @click="showI18n = true"
          >
            <Languages />
            <common-dropdown
              v-model:show="showI18n"
              wrap-class="mt-2"
            >
              <div>
                <client-only>
                  <div
                    v-for="locale of i18nLocales"
                    :key="locale.code"
                    :class="twMerge(
                      $style.i18nSelect,
                      i18nCode === locale.code && $style.i18nSelectActive
                    )"
                    @click="setLocale(locale.code)"
                  >
                    {{ locale.name }}
                  </div>
                </client-only>
              </div>
            </common-dropdown>
          </button>
          <button
            :class="twMerge(
              'icon-button',
              $style.themeMode,
              themeMode === 'dark' && $style.modeDark,
              isContentTabsMode && 'max-md:hidden'
            )"
            :title="$t('switch-mode', [$t(`mode-${themeMode === 'light' ? 'dark' : 'light'}`)])"
            @click="toggleTheme"
          >
            <span :class="themeAnimate && $style.themeAnimateToggle">
              <MoonStar class="size-5" />
              <Sun class="size-5" />
            </span>
          </button>
          <button
            :class="twMerge(
              'icon-button',
              encryptor.passwdCorrect.value && $style.pwdValid,
              isContentTabsMode && 'max-md:hidden'
            )"
            :title="$t('passwd')"
            @click="showPwdModal = true"
          >
            <Key />
          </button>
          <NuxtLink
            :to="rocketUrl"
            title="🚀"
            :class="['icon-button anim-shake', isContentTabsMode && 'max-md:hidden']"
          >
            <Rocket />
          </NuxtLink>
          <span
            class="icon-button !hidden max-md:!flex"
            @click="mobileMenuShow = !mobileMenuShow"
          >
            <Menu />
          </span>
        </div>
      </div>

      <div
        v-show="mobileMenuShow"
        :class="$style.mobileMenu"
      >
        <!-- timeline-first 模式：下拉显示内容标签 -->
        <template v-if="!isContentTabsMode">
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="item"
          >
            {{ $t(item) }}
          </NuxtLink>
          <NuxtLink
            v-if="algoliaEnabled"
            :to="'/search'"
          >
            {{ $t('search-all') }}
          </NuxtLink>
        </template>

        <!-- content-tabs 模式：下拉显示功能按钮和时间轴 -->
        <template v-else>
          <NuxtLink to="/timeline">
            {{ $t('/timeline') }}
          </NuxtLink>

          <!-- 语言选择 -->
          <div class="mt-2 border-t border-dark-200 pt-2 dark:border-dark-700">
            <div class="px-2 py-1 text-xs font-semibold text-dark-500 dark:text-dark-400">
              {{ $t('language') }}
            </div>
            <client-only>
              <button
                v-for="locale of i18nLocales"
                :key="locale.code"
                :class="[
                  'flex w-full items-center gap-2 rounded py-2 pl-2 text-base font-semibold text-dark-600 hover:bg-dark-200 hover:text-primary-700 dark:text-dark-200 dark:hover:bg-dark-700',
                  i18nCode === locale.code && 'dark:bg-primary-900/20 bg-primary-50 text-primary-700 dark:text-primary-500'
                ]"
                @click="setLocale(locale.code); mobileMenuShow = false"
              >
                <Languages class="size-5" />
                {{ locale.name }}
              </button>
            </client-only>
          </div>

          <button
            class="flex items-center gap-2 rounded py-2 pl-2 text-base font-semibold text-dark-600 hover:bg-dark-200 hover:text-primary-700 dark:text-dark-200 dark:hover:bg-dark-700"
            @click="showPwdModal = true; mobileMenuShow = false"
          >
            <Key class="size-5" />
            {{ $t('passwd') }}
          </button>
          <NuxtLink
            :to="rocketUrl"
            class="flex items-center gap-2"
          >
            <Rocket class="size-5" />
            🚀
          </NuxtLink>
        </template>
      </div>
    </nav>
    <span
      v-show="!!loadingState"
      class="fixed left-0 top-0 z-headerLoading h-0.5 bg-primary-500"
      :style="{ width: `${loadingState}%` }"
    />
    <section class="z-body grow pt-header">
      <slot />
    </section>
    <footer :class="$style.footer">
      <div class="mx-auto flex flex-col items-center gap-1">
        <span>Copyright (c) 2019-2025 <b><a
          target="_blank"
          :href="'https://github.com/'+config.githubName"
        >{{ config.nickName }}</a> | {{ footerDomain }}</b></span>
        <span class="flex"><a
          target="_blank"
          href="/sitemap.xml"
          title="rss"
        >RSS <Rss class="size-4" /></a>| Powered By <a
          :href="`https://github.com/${OfficialRepo}`"
          target="_blank"
        >nuxt3-blog</a></span>
      </div>
    </footer>

    <common-modal
      v-model="showPwdModal"
      @confirm="encryptor.usePasswd.value = inputPwd;showPwdModal = false"
    >
      <template #title>
        {{ $t('passwd') }}
      </template>
      <template #body>
        <input
          v-model="inputPwd"
          data-focus
          :placeholder="$t('input-passwd')"
          class="w-full"
        >
      </template>
    </common-modal>

    <!-- 回到顶部按钮 -->
    <Transition name="back-to-top">
      <button
        v-show="showBackToTop"
        :class="$style.backToTop"
        :title="$t('back-to-top')"
        @click="scrollToTop"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style module>
@keyframes light-dark {
  0% {
    @apply size-0 bg-nb-light;
  }

  100% {
    @apply bg-nb-dark;

    width: calc(200vw * 1.5);
    height: calc(200vh * 1.5);
  }
}

@keyframes dark-light {
  0% {
    @apply size-0 bg-nb-dark;
  }

  100% {
    @apply bg-nb-light;

    width: calc(200vw * 1.5);
    height: calc(200vh * 1.5);
  }
}

.themeAnimateBg {
  animation-duration: 1s;
  animation-timing-function: cubic-bezier(0, 0, 0, 1);
  animation-fill-mode: forwards;
  transform: translate(50%, -50%);
}

.themeAnimateBgLight {
  animation-name: dark-light;
}

.themeAnimateBgDark {
  animation-name: light-dark;
}

.nav {
  @apply w-full z-header max-md:!transform-none;
  @apply transition-all duration-300;
  @apply fixed top-0 left-0 right-0;
  @apply bg-nb-light dark:bg-nb-dark;
  @apply shadow-sm;
}

.navHidden {
  transform: translateY(-100%);
}

.mobileMenu {
  @apply flex flex-col mt-2 mb-4 px-4 md:hidden;
  @apply bg-nb-light dark:bg-nb-dark;

  a {
    @apply flex items-center font-semibold pl-2 py-2 rounded text-base text-dark-600 dark:text-dark-200 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-primary-700;
  }
}

.pcMenu {
  @apply flex max-md:hidden gap-10 justify-center;

  a {
    @apply -mb-[4px] font-semibold flex flex-col items-center gap-[3px] text-lg text-dark-600 dark:text-dark-200 hover:text-primary-700 dark:hover:text-primary-400 after:block after:h-[2px] after:w-[120%] after:bg-transparent after:transition hover:after:bg-primary-700;
  }
}

.mobileMainNav {
  @apply flex md:hidden gap-4 justify-center;

  a {
    @apply -mb-[4px] font-semibold flex flex-col items-center gap-[3px] text-base text-dark-600 dark:text-dark-200 hover:text-primary-700 dark:hover:text-primary-400 after:block after:h-[2px] after:w-[120%] after:bg-transparent after:transition hover:after:bg-primary-700;
  }
}

.i18nSelect{
  @apply rounded-lg cursor-pointer px-4 py-2 text-sm text-dark-600 dark:text-dark-300 hover:bg-primary-100 dark:hover:bg-primary-900 transition;
}
.i18nSelectActive {
  @apply text-primary-700 dark:text-primary-500;
}

.themeMode {
  @apply overflow-hidden block;

  > span {
    @apply flex flex-col items-center justify-around w-full h-[200%];
  }
}

.themeAnimateToggle {
  transition: all 0.2s cubic-bezier(0, -0.01, 0.23, 1.56);
}

.modeDark {
  span {
    transform: translateY(-50%);
  }
}

.pwdValid {
  @apply text-primary-700 dark:text-primary-500;
}

.footer {
  @apply pb-4 relative z-footer text-sm leading-6 text-dark-600 dark:text-dark-400;

  a {
    @apply mx-2 text-primary-700 hover:text-primary-500 dark:text-primary-500 hover:dark:text-primary-600 inline-flex items-center gap-1;
  }
}

.backToTop {
  @apply fixed bottom-8 right-8 z-header;
  @apply w-12 h-12 rounded-full;
  @apply bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600;
  @apply text-white shadow-lg hover:shadow-xl;
  @apply flex items-center justify-center;
  @apply transition-all duration-300;
  @apply cursor-pointer;
}

.backToTop:hover {
  transform: translateY(-4px);
}

.backToTop:active {
  transform: translateY(-2px);
}
</style>

<style scoped>
/* 回到顶部按钮过渡动画 */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.3s ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-enter-to,
.back-to-top-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
