import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../WXTask.js";

export class WXInspectVersionTask extends WXTask {
    readonly type = WXTaskType.WX_INSPECT_VERSION;
}