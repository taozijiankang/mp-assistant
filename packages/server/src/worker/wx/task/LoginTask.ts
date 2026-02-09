import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../../constant/wx.js";
import { TaskExecStatusType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";
import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { expect } from "playwright/test";
import { getWxaList } from "../../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";

/**
 * 登录任务
 */
export class LoginTask extends BaseTask {
    readonly type = WXTaskType.LOGIN;

    private loginQRCodeURL: string = '';

    private wxaList: WXMPItem[] = [];

    getWxaList() {
        return JSON.parse(JSON.stringify(this.wxaList)) as WXMPItem[];
    }

    getLoginQRCodeURL() {
        return this.loginQRCodeURL;
    }

    async startExec(browserContent: BrowserContext): Promise<void> {
        if (this.getExecStatus() === TaskExecStatusType.RUNNING) {
            return;
        }
        this.setExecStatus(TaskExecStatusType.RUNNING);
        //
        const openWXHome = async () => {
            const page = await browserContent.newPage();
            // 打开首页页面
            page.goto(WXMP_HOME_URL);
            // 监听页面加载完成
            page.on('load', async () => {
                try {
                    const url = new URL(page.url());
                    // 如果用户跳转到其他页面，则重新回到首页页面
                    if (url.host !== WXMP_HOST) {
                        page.goto(WXMP_HOME_URL);
                        return;
                    }
                    // 登录页面
                    else if (url.pathname === WXMP_LOGIN_PATH) {
                        const loginQRCodeLocator = page.locator('img.login__type__container__scan__qrcode');
                        await expect(loginQRCodeLocator).toHaveAttribute('src', /^\/cgi-bin\/scanloginqrcode/, { timeout: 3 * 1000 });
                        const loginQRCodeURL = await loginQRCodeLocator.getAttribute('src') || '';
                        if (loginQRCodeURL) {
                            const buffer = await loginQRCodeLocator.screenshot();
                            // 转成base64
                            const base64 = Buffer.from(buffer).toString('base64');
                            this.loginQRCodeURL = `data:image/png;base64,${base64}`;
                            //
                            this.setExecStatus(TaskExecStatusType.WAITING);
                        } else {
                            this.setExecStatus(TaskExecStatusType.FAILED);
                        }
                        return;
                    }
                    // 用户页面
                    if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                        const wxaList = await getWxaList(page);
                        this.wxaList = wxaList;
                        this.setExecStatus(TaskExecStatusType.COMPLETED);
                        page.close();
                        return;
                    }
                }
                catch (error) {
                    this.setExecStatus(TaskExecStatusType.FAILED);
                    page.close();
                }
            });
            page.on('close', () => {
                // 页面关闭时，重新打开首页页面
                if (this.getExecStatus() !== TaskExecStatusType.COMPLETED) {
                    openWXHome();
                }
            });
        }
        openWXHome();
    }

    async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}