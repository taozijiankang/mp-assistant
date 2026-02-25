import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { BaseTaskInfo, TaskRunningReport } from "mp-assistant-common/dist/work/task/type.js";
import { TaskExecResult } from "mp-assistant-common/dist/work/task/type.js";

export abstract class BaseTask {
    readonly type?: TaskType;

    readonly key: string;

    private __status: TaskStatus = TaskStatus.NOT_STARTED;

    readonly options: any;

    private __runningReportList: TaskRunningReport[] = [];

    result?: TaskExecResult;

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
            };
            console.error('任务执行失败', error);
        }
        return this.result;
    }

    async destroy() {
        this.__runningReportList = [];
        this.result = void 0;
    }

    protected abstract _executor(browserContent: BrowserContext): Promise<TaskExecResult>;
}
