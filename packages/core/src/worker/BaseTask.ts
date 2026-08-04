import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BaseTaskOptions, BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { ChildProcess } from "node:child_process";
import { invokeExecuteTask } from "../bin/invoke.js";
import { BaseTaskExecutor, BaseTaskExecutorMessage } from "./BaseTaskExecutor.js";
import { BrowserContext } from "playwright";

export abstract class BaseTask<
    Options extends BaseTaskOptions = BaseTaskOptions,
    Info extends BaseTaskInfo = BaseTaskInfo
> {
    declare readonly type: string;
    declare readonly key: string;
    declare readonly options: Options;

    protected status: TaskStatus = TaskStatus.IDLE;

    private executorTask: ChildProcess | null = null;

    protected isExecutor = false;

    constructor({ options, key, isExecutor }: { options: Options, key?: string, isExecutor?: boolean }) {
        this.isExecutor = isExecutor ?? false;
        this.options = options;
        this.key = key || `task-${getUUID()}`;
    }

    getInfo(): Info {
        return {
            key: this.key,
            type: this.type,
            status: this.status,
            createdTime: new Date().toISOString(),
            options: this.options as BaseTaskOptions,
        } as Info;
    }

    getKey(): string {
        return this.key;
    }

    getStatus(): TaskStatus {
        return this.status;
    }

    setStatus(status: TaskStatus): void {
        this.status = status;

        // 任务完成或失败，杀死任务进程
        if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.FAILED) {
            if (this.executorTask) {
                this.executorTask.kill();
                this.executorTask = null;
            }
        }
    }

    async run(debugPort: number): Promise<void> {
        if (this.status !== TaskStatus.IDLE) {
            return;
        }
        this.setStatus(TaskStatus.RUNNING);

        this.executorTask = invokeExecuteTask(this.type, this.options, debugPort);

        // 任务创建失败
        this.executorTask.on('error', () => {
            this.onFailed();
        });
        // 任务退出
        this.executorTask.on('close', (code) => {
            if (code === 0) {
                this.onCompleted();
            } else {
                this.onFailed();
            }
        });

        this.executorTask.on('message', (message_) => {
            const message = message_ as { type: string, data: any };
            this.onExecutorMessage(message.type, message.data);
        });
    }

    execute(context: BrowserContext) {
        new BaseTaskExecutor(this.options, context).execute();
    }

    protected onCompleted(): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        console.log(`[${this.type}] completed`);
        this.setStatus(TaskStatus.COMPLETED);
    }

    protected onFailed(): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        console.log(`[${this.type}] failed`);
        this.setStatus(TaskStatus.FAILED);
    }

    protected onExecutorMessage(type: string, data: any): void {
        const _type = type as keyof BaseTaskExecutorMessage;
        const _data = data as BaseTaskExecutorMessage[keyof BaseTaskExecutorMessage];

        switch (_type) {
            case 'COMPLETED':
                if (_data.status === TaskStatus.COMPLETED) {
                    this.onCompleted();
                } else {
                    this.onFailed();
                }
                break;
            default:
                return;
        }
    }

    protected sendToExecutorMessage(type: string, data: any): void {
        if (
            this.status === TaskStatus.RUNNING &&
            this.executorTask &&
            this.executorTask.exitCode === null
        ) {
            this.executorTask.send({ type, data });
        }
    }
}


