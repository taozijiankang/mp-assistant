import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BaseTaskOptions, BaseTaskInfo, TaskReport } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { ChildProcess } from "node:child_process";
import { invokeExecuteTask } from "../bin/invoke.js";
import { ExecutorCommonMessage, ExecutorCustomMessage } from "./type.js";
import { BrowserContext, Page } from "playwright";

export interface TaskWorker {
    changeDetail(): void;
}

export interface BaseTaskExecutorMessage {
    /** 初始化 */
    TO_A_INIT: undefined;
    /** 自杀命令，executor 收到后自行退出 */
    TO_B_KILL: undefined;
    /** 任务结束 */
    TO_A_END: {
        status: TaskStatus.COMPLETED | TaskStatus.FAILED;
        message?: string;
    };
    /** 运行报告 */
    TO_A_REPORT: {
        type: 'text' | 'image';
        message: string;
    };
    /** 设置某个属性 */
    TO_A_SET_PROPERTY: {
        key: string;
        value: any;
    };
}

/**
 * 任务基类，负责管理任务的创建、运行、完成、失败等生命周期
 * 任务实例会被不同进程创建
 * A 进程：负责管理任务的创建、运行、完成、失败等生命周期
 * B 进程：负责执行任务，与 A 进程通信
 */
export abstract class BaseTask<
    Options extends BaseTaskOptions = BaseTaskOptions,
    Info extends BaseTaskInfo = BaseTaskInfo,
> {
    declare readonly type: string;
    declare readonly key: string;
    declare readonly options: Options;

    protected browserContent: BrowserContext | null = null;
    protected installType: 'A' | 'B';

    protected worker: TaskWorker | null = null;

    private executorCP: ChildProcess | null = null;

    protected status: TaskStatus;
    protected createdTime: string;
    protected reports: TaskReport[];
    /** 任务完成/失败时记录的消息 */
    protected completedMessage: string;

    private pages: Page[] = [];

    constructor({ options, info, browserContent }: { options: Options, info?: Omit<Partial<Info>, 'options'>, browserContent?: BrowserContext }) {
        this.options = options;

        const { key, status, createdTime, reports, completedMessage } = info ?? {};
        this.key = key || `task-${getUUID()}`;
        this.status = status || TaskStatus.IDLE;
        this.createdTime = createdTime || new Date().toISOString();
        this.reports = reports || [];
        this.completedMessage = completedMessage || '';

        this.browserContent = browserContent ?? null;
        this.installType = this.browserContent ? 'B' : 'A';
        if (this.browserContent) {
            this.browserContent.on('page', (page) => {
                this.pages.push(page);
            });
            process.on('message', (message) => {
                this.onAMessage(message as any);
            });

            this.sendToAMessage({
                type: 'TO_A_INIT',
                data: undefined,
            } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
        }
    }

    getInfo(): Info {
        return {
            key: this.key,
            type: this.type,
            status: this.status,
            createdTime: this.createdTime,
            options: this.options as BaseTaskOptions,
            reports: this.reports,
            completedMessage: this.completedMessage,
        } as Info;
    }

    setWorker(worker: TaskWorker | null): void {
        this.worker = worker;
    }

    private setStatus(status: TaskStatus): void {
        this.status = status;
        this.worker?.changeDetail();

        // 任务完成或失败，通知执行器自行退出
        if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.FAILED) {
            if (this.executorCP) {
                this.executorCP.removeAllListeners();
                // 发送自杀命令给执行器
                if (this.executorCP.exitCode === null) {
                    this.executorCP.send({ type: 'TO_B_KILL', data: undefined } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
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

        this.reports.push({
            type: 'text',
            message: `创建任务子进程...`,
            time: Date.now(),
        });

        this.executorCP = invokeExecuteTask(
            this.type,
            this.options,
            this.getInfo(),
            debugPort
        );

        // 任务创建失败
        this.executorCP.on('error', () => {
            this.end(TaskStatus.FAILED, '子进程启动失败');
        });
        // 任务退出
        this.executorCP.on('close', (code) => {
            if (code === 0) {
                this.end(TaskStatus.COMPLETED, '进程正常退出');
            } else {
                this.end(TaskStatus.FAILED, `进程异常退出, 退出码: ${code}`);
            }
        });

        this.executorCP.on('message', (message) => {
            this.onBMessage(message as any);
        });
    }

    async execute(): Promise<void> { }

    abort(): void {
        this.reports.push({
            type: 'text',
            message: '任务被终止',
            time: Date.now(),
        });
        this.end(TaskStatus.FAILED, '任务被终止');
    }

    resetStatus(): void {
        if (this.status !== TaskStatus.FAILED && this.status !== TaskStatus.COMPLETED) {
            return;
        }
        this.reports.push({
            type: 'text',
            message: '任务被重置',
            time: Date.now(),
        });
        this.onReset();
        this.setStatus(TaskStatus.IDLE);
    }

    /** 子类可重写，重置自身字段 */
    protected onReset(): void {
        // 子类实现
    }

    protected end(status: TaskStatus.COMPLETED | TaskStatus.FAILED, message?: string): void {
        switch (this.installType) {
            case 'A': {
                if (this.status !== TaskStatus.RUNNING) {
                    return;
                }
                this.completedMessage = message || '';
                this.setStatus(status);
                break;
            }
            case 'B': {
                this.sendToAMessage({
                    type: 'TO_A_END',
                    data: {
                        status,
                        message,
                    },
                } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
                break;
            }
        }
    }

    protected report(type: 'text' | 'image', message: string): void {
        switch (this.installType) {
            case 'A': {
                this.reports.push({
                    type,
                    message,
                    time: Date.now(),
                });
                this.worker?.changeDetail();
                break;
            }
            case 'B': {
                this.sendToAMessage({
                    type: 'TO_A_REPORT',
                    data: {
                        type,
                        message,
                    },
                } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
                break;
            }
        }
    }

    protected onBMessage({ type, data }: ExecutorCustomMessage<BaseTaskExecutorMessage>): void {
        switch (type) {
            case 'TO_A_INIT': {
                this.reports.push({
                    type: 'text',
                    message: '任务子进程初始化完成',
                    time: Date.now(),
                });
                break;
            }
            case 'TO_A_END': {
                this.end(data.status, data.message);
                break;
            }
            case 'TO_A_REPORT': {
                this.reports.push({
                    ...data,
                    time: Date.now(),
                });
                this.worker?.changeDetail();
                break;
            }
            case 'TO_A_SET_PROPERTY': {
                const { key, value } = data;
                (this as any)[key] = value;
                this.worker?.changeDetail();
                break;
            }
            default:
                return;
        }
    }

    protected sendToBMessage(message: ExecutorCommonMessage): void {
        if (
            this.status === TaskStatus.RUNNING &&
            this.executorCP &&
            this.executorCP.exitCode === null
        ) {
            this.executorCP.send(message);
        }
    }

    protected onAMessage(message: ExecutorCustomMessage<BaseTaskExecutorMessage>): void {
        const { type } = message;
        if (type === 'TO_B_KILL') {
            // 先关闭所有页面，再退出
            Promise.all(
                this.pages.map(p => p.close().catch(() => { }))
            ).finally(() => {
                process.exit(0);
            });
        }
    }

    protected sendToAMessage(message: ExecutorCommonMessage): void {
        if (process.send) {
            process.send(message);
        }
    }

    protected setAProperty(key: string, value: any): void {
        this.sendToAMessage({
            type: 'TO_A_SET_PROPERTY',
            data: {
                key,
                value,
            },
        } as ExecutorCustomMessage<BaseTaskExecutorMessage>);
    }
}


