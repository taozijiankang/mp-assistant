import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";
import { WXTaskType } from "../../const.js";
import { WXMPItem } from "../../../types/wx.js";

export interface WXLoginTaskOptions extends WXTaskOptions {}

export interface WXLoginTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_LOGIN;
    /** 微信小程序列表 */
    wxaList?: WXMPItem[];
}   