import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { wait } from "@mp-assistant/common/dist/utils/global.js";
import { BaseTaskOptions, BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { BrowserContext } from "playwright";
import { executeTask } from "./executeTask.js";
import { ChildProcess } from "node:child_process";

export abstract class BaseTask<
    Options extends BaseTaskOptions = BaseTaskOptions,
    Info extends BaseTaskInfo = BaseTaskInfo
> {
    declare readonly type: string;

    declare readonly key: string;
    declare readonly options: Options;

    protected status: TaskStatus = TaskStatus.IDLE;

    private task: ChildProcess | null = null;

    /** 是否是执行者 */
    protected isExecutor: boolean = false;

    constructor({ options, key }: { options: Options, key?: string }, isExecutor: boolean = false) {
        this.options = options;
        this.key = key || getUUID();
        this.isExecutor = isExecutor;
    }

    getInfo(): Info {
        return {
            key: this.key,
            type: this.type,
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
    }

    async run(debugPort: number): Promise<void> {
        if (this.status !== TaskStatus.IDLE) {
            return;
        }
        this.setStatus(TaskStatus.RUNNING);
        this.task = executeTask(this.type, this.options, debugPort);
        // 任务创建失败
        this.task.on('error', () => {
            this.onFailed();
        });
        // 任务退出
        this.task.on('close', (code) => {
            if (code !== 0) {
                this.onFailed();
            }
        });

        this.task.on('message', (message) => {
            this.onMessage(message);
        });
    }

    async execute(browserContent: BrowserContext): Promise<void> {
        //
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

    protected onMessage(message: any): void {
        console.log(`[${this.type}] message: ${message}`);
    }

    protected sendMessage(message: any): void {
        if (this.task) {
            this.task.send(message);
        }
    }
}
