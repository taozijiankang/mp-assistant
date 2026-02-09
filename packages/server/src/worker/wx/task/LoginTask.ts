import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../../constant/wx.js";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";
import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { expect } from "playwright/test";
import { getWxaList } from "../../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";

export interface LoginTaskOutput {
    loginQRCodeURL: string;
    wxaList: WXMPItem[];
}

/**
 * 登录任务
 */
export class LoginTask extends BaseTask<any, LoginTaskOutput> {
    readonly type = WXTaskType.LOGIN;

    protected output: LoginTaskOutput = {
        loginQRCodeURL: '',
        wxaList: [],
    };

    async exec(browserContent: BrowserContext): Promise<TaskExecResultType> {
        return new Promise<TaskExecResultType>((resolve) => {
            let isComplete = false;
            const complete = () => {
                isComplete = true;
                resolve(TaskExecResultType.COMPLETED);
            }
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
                                this.output.loginQRCodeURL = `data:image/png;base64,${base64}`;
                            } else {
                                resolve(TaskExecResultType.FAILED);
                            }
                            return;
                        }
                        // 用户页面
                        if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                            const wxaList = await getWxaList(page);
                            this.output.wxaList = wxaList;
                            await page.close();
                            complete();
                            return;
                        }
                    }
                    catch (error) {
                        await page.close();
                        resolve(TaskExecResultType.FAILED);
                    }
                });
                page.on('close', () => {
                    // 如果任务没有完成，则重新打开首页页面
                    if (!isComplete) {
                        openWXHome();
                    }
                });
            }
            openWXHome();
        });

    }
}