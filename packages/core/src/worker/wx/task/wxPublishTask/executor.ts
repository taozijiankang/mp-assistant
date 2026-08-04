import { WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";

export interface WXPublishExecutorMessage extends WXTaskExecutorMessage {
}

export class WXPublishExecutor extends WXTaskExecutor<WXPublishTaskOptions> {
    async execute(): Promise<void> {
        // TODO: 实现发布流程
    }
}
