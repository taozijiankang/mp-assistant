#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { getRootDir } from '../pathManage.js';
import { ConfigStore } from '../store/ConfigStore.js';
import { start } from '../start.js';

const rootPackageJson = JSON.parse(fs.readFileSync(path.join(getRootDir(), 'package.json')).toString());

program
    .version(rootPackageJson.version)
    .description('小程序助手')
    .command('start')
    .action(() => {
        ConfigStore.instance.setConfig({
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            headless: false,
            port: 3001,
        });

        start();
    });

program.parse(process.argv);