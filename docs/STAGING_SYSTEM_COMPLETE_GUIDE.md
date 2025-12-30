# 暂存系统完整指南

## 目录

1. [功能概述](#功能概述)
2. [核心功能](#核心功能)
3. [技术实现](#技术实现)
4. [使用指南](#使用指南)
5. [API 参考](#api-参考)
6. [多语言支持](#多语言支持)
7. [测试指南](#测试指南)
8. [常见问题](#常见问题)

---

## 功能概述

暂存系统是 Nuxt3 博客管理系统的核心功能之一，允许用户在发布前保存多个草稿版本，支持批量管理、选择性发布和版本追踪。

### 主要特性

- ✅ **多条暂存支持**：可以同时暂存多篇文章/记录/文化内容
- ✅ **版本追踪**：加载暂存后再次暂存会覆盖原条目，不会生成新条目
- ✅ **选择性加载**：可以从多个暂存中选择任意一条加载
- ✅ **智能发布**：发布时可选择同时发布多个暂存项
- ✅ **批量操作**：支持删除当前暂存、清空所有暂存
- ✅ **暂存计数**：按钮上显示暂存数量
- ✅ **跨类型支持**：支持文章、记录、文化三种内容类型
- ✅ **加密内容支持**：完全支持加密内容的暂存和发布

---

## 核心功能

### 1. 暂存内容（保存草稿）

#### 功能说明
将当前编辑的内容保存到本地存储（localStorage），不发布到服务器。

#### 使用场景
- 文章写到一半，需要暂时保存
- 编辑多篇文章，逐个保存后统一发布
- 创建多个草稿版本进行对比

#### 技术实现

**关键代码：**
```typescript
const doStage = async () => {
  // 判断是否应该作为新项目处理
  const shouldGenerateNewId = loadedFromStagedId.value === null && isNew;
  
  const processedInfo = await getProcessedUploadInfo({
    editingItem: editingItem.value,
    editingMd: editingMd.value,
    targetTab,
    originList,
    isNew: shouldGenerateNewId,
    encryptor,
    baseInfoElement: baseInfo.value
  });

  if (!processedInfo) return;

  // 如果从暂存加载的，使用原暂存的 ID（覆盖而不是新增）
  if (loadedFromStagedId.value !== null) {
    processedInfo.item.id = loadedFromStagedId.value;
  }

  stageItem(processedInfo.item, processedInfo.md, targetTab);
  
  // 如果是新文章且生成了新 ID，更新追踪标记
  if (shouldGenerateNewId && processedInfo.item.id !== editingItem.value.id) {
    editingItem.value.id = processedInfo.item.id;
    loadedFromStagedId.value = processedInfo.item.id;
  }
};
```

**特点：**
- 新建文章每次暂存生成唯一 ID
- 从暂存加载后再暂存会覆盖原条目
- 支持加密内容的暂存

---

### 2. 加载暂存

#### 功能说明
从暂存列表中选择一条内容加载到编辑器。

#### 使用场景
- 继续编辑之前暂存的文章
- 切换不同草稿版本进行编辑
- 恢复误操作前的内容

#### 技术实现

**关键代码：**
```typescript
const loadStagedForCurrentItem = () => {
  const currentId = Number(editingItem.value.id);
  const stagedItem = getStagedItem<T>(currentId, targetTab);

  // 如果只有一个暂存，直接加载
  if (stagedItem && currentTabStagedItems.value.length === 1) {
    stagedItemToLoad.value = {
      item: deepClone(toRaw(stagedItem.item)) as T,
      md: stagedItem.md
    };
    showLoadStagedModal.value = true;
  } 
  // 如果有多个暂存，打开选择界面
  else if (currentTabStagedItems.value.length > 0) {
    showSelectStagedModal.value = true;
  }
};

const loadStagedContent = async () => {
  if (stagedItemToLoad.value) {
    // 记录加载的暂存 ID，后续暂存时会覆盖而不是新增
    loadedFromStagedId.value = stagedItemToLoad.value.item.id;
    await overrideEditingItem(
      deepClone(toRaw(stagedItemToLoad.value.item)) as T, 
      stagedItemToLoad.value.md
    );
  }
  showLoadStagedModal.value = false;
  stagedItemToLoad.value = null;
};
```

**UI 组件：**

1. **选择暂存界面**（多个暂存时）
   - 显示所有暂存项的标题、ID、时间
   - 点击任意项加载
   - 标记当前项

2. **加载确认界面**（单个暂存或选中后）
   - 显示暂存时间
   - 显示标题
   - 显示内容预览
   - 确认/取消按钮

**特点：**
- 支持解密加密内容
- 支持部分加密内容
- 加载后标记来源 ID，避免重复生成

---

### 3. 删除当前暂存

#### 功能说明
删除当前编辑内容对应的暂存项（通过 `loadedFromStagedId` 追踪）。

#### 使用场景
- 暂存内容已过时，需要清理
- 不需要保留草稿，直接删除

#### 技术实现

**关键代码：**
```typescript
const deleteStagedForCurrentItem = () => {
  // 检查是否有可删除的暂存
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
```

**特点：**
- 只删除当前加载的暂存项
- 无对应暂存时提示用户
- 删除后清除追踪标记

---

### 4. 清空所有暂存

#### 功能说明
一键清空当前分类（文章/记录/文化）的所有暂存项。

#### 使用场景
- 批量清理过期草稿
- 重新开始，清空所有暂存

#### 技术实现

**关键代码：**
```typescript
// 打开确认框
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

// 确认清空
const confirmClearAllStaged = () => {
  showClearAllStagedModal.value = false;

  const itemsToRemove = currentTabStagedItems.value.map(item => ({
    id: item.id,
    targetTab: item.targetTab
  }));
  
  for (const item of itemsToRemove) {
    deleteStagedItem(item.id, item.targetTab);
  }
  
  loadedFromStagedId.value = null;

  notify({
    type: "success",
    title: translate("all-staged-cleared"),
    description: translate("all-staged-cleared-desc", [itemsToRemove.length])
  });
};
```

**安全机制：**
- 操作前弹出确认框
- 显示将要删除的数量
- 红色警告："此操作无法撤销！"
- 危险主题按钮（红色）

---

### 5. 智能发布系统

#### 功能说明
发布时自动检测暂存，允许用户选择同时发布多个暂存项。

#### 使用场景
- 编辑完多篇文章，统一发布
- 从暂存中选择部分内容发布
- 快速发布当前内容，忽略暂存

#### 技术实现

**关键代码：**

1. **打开发布界面**
```typescript
const openPublishModal = () => {
  if (hasCurrentStaged.value) {
    // 有暂存内容，打开选择界面
    selectedStagedForPublish.value = [];
    showPublishModal.value = true;
  } else {
    // 无暂存内容，直接发布
    doUpload();
  }
};
```

2. **批量发布**
```typescript
const publishWithStaged = async () => {
  showPublishModal.value = false;
  currentOperate.value = "upload";
  toggleProcessing();
  
  try {
    const additions: Array<{ path: string; content: string }> = [];
    const updatedList = [...originList];
    
    // 处理当前编辑的内容
    const currentInfo = await getProcessedUploadInfo({
      editingItem: editingItem.value,
      editingMd: editingMd.value,
      targetTab,
      originList,
      isNew,
      encryptor,
      baseInfoElement: baseInfo.value
    });
    
    if (!currentInfo) return;
    
    const { item: newItem, md: newMd } = currentInfo;
    
    // 更新列表中的当前项
    const foundIndex = updatedList.findIndex(i => i.id === newItem.id);
    if (foundIndex >= 0) {
      updatedList.splice(foundIndex, 1, newItem);
    } else {
      updatedList.unshift(newItem);
    }
    
    additions.push({
      path: `public/rebuild${targetTab}/${newItem.id}.md`,
      content: newMd
    });
    
    // 处理选中的暂存内容
    const selectedStaged = currentTabStagedItems.value.filter(item => 
      selectedStagedForPublish.value.includes(item.id)
    );
    
    for (const stagedItem of selectedStaged) {
      const { item, md } = stagedItem;
      
      // 确保暂存项有有效的 ID
      if (!item.id || item.id === 0) {
        const maxId = Math.max(0, ...updatedList.map(i => i.id));
        item.id = maxId + 1;
      }
      
      // 更新列表
      const stagedIndex = updatedList.findIndex(i => i.id === item.id);
      if (stagedIndex >= 0) {
        updatedList.splice(stagedIndex, 1, item as T);
      } else {
        updatedList.unshift(item as T);
      }
      
      additions.push({
        path: `public/rebuild${targetTab}/${item.id}.md`,
        content: md
      });
    }
    
    // 添加 JSON 文件
    additions.push({
      path: `public/rebuild/json${targetTab}.json`,
      content: JSON.stringify(updatedList)
    });
    
    const itemCount = 1 + selectedStaged.length;
    const success = await createCommit(
      `Update ${itemCount} ${targetTab.replace("/", "")} item${itemCount > 1 ? 's' : ''}`,
      { additions }
    );
    
    if (success) {
      useUnsavedContent().value = false;
      
      // 删除已发布的暂存项
      for (const id of selectedStagedForPublish.value) {
        deleteStagedItem(id, targetTab);
      }
      
      notify({
        type: "success",
        title: translate("publish-success"),
        description: translate("publish-success-desc", [itemCount])
      });
    }
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};
```

3. **只发布当前内容**
```typescript
const publishCurrentOnly = async () => {
  showPublishModal.value = false;
  await doUpload();
};
```

4. **全选/取消全选**
```typescript
const toggleSelectAllStaged = () => {
  if (selectedStagedForPublish.value.length === currentTabStagedItems.length) {
    selectedStagedForPublish.value = [];
  } else {
    selectedStagedForPublish.value = currentTabStagedItems.value.map(item => item.id);
  }
};
```

**UI 设计：**

```
┌─────────────────────────────────────────────┐
│ 选择发布内容                                 │
├─────────────────────────────────────────────┤
│ ℹ️ 您可以选择只发布当前编辑的内容，         │
│    或同时发布选中的暂存内容                  │
│                                              │
│ 选择要发布的暂存内容          [全选/取消]   │
│ ┌──────────────────────────────────────┐    │
│ │ ☑ 文章标题 1                          │    │
│ │   ID: 123  2024-12-30 10:00          │    │
│ ├──────────────────────────────────────┤    │
│ │ ☐ 文章标题 2                          │    │
│ │   ID: 124  2024-12-30 11:00          │    │
│ ├──────────────────────────────────────┤    │
│ │ ☑ 文章标题 3                          │    │
│ │   ID: 125  2024-12-30 12:00          │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ 将发布 3 篇内容（当前编辑 + 暂存）           │
│                                              │
│        [只发布当前内容]    [发布选中的内容]  │
└─────────────────────────────────────────────┘
```

**交互特性：**
- 点击整行切换选中状态
- 选中项高亮显示
- 实时显示发布总数
- 复选框独立点击

**发布流程：**

1. 用户点击"发布/更新"按钮
2. 系统检测是否有暂存
   - **无暂存** → 直接发布当前内容
   - **有暂存** → 显示选择界面
3. 用户在选择界面中：
   - 勾选要发布的暂存项
   - 点击"发布选中的内容" → 批量发布
   - 或点击"只发布当前内容" → 忽略暂存
4. 批量发布处理：
   - 处理当前编辑内容
   - 处理选中的暂存项
   - 合并到列表
   - 生成所有文件
   - 一次性提交到 GitHub
5. 发布成功：
   - 显示成功通知（含数量）
   - 删除已发布的暂存项
   - 清空未保存标记

**特点：**
- 原子性提交：要么全部成功，要么全部失败
- 自动清理：发布成功后自动删除已发布的暂存
- ID 管理：自动处理新 ID 生成和冲突检测
- 灵活选择：可以选择全部、部分或不发布暂存

---

### 6. 暂存计数显示

#### 功能说明
在"加载暂存"按钮上显示当前分类的暂存数量。

#### UI 实现

```vue
<CommonButton
  size="small"
  :disabled="!hasCurrentStaged"
  :icon="FolderOpen"
  @click="loadStagedForCurrentItem"
>
  {{ $t('load-staged') }}
  <span
    v-if="hasCurrentStaged"
    class="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
  >
    {{ currentTabStagedItems.length }}
  </span>
</CommonButton>
```

**效果：**
- 按钮显示：`[📁] 加载暂存 3`
- 数字徽章：圆角、主题色背景
- 响应式：支持浅色/深色模式

---

## 技术实现

### 数据结构

#### StagedItem 接口
```typescript
interface StagedItem<T extends CommonItem> {
  id: number;              // 项目 ID
  targetTab: HeaderTabUrl; // 目标分类（/articles、/records、/knowledges）
  item: T;                 // 项目数据
  md: string;              // Markdown 内容
  timestamp: number;       // 暂存时间戳
}
```

### 状态管理

#### 关键状态
```typescript
// 显示控制
const showLoadStagedModal = ref(false);         // 加载暂存确认框
const showSelectStagedModal = ref(false);       // 选择暂存界面
const showClearAllStagedModal = ref(false);     // 清空暂存确认框
const showPublishModal = ref(false);            // 发布选择界面

// 数据状态
const stagedItemToLoad = ref<{ item: T; md: string } | null>(null); // 待加载的暂存项
const selectedStagedForPublish = ref<number[]>([]);                  // 选中要发布的暂存 ID

// 追踪状态
const loadedFromStagedId = ref<number | null>(null); // 记录当前内容来自哪个暂存
```

#### 计算属性
```typescript
// 当前分类的所有暂存项
const currentTabStagedItems = computed(() => {
  return stagedItems.value.filter(item => item.targetTab === targetTab);
});

// 是否有暂存内容
const hasCurrentStaged = computed(() => {
  return currentTabStagedItems.value.length > 0;
});
```

### 核心 Hook: useStaging

```typescript
export function useStaging() {
  const stagedItems = ref<StagedItem<any>[]>([]);

  // 初始化：从 localStorage 加载
  const initStaging = () => {
    const stored = localStorage.getItem('staged-items');
    if (stored) {
      stagedItems.value = JSON.parse(stored);
    }
  };

  // 暂存项目
  const stageItem = (item: any, md: string, targetTab: HeaderTabUrl) => {
    const existingIndex = stagedItems.value.findIndex(
      s => s.id === item.id && s.targetTab === targetTab
    );

    const stagedItem: StagedItem<any> = {
      id: item.id,
      targetTab,
      item: deepClone(item),
      md,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      // 覆盖已存在的暂存
      stagedItems.value.splice(existingIndex, 1, stagedItem);
    } else {
      // 新增暂存
      stagedItems.value.push(stagedItem);
    }

    localStorage.setItem('staged-items', JSON.stringify(stagedItems.value));
  };

  // 获取暂存项目
  const getStagedItem = <T extends CommonItem>(id: number, targetTab: HeaderTabUrl) => {
    return stagedItems.value.find(
      item => item.id === id && item.targetTab === targetTab
    ) as StagedItem<T> | undefined;
  };

  // 删除暂存项目
  const deleteStagedItem = (id: number, targetTab: HeaderTabUrl) => {
    const index = stagedItems.value.findIndex(
      item => item.id === id && item.targetTab === targetTab
    );
    if (index >= 0) {
      stagedItems.value.splice(index, 1);
      localStorage.setItem('staged-items', JSON.stringify(stagedItems.value));
    }
  };

  // 清空所有暂存
  const clearStaging = () => {
    stagedItems.value = [];
    localStorage.removeItem('staged-items');
  };

  // 删除多个暂存项
  const removeStagedItems = (items: { id: number; targetTab: HeaderTabUrl }[]) => {
    for (const item of items) {
      deleteStagedItem(item.id, item.targetTab);
    }
  };

  return {
    stagedItems,
    stageItem,
    getStagedItem,
    deleteStagedItem,
    clearStaging,
    removeStagedItems,
    initStaging
  };
}
```

### 版本追踪机制

**问题：** 新建文章暂存后，每次点击暂存都会生成新的 ID，导致暂存列表中出现多个重复项。

**解决方案：** 使用 `loadedFromStagedId` 追踪当前编辑内容的来源。

**工作流程：**

1. **新建文章首次暂存**
   - `isNew = true`
   - `loadedFromStagedId = null`
   - 生成新 ID（例如：123）
   - 暂存后设置 `loadedFromStagedId = 123`

2. **再次暂存**
   - `isNew = true`（仍然是新文章）
   - `loadedFromStagedId = 123`（有追踪 ID）
   - `shouldGenerateNewId = false`（不生成新 ID）
   - 使用原 ID 123 覆盖暂存

3. **加载暂存后暂存**
   - 加载时设置 `loadedFromStagedId = 原暂存ID`
   - 暂存时使用该 ID 覆盖

4. **清除追踪**
   - 发布成功后清除
   - 删除暂存后清除
   - 加载其他暂存时更新

---

## 使用指南

### 基础工作流

#### 1. 创建并暂存多篇文章

```
用户操作：
1. 点击"新建文章"
2. 编辑文章 A
3. 点击"暂存"按钮 → 文章 A 保存到暂存
4. 点击"新建文章"
5. 编辑文章 B
6. 点击"暂存"按钮 → 文章 B 保存到暂存
7. 点击"新建文章"
8. 编辑文章 C
9. 点击"发布"按钮 → 打开发布选择界面

发布选择界面：
- 显示文章 A 和 B
- 勾选文章 A 和 B
- 点击"发布选中的内容"

结果：
- 文章 A、B、C 一次性发布成功
- 文章 A 和 B 从暂存列表中移除
- 显示"成功发布 3 篇内容"
```

#### 2. 加载暂存继续编辑

```
用户操作：
1. 点击"加载暂存"按钮（显示数量徽章：3）
2. 弹出暂存列表，显示 3 篇暂存
3. 点击"文章标题 2"
4. 弹出确认界面，显示文章详情
5. 点击"确认"加载

结果：
- 文章 2 的内容加载到编辑器
- 可以继续编辑
- 再次暂存会覆盖原暂存项
```

#### 3. 删除不需要的暂存

```
场景 A：删除当前暂存
1. 加载某个暂存
2. 点击"删除当前暂存"
3. 确认删除
4. 该暂存项被删除

场景 B：清空所有暂存
1. 点击"清空所有暂存"按钮
2. 弹出确认框："即将清空 5 个暂存项目，此操作无法撤销！"
3. 点击"确认"
4. 所有暂存被清空
```

### 高级工作流

#### 1. 选择性发布暂存

```
用户操作：
1. 已有 5 篇暂存（A、B、C、D、E）
2. 编辑新文章 F
3. 点击"发布"
4. 在发布选择界面：
   - 勾选文章 B、D、E
   - 不勾选文章 A、C
5. 点击"发布选中的内容"

结果：
- 文章 B、D、E、F 发布成功（4篇）
- 文章 A、C 保留在暂存中
- 显示"成功发布 4 篇内容"
```

#### 2. 快速发布忽略暂存

```
用户操作：
1. 已有暂存，但不想发布
2. 编辑新文章
3. 点击"发布"
4. 在发布选择界面点击"只发布当前内容"

结果：
- 只发布当前编辑的文章
- 暂存保持不变
```

#### 3. 版本对比（加载不同暂存）

```
用户操作：
1. 创建文章 A 并暂存（版本 1）
2. 修改文章 A 并暂存（版本 2，覆盖版本 1）
3. 创建文章 B 并暂存
4. 点击"加载暂存"
5. 选择文章 A（版本 2）
6. 继续编辑并暂存（版本 3，覆盖版本 2）

特点：
- 同一篇文章只保留最新版本
- 避免暂存列表混乱
```

---

## API 参考

### useStaging Hook

#### stageItem
```typescript
function stageItem(
  item: CommonItem,     // 项目数据
  md: string,           // Markdown 内容
  targetTab: HeaderTabUrl // 目标分类
): void
```

**说明：** 暂存一个项目。如果已存在相同 ID 和 targetTab 的暂存，则覆盖。

#### getStagedItem
```typescript
function getStagedItem<T extends CommonItem>(
  id: number,               // 项目 ID
  targetTab: HeaderTabUrl   // 目标分类
): StagedItem<T> | undefined
```

**说明：** 获取指定 ID 和分类的暂存项。

#### deleteStagedItem
```typescript
function deleteStagedItem(
  id: number,               // 项目 ID
  targetTab: HeaderTabUrl   // 目标分类
): void
```

**说明：** 删除指定的暂存项。

#### clearStaging
```typescript
function clearStaging(): void
```

**说明：** 清空所有暂存项。

#### removeStagedItems
```typescript
function removeStagedItems(
  items: Array<{ id: number; targetTab: HeaderTabUrl }>
): void
```

**说明：** 批量删除多个暂存项。

### 组件函数

#### doStage
```typescript
async function doStage(): Promise<void>
```

**说明：** 暂存当前编辑的内容。

#### loadStagedForCurrentItem
```typescript
function loadStagedForCurrentItem(): void
```

**说明：** 打开加载暂存界面。

#### deleteStagedForCurrentItem
```typescript
function deleteStagedForCurrentItem(): void
```

**说明：** 删除当前项目对应的暂存。

#### clearAllStagedForCurrentTab
```typescript
function clearAllStagedForCurrentTab(): void
```

**说明：** 打开清空所有暂存的确认框。

#### openPublishModal
```typescript
function openPublishModal(): void
```

**说明：** 打开发布选择界面（如果有暂存）或直接发布（如果无暂存）。

#### publishWithStaged
```typescript
async function publishWithStaged(): Promise<void>
```

**说明：** 发布当前内容和选中的暂存项。

#### publishCurrentOnly
```typescript
async function publishCurrentOnly(): Promise<void>
```

**说明：** 只发布当前编辑的内容，忽略暂存。

---

## 多语言支持

### 中文翻译（zh.json）

```json
{
  "load-staged": "加载暂存",
  "delete-current-staged": "删除当前暂存",
  "clear-all-staged": "清空所有暂存",
  "confirm-clear-all-staged": "确认清空所有暂存？",
  "confirm-clear-all-staged-desc": "即将清空当前分类的所有 {0} 个暂存项目",
  "this-action-cannot-be-undone": "此操作无法撤销！",
  "current-staged-deleted": "已删除当前暂存",
  "current-staged-deleted-desc": "成功删除当前项目的暂存内容",
  "all-staged-cleared": "已清空所有暂存",
  "all-staged-cleared-desc": "成功清空 {0} 个暂存项目",
  "no-current-staged-to-delete": "当前项目没有暂存内容可删除",
  "no-staged-items-to-clear": "当前分类没有暂存项目",
  "save-staged": "暂存",
  "staged": "已暂存",
  "staged-items-count": "已暂存 {0} 个项目",
  "staged-content-loaded": "已加载暂存内容",
  "staged-content-loaded-desc": "暂存内容已成功加载到编辑器",
  "select-staged-item": "选择暂存项目",
  "select-staged-item-desc": "找到 {0} 个暂存项目，点击选择要加载的项目",
  "load-staged-changes": "加载暂存内容",
  "staged-changes-found": "发现暂存的更改",
  "staged-time": "暂存时间",
  "content-preview": "内容预览",
  
  "publish-select": "选择发布内容",
  "publish-select-desc": "您可以选择只发布当前编辑的内容，或同时发布选中的暂存内容",
  "select-staged-to-publish": "选择要发布的暂存内容",
  "publish-selected": "发布选中的内容",
  "publish-current-only": "只发布当前内容",
  "publish-summary": "将发布 {0} 篇内容（当前编辑 + 暂存）",
  "publish-success": "发布成功",
  "publish-success-desc": "成功发布 {0} 篇内容"
}
```

### 英文翻译（en.json）

```json
{
  "load-staged": "Load Staged",
  "delete-current-staged": "Delete Current Staged",
  "clear-all-staged": "Clear All Staged",
  "confirm-clear-all-staged": "Confirm Clear All Staged?",
  "confirm-clear-all-staged-desc": "About to clear all {0} staged items in current category",
  "this-action-cannot-be-undone": "This action cannot be undone!",
  "current-staged-deleted": "Current Staged Deleted",
  "current-staged-deleted-desc": "Successfully deleted current staged content",
  "all-staged-cleared": "All Staged Cleared",
  "all-staged-cleared-desc": "Successfully cleared {0} staged items",
  "no-current-staged-to-delete": "No current staged content to delete",
  "no-staged-items-to-clear": "No staged items to clear in current category",
  "save-staged": "Stage",
  "staged": "Staged",
  "staged-items-count": "Staged {0} items",
  "staged-content-loaded": "Staged Content Loaded",
  "staged-content-loaded-desc": "Staged content loaded to editor successfully",
  "select-staged-item": "Select Staged Item",
  "select-staged-item-desc": "Found {0} staged items, click to select one to load",
  "load-staged-changes": "Load Staged Changes",
  "staged-changes-found": "Staged changes found",
  "staged-time": "Staged Time",
  "content-preview": "Content Preview",
  
  "publish-select": "Select Content to Publish",
  "publish-select-desc": "You can choose to publish only the current content, or publish selected staged items as well",
  "select-staged-to-publish": "Select staged items to publish",
  "publish-selected": "Publish Selected",
  "publish-current-only": "Publish Current Only",
  "publish-summary": "Will publish {0} items (current + staged)",
  "publish-success": "Published Successfully",
  "publish-success-desc": "Successfully published {0} items"
}
```

---

## 测试指南

### 单元测试

#### 1. 测试暂存功能

```typescript
describe('Staging System', () => {
  it('should stage a new item', async () => {
    // 创建新文章
    const article = { id: 0, title: 'Test Article' };
    
    // 暂存
    await doStage();
    
    // 验证：暂存列表应该有 1 项
    expect(stagedItems.value.length).toBe(1);
    
    // 验证：文章 ID 应该被更新
    expect(article.id).toBeGreaterThan(0);
  });

  it('should update staged item instead of creating new one', async () => {
    // 创建并暂存
    await doStage();
    const firstId = editingItem.value.id;
    const initialCount = stagedItems.value.length;
    
    // 修改内容并再次暂存
    editingItem.value.title = 'Updated Title';
    await doStage();
    
    // 验证：暂存数量不变
    expect(stagedItems.value.length).toBe(initialCount);
    
    // 验证：ID 不变
    expect(editingItem.value.id).toBe(firstId);
  });
});
```

#### 2. 测试加载暂存

```typescript
describe('Load Staged', () => {
  it('should load staged item correctly', async () => {
    // 准备：创建并暂存
    const originalTitle = 'Original Title';
    editingItem.value.title = originalTitle;
    await doStage();
    
    // 修改当前内容
    editingItem.value.title = 'Modified Title';
    
    // 加载暂存
    await loadStagedContent();
    
    // 验证：标题应该恢复为暂存的内容
    expect(editingItem.value.title).toBe(originalTitle);
  });

  it('should set loadedFromStagedId when loading', async () => {
    // 暂存
    await doStage();
    const stagedId = editingItem.value.id;
    
    // 加载暂存
    await loadStagedContent();
    
    // 验证：追踪 ID 被设置
    expect(loadedFromStagedId.value).toBe(stagedId);
  });
});
```

#### 3. 测试批量发布

```typescript
describe('Batch Publish', () => {
  it('should publish current and selected staged items', async () => {
    // 准备：暂存 3 篇文章
    for (let i = 0; i < 3; i++) {
      editingItem.value = { id: 0, title: `Article ${i}` };
      await doStage();
    }
    
    // 选择 2 篇暂存发布
    selectedStagedForPublish.value = [
      stagedItems.value[0].id,
      stagedItems.value[1].id
    ];
    
    // 发布
    await publishWithStaged();
    
    // 验证：应该发布 3 篇（当前 + 2 篇暂存）
    expect(publishedCount).toBe(3);
    
    // 验证：已发布的暂存应该被删除
    expect(stagedItems.value.length).toBe(1);
  });
});
```

### 集成测试

#### 1. 完整工作流测试

```typescript
describe('Complete Workflow', () => {
  it('should handle complete staging workflow', async () => {
    // 1. 创建并暂存文章 A
    editingItem.value = { id: 0, title: 'Article A' };
    await doStage();
    expect(stagedItems.value.length).toBe(1);
    
    // 2. 创建并暂存文章 B
    editingItem.value = { id: 0, title: 'Article B' };
    await doStage();
    expect(stagedItems.value.length).toBe(2);
    
    // 3. 加载文章 A
    await selectStagedItem(stagedItems.value[0]);
    await loadStagedContent();
    expect(editingItem.value.title).toBe('Article A');
    
    // 4. 修改并再次暂存（应该覆盖）
    editingItem.value.title = 'Article A Updated';
    await doStage();
    expect(stagedItems.value.length).toBe(2);
    
    // 5. 批量发布
    selectedStagedForPublish.value = [stagedItems.value[1].id];
    await publishWithStaged();
    expect(stagedItems.value.length).toBe(0);
  });
});
```

### E2E 测试

#### 1. UI 交互测试

```typescript
test('should display staged count badge', async ({ page }) => {
  // 暂存 3 篇文章
  for (let i = 0; i < 3; i++) {
    await page.click('[data-testid="new-article-btn"]');
    await page.fill('[data-testid="title-input"]', `Article ${i}`);
    await page.click('[data-testid="item-stage-btn"]');
  }
  
  // 验证：按钮上应该显示数量 3
  const badge = await page.locator('[data-testid="load-staged-btn"] span');
  expect(await badge.textContent()).toBe('3');
});

test('should show publish selection modal when staged items exist', async ({ page }) => {
  // 暂存文章
  await page.click('[data-testid="item-stage-btn"]');
  
  // 点击发布
  await page.click('[data-testid="item-upload-btn"]');
  
  // 验证：应该显示发布选择界面
  const modal = await page.locator('[data-testid="publish-select-modal"]');
  expect(await modal.isVisible()).toBe(true);
});
```

---

## 常见问题

### Q1: 暂存内容存储在哪里？

**A:** 暂存内容存储在浏览器的 `localStorage` 中，键名为 `staged-items`。这意味着：
- 暂存内容只在当前浏览器和设备上有效
- 清除浏览器缓存会丢失暂存内容
- 不同设备/浏览器的暂存内容不同步

### Q2: 为什么新建文章每次暂存不生成新 ID？

**A:** 这是版本追踪机制的设计。使用 `loadedFromStagedId` 追踪当前内容来源：
- 首次暂存：生成新 ID 并记录
- 再次暂存：使用记录的 ID 覆盖
- 避免暂存列表中出现大量重复项

### Q3: 加密内容可以暂存吗？

**A:** 可以。暂存系统完全支持加密内容：
- 整篇加密：暂存加密后的内容
- 部分加密：暂存包含加密块的内容
- 加载时自动解密（需要密码）

### Q4: 暂存数量有限制吗？

**A:** 理论上没有硬性限制，但受 `localStorage` 容量限制（通常 5-10MB）。建议：
- 定期清理不需要的暂存
- 避免暂存过大的内容（如超大图片）

### Q5: 发布失败后暂存会被删除吗？

**A:** 不会。只有发布成功后，已发布的暂存项才会被删除。这确保了数据安全。

### Q6: 可以恢复已删除的暂存吗？

**A:** 不能。暂存删除是永久性的，没有回收站功能。建议：
- 删除前确认
- 重要内容先导出备份

### Q7: 暂存和发布的区别是什么？

**A:**
- **暂存**：保存到本地 localStorage，不会同步到服务器
- **发布**：提交到 GitHub，内容会被部署到网站上

### Q8: 批量发布时如何处理 ID 冲突？

**A:** 系统自动处理：
1. 检查列表中是否存在相同 ID
2. 如果存在：覆盖旧内容
3. 如果不存在：添加到列表
4. 提交前检查 ID 和 slug 冲突

### Q9: 为什么"清空所有暂存"需要确认？

**A:** 这是一个危险操作，会删除当前分类的所有暂存内容，且无法撤销。确认框防止误操作。

### Q10: 暂存内容会过期吗？

**A:** 不会自动过期。暂存内容会一直保存在 localStorage 中，直到：
- 手动删除
- 发布后自动删除
- 清除浏览器缓存

---

## 最佳实践

### 1. 暂存管理

**建议：**
- 定期清理不需要的暂存
- 为暂存内容设置清晰的标题
- 重要内容暂存后尽快发布
- 不要依赖暂存作为长期存储

### 2. 批量发布

**建议：**
- 发布前检查选中的暂存项
- 相关内容一起发布
- 发布后验证线上效果
- 保留未完成的暂存，不要强制发布

### 3. 版本管理

**建议：**
- 重要修改前先暂存当前版本
- 使用有意义的标题区分不同版本
- 定期整理暂存列表
- 不需要的旧版本及时删除

### 4. 团队协作

**注意事项：**
- 暂存内容不会同步给其他成员
- 需要共享的内容应直接发布
- 本地暂存仅作为个人草稿使用

---

## 技术架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                          │
├─────────────────────────────────────────────────────────┤
│  [暂存按钮]  [加载暂存(3)]  [删除当前]  [清空所有]      │
│  [发布/更新按钮]                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      组件逻辑层                          │
├─────────────────────────────────────────────────────────┤
│  doStage()              - 暂存当前内容                   │
│  loadStagedForCurrentItem() - 加载暂存                  │
│  deleteStagedForCurrentItem() - 删除当前暂存            │
│  clearAllStagedForCurrentTab() - 清空所有暂存           │
│  openPublishModal()     - 打开发布选择                   │
│  publishWithStaged()    - 批量发布                      │
│  publishCurrentOnly()   - 只发布当前                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      状态管理层                          │
├─────────────────────────────────────────────────────────┤
│  useStaging Hook:                                       │
│  - stagedItems (暂存列表)                               │
│  - stageItem() (暂存)                                   │
│  - getStagedItem() (获取)                               │
│  - deleteStagedItem() (删除)                            │
│  - clearStaging() (清空)                                │
│                                                          │
│  追踪状态:                                               │
│  - loadedFromStagedId (版本追踪)                        │
│  - selectedStagedForPublish (选中发布)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      存储层                              │
├─────────────────────────────────────────────────────────┤
│  localStorage                                           │
│  - Key: 'staged-items'                                  │
│  - Value: JSON.stringify(StagedItem[])                 │
└─────────────────────────────────────────────────────────┘
```

---

## 更新日志

### v2.0.0 (2024-12-30)

#### 新增功能
- ✅ 智能发布系统：发布时可选择同时发布多个暂存项
- ✅ 发布选择界面：支持多选、全选、取消全选
- ✅ 暂存计数显示：按钮上显示暂存数量徽章
- ✅ 清空所有暂存：一键清空当前分类所有暂存
- ✅ 确认框机制：危险操作前弹出确认框

#### 优化
- 🔄 版本追踪：避免重复生成 ID
- 🔄 删除逻辑：区分"删除当前"和"清空所有"
- 🔄 UI/UX：更清晰的按钮文案和交互提示
- 🔄 批量发布：原子性提交，自动清理

#### 修复
- 🐛 新建文章暂存时重复生成 ID 的问题
- 🐛 加载暂存后再次暂存生成新条目的问题
- 🐛 CSS 编译错误（`after:content_[":"]`）

---

## 贡献指南

### 报告问题

如果发现 bug 或有功能建议，请：
1. 在 Issues 中搜索是否已存在相关问题
2. 提供详细的复现步骤
3. 附上截图或错误日志
4. 说明浏览器和设备信息

### 提交代码

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 遵循 ESLint 配置
- 添加必要的注释
- 编写单元测试
- 更新相关文档

---

## 许可证

MIT License

---

## 联系方式

- 项目主页：[GitHub](https://github.com/your-repo)
- 文档：[在线文档](https://your-docs-site.com)
- Issues：[反馈问题](https://github.com/your-repo/issues)

---

**最后更新时间：** 2024-12-30
