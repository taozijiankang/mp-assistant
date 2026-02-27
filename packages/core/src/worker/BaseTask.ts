import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { BaseTaskInfo, TaskExecResult, TaskRunningReport, TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import type { BaseWorker } from "./BaseWorker.js";
import { WSMessage } from "mp-assistant-common/dist/ws/message.js";

export abstract class BaseTask {
    readonly type?: TaskType;

    readonly key: string;

    private __status: TaskStatus = TaskStatus.NOT_STARTED;

    readonly options: any;

    private __runningReportList: TaskRunningReport[] = [];

    result?: TaskExecResult;

    protected _worker?: BaseWorker;

    get worker(): BaseWorker | null {
        return this._worker || null;
    }
    set worker(worker: BaseWorker) {
        this._worker = worker;
    }

    get status() {
        return this.__status;
    }

    get runningReportList() {
        return [...this.__runningReportList];
    }

    constructor(options: any) {
        this.key = getUUID();
        this.options = options;
    }

    protected _setStatus(status: TaskStatus) {
        if (this.__status === status) {
            return;
        }
        this.__status = status;

        this.emitDetailChangeEvent();
    }

    protected _addRunningReport(report: TaskRunningReport) {
        this.__runningReportList.push(report);

        this.emitDetailChangeEvent();
    }

    info(): BaseTaskInfo {
        return {
            workerKey: this._worker?.key || '',
            key: this.key,
            type: this.type!,
            status: this.status,
            runningReportList: this.runningReportList,
            options: this.options,
            result: this.result,
        };
    }

    async run(browserContent: BrowserContext): Promise<TaskExecResult> {
        if (this.status !== TaskStatus.NOT_STARTED) {
            throw new Error('Task already started');
        }
        this._setStatus(TaskStatus.RUNNING);
        try {
            // 清空运行报告
            this.__runningReportList = [];
            // 执行任务
            const result = await this._executor(browserContent);
            this._setStatus(result.status);
            this.result = result;
        } catch (error) {
            this._setStatus(TaskStatus.FAILED);
            this.result = {
                status: TaskStatus.FAILED,
                endTimestamp: Date.now(),
                msg: error instanceof Error ? error.message : '未知错误',
            };
            console.error('任务执行失败', error);
        }
        return this.result;
    }

    async destroy() {
        this.__runningReportList = [];
        this.result = void 0;
    }

    emitMessage<K extends keyof WSMessage.EventMap>(type: K, data: WSMessage.EventMap[K]) {
        this.worker?.emitMessage(type, data);
    }

    private __emitDetailChangeEventTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * 触发详情改变事件
     * 会有一层节流
     */
    emitDetailChangeEvent() {
        this.__emitDetailChangeEventTimer && clearTimeout(this.__emitDetailChangeEventTimer);
        this.__emitDetailChangeEventTimer = setTimeout(() => {
            this.emitMessage(WSMessage.Worker.DetailChange.type, {
                key: this.key,
            });
        }, 0);
    }

    protected abstract _executor(browserContent: BrowserContext): Promise<TaskExecResult>;
}
