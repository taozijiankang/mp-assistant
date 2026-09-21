import { chromium } from "playwright";
import fs from "fs";
import { execSync } from 'child_process';
import { getRootDir } from "./pathManage.js";

/**
 * 安装 Chromium
 */
export async function installChromium() {
    const executablePath = chromium.executablePath();
    if (!executablePath || !fs.statSync(executablePath, { throwIfNoEntry: false })?.isFile()) {
        // 先检测是否安装了 Chromium
        console.log('Starting browser installation...');
        try {
            // 通过 child_process 同步执行 npx，在项目根目录安装 chromium
            execSync('npx playwright install chromium', { stdio: 'inherit', cwd: getRootDir() });
            console.log('✅ Chromium installed successfully.');
        } catch (error) {
            console.error('❌ Installation failed:', error);
            throw error;
        }
    }
}