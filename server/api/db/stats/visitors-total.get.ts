import { getQuery } from "h3";
import { getVisitorsByArticle, tryRestoreFromPublic } from "../../../utils/visitor-log";

export default defineEventHandler(async (event) => {
  tryRestoreFromPublic();
  const query = getQuery(event);
  return getVisitorsByArticle(query.type as string || undefined);
});
