<script setup lang="ts">
import { nextTick, watch } from "vue";
import { Key, Eye, EyeOff, Copy, RefreshCw, Trash2, Save, AlertTriangle, ChevronDown, ChevronUp, FileText, Image, BookOpen } from "lucide-vue-next";
import { translate } from "~/utils/nuxt/i18n";
import { notify } from "~/utils/nuxt/notify";
import {
  getPasswordBackups,
  getPasswordBackupsByType,
  getBackupConfig,
  updatePassword,
  deletePasswordEntry,
  triggerRedeploy,
  getContentTypeName,
  type PasswordBackupEntry,
  type GithubBackupConfig
} from "~/utils/nuxt/manage/password-backup";
import { formatTime } from "~/utils/nuxt/format-time";

// 状态
const loading = ref(false);
const passwords = ref<PasswordBackupEntry[]>([]);
const githubConfig = ref<GithubBackupConfig | null>(null);

// 折叠状态
const collapsedSections = ref<Record<string, boolean>>({
  article: false,
  record: false,
  knowledge: false
});

// 查看密码弹窗
const showViewModal = ref(false);
const selectedEntry = ref<PasswordBackupEntry | null>(null);
const showPassword = ref(false);

// 修改密码弹窗
const showEditModal = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const editingEntry = ref<PasswordBackupEntry | null>(null);
const updating = ref(false);

// 删除确认弹窗
const showDeleteModal = ref(false);
const deletingEntry = ref<PasswordBackupEntry | null>(null);

// 重新部署弹窗
const showRedeployModal = ref(false);
const redeploying = ref(false);

// 调试信息
const showDebug = ref(false);
const debugInfo = ref("");

// 内容类型配置
const contentTypes = [
  { key: "article", label: "文章", icon: FileText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "record", label: "记录", icon: Image, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { key: "knowledge", label: "文化", icon: BookOpen, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" }
] as const;

// 按类型分组的密码
const groupedPasswords = computed(() => {
  console.log("[PasswordManager] Computing groupedPasswords, passwords.length:", passwords.value.length);
  console.log("[PasswordManager] passwords:", passwords.value);

  const grouped: Record<string, PasswordBackupEntry[]> = {
    article: [],
    record: [],
    knowledge: []
  };

  for (const entry of passwords.value) {
    console.log("[PasswordManager] Processing entry:", entry.contentType, entry.id, entry.title);
    if (grouped[entry.contentType]) {
      grouped[entry.contentType].push(entry);
      console.log("[PasswordManager] Added to group:", entry.contentType);
    } else {
      console.log("[PasswordManager] Unknown contentType:", entry.contentType);
    }
  }

  // 每个组内按时间倒序排序
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => b.timestamp - a.timestamp);
  }

  console.log("[PasswordManager] Grouped result:", {
    article: grouped.article.length,
    record: grouped.record.length,
    knowledge: grouped.knowledge.length
  });

  return grouped;
});

// 切换折叠状态
function toggleSection(type: string) {
  collapsedSections.value[type] = !collapsedSections.value[type];
}

// 展开所有
function expandAll() {
  for (const key of Object.keys(collapsedSections.value)) {
    collapsedSections.value[key] = false;
  }
}

// 折叠所有
function collapseAll() {
  for (const key of Object.keys(collapsedSections.value)) {
    collapsedSections.value[key] = true;
  }
}

