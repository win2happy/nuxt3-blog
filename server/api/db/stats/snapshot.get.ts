import { getSnapshot, tryRestoreFromPublic } from "../../../utils/visitor-log";

export default defineEventHandler(async () => {
  tryRestoreFromPublic();
  return getSnapshot();
});
