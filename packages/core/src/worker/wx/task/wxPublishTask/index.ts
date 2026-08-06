import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXPublishTaskInfo, WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";

export class WXPublishTask extends WXTask<WXPublishTaskOptions, WXPublishTaskInfo> {
    readonly type = WXTaskType.WX_PUBLISH;
}
