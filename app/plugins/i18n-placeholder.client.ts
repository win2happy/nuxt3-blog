/**
 * 客户端插件：处理加密内容的显示
 * 1. 替换加密提示中的 i18n 占位符
 * 2. 处理 HTML 注释标记，替换为加密提示框
 */
export default defineNuxtPlugin(() => {
  if (!process.client) return;

  // 创建加密提示HTML
  const createEncryptedPlaceholder = (isFullArticle = false) => {
    const nuxtApp = useNuxtApp();
    const i18nCode = useI18nCode().i18nCode.value;
    const messages = nuxtApp.$i18nMessages.value[i18nCode!];
    
    const titleKey = isFullArticle ? "encrypted-article" : "encrypted-content";
    const tipKey = "encrypted-content-tip";
    
    const title = messages?.[titleKey] || (isFullArticle ? "加密文章" : "加密内容");
    const tip = messages?.[tipKey] || "此内容已加密，需要密码才能查看";
    
    const classes = isFullArticle 
      ? "encrypted-block-placeholder encrypted-full-article"
      : "encrypted-block-placeholder";
    
    const div = document.createElement('div');
    div.className = classes;
    div.innerHTML = `
      <div class="encrypted-icon">🔒</div>
      <div class="encrypted-title">${title}</div>
      <div class="encrypted-tip">${tip}</div>
    `;
    return div;
  };

  // 处理加密块标记
  const processEncryptedBlocks = () => {
    const markdownContainer = document.querySelector('.--markdown');
    if (!markdownContainer) return;

    // 只处理部分加密块（不处理完全加密文章）
    const walker = document.createTreeWalker(
      markdownContainer,
      NodeFilter.SHOW_COMMENT,
      null
    );

    const commentsToProcess: Array<{ start: Comment; end: Comment }> = [];
    let startComment: Comment | null = null;

    while (walker.nextNode()) {
      const comment = walker.currentNode as Comment;
      const text = comment.textContent?.trim();
      
      if (text === 'encrypted-block-start') {
        startComment = comment;
      } else if (text === 'encrypted-block-end' && startComment) {
        commentsToProcess.push({ start: startComment, end: comment });
        startComment = null;
      }
    }

    // 替换加密块为提示框
    commentsToProcess.forEach(({ start, end }) => {
      const placeholder = createEncryptedPlaceholder(false);
      
      // 删除 start 和 end 之间的所有节点
      let node = start.nextSibling;
      while (node && node !== end) {
        const next = node.nextSibling;
        node.parentNode?.removeChild(node);
        node = next;
      }
      
      // 插入加密提示
      start.parentNode?.insertBefore(placeholder, end);
      
      // 删除注释标记
      start.parentNode?.removeChild(start);
      end.parentNode?.removeChild(end);
    });
  };

  // 处理执行
  const processAll = () => {
    setTimeout(() => {
      processEncryptedBlocks();
    }, 100);
  };

  // 页面加载后执行
  onMounted(() => {
    processAll();
  });

  // 路由变化后执行
  const router = useRouter();
  router.afterEach(() => {
    processAll();
  });

  // 监听 i18n 语言变化，重新生成提示框
  watch(useI18nCode().i18nCode, () => {
    processAll();
  });
});
