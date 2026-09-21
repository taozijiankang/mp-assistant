import { TaskStatus, TaskStatusDict } from "@mp-assistant/common/dist/work/const.js";
import { BaseTaskOptions, BaseTaskInfo, TaskReport } from "@mp-assistant/common/dist/work/BaseTask.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { ChildProcess } from "node:child_process";
import { invokeExecuteTask } from "../bin/invoke.js";
import { ExecutorCommonMessage, ExecutorCustomMessage } from "./type.js";
import { BrowserContext, Page } from "playwright";
import type { BaseWorker } from "./BaseWorker.js";

/**
 * A/B 进程间消息。类型名以「目的地」为准：
 * TO_A_* 由 B 发给 A（任务结束/报告/属性写回），TO_B_* 由 A 发给 B（如自杀命令）。
 */
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
 * 任务基类：管理任务状态、生命周期与父子进程间通信。
 * 同一份代码会在 A（父，worker）/ B（子，executor）两种进程各实例化一次，分工见构造函数注释。
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

    protected worker: BaseWorker | null = null;

    private executorCP: ChildProcess | null = null;

    protected status: TaskStatus;
    protected createdTime: string;
    protected reports: TaskReport[];
    /** 任务完成/失败时记录的消息 */
    protected completedMessage: string;
    /** 任务完成/失败的时间戳（毫秒），供定时任务判断间隔 */
    protected completedTime?: number;
    /** 执行次数，任务每次运行累加 */
    protected runCount: number;
    /** 失败后已自动重试的次数 */
    protected retryCount: number;
    /** 是否被手动终止（终止后不再自动重试） */
    private aborted = false;

    private pages: Page[] = [];

    constructor({ options, info, browserContent }: { options: Options, info?: Omit<Partial<Info>, 'options'>, browserContent?: BrowserContext }) {
        this.options = options;

        const { key, status, createdTime, reports, completedMessage, completedTime, runCount, retryCount } = info ?? {};
        this.key = key || `task-${getUUID()}`;
        this.status = status || TaskStatus.IDLE;
        this.createdTime = createdTime || new Date().toISOString();
        this.reports = reports || [];
        this.completedMessage = completedMessage || '';
        this.completedTime = completedTime;
        this.runCount = runCount || 0;
        this.retryCount = retryCount || 0;

        // 同一份 BaseTask 代码在两种进程各实例化一次：
        // A 进程（父，worker）没有 browserContent，负责 fork 子进程并维护状态；
        // B 进程（子，executor）经 CDP 拿到 browserContent，只执行任务并把结果回报给 A。
        this.browserContent = browserContent ?? null;
        this.installType = this.browserContent ? 'B' : 'A';
        if (this.browserContent) {
            // B 进程：监听 A 发来的消息，并主动上报一次「初始化完成」
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
            completedTime: this.completedTime,
            runCount: this.runCount,
            retryCount: this.retryCount,
        } as Info;
    }

    setWorker(worker: BaseWorker | null): void {
        this.worker = worker;
    }

    /** 通知 worker：详情面板摘要与任务弹窗均需刷新 */
    private notifyWorkerChange(): void {
        this.worker?.changeDetail();
        this.worker?.changeTask(this.key);
    }

    private setStatus(status: TaskStatus): void {
        this.status = status;
        // 记录完成/失败时间，重置为其他状态时清空
        this.completedTime = status === TaskStatus.COMPLETED || status === TaskStatus.FAILED ? Date.now() : undefined;
        this.notifyWorkerChange();

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
        this.runCount += 1;
        this.setStatus(TaskStatus.RUNNING);

        this.reports.push({
            type: 'text',
            message: `创建任务子进程...`,
            time: Date.now(),
        });

        // fork 出独立子进程（B）执行任务，参数经临时文件传递；A 只负责监听它的消息与退出
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

    /** 打开新页面并登记到任务自身，确保终止时只关闭本任务打开的页面 */
    protected async newPage(): Promise<Page> {
        const page = await this.browserContent!.newPage();
        this.trackPage(page);
        return page;
    }

    /** 登记页面，并监听其弹出的新页面（popup）递归纳入本任务 */
    private trackPage(page: Page): void {
        this.pages.push(page);
        page.on('popup', (popup) => this.trackPage(popup));
    }

    abort(): void {
        this.aborted = true;
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
        this.reports = [];
        this.aborted = false;
        this.retryCount = 0;
        this.onReset();
        this.setStatus(TaskStatus.IDLE);
    }

    /** 失败后自动重试：未达上限则立即重置为空闲等待重跑 */
    private tryRetry(): void {
        const retryTimes = this.options.retryTimes ?? 0;
        if (retryTimes <= 0 || this.aborted) return;
        if (this.retryCount >= retryTimes) return;

        this.retryCount += 1;
        this.reports.push({
            type: 'text',
            message: `任务失败，自动重试（第 ${this.retryCount}/${retryTimes} 次）`,
            time: Date.now(),
        });
        this.onReset();
        this.setStatus(TaskStatus.IDLE);
    }

    /** 子类可重写，重置自身字段 */
    protected onReset(): void {
        // 子类实现
    }

    /** 处理 executor 上报的属性写回；子类可重写以路由到 worker */
    protected onSetProperty(key: string, value: any): void {
        (this as any)[key] = value;
    }

    /** 设置是否为定时任务，供详情面板开关控制 */
    setScheduled(scheduled: boolean): void {
        this.options.scheduled = scheduled;
        this.notifyWorkerChange();
    }

    protected end(status: TaskStatus.COMPLETED | TaskStatus.FAILED, message?: string): void {
        // A 是状态的权威来源，直接落地；B 不自己改状态，只把结束结果回报给 A
        switch (this.installType) {
            case 'A': {
                if (this.status !== TaskStatus.RUNNING) {
                    return;
                }
                this.reports.push({
                    type: 'text',
                    message: `任务结束，状态: ${TaskStatusDict[status]}, 消息: ${message || ''}`,
                    time: Date.now(),
                });
                this.completedMessage = message || '';
                this.setStatus(status);
                if (status === TaskStatus.FAILED) {
                    this.tryRetry();
                }
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
        // 与 end 同理：A 本地记录，B 上报给 A
        switch (this.installType) {
            case 'A': {
                this.reports.push({
                    type,
                    message,
                    time: Date.now(),
                });
                this.notifyWorkerChange();
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
                this.notifyWorkerChange();
                break;
            }
            case 'TO_A_SET_PROPERTY': {
                const { key, value } = data;
                this.onSetProperty(key, value);
                this.notifyWorkerChange();
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


