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
            <!-- 选项列表 -->
            <div class="space-y-4">
              <!-- 60秒读懂世界（红色卡片） -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-red-500 hover:from-red-50 hover:to-pink-50 dark:border-gray-700 dark:hover:border-red-500 dark:hover:from-red-900/20 dark:hover:to-pink-900/20"
                @click="handleSave('news-card')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">📰</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                    60秒读懂世界（红色卡片）
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    生成经典红色背景的新闻卡片
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

              <!-- 实时热搜 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-orange-500 hover:from-orange-50 hover:to-red-50 dark:border-gray-700 dark:hover:border-orange-500 dark:hover:from-orange-900/20 dark:hover:to-red-900/20"
                @click="handleSave('trends')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">🔥</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                    实时热搜
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存所有平台的热搜榜单
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-orange-500"
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
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-green-500 hover:from-green-50 hover:to-teal-50 dark:border-gray-700 dark:hover:border-green-500 dark:hover:from-green-900/20 dark:hover:to-teal-900/20"
                @click="handleSave('history')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">📅</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
                    历史上的今天
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存历史事件时间轴
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

              <!-- 今日黄历 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-orange-500 hover:from-orange-50 hover:to-red-50 dark:border-gray-700 dark:hover:border-orange-500 dark:hover:from-orange-900/20 dark:hover:to-red-900/20"
                @click="handleSave('calendar')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">📖</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                    今日黄历
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存黄历宜忌信息
                  </p>
                </div>
                <svg
                  class="size-6 text-gray-400 transition-colors group-hover:text-orange-500"
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

              <!-- 每日一语 -->
              <div
                class="group flex cursor-pointer items-center rounded-2xl border-2 border-gray-200 bg-gradient-to-r p-5 transition-all hover:border-purple-500 hover:from-purple-50 hover:to-pink-50 dark:border-gray-700 dark:hover:border-purple-500 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20"
                @click="handleSave('quote')"
              >
                <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg transition-transform group-hover:scale-110">
                  <span class="text-3xl">💬</span>
                </div>
                <div class="ml-5 flex-1">
                  <h4 class="text-lg font-bold text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                    每日一语
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    保存励志语录卡片
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
            </div>
          </div>

          <!-- 底部 -->
          <div class="border-t border-gray-200 bg-gray-50 px-8 py-5 dark:border-gray-700 dark:bg-gray-900/50">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                💡 点击任意模块即可生成并保存图片
              </p>
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", type: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const close = () => {
  emit("update:modelValue", false);
};

const handleSave = (type: string) => {
  emit("save", type);
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
