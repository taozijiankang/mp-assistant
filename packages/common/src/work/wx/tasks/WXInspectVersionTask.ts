import { WXTaskType } from "../../const.js";
import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";

export interface WXInspectVersionTaskOptions extends WXTaskOptions {}

export interface WXInspectVersionTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_INSPECT_VERSION;
}   
