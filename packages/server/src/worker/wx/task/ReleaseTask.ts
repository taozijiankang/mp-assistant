import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 发布任务
 */
export class ReleaseTask extends BaseTask {
    readonly type = WXTaskType.PUBLISH;

    async startExec_(browserContent: BrowserContext): Promise<void> {
        console.log('发布任务开始执行');
    }
    async resetExec_(): Promise<void> {
        console.log('发布任务重置执行');
    }
}