import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXLoginTaskInfo, WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXLoginExecutor } from "./executor.js";

export class WXLoginTask extends WXTask<WXLoginTaskOptions, WXLoginTaskInfo> {
    readonly type = WXTaskType.WX_LOGIN;

    createExecutor(): WXLoginExecutor {
        return new WXLoginExecutor(this.options);
    }
}
