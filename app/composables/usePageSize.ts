/**
 * 可组合函数：管理分页每页数量，支持 localStorage 持久化
 * @param storageKey - localStorage 存储键名，用于区分不同列表页
 * @param defaultSize - 默认每页数量
 * @returns 响应式的 pageSize ref
 */
export function usePageSize(storageKey: string, defaultSize = 10) {
  const pageSize = ref(defaultSize);

  // 仅在客户端执行
  if (import.meta.client) {
    // 从 localStorage 恢复上次选择的数量
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsedSize = parseInt(stored, 10);
      // 验证是否为有效数字且在合理范围内
      if (!isNaN(parsedSize) && parsedSize > 0 && parsedSize <= 1000) {
        pageSize.value = parsedSize;
      }
    }

    // 监听变化并同步到 localStorage
    watch(pageSize, (newSize) => {
      localStorage.setItem(storageKey, String(newSize));
    });
  }

  return pageSize;
}
