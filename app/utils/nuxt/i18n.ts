import type { I18nCode } from "~/utils/common/locales";

export async function getI18nJson(code: I18nCode) {
  const json = await import(`../../../i18n/${code}.json?raw`);
  return JSON.parse(json.default) as Record<string, string>;
}

export async function loadI18nJson(code: I18nCode) {
  try {
    const nuxtApp = useNuxtApp();
    if (!nuxtApp.$i18nMessages) {
      console.warn("i18nMessages not initialized");
      return;
    }

    const messages = nuxtApp.$i18nMessages;
    if (!messages.value[code]) {
      messages.value[code] = await getI18nJson(code);
    }
  } catch (error) {
    console.error("Failed to load i18n json:", error);
  }
}

export function translate(name: string, params?: any[], code?: I18nCode): string {
  try {
    const i18nCodeRef = useI18nCode().i18nCode;
    code = code || i18nCodeRef?.value;

    // 如果还是没有 code，使用默认语言
    if (!code) {
      return name;
    }

    const messagesRef = useNuxtApp().$i18nMessages;
    if (!messagesRef?.value) {
      return name;
    }

    const messages = messagesRef.value[code];
    if (!messages || !messages[name]) {
      return name;
    }

    const regex = /\{(\d+)\}/g;
    return messages[name]?.replace(regex, (_, idx) => (params || [])[+idx]) || name;
  } catch (error) {
    console.error("Translation error:", error);
    return name;
  }
}
