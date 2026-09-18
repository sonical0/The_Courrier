import handler from "../../../api/nexus/validate.mjs";
import { toPagesFunction } from "../../../api/utils/pagesAdapter.mjs";

export const onRequest = toPagesFunction(handler);
