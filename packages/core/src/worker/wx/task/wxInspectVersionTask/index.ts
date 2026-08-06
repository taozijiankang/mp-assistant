import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXInspectVersionTaskInfo, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { WXInspectVersionExecutorMessage } from "./executor.js";
import { ExecutorCustomMessage } from "../../../type.js";

export class WXInspectVersionTask extends WXTask<WXInspectVersionTaskOptions, WXInspectVersionTaskInfo> {
    readonly type = WXTaskType.WX_INSPECT_VERSION;

    private versionData?: WXVersionCodeData;

    getInfo(): WXInspectVersionTaskInfo {
        return {
            ...super.getInfo(),
            versionData: this.versionData,
        } as WXInspectVersionTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.versionData = undefined;
    }

    protected onExecutorMessage(message: ExecutorCustomMessage<WXInspectVersionExecutorMessage>): void {
        if (message.type === 'UPDATE_VERSION_LIST') {
            this.versionData = message.data.versionData;
            this.worker?.changeDetail();
            return;
        }
        super.onExecutorMessage(message);
    }
}
