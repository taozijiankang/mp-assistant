import { BaseTaskOptions } from "@mp-assistant/common/dist/work/BaseTask.js";
import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import { BrowserContext, Page } from "playwright";
import { ExecutorCommonMessage, ExecutorCustomMessage } from "./type.js";

export interface BaseTaskExecutorMessage {
    /** 自杀命令，executor 收到后自行退出 */
    KILL: undefined;
    /** 完成任务 */
    COMPLETED: {
        status: TaskStatus.COMPLETED | TaskStatus.FAILED;
        message?: string;
    };
    /** 运行报告 */
    REPORT: {
        type: 'text' | 'image';
        message: string;
    };
}

export class BaseTaskExecutor<
    Options extends BaseTaskOptions = BaseTaskOptions,
> {
    protected options: Options;
    private browserContent: BrowserContext;

    /** 执行器创建的页面，KILL 时统一关闭 */
    private pages: Page[] = [];

    constructor(options: Options, browserContent: BrowserContext) {
        this.options = options;
        this.browserContent = browserContent;

        process.on('message', (message) => {
            this.onTaskMessage(message as any);
        });
    }

    async execute() {
        console.log('BaseTaskExecutor execute');

        this.completed();
    }

    protected onTaskMessage(message: ExecutorCustomMessage<BaseTaskExecutorMessage>): void {
        const { type } = message;
        if (type === 'KILL') {
            // 先关闭所有页面，再退出
            Promise.all(
                this.pages.map(p => p.close().catch(() => { }))
            ).finally(() => {
                process.exit(0);
            });
        }
    }

    /**
     * 创建页面并纳入管理，KILL 时自动关闭
     */
    protected async createPage(): Promise<Page> {
        const page = await this.browserContent.newPage();
        this.pages.push(page);
        return page;
    }

    protected sendToTaskMessage(message: ExecutorCommonMessage): void {
        if (process.send) {
            process.send(message);
        }
    }

    protected completed(message?: string): void {
        this.sendToTaskMessage({
            type: 'COMPLETED',
            data: {
                status: TaskStatus.COMPLETED,
                message,
            },
        });
    }

    protected report(type: 'text' | 'image', message: string): void {
        this.sendToTaskMessage({
            type: 'REPORT',
            data: { type, message },
        });
    }

    protected failed(message?: string): void {
        this.sendToTaskMessage({
            type: 'COMPLETED',
            data: {
                status: TaskStatus.FAILED,
                message,
            },
        });
    }
}