import handler from "../../../../api/steam/game/[appId].mjs";
import { toPagesFunction } from "../../../../api/utils/pagesAdapter.mjs";

export const onRequest = toPagesFunction(handler);
