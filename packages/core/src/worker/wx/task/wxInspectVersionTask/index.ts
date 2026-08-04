import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXInspectVersionTaskInfo, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXInspectVersionExecutor } from "./executor.js";

export class WXInspectVersionTask extends WXTask<WXInspectVersionTaskOptions, WXInspectVersionTaskInfo> {
    readonly type = WXTaskType.WX_INSPECT_VERSION;

    createExecutor(): WXInspectVersionExecutor {
        return new WXInspectVersionExecutor(this.options);
    }
}
