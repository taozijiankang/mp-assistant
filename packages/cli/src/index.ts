#!/usr/bin/env node

import { WXWorker } from "mp-assistant-core/dist/worker/index.js";
import { ConfigStore } from "./store/ConfigStore.js";
import { WorkerStore } from "./store/WorkerStore.js";

ConfigStore.instance.setConfig({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
});

console.log(ConfigStore.instance.config);

if (WorkerStore.instance.workerList.length <= 0) {
    const devWXWorker = new WXWorker({
        key: 'dev'
    });
    WorkerStore.instance.addWorker(devWXWorker);
}

for (const worker of WorkerStore.instance.workerList) {
    await worker.init({
        executablePath: ConfigStore.instance.config.executablePath,
        headless: false,
    });
}

