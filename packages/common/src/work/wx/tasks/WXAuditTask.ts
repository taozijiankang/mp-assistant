import { WXTaskType } from "../../const.js";
import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";

export interface WXAuditTaskOptions extends WXTaskOptions {}

export interface WXAuditTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_AUDIT;
    options: WXAuditTaskOptions;
}   