import { AuditTask } from './worker/wx/task/AuditTask.js';
import { LoginTask } from './worker/wx/task/LoginTask.js';
import { SwitchMPTask } from './worker/wx/task/SwitchMPTask.js';
import { WXMPWorker } from './worker/wx/WXMPWorker.js';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const devWXMPWorker = new WXMPWorker({
    key: 'dev'
});
await devWXMPWorker.init({
    executablePath: executablePath,
    headless: false,
});

//添加任务
devWXMPWorker.addTask(
    new LoginTask({}),
    new SwitchMPTask({
        app_name: '广升誉健康商城',
        username: 'gh_a20d71d10889',
    }),
    new AuditTask({})
);