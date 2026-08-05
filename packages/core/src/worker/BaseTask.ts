import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BaseTaskOptions, BaseTaskInfo, TaskReport } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { ChildProcess } from "node:child_process";
import { invokeExecuteTask } from "../bin/invoke.js";
import { BaseTaskExecutorMessage } from "./BaseTaskExecutor.js";
import { ExecutorCommonMessage, ExecutorCustomMessage } from "./type.js";

export interface TaskWorker {
    changeDetail(): void;
}

export abstract class BaseTask<
    Options extends BaseTaskOptions = BaseTaskOptions,
    Info extends BaseTaskInfo = BaseTaskInfo,
> {
    declare readonly type: string;
    declare readonly key: string;
    declare readonly options: Options;

    protected status: TaskStatus = TaskStatus.IDLE;

    private executorCP: ChildProcess | null = null;

    private reports: TaskReport[] = [];

    /** 任务完成/失败时记录的消息 */
    private completedMessage?: string;

    worker: TaskWorker | null = null;

    constructor({ options, key }: { options: Options, key?: string }) {
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
            completedMessage: this.completedMessage,
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

        // 任务完成或失败，通知执行器自行退出
        if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.FAILED) {
            if (this.executorCP) {
                this.executorCP.removeAllListeners();
                // 发送自杀命令给执行器
                if (this.executorCP.exitCode === null) {
                    this.executorCP.send({ type: 'KILL', data: undefined } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
                }
                this.executorCP = null;
            }
        }
    }

    async run(debugPort: number): Promise<void> {
        if (this.status !== TaskStatus.IDLE) {
            return;
        }
        this.setStatus(TaskStatus.RUNNING);

        this.executorCP = invokeExecuteTask(this.type, this.options, debugPort);

        // 任务创建失败
        this.executorCP.on('error', () => {
            this.failed('子进程启动失败');
        });
        // 任务退出
        this.executorCP.on('close', (code) => {
            if (code === 0) {
                this.completed('进程正常退出');
            } else {
                this.failed(`进程异常退出, 退出码: ${code}`);
            }
        });

        this.executorCP.on('message', (message) => {
            this.onExecutorMessage(message as any);
        });
    }

    abort(): void {
        this.failed('任务被终止');
    }

    resetStatus(): void {
        if (this.status !== TaskStatus.FAILED && this.status !== TaskStatus.COMPLETED) {
            return;
        }
        this.setStatus(TaskStatus.IDLE);
    }

    protected completed(message?: string): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        this.completedMessage = message;
        this.setStatus(TaskStatus.COMPLETED);
    }

    protected failed(message?: string): void {
        if (this.status !== TaskStatus.RUNNING) {
            return;
        }
        this.completedMessage = message;
        this.setStatus(TaskStatus.FAILED);
    }

    protected onExecutorMessage({ type, data }: ExecutorCustomMessage<BaseTaskExecutorMessage>): void {
        switch (type) {
            case 'COMPLETED': {
                if (data.status === TaskStatus.COMPLETED) {
                    this.completed(data.message);
                } else {
                    this.failed(data.message);
                }
                break;
            }
            case 'REPORT': {
                const _data = data as BaseTaskExecutorMessage['REPORT'];
                this.reports.push({
                    ..._data,
                    time: Date.now(),
                });
                this.worker?.changeDetail();
                break;
            }
            default:
                return;
        }
    }

    protected sendToExecutorMessage(message: ExecutorCommonMessage): void {
        if (
            this.status === TaskStatus.RUNNING &&
            this.executorCP &&
            this.executorCP.exitCode === null
        ) {
            this.executorCP.send(message);
        }
    }
}


