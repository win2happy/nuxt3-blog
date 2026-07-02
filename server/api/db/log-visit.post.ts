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
    appendLog(nid, ntype);
    return { success: true };
  } catch (e: any) {
    return createError({ statusCode: 500, data: e.toString() });
  }
});