// 加载密码列表（按类型分别读取）
async function loadPasswords() {
  loading.value = true;
  const logs: string[] = [];
  logs.push("开始加载密码列表（按类型分别读取）...");

  try {
    const config = getBackupConfig();
    logs.push(`GitHub 配置: ${JSON.stringify(config.github, null, 2)}`);

    githubConfig.value = config.github || null;

    if (!config.github?.enabled) {
      logs.push("错误: GitHub 备份未启用");
      notify({
        type: "warn",
        title: translate("password-backup-not-enabled"),
        description: translate("password-backup-not-enabled-desc")
      });
      debugInfo.value = logs.join("\n");
      loading.value = false;
      return;
    }

    // 按类型分别读取
    const allEntries: PasswordBackupEntry[] = [];
    const types = ["article", "record", "knowledge"] as const;

    for (const type of types) {
      logs.push(`正在读取 ${type} 类型的密码...`);
      const entries = await getPasswordBackupsByType(config.github, type);
      logs.push(`  ${type}: ${entries.length} 条`);
      allEntries.push(...entries);
    }

    // 按时间倒序排序
    allEntries.sort((a, b) => b.timestamp - a.timestamp);

    passwords.value = allEntries;
    logs.push(`总计: ${allEntries.length} 条密码`);
  } catch (error: any) {
    logs.push(`错误: ${error.message}`);
    console.error("[PasswordManager] Load passwords failed:", error);
    notify({
      type: "error",
      title: translate("load-failed"),
      description: translate("password-load-failed-desc")
    });
  } finally {
    loading.value = false;
    logs.push(`最终密码数组长度: ${passwords.value.length}`);
    debugInfo.value = logs.join("\n");
  }
}

// 查看密码
function viewPassword(entry: PasswordBackupEntry) {
  selectedEntry.value = entry;
  showPassword.value = false;
  showViewModal.value = true;
}

// 复制密码
async function copyPassword(password: string) {
  try {
    await navigator.clipboard.writeText(password);
    notify({
      type: "success",
      title: translate("copy-successful"),
      description: translate("password-copied")
    });
  } catch {
    notify({
      type: "error",
      title: translate("copy-failed"),
      description: translate("copy-failed-desc")
    });
  }
}

// 打开修改密码弹窗
function openEditModal(entry: PasswordBackupEntry) {
  editingEntry.value = entry;
  newPassword.value = "";
  confirmPassword.value = "";
  showEditModal.value = true;
}

// 保存新密码
async function savePassword() {
  if (!editingEntry.value || !githubConfig.value) return;

  // 验证密码
  if (!newPassword.value) {
    notify({
      type: "error",
      title: translate("error"),
      description: translate("password-required")
    });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    notify({
      type: "error",
      title: translate("error"),
      description: translate("password-not-match")
    });
    return;
  }

  updating.value = true;
  try {
    const success = await updatePassword(editingEntry.value, newPassword.value, githubConfig.value);

    if (success) {
      notify({
        type: "success",
        title: translate("password-updated"),
        description: translate("password-updated-desc")
      });

      showEditModal.value = false;

      // 询问是否重新部署
      setTimeout(() => {
        showRedeployModal.value = true;
      }, 300);

      // 刷新列表
      await loadPasswords();
    } else {
      notify({
        type: "error",
        title: translate("update-failed"),
        description: translate("password-update-failed-desc")
      });
    }
  } catch (error) {
    console.error("[PasswordManager] Save password failed:", error);
    notify({
      type: "error",
      title: translate("update-failed"),
      description: translate("password-update-failed-desc")
    });
  } finally {
    updating.value = false;
  }
}

// 打开删除确认弹窗
function openDeleteModal(entry: PasswordBackupEntry) {
  deletingEntry.value = entry;
  showDeleteModal.value = true;
}

// 删除密码条目
async function confirmDelete() {
  if (!deletingEntry.value || !githubConfig.value) return;

  try {
    const success = await deletePasswordEntry(deletingEntry.value, githubConfig.value);

    if (success) {
      notify({
        type: "success",
        title: translate("password-deleted"),
        description: translate("password-deleted-desc")
      });

      showDeleteModal.value = false;
      await loadPasswords();
    } else {
      notify({
        type: "error",
        title: translate("delete-failed"),
        description: translate("password-delete-failed-desc")
      });
    }
  } catch (error) {
    console.error("[PasswordManager] Delete password failed:", error);
    notify({
      type: "error",
      title: translate("delete-failed"),
      description: translate("password-delete-failed-desc")
    });
  }
}

// 触发重新部署
async function confirmRedeploy() {
  if (!githubConfig.value) return;

  redeploying.value = true;
  try {
    const success = await triggerRedeploy(githubConfig.value);

    if (success) {
      notify({
        type: "success",
        title: translate("redeploy-triggered"),
        description: translate("redeploy-triggered-desc")
      });

      showRedeployModal.value = false;
    } else {
      notify({
        type: "error",
        title: translate("redeploy-failed"),
        description: translate("redeploy-failed-desc")
      });
    }
  } catch (error) {
    console.error("[PasswordManager] Redeploy failed:", error);
    notify({
      type: "error",
      title: translate("redeploy-failed"),
      description: translate("redeploy-failed-desc")
    });
  } finally {
    redeploying.value = false;
  }
}

