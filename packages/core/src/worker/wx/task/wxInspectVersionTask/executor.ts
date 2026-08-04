import { WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";

export interface WXInspectVersionExecutorMessage extends WXTaskExecutorMessage {
}

export class WXInspectVersionExecutor extends WXTaskExecutor<WXInspectVersionTaskOptions> {
    async execute(): Promise<void> {
        // TODO: 实现版本检查流程
    }
}
