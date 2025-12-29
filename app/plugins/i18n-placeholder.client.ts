/**
 * 客户端插件：替换加密提示中的 i18n 占位符
 * 因为 SSR 期间无法调用 translate()，所以先用占位符，然后在客户端替换
 */
export default defineNuxtPlugin(() => {
  if (!process.client) return;

  const replaceI18nPlaceholders = () => {
    // 获取所有带 data-i18n 属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    
    if (elements.length === 0) return;
    
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        try {
          // 使用我们自己的 translate 函数
          const nuxtApp = useNuxtApp();
          const i18nCode = useI18nCode().i18nCode.value;
          const messages = nuxtApp.$i18nMessages.value[i18nCode!];
          const translated = messages?.[key] || key;
          
          // 只有当文本不同时才更新（避免重复更新）
          if (element.textContent !== translated) {
            element.textContent = translated;
          }
        } catch (e) {
          // 如果翻译失败，保留原key
          console.warn('Failed to translate', key, e);
        }
      }
    });
  };

  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 延迟一点执行，确保 DOM 完全渲染
        setTimeout(replaceI18nPlaceholders, 10);
        break;
      }
    }
  });

  // 页面加载后执行
  onMounted(() => {
    replaceI18nPlaceholders();
    
    // 开始监听 DOM 变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });

  // 路由变化后执行
  const router = useRouter();
  router.afterEach(() => {
    setTimeout(replaceI18nPlaceholders, 50);
  });

  // 监听 i18n 语言变化
  watch(useI18nCode().i18nCode, () => {
    setTimeout(replaceI18nPlaceholders, 10);
  });

  // 清理
  onBeforeUnmount(() => {
    observer.disconnect();
  });
});
