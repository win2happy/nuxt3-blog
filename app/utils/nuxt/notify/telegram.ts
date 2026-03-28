/**
 * Telegram 通知服务
 * 用于发送加密密码备份到 Telegram
 */

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  includeContentType: boolean;
  includeTitle: boolean;
  includeTime: boolean;
}

export interface PasswordNotifyPayload {
  password: string;
  contentType: "article" | "knowledge" | "record";
  title?: string;
  id: number;
  isNew: boolean;
  timestamp: number;
}

/**
 * 发送密码通知到 Telegram
 */
export async function sendPasswordToTelegram(
  payload: PasswordNotifyPayload,
  config: TelegramConfig
): Promise<boolean> {
  if (!config.enabled || !config.botToken || !config.chatId) {
    return false;
  }

  const { password, contentType, title, id, isNew, timestamp } = payload;

  // 构建消息
  const lines: string[] = ["🔐 *密码备份通知*"];
  lines.push("");

  if (config.includeContentType) {
    const typeMap = {
      article: "📄 文章",
      knowledge: "📚 文化",
      record: "📝 记录"
    };
    lines.push(`*类型:* ${typeMap[contentType]}`);
  }

  if (config.includeTitle && title) {
    lines.push(`*标题:* ${escapeMarkdown(title)}`);
  }

  lines.push(`*ID:* ${id}`);
  lines.push(`*操作:* ${isNew ? "新建" : "修改"}`);

  if (config.includeTime) {
    lines.push(`*时间:* ${new Date(timestamp).toLocaleString("zh-CN")}`);
  }

  lines.push("");
  lines.push(`*密码:* \`${escapeMarkdown(password)}\``);
  lines.push("");
  lines.push("⚠️ 请妥善保管此密码，用于解密内容");

  const message = lines.join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: "MarkdownV2"
        })
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API 错误:", data);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Telegram 通知发送失败:", error);
    return false;
  }
}

/**
 * 转义 MarkdownV2 特殊字符
 */
function escapeMarkdown(text: string): string {
  // eslint-disable-next-line no-useless-escape
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

/**
 * 测试 Telegram 配置是否有效
 */
export async function testTelegramConfig(config: TelegramConfig): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: "Telegram 通知未启用" };
  }

  if (!config.botToken) {
    return { success: false, message: "Bot Token 未配置" };
  }

  if (!config.chatId) {
    return { success: false, message: "Chat ID 未配置" };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/getMe`
    );

    const data = await response.json();

    if (!data.ok) {
      return { success: false, message: `Bot Token 无效: ${data.description}` };
    }

    // 发送测试消息
    const testResponse = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: "✅ *配置测试成功*\n\n您的 Telegram 密码备份功能已启用！",
          parse_mode: "MarkdownV2"
        })
      }
    );

    const testData = await testResponse.json();

    if (!testData.ok) {
      return { success: false, message: `Chat ID 无效: ${testData.description}` };
    }

    return { success: true, message: `配置有效，Bot: ${data.result.username}` };
  } catch (error: any) {
    return { success: false, message: `网络错误: ${error.message}` };
  }
}
