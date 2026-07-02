import { getQuery } from "h3";
import { getVisitorsByArticle, tryRestoreFromPublic } from "../../../utils/visitor-log";

export default defineEventHandler(async (event) => {
  tryRestoreFromPublic();
  const query = getQuery(event);
  return await getVisitorsByArticle(query.type as string || undefined);
});
