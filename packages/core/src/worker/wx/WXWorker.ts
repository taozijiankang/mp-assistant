import { Page } from "playwright";
import { BaseWorker } from "../BaseWorker.js";
import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { requestWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";
import { taskCompleted, TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { WorkerType, WXWorkerN } from "mp-assistant-common/dist/work/index.js";
import { WSMessage } from "mp-assistant-common/dist/ws/message.js";

export class WXWorker extends BaseWorker {
    readonly type = WorkerType.WX;

    private __isLogin: boolean = false;
    private __lastUpdateLoginStatusTime: number = 0;

    loginQRCodeURL: string = '';
    wxaList: WXMPItem[] = [];

    get isLogin() {
        return this.__isLogin;
    }

    info(): WXWorkerN.WXWorkInfo {
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

        const currentRunningTask = this.currentRunningTask;
        if (!currentRunningTask) {
            this._feedTasks()
            return;
        }

        /**
         * 任务未开始就去执行它
         */
        if (
            currentRunningTask.status === TaskStatus.NOT_STARTED
        ) {
            currentRunningTask.run(this.browserContent);
        }

        /**
         * 任务结束
         */
        if (taskCompleted(currentRunningTask.status)) {
            // 如果是失败任务，则更新登录状态暂停整个任务循环，因为可能登录状态已过期
            if (currentRunningTask.status === TaskStatus.FAILED) {
                await this.__updateLoginStatus();
            }

            this._feedTasks();
        }
    }

    async login() {
        if (this.isLoading(WXWorkerN.LoadingType.login)) {
            return;
        }
        this.setLoading(WXWorkerN.LoadingType.login);

        const browserContent = this.browserContent!;

        try {
            const page = await browserContent.newPage();

            await page.goto(WXMP_HOME_URL);

            const url = new URL(page.url());

            // 登录页面
            if (url.pathname === WXMP_LOGIN_PATH) {
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
                await page?.close();
            }
        } catch (error) {
            console.log('登录失败', error);
        }
        finally {
            this.offLoading(WXWorkerN.LoadingType.login);
        }
    }

    async updateWxaList() {
        if (this.isLoading(WXWorkerN.LoadingType.updateWxaListWxaList)) { return }
        this.setLoading(WXWorkerN.LoadingType.updateWxaListWxaList);

        const browserContent = this.browserContent!;

        try {
            await this.__updateLoginStatus();
            if (!this.isLogin) {
                return [];
            }
            const page = await browserContent.newPage();
            await page.goto(WXMP_HOME_URL);
            const wxaList = await requestWxaList(page);
            await page.close();
            this.wxaList = wxaList;
        } finally {
            this.offLoading(WXWorkerN.LoadingType.updateWxaListWxaList)
        }
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
            const oldIsLogin = this.__isLogin;
            this.__isLogin = WXMP_USER_PAGE_PATH_REX.test(url.pathname);
            // 登录状态改变
            if (this.__isLogin !== oldIsLogin) {
                this.emitMessage(WSMessage.Worker.DetailChange.type, {
                    key: this.key,
                });
            }
        }
        catch (error) {
            console.error('更新登录状态失败', error);
        } finally {
            await page_?.close();
        }
        return this.__isLogin;
    }
}
