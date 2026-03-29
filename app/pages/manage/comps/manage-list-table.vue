<script setup lang="ts" generic="T extends CommonItem">
import { deleteList } from "ls:~/utils/nuxt/manage/github";
import { Lock, LockKeyhole, Plus, Search, Trash2 } from "lucide-vue-next";
import type { CommonItem } from "~/utils/common/types";
import { useStatusText } from "~/utils/nuxt/manage";
import { useManageList } from "~/utils/nuxt/manage/list";
import { formatTime } from "~/utils/nuxt/format-time";
import { useStaging } from "~/utils/hooks/useStaging";
import { getPasswordBackups, getBackupConfig } from "~/utils/nuxt/manage/password-backup";
import { notify } from "~/utils/nuxt/notify";
import { translate } from "~/utils/nuxt/i18n";

const props = defineProps<{
  filterFn: (item: T, search: string) => boolean;
}>();

const { targetTab, list, originList, decryptedList } = await useManageList<T>();
const { isItemStaged } = useStaging();

const searchValue = ref("");

// 密码模态框相关
const showPasswordModal = ref(false);
const currentItem = ref<T | null>(null);
const passwordInfo = ref<{ password: string; title?: string; date: string; encryptType?: "full" | "partial" } | null>(null);
const loadingPassword = ref(false);

// 复制密码函数
const copyPassword = async (password: string) => {
  try {
    // 尝试使用现代 Clipboard API
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(password);
      notify({
        type: "success",
        title: translate("copy-success"),
        description: translate("copy-success-desc")
      });
      return true;
    }

    // 降级方案：使用传统方法
    const input = document.createElement("input");
    input.value = password;
    input.style.position = "fixed";
    input.style.left = "-999999px";
    input.style.top = "-999999px";
    document.body.appendChild(input);

    input.focus();
    input.select();

    const success = document.execCommand("copy");
    document.body.removeChild(input);

    if (success) {
      notify({
        type: "success",
        title: translate("copy-success"),
        description: translate("copy-success-desc")
      });
      return true;
    } else {
      throw new Error("复制命令执行失败");
    }
  } catch (err) {
    console.error("复制失败:", err);
    notify({
      type: "error",
      title: translate("copy-failed"),
      description: translate("copy-failed-desc")
    });
    return false;
  }
};

