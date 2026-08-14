import { VersionPositioner } from "../../../utils/index.js";
import { WXTaskType } from "../../const.js";
import { WXTaskInfo, WXTaskOptions } from "../WXTask.js";

export interface WXAuditTaskOptions extends WXTaskOptions {
    appId: string;
    positioner?: VersionPositioner[]
    populateData?: {
        // 版本描述
        versionDescription?: string
        // 图片预览
        imagePreviews?: string[]
        // 视频预览
        videoPreview?: string
    }
}

export interface WXAuditTaskInfo extends WXTaskInfo {
    type: WXTaskType.WX_AUDIT;
    options: WXAuditTaskOptions;
}   