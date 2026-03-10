#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { getRootDir } from '../pathManage.js';
import { ConfigStore } from '../store/ConfigStore.js';
import { start } from '../start.js';

const rootPackageJson = JSON.parse(fs.readFileSync(path.join(getRootDir(), 'package.json')).toString());

interface StartCommandOptions {
    headless: boolean;
    port: number;
}

program
    .version(rootPackageJson.version)
    .description('小程序助手')
    // 
    .command('start')
    .option('-h, --headless <headless>', '是否无头模式')
    .option('-p, --port <port>', '端口号 (默认: 3001)')
    .action(async (options: StartCommandOptions) => {
        const { headless, port } = options;

        ConfigStore.instance.setConfig({
            headless: headless || ConfigStore.instance.config.headless,
            port: port || ConfigStore.instance.config.port,
        });

        await start();
    });

program.parse(process.argv);