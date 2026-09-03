import { BaseTaskInfo, BaseTaskOptions, WXTaskType } from "@mp-assistant/common/dist/work/index.js";
import { chromium } from "playwright";
import { createTask } from "../worker/index.js";
import fs from "node:fs";

/**
 * 子进程入口：从临时文件读取任务参数并执行
 * 参数：
 * - tmpFilePath: 存放任务参数（type/options/info/debugPort）的临时文件路径
 */

async function start(taskType: WXTaskType, options: BaseTaskOptions, info: BaseTaskInfo, debugPort: number) {
    const browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`);
    const browserContext = browser.contexts()[0];

    if (!browserContext) {
        console.error('Browser context is not found');
        process.exit(1);
    }

    await createTask(taskType, options, info, browserContext).execute();
}

const tmpFilePath = process.argv[2] || '';

if (!tmpFilePath) {
    console.error('Task param file path is required');
    process.exit(1);
}

let taskType = '' as WXTaskType;
let options: BaseTaskOptions = {};
let info = {} as BaseTaskInfo;
let debugPort = 0;

try {
    const content = fs.readFileSync(tmpFilePath, 'utf-8');
    fs.rmSync(tmpFilePath, { force: true });  // 读取后立即删除临时文件
    const data = JSON.parse(content);
    taskType = data.type;
    options = data.options ?? {};
    info = data.info ?? {};
    debugPort = data.debugPort;
} catch (error) {
    console.error('读取任务参数失败:', error);
    process.exit(1);
}

if (!taskType) {
    console.error('Task type is required');
    process.exit(1);
}
if (!debugPort) {
    console.error('Debug port is required');
    process.exit(1);
}

start(taskType, options, info, debugPort).catch((error) => {
    console.error('执行任务失败:', error);
    process.exit(1);
});
