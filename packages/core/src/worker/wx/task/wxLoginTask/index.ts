import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXLoginTaskInfo, WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { WXLoginExecutorMessage } from "./executor.js";
import { ExecutorCustomMessage } from "../../../type.js";

export class WXLoginTask extends WXTask<WXLoginTaskOptions, WXLoginTaskInfo> {
    readonly type = WXTaskType.WX_LOGIN;

    /** 微信小程序列表，由 executor 通过 UPDATE_WXA_LIST 消息上报 */
    private wxaList?: WXMPItem[];

    getInfo(): WXLoginTaskInfo {
        return {
            ...super.getInfo(),
            wxaList: this.wxaList,
        } as WXLoginTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.wxaList = undefined;
    }

    protected onExecutorMessage(message: ExecutorCustomMessage<WXLoginExecutorMessage>): void {
        if (message.type === 'UPDATE_WXA_LIST') {
            this.wxaList = message.data.wxaList;
            this.worker?.changeDetail();
            return;
        }
        super.onExecutorMessage(message as any);
    }
}
