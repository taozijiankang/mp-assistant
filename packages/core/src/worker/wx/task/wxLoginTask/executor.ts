import { WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";

export interface WXLoginExecutorMessage extends WXTaskExecutorMessage {
}

export class WXLoginExecutor extends WXTaskExecutor<WXLoginTaskOptions> {
    async execute(): Promise<void> {
        // TODO: 实现登录流程
    }
}
