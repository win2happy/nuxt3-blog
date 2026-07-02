import { buildOverview, tryRestoreFromPublic } from "../../../utils/visitor-log";

export default defineEventHandler(async () => {
  tryRestoreFromPublic();
  return await buildOverview();
});