// 直接测试加载
async function testDirectLoad() {
  const logs: string[] = [];
  logs.push("=== 直接测试加载 ===");

  try {
    const config = getBackupConfig();
    logs.push(`GitHub enabled: ${config.github?.enabled}`);
    logs.push(`GitHub owner: ${config.github?.owner}`);
    logs.push(`GitHub repo: ${config.github?.repo}`);
    logs.push(`GitHub filePath: ${config.github?.filePath}`);
    logs.push(`GitHub branch: ${config.github?.branch}`);

    if (!config.github?.enabled) {
      logs.push("错误: GitHub 未启用");
      debugInfo.value = logs.join("\n");
      return;
    }

    logs.push("调用 getPasswordBackups...");
    const data = await getPasswordBackups(config.github);
    logs.push(`返回结果: ${data ? "有数据" : "无数据"}`);

    if (data) {
      logs.push(`条目数: ${data.entries?.length || 0}`);

      // 显示每个条目的 contentType
      if (data.entries && data.entries.length > 0) {
        logs.push("条目列表:");
        data.entries.forEach((entry, index) => {
          logs.push(`  ${index + 1}. ID=${entry.id}, contentType="${entry.contentType}", title="${entry.title}"`);
        });
      }

      // 直接更新 passwords
      passwords.value = data.entries || [];
      logs.push(`已更新 passwords 数组，长度: ${passwords.value.length}`);

      // 验证更新后的数组
      logs.push("更新后的 passwords 数组:");
      passwords.value.forEach((entry, index) => {
        logs.push(`  ${index + 1}. ID=${entry.id}, contentType="${entry.contentType}", title="${entry.title}"`);
      });
    } else {
      logs.push("未获取到数据");
    }
  } catch (error: any) {
    logs.push(`错误: ${error.message}`);
    logs.push(`堆栈: ${error.stack}`);
  }

  debugInfo.value = logs.join("\n");
}

// 监控 passwords 数组变化
watch(passwords, (newVal) => {
  console.log("[PasswordManager] passwords changed:", newVal.length, newVal);
}, { deep: true });

// 监控 groupedPasswords 变化
watch(groupedPasswords, (newVal) => {
  console.log("[PasswordManager] groupedPasswords changed:", {
    article: newVal.article.length,
    record: newVal.record.length,
    knowledge: newVal.knowledge.length
  });
}, { deep: true });

