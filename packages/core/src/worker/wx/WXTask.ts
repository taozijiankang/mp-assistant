import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { BaseTask } from "../BaseTask.js";

export class WXTask extends BaseTask {
    declare readonly type: WXTaskType;
}