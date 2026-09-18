import handler from "../../../api/nexus/untrack.mjs";
import { toPagesFunction } from "../../../api/utils/pagesAdapter.mjs";

export const onRequest = toPagesFunction(handler);