// 页面加载时获取密码列表
onMounted(async () => {
  console.log("[PasswordManager] onMounted called");
  await nextTick();
  console.log("[PasswordManager] after nextTick");
  await loadPasswords();
  console.log("[PasswordManager] after loadPasswords");
});
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- 页面标题 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-dark-800 dark:text-dark-100">
          {{ $t('password-manager') }}
        </h1>
        <p class="mt-1 text-sm text-dark-500 dark:text-dark-400">
          {{ $t('password-manager-desc') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <CommonButton
          size="small"
          @click="expandAll"
        >
          {{ $t('expand-all') }}
        </CommonButton>
        <CommonButton
          size="small"
          @click="collapseAll"
        >
          {{ $t('collapse-all') }}
        </CommonButton>
        <CommonButton
          :icon="RefreshCw"
          :loading="loading"
          @click="loadPasswords"
        >
          {{ $t('refresh') }}
        </CommonButton>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-yellow-800 dark:text-yellow-200">调试信息</span>
        <div class="flex items-center gap-2">
          <button
            class="rounded bg-yellow-200 px-2 py-1 text-xs text-yellow-800 hover:bg-yellow-300 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700"
            @click="testDirectLoad"
          >
            直接测试加载
          </button>
          <button
            class="text-xs text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            @click="showDebug = !showDebug"
          >
            {{ showDebug ? '隐藏' : '显示' }}
          </button>
        </div>
      </div>
      <pre
        v-if="showDebug"
        class="mt-2 max-h-40 overflow-auto text-xs text-yellow-700 dark:text-yellow-300"
      >{{ debugInfo }}</pre>
    </div>

    <!-- 加载中 -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-12"
    >
      <div class="size-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="passwords.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border border-dark-200 bg-white py-12 dark:border-dark-700 dark:bg-dark-800"
    >
      <Key class="mb-4 size-12 opacity-50" />
      <p class="text-dark-500 dark:text-dark-400">
        {{ $t('no-passwords') }}
      </p>
      <p class="mt-1 text-sm text-dark-500 dark:text-dark-400">
        {{ $t('no-passwords-desc') }}
      </p>
      <p class="mt-2 text-xs text-dark-400 dark:text-dark-500">
        如果确定有密码备份，请检查 config.ts 中的 filePath 配置是否正确
      </p>
    </div>

    <!-- 按类型分组显示 -->
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="typeConfig in contentTypes"
        :key="typeConfig.key"
        class="rounded-lg border border-dark-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800"
      >
        <!-- 分组标题 -->
        <button
          class="flex w-full items-center justify-between px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700/50"
          @click="toggleSection(typeConfig.key)"
        >
          <div class="flex items-center gap-3">
            <component
              :is="typeConfig.icon"
              class="size-5"
              :class="typeConfig.color.split(' ')[1]"
            />
            <span class="font-medium text-dark-800 dark:text-dark-100">
              {{ typeConfig.label }}
            </span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="typeConfig.color"
            >
              {{ groupedPasswords[typeConfig.key].length }}
            </span>
          </div>
          <component
            :is="collapsedSections[typeConfig.key] ? ChevronDown : ChevronUp"
            class="size-5 text-dark-500 dark:text-dark-400"
          />
        </button>

        <!-- 分组内容 -->
        <div
          v-show="!collapsedSections[typeConfig.key]"
          class="border-t border-dark-200 dark:border-dark-700"
        >
          <div
            v-if="groupedPasswords[typeConfig.key].length === 0"
            class="px-4 py-6 text-center text-sm text-dark-500 dark:text-dark-400"
          >
            {{ $t('no-passwords-in-category') }}
          </div>

          <div
            v-else
            class="divide-y divide-dark-200 dark:divide-dark-700"
          >
            <div
              v-for="entry in groupedPasswords[typeConfig.key]"
              :key="`${entry.contentType}-${entry.id}`"
              class="flex items-center justify-between px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700/50"
            >
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-dark-500 dark:text-dark-400">
                  #{{ entry.id }}
                </span>
                <div class="max-w-md">
                  <div class="truncate text-sm font-medium text-dark-700 dark:text-dark-300">
                    {{ entry.title || $t('untitled') }}
                  </div>
                  <div class="text-xs text-dark-500 dark:text-dark-400">
                    {{ $t('backup-time') }}: {{ formatTime(entry.timestamp, 'full') }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  class="rounded p-1.5 text-dark-500 hover:bg-dark-100 hover:text-primary-600 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                  :title="$t('view-password')"
                  @click="viewPassword(entry)"
                >
                  <Eye class="size-4" />
                </button>
                <button
                  class="rounded p-1.5 text-dark-500 hover:bg-dark-100 hover:text-primary-600 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                  :title="$t('edit-password')"
                  @click="openEditModal(entry)"
                >
                  <Save class="size-4" />
                </button>
                <button
                  class="rounded p-1.5 text-dark-500 hover:bg-dark-100 hover:text-red-600 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-red-400"
                  :title="$t('delete')"
                  @click="openDeleteModal(entry)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看密码弹窗 -->
    <CommonModal
      v-model="showViewModal"
      :show-footer="false"
      modal-width="500px"
    >
      <template #title>
        {{ $t('view-password') }}
      </template>
      <template #body>
        <div
          v-if="selectedEntry"
          class="space-y-4"
        >
          <div class="rounded-lg bg-dark-50 p-4 dark:bg-dark-700">
            <div class="mb-3">
              <span class="text-xs text-dark-500 dark:text-dark-400">{{ $t('content-info') }}</span>
              <div class="mt-1 flex items-center gap-2">
                <span class="dark:bg-primary-900/30 inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
                  {{ getContentTypeName(selectedEntry.contentType) }}
                </span>
                <span class="text-sm text-dark-700 dark:text-dark-300">#{{ selectedEntry.id }}</span>
              </div>
              <div class="mt-1 text-sm font-medium text-dark-800 dark:text-dark-200">
                {{ selectedEntry.title || $t('untitled') }}
              </div>
            </div>

            <div>
              <span class="text-xs text-dark-500 dark:text-dark-400">{{ $t('password') }}</span>
              <div class="mt-1 flex items-center gap-2">
                <div class="flex-1 rounded border border-dark-200 bg-white px-3 py-2 font-mono text-sm dark:border-dark-600 dark:bg-dark-800">
                  {{ showPassword ? selectedEntry.password : '••••••••' }}
                </div>
                <button
                  class="rounded p-2 text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-600"
                  @click="showPassword = !showPassword"
                >
                  <Eye
                    v-if="!showPassword"
                    class="size-4"
                  />
                  <EyeOff
                    v-else
                    class="size-4"
                  />
                </button>
                <button
                  class="rounded p-2 text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-600"
                  @click="copyPassword(selectedEntry.password)"
                >
                  <Copy class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="text-xs text-dark-500 dark:text-dark-400">
            {{ $t('backup-time') }}: {{ formatTime(selectedEntry.timestamp, 'full') }}
          </div>
        </div>
      </template>
    </CommonModal>

    <!-- 修改密码弹窗 -->
    <CommonModal
      v-model="showEditModal"
      :ok-text="$t('save')"
      :loading="updating"
      @confirm="savePassword"
    >
      <template #title>
        {{ $t('edit-password') }}
      </template>
      <template #body>
        <div
          v-if="editingEntry"
          class="space-y-4"
        >
          <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {{ getContentTypeName(editingEntry.contentType) }} #{{ editingEntry.id }}: {{ editingEntry.title || $t('untitled') }}
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-300">
              {{ $t('new-password') }}
            </label>
            <input
              v-model="newPassword"
              type="password"
              class="w-full rounded-lg border border-dark-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              :placeholder="$t('input-new-password')"
            >
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-300">
              {{ $t('confirm-password') }}
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full rounded-lg border border-dark-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              :placeholder="$t('input-password-again')"
            >
          </div>

          <div class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <div class="flex items-start gap-2">
              <AlertTriangle class="mt-0.5 size-4 shrink-0" />
              <div>
                <p class="font-medium">
                  {{ $t('password-change-notice') }}
                </p>
                <p class="mt-1 text-xs">
                  {{ $t('password-change-notice-desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CommonModal>

    <!-- 删除确认弹窗 -->
    <CommonModal
      v-model="showDeleteModal"
      confirm-theme="danger"
      @confirm="confirmDelete"
    >
      <template #title>
        {{ $t('confirm-delete') }}
      </template>
      <template #body>
        <div v-if="deletingEntry">
          <p>{{ $t('confirm-delete-password-desc') }}</p>
          <div class="mt-3 rounded-lg bg-dark-50 p-3 text-sm dark:bg-dark-700">
            <div class="flex items-center gap-2">
              <span class="dark:bg-primary-900/30 inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
                {{ getContentTypeName(deletingEntry.contentType) }}
              </span>
              <span class="font-medium">#{{ deletingEntry.id }}</span>
            </div>
            <div class="mt-1">
              {{ deletingEntry.title || $t('untitled') }}
            </div>
          </div>
        </div>
      </template>
    </CommonModal>

    <!-- 重新部署确认弹窗 -->
    <CommonModal
      v-model="showRedeployModal"
      :ok-text="$t('redeploy-now')"
      :cancel-text="$t('redeploy-later')"
      :loading="redeploying"
      @confirm="confirmRedeploy"
    >
      <template #title>
        {{ $t('redeploy-confirm') }}
      </template>
      <template #body>
        <div class="space-y-3">
          <p>{{ $t('redeploy-confirm-desc') }}</p>
          <div class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <div class="flex items-start gap-2">
              <AlertTriangle class="mt-0.5 size-4 shrink-0" />
              <div>
                <p class="font-medium">
                  {{ $t('important-notice') }}
                </p>
                <p class="mt-1 text-xs">
                  {{ $t('redeploy-important-desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CommonModal>
  </div>
</template>
