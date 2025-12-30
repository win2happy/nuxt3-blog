<script setup lang="ts" generic="T extends CommonItem">
import { createCommit, deleteList } from "ls:~/utils/nuxt/manage/github";
import { FolderOpen, Hash, Lock, MessageCircleMore, Save, Trash2, Upload } from "lucide-vue-next";
import MdEditor from "~/pages/manage/comps/md-editor.vue";
import type { CommonItem } from "~/utils/common/types";
import { translate } from "~/utils/nuxt/i18n";
import { formatTime } from "~/utils/nuxt/format-time";

import { useManageContent, deleteItem, editItem } from "~/utils/nuxt/manage/detail";
import { notify } from "~/utils/nuxt/notify";
import { useStaging, type StagedItem } from "~/utils/hooks/useStaging";
import { getProcessedUploadInfo } from "~/utils/nuxt/manage/item-processor";
import { encryptDecryptItem } from "~/utils/common/process-encrypt-decrypt";
import { deepClone } from "~/utils/nuxt/utils";

const props = defineProps<{
  preProcessItem?: (editingItem: Ref<T>, originList: T[]) => void;
}>();

const encryptor = useEncryptor();
const showPwdModal = useShowPwdModal();
const { stageItem, stagedItems, getStagedItem, deleteStagedItem } = useStaging();

// 检查当前项目是否有暂存内容
const hasCurrentStaged = computed(() => {
  return currentTabStagedItems.value.length > 0;
});

const slots = defineSlots<Record<string, (_: { item: T; disabled: boolean }) => void>>();

const slotsRow = computed(() => Object.keys(slots).filter(key => !key.startsWith("_")));

const {
  originList,
  decryptedItem,
  decryptedMd,
  editingItem,
  editingMd,
  decrypted,

  statusText,
  processing,
  toggleProcessing,

  canUpload,
  canDelete,
  targetTab,
  isNew
} = await useManageContent<T>();

props.preProcessItem?.(editingItem, originList);

const currentOperate = ref<"upload" | "delete" | "">("");
const showDeleteModal = ref(false);

const baseInfo = ref<HTMLElement>();

const isValidUrlSegment = computed(() => !editingItem.value.customSlug || /^[a-zA-Z0-9\-_]+$/.test(editingItem.value.customSlug));

