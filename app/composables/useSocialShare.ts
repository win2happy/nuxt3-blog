import type { ShareData, SharePlatform } from "~/utils/social-share";
import { buildShareUrl, copyToClipboard, openShareWindow } from "~/utils/social-share";

export const useSocialShare = () => {
  const shareState = useState("social-share", () => ({
    showCopiedToast: false,
    sharePanelVisible: false,
    shareData: {
      title: "",
      url: "",
      description: ""
    } as ShareData
  }));

  const setShareData = (data: Partial<ShareData>) => {
    shareState.value.shareData = { ...shareState.value.shareData, ...data };
  };

  const handleShare = async (platform: SharePlatform) => {
    if (platform === "copy") {
      const success = await copyToClipboard(shareState.value.shareData.url);
      if (success) {
        shareState.value.showCopiedToast = true;
        setTimeout(() => {
          shareState.value.showCopiedToast = false;
        }, 2000);
      }
    } else {
      const url = buildShareUrl(platform, shareState.value.shareData);
      openShareWindow(url);
    }
    shareState.value.sharePanelVisible = false;
  };

  const toggleSharePanel = () => {
    shareState.value.sharePanelVisible = !shareState.value.sharePanelVisible;
  };

  const closeSharePanel = () => {
    shareState.value.sharePanelVisible = false;
  };

  return {
    shareData: computed(() => shareState.value.shareData),
    showCopiedToast: computed(() => shareState.value.showCopiedToast),
    sharePanelVisible: computed(() => shareState.value.sharePanelVisible),
    setShareData,
    handleShare,
    toggleSharePanel,
    closeSharePanel
  };
};
