import { WXTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { BaseTaskExecutor, BaseTaskExecutorMessage } from "../BaseTaskExecutor.js";

export interface WXTaskExecutorMessage extends BaseTaskExecutorMessage {
}

export abstract class WXTaskExecutor<Options extends WXTaskOptions = WXTaskOptions>
    extends BaseTaskExecutor<Options> {
}
