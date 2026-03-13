import { chromium } from "playwright";
import fs from "fs";
import { execSync } from 'child_process';
import { getRootDir } from "./pathManage.js";

/**
 * 初始化
 */
export async function init() {
    const executablePath = chromium.executablePath();
    if (!executablePath || !fs.statSync(executablePath, { throwIfNoEntry: false })?.isFile()) {
        // 先检测是否安装了 Chromium
        console.log('Starting browser installation...');
        try {
            // 方式 A：通过 child_process 调用（最稳定，推荐）
            // 这本质上是在代码里执行 npx 命令
            execSync('npx playwright install chromium', { stdio: 'inherit', cwd: getRootDir() });
            console.log('✅ Chromium installed successfully.');
        } catch (error) {
            console.error('❌ Installation failed:', error);
            throw error;
        }
    }
}