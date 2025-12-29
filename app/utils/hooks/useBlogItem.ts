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
  
  // 存储加密块信息，用于后续处理
  const encryptBlocks = ref<Array<{ start: number; end: number }>>([]);

  if (originItem) {
    const item = originItem;
    originMd = await fetchMd(url, String(originItem.id));
    
    if (item.encrypt) {
      // 完全加密：保持原有逻辑，直接显示加密的内容
      decryptedMd.value = originMd;
      
      await encryptor.decryptOrWatchToDecrypt(
        async (decrypt) => {
          decryptedMd.value = await decrypt(originMd);
          successDecrypt.value = true;
        }
      );
    } else if (item.encryptBlocks) {
      // 部分加密：保存加密块位置信息
      encryptBlocks.value = item.encryptBlocks;
      
      // 先显示未解密的原始内容（带加密块标记）
      let markedMd = originMd;
      const sortedBlocks = [...item.encryptBlocks].sort((a, b) => b.start - a.start);
      
      for (const block of sortedBlocks) {
        const { start, end } = block;
        // 用注释标记加密区域
        markedMd = markedMd.slice(0, start) + 
                   `<!-- encrypted-block-start -->${markedMd.slice(start, end)}<!-- encrypted-block-end -->` + 
                   markedMd.slice(end);
      }
      
      decryptedMd.value = markedMd;

      // 监听解密
      await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        let newMarkdownContent = originMd;
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