// 获取密码并显示模态框
const showPasswordInfo = async (item: T) => {
  // 检查是否有加密（全篇加密或部分加密）
  const isEncrypted = item.encrypt || (item.encryptBlocks && item.encryptBlocks.length > 0);
  if (!isEncrypted) return;

  // 重置密码信息，确保不会显示之前的密码
  passwordInfo.value = null;
  currentItem.value = item;
  loadingPassword.value = true;

  try {
    const backupConfig = getBackupConfig();
    if (backupConfig.github) {
      const backups = await getPasswordBackups(backupConfig.github);
      if (backups) {
        const entry = backups.entries.find(
          e => e.id === item.id
        );
        if (entry) {
          passwordInfo.value = {
            password: entry.password,
            title: entry.title || item.title,
            date: entry.date,
            encryptType: item.encrypt ? "full" : "partial"
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to get password:", error);
  } finally {
    loadingPassword.value = false;
    showPasswordModal.value = true;
  }
};

const searchedList = computed(() => {
  return decryptedList.value.filter((item) => {
    return props.filterFn(item, searchValue.value);
  });
});

// 分页相关
const pageSize = usePageSize(`manage-${targetTab}-page-size`, 10);
const currentPage = ref(1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return searchedList.value.slice(start, end);
});

// 当搜索条件变化时，重置到第一页
watch(searchedList, () => {
  currentPage.value = 1;
});

const slots = defineSlots<Record<string, (_: { item: T; dataUrl: string; key: any }) => void>>();
const header = Object.keys(slots).filter(
  key => !key.startsWith("_")
);

const showConfirmModal = ref<boolean>(false);
const selectedList = reactive<CommonItem[]>([]);

const { statusText, canCommit, processing, toggleProcessing } = useStatusText();

watch([list, searchValue], () => {
  selectedList.splice(0, selectedList.length);
});

const newListToUpdate = computed(() => originList.filter(item =>
  selectedList.find(selected => selected.id === item.id) === undefined
));

const changeSelect = (item: CommonItem) => {
  if (selectedList.includes(item)) {
    selectedList.splice(selectedList.indexOf(item), 1);
  } else {
    selectedList.push(item);
  }
};

const deleteSelect = async () => {
  showConfirmModal.value = false;
  toggleProcessing();
  try {
    await deleteList(newListToUpdate.value, selectedList.map(item => ({ item, md: "(content not loaded)" })));
  } finally {
    toggleProcessing();
  }
};
</script>

<template>
  <main class="p-4 max-md:px-2">
    <div class="overflow-hidden">
      <div class="flex flex-wrap items-center gap-2 pb-2">
        <div class="relative grow md:max-w-sm">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search class="size-5 text-dark-400" />
          </div>
          <input
            v-model="searchValue"
            type="text"
            class="w-full pl-10"
            :placeholder="$t('input-text-to-search')"
          >
        </div>

        <div class="ml-auto flex items-center">
          <span
            v-show="!!statusText"
            class="ml-auto mr-4 text-xs text-red-500"
          >{{ statusText }}</span>

          <div class="flex items-center gap-3">
            <NuxtLink :to="`/manage${targetTab}/0`">
              <CommonButton
                :icon="Plus"
                theme="primary"
                :disabled="!canCommit"
              >
                {{ $t('new') }}
              </CommonButton>
            </NuxtLink>
            <CommonButton
              :icon="Trash2"
              theme="danger"
              :disabled="!canCommit || !selectedList.length"
              :loading="processing"
              data-testid="list-delete-btn"
              @click="showConfirmModal = true"
            >
              {{ $t('del') }}
            </CommonButton>
          </div>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full border-collapse divide-y divide-dark-200 border border-dark-300 dark:divide-dark-700 dark:border-dark-600">
          <thead>
            <tr>
              <th :class="twMerge($style.th, 'max-md:hidden')">
                ID
              </th>
              <th
                v-for="head in header"
                :key="head"
                :class="$style.th"
              >
                {{ $t(head) }}
              </th>
              <th :class="$style.th">
                {{ $t('date') }}
              </th>
              <th :class="twMerge($style.th, 'max-md:hidden')">
                {{ $t('encrypted') }}
              </th>
              <th :class="$style.th">
                {{ $t('select') }}
              </th>
            </tr>
          </thead>
          <tbody
            data-testid="list-items"
            class="divide-y divide-dark-200 bg-white dark:divide-dark-700 dark:bg-dark-800"
          >
            <tr
              v-for="item, idx in paginatedList"
              :key="item.id"
              :class="twMerge(
                'transition-colors hover:bg-dark-50 dark:hover:bg-dark-700',
                isItemStaged(item.id, targetTab) && 'bg-green-50 dark:bg-green-900/20'
              )"
            >
              <td :class="twMerge($style.td, 'max-md:hidden')">
                {{ item.id }}
              </td>
              <slot
                v-for="key, idx1 in header"
                :key="idx1"
                :name="key"
                :item="item"
                :data-url="`/manage${targetTab}/${item.customSlug || item.id}`"
              />
              <td :class="twMerge($style.td, 'break-all')">
                {{ formatTime(item.time, 'date') }}
              </td>
              <td :class="twMerge($style.td, 'max-md:hidden')">
                <div
                  v-if="item.encrypt || (item.encryptBlocks && item.encryptBlocks.length > 0)"
                  class="flex items-center gap-2"
                >
                  <button
                    class="cursor-pointer transition-colors hover:opacity-80"
                    :class="item.encrypt ? 'text-red-500' : 'text-orange-500'"
                    :title="item.encrypt ? '全篇加密' : '部分加密'"
                    @click="showPasswordInfo(item)"
                  >
                    <LockKeyhole
                      v-if="item.encrypt"
                      class="size-4"
                    />
                    <Lock
                      v-else
                      class="size-4"
                    />
                  </button>
                </div>
              </td>
              <td :class="$style.td">
                <CommonCheckbox
                  :checked="selectedList.includes(item)"
                  :test-id="`list-item-check-${idx}`"
                  @change="changeSelect(item)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页组件 -->
      <common-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total-items="searchedList.length"
        :page-size-options="[5, 10, 20, 50, 100]"
        class="mt-6"
      />
    </div>
  </main>

  <common-modal
    v-model="showConfirmModal"
    confirm-theme="danger"
    ok-test-id="confirm-list-delete"
    @confirm="deleteSelect"
  >
    <template #title>
      {{ $t('confirm-delete') }}
    </template>
    <template #body>
      <p v-html="$t('selected-items', [selectedList.length])" />
    </template>
  </common-modal>

  <!-- 密码信息模态框 -->
  <common-modal
    v-model="showPasswordModal"
    ok-test-id="password-modal-close"
    @confirm="showPasswordModal = false"
  >
    <template #title>
      {{ $t('password-info') }}
    </template>
    <template #body>
      <div
        v-if="loadingPassword"
        class="py-4 text-center"
      >
        <p>加载密码中...</p>
      </div>
      <div
        v-else-if="passwordInfo"
        class="space-y-4"
      >
        <div>
          <label class="mb-1 block text-sm font-medium text-dark-700">
            {{ translate('encryption-type') }}
          </label>
          <p class="text-sm text-dark-500">
            <span
              v-if="passwordInfo.encryptType === 'full'"
              class="text-red-500"
            >{{ translate('full-encryption') }}</span>
            <span
              v-else
              class="text-orange-500"
            >{{ translate('partial-encryption') }}</span>
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-dark-700">
            {{ $t('title') }}
          </label>
          <p class="text-sm text-dark-500">
            {{ passwordInfo.title || $t('no-title') }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-dark-700">
            {{ $t('password') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              :value="passwordInfo.password"
              readonly
              class="flex-1 rounded-md border border-dark-300 px-3 py-2 text-sm"
            >
            <client-only>
              <button
                class="rounded-md bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                @click="async () => {
                  if (passwordInfo) {
                    await copyPassword(passwordInfo.password);
                  }
                }"
              >
                {{ translate('copy') }}
              </button>
            </client-only>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-dark-700">
            {{ $t('backup-date') }}
          </label>
          <p class="text-sm text-dark-500">
            {{ formatTime(new Date(passwordInfo.date).getTime(), 'datetime') }}
          </p>
        </div>
      </div>
      <div
        v-else
        class="py-4 text-center"
      >
        <p>{{ $t('password-not-found') }}</p>
      </div>
    </template>
  </common-modal>
</template>

<style module>
.th {
  @apply px-4 py-3 text-left text-sm font-medium break-keep sticky top-0 tracking-wider text-dark-500 dark:text-dark-300 bg-dark-50 dark:bg-dark-700;
}

.td {
  @apply whitespace-nowrap py-6 px-4 text-sm text-dark-500 dark:text-dark-400;
}
</style>
