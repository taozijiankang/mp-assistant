import { BaseTaskOptions } from "@mp-assistant/common/dist/work/BaseTask.js";
import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BrowserContext } from "playwright";

export interface BaseTaskExecutorMessage {
    /** 完成任务 */
    COMPLETED: {
        status: TaskStatus.COMPLETED | TaskStatus.FAILED;
    };
}

export class BaseTaskExecutor<Options extends BaseTaskOptions = BaseTaskOptions> {
    protected options: Options;

    constructor(options: Options) {
        this.options = options;

        process.on('message', (message_) => {
            const message = message_ as { type: keyof BaseTaskExecutorMessage, data: any };
            this.onTaskMessage(message.type, message.data);
        });
    }

    async execute(context: BrowserContext) {
        this.onCompleted();
    }

    protected onTaskMessage<T extends keyof BaseTaskExecutorMessage>(type: T, data: BaseTaskExecutorMessage[T]): void {
        console.log(`[${type}] task message: ${type}: ${data}`);
    }

    protected sendToTaskMessage<T extends keyof BaseTaskExecutorMessage>(type: T, data: BaseTaskExecutorMessage[T]): void {
        if (process.send) {
            process.send({ type, data });
        }
    }

    protected onCompleted(): void {
        this.sendToTaskMessage('COMPLETED', {
            status: TaskStatus.COMPLETED,
        });
    }

    protected onFailed(): void {
        this.sendToTaskMessage('COMPLETED', {
            status: TaskStatus.FAILED,
        });
    }
}