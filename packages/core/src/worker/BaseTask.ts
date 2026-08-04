import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BaseTaskOptions, BaseTaskInfo, TaskReport } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { ChildProcess } from "node:child_process";
import { invokeExecuteTask } from "../bin/invoke.js";
import { BaseTaskExecutor, BaseTaskExecutorMessage } from "./BaseTaskExecutor.js";
import { BrowserContext } from "playwright";

export interface TaskWorker {
    changeDetail(): void;
}

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

    private reports: TaskReport[] = [];

    worker: TaskWorker | null = null;

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
            reports: this.reports,
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
        this.worker?.changeDetail();

        // 任务完成或失败，杀死任务进程，先移除监听防止旧回调干扰后续 rerun
        if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.FAILED) {
            if (this.executorTask) {
                this.executorTask.removeAllListeners();
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
            this.failed();
        });
        // 任务退出
        this.executorTask.on('close', (code) => {
            if (code === 0) {
                this.completed();
            } else {
                this.failed();
            }
        });

        this.executorTask.on('message', (message_) => {
            const message = message_ as { type: string, data: any };
            this.onExecutorMessage(message.type, message.data);
        });
    }

    abort(): void {
        this.failed();
    }

    resetStatus(): void {
        if (this.status !== TaskStatus.FAILED && this.status !== TaskStatus.COMPLETED) {
            return;
        }
        this.setStatus(TaskStatus.IDLE);
    }

    execute(context: BrowserContext) {
        new BaseTaskExecutor(this.options, context).execute();
    }

    protected completed(): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        console.log(`[${this.type}] completed`);
        this.setStatus(TaskStatus.COMPLETED);
    }

    protected failed(): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        console.log(`[${this.type}] failed`);
        this.setStatus(TaskStatus.FAILED);
    }

    protected onExecutorMessage(type: string, data: any): void {
        const _type = type as keyof BaseTaskExecutorMessage;

        switch (_type) {
            case 'COMPLETED': {
                const _data = data as BaseTaskExecutorMessage['COMPLETED'];
                if (_data.status === TaskStatus.COMPLETED) {
                    this.completed();
                } else {
                    this.failed();
                }
            }
                break;
            case 'REPORT':
                const _data = data as BaseTaskExecutorMessage['REPORT'];
                this.reports.push({
                    ..._data,
                    time: Date.now(),
                });
                this.worker?.changeDetail();
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


