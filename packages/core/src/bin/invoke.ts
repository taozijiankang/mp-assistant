import { fileURLToPath } from "node:url";
import { ChildProcess, fork } from "node:child_process";
import { BaseTaskInfo, BaseTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function invokeExecuteTask(type: string, options: BaseTaskOptions, info: BaseTaskInfo, debugPort: number): ChildProcess {
    // 所有参数写入临时文件，避免命令行参数过长（Windows 约 32K 限制）
    const tmpFilePath = path.join(os.tmpdir(), `mp-assistant-task-${getUUID()}.json`);
    fs.writeFileSync(tmpFilePath, JSON.stringify({ type, options, info, debugPort }));

    return fork(path.join(__dirname, 'executeTask.js'), [tmpFilePath]);
}
