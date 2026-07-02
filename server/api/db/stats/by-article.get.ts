import { getQuery, createError } from "h3";
import { getArticleVisitors } from "../../../utils/visitor-log";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const nid = parseInt(query.nid as string);
  const ntype = query.ntype as string;

  if (isNaN(nid) || !ntype) {
    throw createError({ statusCode: 400, data: "Missing or invalid nid or ntype" });
  }

  return await getArticleVisitors(nid, ntype);
});