const doUpload = async () => {
  const info = await getProcessedUploadInfo({
    editingItem: editingItem.value,
    editingMd: editingMd.value,
    targetTab,
    originList,
    isNew,
    encryptor,
    baseInfoElement: baseInfo.value
  });
  if (!info) {
    return;
  }
  const { item: newItem, md } = info;
  currentOperate.value = "upload";
  toggleProcessing();
  try {
    const success = await createCommit(`Update ${targetTab.replace("/", "")}-${newItem.id}`, {
      additions: [
        {
          path: `public/rebuild/json${targetTab}.json`,
          content: JSON.stringify(editItem(originList, newItem))
        },
        {
          path: `public/rebuild${targetTab}/${newItem.id}.md`,
          content: md
        }
      ]
    });
    if (success) {
      useUnsavedContent().value = false;
    }
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};

const doDelete = async () => {
  showDeleteModal.value = false;
  currentOperate.value = "delete";
  toggleProcessing();
  try {
    await deleteList(deleteItem(originList, unref(editingItem)), [{ item: decryptedItem.value, md: decryptedMd.value }]);
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};

const showLoadStagedModal = ref(false);
const showSelectStagedModal = ref(false);
const showClearAllStagedModal = ref(false);
const stagedItemToLoad = ref<{ item: T; md: string } | null>(null);

// 追踪当前编辑内容是否来自加载的暂存（用于避免重复生成 ID）
const loadedFromStagedId = ref<number | null>(null);

// 获取当前 tab 的所有暂存项目
const currentTabStagedItems = computed(() => {
  return stagedItems.value.filter(item => item.targetTab === targetTab);
});

const doStage = async () => {
  // 判断是否应该作为新项目处理
  // 如果从暂存加载的，使用加载的 ID；否则根据 isNew 判断
  const shouldGenerateNewId = loadedFromStagedId.value === null && isNew;

  const processedInfo = await getProcessedUploadInfo({
    editingItem: editingItem.value,
    editingMd: editingMd.value,
    targetTab,
    originList,
    isNew: shouldGenerateNewId, // 使用计算后的值
    encryptor,
    baseInfoElement: baseInfo.value
  });

  if (!processedInfo) {
    return;
  }

  // 如果从暂存加载的，确保使用原暂存的 ID（覆盖而不是新增）
  if (loadedFromStagedId.value !== null) {
    processedInfo.item.id = loadedFromStagedId.value;
  }

  stageItem(processedInfo.item, processedInfo.md, targetTab);

  // 如果是新文章且生成了新 ID，更新当前编辑项的 ID 和追踪标记
  if (shouldGenerateNewId && processedInfo.item.id !== editingItem.value.id) {
    editingItem.value.id = processedInfo.item.id;
    loadedFromStagedId.value = processedInfo.item.id; // 标记为从暂存加载
  }

  notify({
    type: "success",
    title: translate("staged"),
    description: translate("staged-items-count", [stagedItems.value.length])
  });
};

const overrideEditingItem = async (item: T, md: string) => {
  if ((item.encrypt || item.encryptBlocks) && !encryptor.usePasswd.value) {
    notify({
      type: "error",
      title: translate("need-passwd")
    });
    showPwdModal.value = true;
    return;
  }
  // 更新编辑中的内容
  if (item.encrypt) {
    await encryptDecryptItem(item, encryptor.decrypt, targetTab);
    editingMd.value = await encryptor.decrypt(md);
  }
  editingItem.value = item;

  if (item.encryptBlocks) {
    let newMarkdownContent = md;
    for (const block of item.encryptBlocks) {
      const { start, end } = block;
      newMarkdownContent = newMarkdownContent.slice(0, start) + await encryptor.decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
    }
    editingMd.value = newMarkdownContent;
  } else if (!item.encrypt) {
    editingMd.value = md;
  }

  notify({
    type: "success",
    title: translate("staged-content-loaded"),
    description: translate("staged-content-loaded-desc")
  });
};

// 打开选择暂存项目的模态框
const loadStagedForCurrentItem = () => {
  const currentId = Number(editingItem.value.id);
  const stagedItem = getStagedItem<T>(currentId, targetTab);

  // 如果当前项目有暂存，直接加载
  if (stagedItem && currentTabStagedItems.value.length === 1) {
    stagedItemToLoad.value = {
      item: deepClone(toRaw(stagedItem.item)) as T,
      md: stagedItem.md
    };
    showLoadStagedModal.value = true;
  } else if (currentTabStagedItems.value.length > 0) {
    // 如果有多个暂存项目，打开选择界面
    showSelectStagedModal.value = true;
  }
};

// 选择一个暂存项目进行加载
const selectStagedItem = (stagedItem: StagedItem<T>) => {
  stagedItemToLoad.value = {
    item: deepClone(toRaw(stagedItem.item)) as T,
    md: stagedItem.md
  };
  showSelectStagedModal.value = false;
  showLoadStagedModal.value = true;
};

// 删除当前项目的暂存内容
const deleteStagedForCurrentItem = () => {
  if (!loadedFromStagedId.value && editingItem.value.id === 0) {
    notify({
      type: "warn",
      title: translate("warning"),
      description: translate("no-current-staged-to-delete")
    });
    return;
  }

  const idToDelete = loadedFromStagedId.value || editingItem.value.id;
  deleteStagedItem(idToDelete, targetTab);

  // 清除追踪标记
  loadedFromStagedId.value = null;

  notify({
    type: "success",
    title: translate("current-staged-deleted"),
    description: translate("current-staged-deleted-desc")
  });
};

// 打开清空所有暂存的确认框
const clearAllStagedForCurrentTab = () => {
  if (currentTabStagedItems.value.length === 0) {
    notify({
      type: "warn",
      title: translate("warning"),
      description: translate("no-staged-items-to-clear")
    });
    return;
  }
  showClearAllStagedModal.value = true;
};

// 确认清空当前分类的所有暂存内容
const confirmClearAllStaged = () => {
  showClearAllStagedModal.value = false;

  // 删除当前 tab 的所有暂存项
  const itemsToRemove = currentTabStagedItems.value.map(item => ({
    id: item.id,
    targetTab: item.targetTab
  }));

  for (const item of itemsToRemove) {
    deleteStagedItem(item.id, item.targetTab);
  }

  // 清除追踪标记
  loadedFromStagedId.value = null;

  notify({
    type: "success",
    title: translate("all-staged-cleared"),
    description: translate("all-staged-cleared-desc", [itemsToRemove.length])
  });
};

// 加载暂存的内容
const loadStagedContent = async () => {
  if (stagedItemToLoad.value) {
    // 记录加载的暂存 ID，后续暂存时会覆盖而不是新增
    loadedFromStagedId.value = stagedItemToLoad.value.item.id;
    await overrideEditingItem(deepClone(toRaw(stagedItemToLoad.value.item)) as T, stagedItemToLoad.value.md);
  }
  showLoadStagedModal.value = false;
  stagedItemToLoad.value = null;
};

// 取消加载暂存内容
const cancelLoadStaged = () => {
  showLoadStagedModal.value = false;
  stagedItemToLoad.value = null;
};

// 页面加载完成后初始化暂存项目并检查暂存项目
onMounted(() => {
  nextTick(() => {
    const currentId = Number(editingItem.value.id);
    const stagedItem = stagedItems.value.find(
      item => item.id === currentId && item.targetTab === targetTab
    ) as StagedItem<T>;

    if (stagedItem) {
      stagedItemToLoad.value = {
        item: stagedItem.item,
        md: stagedItem.md
      };
      showLoadStagedModal.value = true;
    }
  });
});
</script>

<template>
  <main class="!bg-transparent !shadow-none">
    <div :class="twMerge($style.box, 'mb-6 flex flex-wrap items-center gap-3')">
      <div class="flex flex-wrap items-center gap-2">
        <CommonButton
          size="small"
          :disabled="!hasCurrentStaged"
          :icon="FolderOpen"
          data-testid="load-staged-btn"
          @click="loadStagedForCurrentItem"
        >
          {{ $t('load-staged') }}
          <span
            v-if="hasCurrentStaged"
            class="dark:bg-primary-900/30 ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-400"
          >
            {{ currentTabStagedItems.length }}
          </span>
        </CommonButton>
        <CommonButton
          size="small"
          :disabled="!hasCurrentStaged"
          :icon="Trash2"
          data-testid="delete-staged-btn"
          @click="deleteStagedForCurrentItem"
        >
          {{ $t('delete-current-staged') }}
        </CommonButton>
        <CommonButton
          size="small"
          :disabled="!hasCurrentStaged"
          :icon="Trash2"
          theme="danger"
          data-testid="clear-all-staged-btn"
          @click="clearAllStagedForCurrentTab"
        >
          {{ $t('clear-all-staged') }}
        </CommonButton>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-4">
        <span
          v-show="!!statusText"
          class="ml-2 text-xs text-red-500"
        >{{ statusText }}</span>
        <CommonButton
          :icon="Save"
          :disabled="!canUpload || currentOperate === 'delete' || !decrypted"
          data-testid="item-stage-btn"
          @click="doStage"
        >
          {{ $t('save-staged') }}
        </CommonButton>
        <CommonButton
          :icon="Upload"
          :disabled="!canUpload || currentOperate === 'delete' || !decrypted"
          :loading="processing && currentOperate === 'upload'"
          data-testid="item-upload-btn"
          theme="primary"
          @click="doUpload"
        >
          {{ $t(isNew ? "publish" : "update") }}
        </CommonButton>
        <CommonButton
          v-if="!isNew"
          theme="danger"
          :icon="Trash2"
          :disabled="!canDelete || currentOperate === 'upload'"
          :loading="processing && currentOperate === 'delete'"
          data-testid="item-delete-btn"
          @click="showDeleteModal = true"
        >
          {{ $t('del') }}
        </CommonButton>
      </div>
    </div>

    <div
      ref="baseInfo"
      :class="twMerge($style.box, $style.form)"
      :title="editingItem.encrypt && !decrypted ? $t('need-decrypt') : ''"
    >
      <div class="mb-4 flex gap-6 border-b border-dark-200 pb-4 dark:border-dark-700">
        <div class="!flex-row items-center !gap-3">
          <span>
            <Lock class="inline-block size-5" />
            {{ $t('encrypt') }}
          </span>
          <common-checkbox
            :checked="editingItem.encrypt"
            :disabled="!decrypted"
            :title="!decrypted ? $t('decrypt-blocks') : ''"
            test-id="item-encrypt-checkbox"
            @change="editingItem.encrypt = $event"
          />
        </div>
        <div class="!flex-row items-center !gap-3">
          <span>
            <MessageCircleMore class="inline-block size-5" />
            {{ $t('show-comments') }}
          </span>
          <common-checkbox
            :checked="editingItem.showComments"
            :disabled="!decrypted"
            :title="$t('show-comments')"
            test-id="item-show-comment-checkbox"
            @change="editingItem.showComments = $event"
          />
        </div>
      </div>

      <div class="mt-4 space-y-4">
        <div>
          <span :class="!isValidUrlSegment && 'form-item-invalid'">
            <Hash class="size-5" />
            {{ $t('custom-slug') }}
          </span>
          <input
            v-model="editingItem.customSlug"
            data-testid="item-slug-input"
            placeholder="[a-zA-Z0-9\-_]*"
            :disabled="!decrypted"
          >
        </div>
        <slot
          v-for="slot in slotsRow"
          :name="slot"
          :item="editingItem"
          :disabled="!decrypted"
        />
      </div>
    </div>
  </main>

  <div
    :class="twMerge($style.box, 'max-md:!px-0')"
  >
    <client-only>
      <md-editor
        v-model="editingMd"
        :disabled="!decrypted"
      />
    </client-only>
  </div>

  <common-modal
    v-model="showDeleteModal"
    confirm-theme="danger"
    ok-test-id="confirm-item-delete"
    @confirm="doDelete"
  >
    <template #title>
      {{ $t('confirm-delete') }}
    </template>
  </common-modal>

  <common-modal
    v-model="showLoadStagedModal"
    modal-width="600px"
    test-id="load-staged-modal"
    ok-test-id="load-staged-ok-btn"
    cancel-test-id="load-staged-cancel-btn"
    @ok="loadStagedContent"
    @after-close="cancelLoadStaged"
  >
    <template #title>
      {{ $t('load-staged-changes') }}
    </template>
    <template #body>
      <div class="space-y-4">
        <p>{{ $t('staged-changes-found') }}</p>
        <div
          v-if="stagedItemToLoad"
          class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
        >
          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">{{ $t('staged-time') }}:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">
                {{ formatTime(stagedItemToLoad.item.modifyTime || stagedItemToLoad.item.time, 'full') }}
              </span>
            </div>
            <div class="flex items-center">
              <span class="font-medium">{{ $t('title') }}:</span>
              <span class="ml-2 truncate">
                {{ 'title' in stagedItemToLoad.item ? stagedItemToLoad.item.title : `${$t('item')} ${stagedItemToLoad.item.id}` }}
              </span>
            </div>
            <div>
              <span class="font-medium">{{ $t('content-preview') }}:</span>
              <div class="mt-1 max-h-40 overflow-y-auto whitespace-pre rounded bg-white p-2 text-xs dark:bg-gray-700">
                {{ stagedItemToLoad.md }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </common-modal>

  <!-- 选择暂存项目的模态框 -->
  <common-modal
    v-model="showSelectStagedModal"
    modal-width="700px"
    test-id="select-staged-modal"
    :show-footer="false"
  >
    <template #title>
      <span>{{ $t('select-staged-item') }}</span>
    </template>
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-dark-500 dark:text-dark-400">
          {{ $t('select-staged-item-desc', [currentTabStagedItems.length]) }}
        </p>
        <div class="max-h-96 space-y-2 overflow-y-auto">
          <div
            v-for="item in currentTabStagedItems"
            :key="`${item.targetTab}-${item.id}`"
            class="dark:hover:bg-primary-900/20 cursor-pointer rounded-lg border border-dark-200 p-4 transition hover:border-primary-500 hover:bg-primary-50 dark:border-dark-700 dark:hover:border-primary-400"
            @click="selectStagedItem(item as StagedItem<T>)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 overflow-hidden">
                <div class="mb-1 flex items-center gap-2">
                  <h4 class="truncate font-medium text-dark-700 dark:text-dark-300">
                    {{ 'title' in item.item ? item.item.title : `${$t('item')} ${item.id}` }}
                  </h4>
                  <span
                    v-if="item.id === editingItem.id"
                    class="dark:bg-primary-900/30 shrink-0 rounded bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:text-primary-400"
                  >
                    {{ $t('current') }}
                  </span>
                </div>
                <div class="mb-2 flex items-center gap-3 text-xs text-dark-500 dark:text-dark-400">
                  <span>ID: {{ item.id }}</span>
                  <span>{{ formatTime(item.item.modifyTime || item.item.time, 'full') }}</span>
                </div>
                <div
                  v-if="'tags' in item.item && item.item.tags"
                  class="flex flex-wrap gap-1"
                >
                  <span
                    v-for="tag in (item.item.tags as string[]).slice(0, 3)"
                    :key="tag"
                    class="rounded bg-dark-100 px-2 py-0.5 text-xs text-dark-600 dark:bg-dark-700 dark:text-dark-400"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="(item.item.tags as string[]).length > 3"
                    class="rounded bg-dark-100 px-2 py-0.5 text-xs text-dark-600 dark:bg-dark-700 dark:text-dark-400"
                  >
                    +{{ (item.item.tags as string[]).length - 3 }}
                  </span>
                </div>
              </div>
              <div class="shrink-0 text-primary-500 dark:text-primary-400">
                <svg
                  class="size-5"
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
        </div>
      </div>
    </template>
  </common-modal>

  <!-- 清空所有暂存的确认框 -->
  <common-modal
    v-model="showClearAllStagedModal"
    confirm-theme="danger"
    test-id="clear-all-staged-modal"
    ok-test-id="confirm-clear-all-staged"
    @confirm="confirmClearAllStaged"
  >
    <template #title>
      {{ $t('confirm-clear-all-staged') }}
    </template>
    <template #body>
      <div class="space-y-3">
        <p>{{ $t('confirm-clear-all-staged-desc', [currentTabStagedItems.length]) }}</p>
        <p class="text-sm text-red-500 dark:text-red-400">
          {{ $t('this-action-cannot-be-undone') }}
        </p>
      </div>
    </template>
  </common-modal>
</template>

<style module>
.box {
  @apply p-4 max-md:px-2 bg-white dark:bg-dark-800 shadow-sm rounded-lg border border-dark-100 dark:border-dark-700;
}

.form {
  @apply my-6;

  :global(>div >div) {
    @apply flex flex-col gap-2;

    >span:first-of-type {
      @apply flex items-center gap-1 after:content-[":"] text-sm text-dark-600 dark:text-dark-300;
      svg {
        @apply opacity-70;
      }
    }
  }
}
</style>
