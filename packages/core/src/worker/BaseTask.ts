import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/constant/enum/task.js";
import { TaskRunningReport } from "mp-assistant-common/dist/types/task.js";
import { TaskExecResult } from "mp-assistant-common/dist/types/task.js";


export abstract class BaseTask<
    TParams = any,
    TOutput = any
> {
    readonly type?: TaskType;

    readonly key: string;

    protected __status: TaskStatus = TaskStatus.NOT_STARTED;

    readonly params: TParams;

    private __output?: TOutput;

    private __runningReportList: TaskRunningReport[] = [];

    get status() {
        return this.__status;
    }

    get output() {
        return this.__output;
    }

    get runningReportList() {
        return this.__runningReportList;
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

    async run(browserContent: BrowserContext): Promise<TaskExecResult<TOutput>> {
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
            this.__output = result.output;
            return result
        } catch (error) {
            this._setStatus(TaskStatus.FAILED);
            console.error('任务执行失败', error);
            return {
                status: TaskStatus.FAILED,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    protected abstract _executor(browserContent: BrowserContext): Promise<TaskExecResult>;
}
