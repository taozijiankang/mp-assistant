import { WXTaskInfo, WXTaskOptions, WXTaskType } from "@mp-assistant/common/dist/work/index.js";
import { BaseTask } from "../BaseTask.js";

export abstract class WXTask<
    Options extends WXTaskOptions = WXTaskOptions,
    Info extends WXTaskInfo = WXTaskInfo
> extends BaseTask<Options, Info> {
    declare readonly type: WXTaskType;
}