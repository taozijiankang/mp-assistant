import { BaseTaskOptions } from "@mp-assistant/common/dist/work/BaseTask.js";
import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BrowserContext } from "playwright";

export interface BaseTaskExecutorMessage {
    /** 完成任务 */
    COMPLETED: {
        status: TaskStatus.COMPLETED | TaskStatus.FAILED;
    };
    /** 运行报告 */
    REPORT: {
        type: 'text' | 'image';
        message: string;
    };
}

export class BaseTaskExecutor<Options extends BaseTaskOptions = BaseTaskOptions> {
    protected options: Options;
    protected context: BrowserContext;

    constructor(options: Options, context: BrowserContext) {
        this.options = options;
        this.context = context;

        process.on('message', (message_) => {
            const message = message_ as { type: keyof BaseTaskExecutorMessage, data: any };
            this.onTaskMessage(message.type, message.data);
        });
    }

    async execute() {
        console.log('execute task');

        this.completed();
    }

    protected onTaskMessage<T extends keyof BaseTaskExecutorMessage>(type: T, data: BaseTaskExecutorMessage[T]): void {
        console.log(`[${type}] task message: ${type}: ${data}`);
    }

    protected sendToTaskMessage<T extends keyof BaseTaskExecutorMessage>(type: T, data: BaseTaskExecutorMessage[T]): void {
        if (process.send) {
            process.send({ type, data });
        }
    }

    protected completed(): void {
        this.sendToTaskMessage('COMPLETED', {
            status: TaskStatus.COMPLETED,
        });
    }

    protected report(type: 'text' | 'image', message: string): void {
        this.sendToTaskMessage('REPORT', { type, message });
    }

    protected failed(): void {
        this.sendToTaskMessage('COMPLETED', {
            status: TaskStatus.FAILED,
        });
    }
}