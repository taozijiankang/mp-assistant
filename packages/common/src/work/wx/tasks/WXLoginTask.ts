import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";
import { WXTaskType } from "../../const.js";

export interface WXLoginTaskOptions extends WXTaskOptions {}

export interface WXLoginTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_LOGIN;
}   