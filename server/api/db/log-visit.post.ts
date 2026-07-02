import { readBody, createError } from "h3";
import { appendLog } from "../../utils/visitor-log";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({ statusCode: 405, data: "Post only!" });
  }
  try {
    const { nid, ntype } = await readBody(event);
    if (typeof nid !== "number" || typeof ntype !== "string") {
      throw createError({ statusCode: 400, data: "Invalid body" });
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("GitHub sync timeout")), 5000);
    });

    await Promise.race([appendLog(nid, ntype), timeoutPromise]);
    return { success: true };
  } catch (e: any) {
    console.error("[VisitorLog] log-visit API error:", e);
    return { success: true };
  }
});
