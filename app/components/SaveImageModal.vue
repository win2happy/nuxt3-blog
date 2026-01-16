<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="animate-modal-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800">
          <!-- 头部 -->
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="rounded-xl bg-white/20 p-2">
                  <span class="text-3xl">📸</span>
                </div>
                <div>
                  <h3 class="text-2xl font-black text-white">
                    保存图片
                  </h3>
                  <p class="mt-1 text-sm text-white/80">
                    选择要保存的模块
                  </p>
                </div>
              </div>
              <button
                class="rounded-xl p-2 transition-colors hover:bg-white/20"
                @click="close"
              >
                <svg
                  class="size-6 text-white"
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
          </div>

          <!-- 内容 -->
          <div class="max-h-[calc(90vh-180px)] overflow-y-auto p-8">
            <!-- 提示信息 -->
            <div class="mb-6 rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div class="flex items-center space-x-2">
                <span class="text-xl">💡</span>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  所有卡片统一使用前端配置的样式。需要修改样式请点击页面上的"样式配置"按钮。
                </p>
              </div>
            </div>

            <!-- 选项列表 -->
            <div class="space-y-4">
              <!-- 每天 60 秒读懂世界 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-blue-500 hover:from-blue-50 hover:to-purple-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
                @click="handleSave('sixty-seconds')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">📰</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    每天 60 秒读懂世界
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存每日新闻摘要
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- AI资讯快报 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-purple-500 hover:from-purple-50 hover:to-pink-50 dark:border-gray-700 dark:hover:border-purple-500 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20"
                @click="handleSave('ai-news')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">🤖</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                    AI资讯快报
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存AI领域最新动态
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 实时热搜 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-red-500 hover:from-red-50 hover:to-orange-50 dark:border-gray-700 dark:hover:border-red-500 dark:hover:from-red-900/20 dark:hover:to-orange-900/20"
                @click="handleSave('hot-search')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">🔥</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                    实时热搜
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存8大平台热搜榜单
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 历史上的今天 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-amber-500 hover:from-amber-50 hover:to-yellow-50 dark:border-gray-700 dark:hover:border-amber-500 dark:hover:from-amber-900/20 dark:hover:to-yellow-900/20"
                @click="handleSave('history-today')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">📜</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                    历史上的今天
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存历史事件记录
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 农历信息 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-green-500 hover:from-green-50 hover:to-emerald-50 dark:border-gray-700 dark:hover:border-green-500 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20"
                @click="handleSave('lunar-info')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">🌙</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
                    农历信息
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存农历日历宜忌信息
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 随机一言 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-indigo-500 hover:from-indigo-50 hover:to-blue-50 dark:border-gray-700 dark:hover:border-indigo-500 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20"
                @click="handleSave('random-quote')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">💭</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                    随机一言
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存哲理语录卡片
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 随机搞笑段子 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-amber-500 hover:from-amber-50 hover:to-orange-50 dark:border-gray-700 dark:hover:border-amber-500 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20"
                @click="handleSave('funny-joke')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">😂</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                    随机搞笑段子
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存幽默搞笑内容
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              <!-- 随机冷笑话 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-teal-500 hover:from-teal-50 hover:to-cyan-50 dark:border-gray-700 dark:hover:border-teal-500 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20"
                @click="handleSave('dad-joke')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">🤨</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400">
                    随机冷笑话
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存轻松有趣的冷笑话
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-teal-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="border-t border-gray-200 bg-gray-50 px-8 py-5 dark:border-gray-700 dark:bg-gray-900/50">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                💡 点击任意模块即可生成并保存图片
              </p>
              <div class="flex items-center space-x-3">
                <button
                  class="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
                  @click="handleDownloadAll"
                >
                  <span class="text-xl transition-transform group-hover:rotate-12">📦</span>
                  <span>一键下载所有</span>
                </button>
                <button
                  class="rounded-xl bg-gray-200 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  @click="close"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", type: string, config?: any): void;
  (e: "download-all"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用统一的前端配置
const { cardConfig } = useCardConfig();

const close = () => {
  emit("update:modelValue", false);
};

const handleSave = (type: string) => {
  // 所有类型统一使用前端配置
  emit("save", type, cardConfig.value);
  close();
};

const handleDownloadAll = () => {
  emit("download-all");
  close();
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .animate-modal-in {
  animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
