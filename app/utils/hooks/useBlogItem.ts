import type { CommonItem, HeaderTabUrl } from "../common/types";
import { fetchMd } from "../nuxt/fetch";
import { useBlogList } from "./useBlogList";

export const useBlogItem = async <T extends CommonItem>(id: string, url: HeaderTabUrl, showNotFound = true) => {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();
  const { originList, decryptedList } = await useBlogList<T>(url, id);

  const originItem = originList.find(i => i.customSlug === id || i.id === Number(id));
  const decryptedItem = computed(() => decryptedList.value?.find(i => i.customSlug === id || i.id === Number(id))) as Readonly<Ref<T>>;
  let originMd = "";
  const decryptedMd = ref("");
  const successDecrypt = ref(false);

  // 创建加密提示HTML的辅助函数（不依赖 translate）
  const createEncryptedPlaceholder = (isFullArticle = false) => {
    // 使用多语言占位符，稍后由前端替换
    const lockIcon = "🔒";
    const titleKey = isFullArticle ? "encrypted-article" : "encrypted-content";
    const tipKey = "encrypted-content-tip";
    
    // 默认文本（中文）
    const defaultTitle = isFullArticle ? "加密文章" : "加密内容";
    const defaultTip = "此内容已加密，需要密码才能查看";
    
    const classes = isFullArticle 
      ? "encrypted-block-placeholder encrypted-full-article"
      : "encrypted-block-placeholder";
    
    return `<div class="${classes}">
  <div class="encrypted-icon">${lockIcon}</div>
  <div class="encrypted-title" data-i18n="${titleKey}">${defaultTitle}</div>
  <div class="encrypted-tip" data-i18n="${tipKey}">${defaultTip}</div>
</div>`;
  };

  if (originItem) {
    const item = originItem;
    originMd = await fetchMd(url, String(originItem.id));
    if (item.encrypt) {
      // 初始状态显示加密提示
      decryptedMd.value = createEncryptedPlaceholder(true);
      
      await encryptor.decryptOrWatchToDecrypt(
        async (decrypt) => {
          decryptedMd.value = await decrypt(originMd);
          successDecrypt.value = true;
        }
      );
    } else if (item.encryptBlocks) {
      // 初始化：显示未加密内容 + 加密提示框
      const initContent = () => {
        let newMarkdownContent = originMd;
        const encryptedPlaceholder = `\n\n${createEncryptedPlaceholder(false)}\n\n`;
        
        // 从后往前替换，避免位置偏移问题
        const sortedBlocks = [...item.encryptBlocks!].sort((a, b) => b.start - a.start);
        for (const block of sortedBlocks) {
          const { start, end } = block;
          newMarkdownContent = newMarkdownContent.slice(0, start) + encryptedPlaceholder + newMarkdownContent.slice(end);
        }
        return newMarkdownContent;
      };
      
      // 立即设置初始内容（显示未加密部分 + 加密提示）
      decryptedMd.value = initContent();

      // 监听解密
      await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        let newMarkdownContent = originMd;
        // 从后往前解密，避免位置偏移问题
        const sortedBlocks = [...item.encryptBlocks!].sort((a, b) => b.start - a.start);
        for (const block of sortedBlocks) {
          const { start, end } = block;
          const decryptedBlock = await decrypt(newMarkdownContent.slice(start, end));
          newMarkdownContent = newMarkdownContent.slice(0, start) + decryptedBlock + newMarkdownContent.slice(end);
        }
        decryptedMd.value = newMarkdownContent;
        successDecrypt.value = true;
      });
    } else {
      decryptedMd.value = originMd;
      successDecrypt.value = true;
    }
  } else if (showNotFound) {
    showError({
      status: 404,
      statusText: `${url}/${id} not found`,
      message: "wtf bro"
    });
  }

  return {
    originList,
    decryptedList,

    successDecrypt,
    originItem,
    decryptedItem,
    originMd,
    decryptedMd
  };
};
