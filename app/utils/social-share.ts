export interface ShareData {
  title: string;
  url: string;
  description?: string;
  coverImage?: string;
  author?: string;
  date?: string;
  tags?: string[];
  gradient?: {
    from: string;
    to: string;
  };
}

export type SharePlatform =
  | "weibo"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "telegram"
  | "email"
  | "copy";

export const buildShareUrl = (
  platform: SharePlatform,
  data: ShareData
): string => {
  const { title, url, description } = data;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const encodedDescription = description
    ? encodeURIComponent(description)
    : "";

  const shareUrls: Record<SharePlatform, string> = {
    weibo: `https://service.weibo.com/share/share.php?title=${encodedTitle}&url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    copy: ""
  };

  return shareUrls[platform];
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        return true;
      } finally {
        textArea.remove();
      }
    }
  } catch {
    return false;
  }
};

export const openShareWindow = (
  url: string,
  width = 600,
  height = 400
): void => {
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    url,
    "_blank",
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );
};
