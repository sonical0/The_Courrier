import handler from "../../../api/nexus/tracked.mjs";
import { toPagesFunction } from "../../../api/utils/pagesAdapter.mjs";

export const onRequest = toPagesFunction(handler);
