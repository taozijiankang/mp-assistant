import { WXMPWorker } from './worker/wx/WXMPWorker.js';
import { AuthenticatorStatus } from 'mp-assistant-common/dist/constant/enum.js';
import path from 'path';
import { getChromeUserDataDir } from './pathManage.js';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const wxMPWorker = new WXMPWorker();
await wxMPWorker.init(path.join(getChromeUserDataDir(), 'one'), {
    executablePath: executablePath,
});

let status = AuthenticatorStatus.NOT_LOGIN;
setInterval(() => {
    const newStatus = wxMPWorker.authenticator.getStatus();
    if (newStatus !== status) {
        status = newStatus;

        console.log('切换小程序', status);
        wxMPWorker.authenticator.switchMP({
            app_name: '广升誉健康商城',
            username: 'gh_a20d71d10889',
        }).catch(error => {
            console.error('切换小程序失败', error);
        });
    } else {
    }
}, 100);