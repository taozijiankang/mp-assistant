import { WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";
import { ExecutorCustomMessage } from "../../../type.js";
import { getVersionList } from "../../../../api/index.js";

export interface WXInspectVersionExecutorMessage extends WXTaskExecutorMessage {
    UPDATE_VERSION_LIST: {
        versionData: WXVersionCodeData;
    };
}

export class WXInspectVersionExecutor extends WXTaskExecutor<WXInspectVersionTaskOptions> {
    protected sendToTaskMessage(message: ExecutorCustomMessage<WXInspectVersionExecutorMessage>): void {
        super.sendToTaskMessage(message as any);
    }

    async execute(): Promise<void> {
        try {
            const page = await this.createPage();

            await this.switchMP(page, this.options.appId);

            this.report('text', '正在获取版本列表...');
            const versionData = await getVersionList(page);
            this.sendToTaskMessage({
                type: 'UPDATE_VERSION_LIST',
                data: { versionData },
            });

            this.report('text', '版本列表获取完成');

            this.completed('登录任务完成');
        } catch (error) {
            this.failed(error instanceof Error ? error.message : '登录失败');
        }
    }
}
