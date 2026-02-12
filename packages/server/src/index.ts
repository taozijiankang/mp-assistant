import { InspectVersionTask } from './worker/wx/task/InspectVersionTask.js';
import { WXWorker } from './worker/wx/WXWorker.js';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const devWXWorker = new WXWorker({
    key: 'dev'
});
await devWXWorker.init({
    executablePath: executablePath,
    headless: false,
});

//添加任务
devWXWorker.addTask(
    new InspectVersionTask({
        params: {
            app_name: '广升誉健康商城',
            username: 'gh_a20d71d10889',
        }
    })
);