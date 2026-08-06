import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";
import { WXTaskType } from "../../const.js";

export interface WXPublishTaskOptions extends WXTaskOptions { }

export interface WXPublishTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_PUBLISH;
    options: WXPublishTaskOptions;
}   