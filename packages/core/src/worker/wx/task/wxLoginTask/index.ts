import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";

export class WXLoginTask extends WXTask {
    readonly type = WXTaskType.WX_LOGIN;
}
