import { WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";

export interface WXAuditExecutorMessage extends WXTaskExecutorMessage {
}

export class WXAuditExecutor extends WXTaskExecutor<WXAuditTaskOptions> {
    async execute(): Promise<void> {
        // TODO: 实现提审流程
    }
}
