import { BaseTaskInfo, BaseTaskOptions, WXTaskType } from "@mp-assistant/common/dist/work/index.js";
import { chromium } from "playwright";
import { createTask } from "../worker/index.js";

/**
 * 子进程入口：根据 taskType 创建对应 Executor 并执行
 * 参数：
 * - taskType: 任务类型
 * - options: 任务选项
 * - debugPort: 调试端口
 */

async function start(taskType: WXTaskType, options: BaseTaskOptions, info: BaseTaskInfo, debugPort: number) {
    const browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`);
    const browserContext = browser.contexts()[0];

    if (!browserContext) {
        console.error('Browser context is not found');
        process.exit(1);
    }

    createTask(taskType, options, info, browserContext).execute();
}

const taskType = process.argv[2] || '';
const options = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const info = process.argv[4] ? JSON.parse(process.argv[4]) : {};
const debugPort = process.argv[5] ? parseInt(process.argv[5]) : undefined;

if (!taskType) {
    console.error('Task type is required');
    process.exit(1);
}
if (!debugPort) {
    console.error('Debug port is required');
    process.exit(1);
}

start(taskType as WXTaskType, options as BaseTaskOptions, info as BaseTaskInfo, debugPort);