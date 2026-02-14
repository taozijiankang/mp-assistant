import { Page } from "playwright";
import { BaseWorker } from "../BaseWorker.js";
import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { getWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";
import { TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { WorkerType } from "mp-assistant-common/dist/work/index.js";
import { WXWorkInfo } from "mp-assistant-common/dist/work/type.js";

export class WXWorker extends BaseWorker {
    readonly type = WorkerType.WX;

    private __isLogin: boolean = false;
    private __lastUpdateLoginStatusTime: number = 0;

    loginQRCodeURL: string = '';
    wxaList: WXMPItem[] = [];

    get isLogin() {
        return this.__isLogin;
    }

    info(): WXWorkInfo {
        return {
            ...super.info(),
            loginQRCodeURL: this.loginQRCodeURL,
            wxaList: this.wxaList,
            isLogin: this.isLogin,
        }
    }

    protected async _taskCycleExecutor() {
        if (!this.browserContent) {
            return;
        }
        // 每10分钟更新一次登录状态
        if (Date.now() - this.__lastUpdateLoginStatusTime > 10 * 60 * 1000) {
            await this.__updateLoginStatus();
        }
        if (!this.isLogin) {
            return;
        }
        // 再执行任务
        if (!this.currentRunningTask) {
            this.currentRunningTaskKey = this.taskList[0]?.key ?? '';
        }
        const currentRunningTask = this.currentRunningTask;
        if (!currentRunningTask) {
            return;
        }
        if (
            currentRunningTask.status === TaskStatus.NOT_STARTED ||
            currentRunningTask.status === TaskStatus.WAITING_RESULT
        ) {
            currentRunningTask.run(this.browserContent);
        }
        else if (
            currentRunningTask.status === TaskStatus.COMPLETED ||
            currentRunningTask.status === TaskStatus.FAILED
        ) {
            let nextTaskIndex = this.taskList.findIndex(item => item.key === currentRunningTask.key) + 1;
            if (nextTaskIndex >= this.taskList.length) {
                nextTaskIndex = 0;
            }
            this.currentRunningTaskKey = this.taskList[nextTaskIndex]?.key ?? '';
            this._completeTask(currentRunningTask);

            // 如果是失败任务，则更新登录状态暂停整个任务循环，因为可能登录状态已过期
            if (currentRunningTask.status === TaskStatus.FAILED) {
                await this.__updateLoginStatus();
            }
        }
    }

    async login() {
        const browserContent = this.browserContent!;

        let page_: Page | null = null;
        try {
            const page = await browserContent.newPage();
            page_ = page;
            page.goto(WXMP_HOME_URL);
            page.on('load', async () => {
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
                        // 检查图片资源加载情况
                        await loginQRCodeLocator.evaluate((img: HTMLImageElement) => {
                            return new Promise<void>((resolve, reject) => {
                                // 如果图片已经加载完成 (Already loaded)
                                if (img.complete && img.naturalWidth > 0) {
                                    resolve();
                                } else {
                                    // 否则监听 load 和 error 事件
                                    img.onload = () => resolve();
                                    img.onerror = () => reject(new Error('Image load failed'));
                                }
                            });
                        });
                        const buffer = await loginQRCodeLocator.screenshot();
                        // 转成base64
                        const base64 = Buffer.from(buffer).toString('base64');
                        this.loginQRCodeURL = `data:image/png;base64,${base64}`;
                    } else {
                        throw new Error('登录二维码获取失败');
                    }
                }
                // 用户页面
                else if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                    this.__isLogin = true;
                    await page_?.close();
                }
            });
        }
        catch (error) {
            console.error('登录失败', error);
        }
    }

    async getWxaList() {
        await this.__updateLoginStatus();
        if (!this.isLogin) {
            return [];
        }
        const page = await this.browserContent!.newPage();
        await page.goto(WXMP_HOME_URL);
        const wxaList = await getWxaList(page);
        await page.close();
        this.wxaList = wxaList;
        return wxaList;
    }

    private async __updateLoginStatus() {
        this.__lastUpdateLoginStatusTime = Date.now();

        const browserContent = this.browserContent!;

        let page_: Page | null = null;
        try {
            const page = await browserContent.newPage();
            page_ = page;
            await page.goto(WXMP_HOME_URL);
            const url = new URL(page.url());
            this.__isLogin = WXMP_USER_PAGE_PATH_REX.test(url.pathname);
        }
        catch (error) {
            console.error('更新登录状态失败', error);
        } finally {
            await page_?.close();
        }
        return this.__isLogin;
    }
}
