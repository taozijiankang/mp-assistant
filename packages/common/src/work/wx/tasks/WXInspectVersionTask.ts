import { WXTaskType } from "../../const.js";
import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";

export interface WXInspectVersionTaskOptions extends WXTaskOptions {
    appId: string;
}

export interface WXInspectVersionTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_INSPECT_VERSION;
    options: WXInspectVersionTaskOptions;
}
