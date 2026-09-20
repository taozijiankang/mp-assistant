import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";
import { WXTaskType } from "../../const.js";
import { VersionPositioner } from "../../../utils/index.js";

export interface WXPublishTaskOptions extends WXTaskOptions {
    appId: string;
    positioner: VersionPositioner[]
}

export interface WXPublishTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_PUBLISH;
    options: WXPublishTaskOptions;
    publishQRCode?: string;
}