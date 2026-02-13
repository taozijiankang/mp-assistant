import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { BaseTaskInfo, TaskRunningReport } from "mp-assistant-common/dist/work/task/type.js";
import { TaskExecResult } from "mp-assistant-common/dist/work/task/type.js";

export abstract class BaseTask<
    TParams = any
> {
    readonly type?: TaskType;

    readonly key: string;

    protected __status: TaskStatus = TaskStatus.NOT_STARTED;

    readonly params: TParams;

    private __runningReportList: TaskRunningReport[] = [];

    private __result?: TaskExecResult;

    get status() {
        return this.__status;
    }

    get runningReportList() {
        return [...this.__runningReportList];
    }

    get result() {
        return this.__result;
    }

    constructor(options: {
        params: TParams;
    }) {
        const { params } = options;
        this.key = getUUID();
        this.params = params;
    }

    protected _setStatus(status: TaskStatus) {
        this.__status = status;
    }

    protected _addRunningReport(report: TaskRunningReport) {
        this.__runningReportList.push(report);
    }

    info(): BaseTaskInfo {
        return {
            key: this.key,
            type: this.type!,
            status: this.status,
            runningReportList: this.runningReportList,
            params: this.params,
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
            this.__result = result;
        } catch (error) {
            this._setStatus(TaskStatus.FAILED);
            this.__result = {
                status: TaskStatus.FAILED,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            console.error('任务执行失败', error);
        }
        return this.__result;
    }

    async destroy() {
        this.__runningReportList = [];
        this.__result = void 0;
    }

    protected abstract _executor(browserContent: BrowserContext): Promise<TaskExecResult>;
}
