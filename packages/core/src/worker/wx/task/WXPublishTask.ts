import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../WXTask.js";

export class WXPublishTask extends WXTask {
    readonly type = WXTaskType.WX_PUBLISH;
}