import { Page } from "playwright";
import { BaseWorker } from "../BaseWorker.js";
import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { requestWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";
import { taskCompleted, TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { WorkerType, WXWorkerLoadingType } from "mp-assistant-common/dist/work/index.js";
import { WXWorkInfo } from "mp-assistant-common/dist/work/type.js";
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
        if (this.isLoading(WXWorkerLoadingType.login)) {
            return;
        }
        this.setLoading(WXWorkerLoadingType.login);

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

                        this.emitMessage(WSMessage.Worker.DetailChange.type, {
                            key: this.key,
                        });
                    } else {
                        throw new Error('登录二维码获取失败');
                    }
                }
                // 用户页面
                else if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                    this.__isLogin = true;

                    this.emitMessage(WSMessage.Worker.DetailChange.type, {
                        key: this.key,
                    });
                    await page_?.close();
                }
            });
        }
        catch (error) {
            console.error('登录失败', error);
        } finally {
            this.offLoading(WXWorkerLoadingType.login);
        }
    }

    async updateWxaList() {
        if (this.isLoading(WXWorkerLoadingType.updateWxaListWxaList)) { return }
        this.setLoading(WXWorkerLoadingType.updateWxaListWxaList);

        try {
            await this.__updateLoginStatus();
            if (!this.isLogin) {
                return [];
            }
            const page = await this.browserContent!.newPage();
            await page.goto(WXMP_HOME_URL);
            const wxaList = await requestWxaList(page);
            await page.close();
            this.wxaList = wxaList;
        } finally {
            this.offLoading(WXWorkerLoadingType.updateWxaListWxaList)
        }

        this.emitMessage(WSMessage.Worker.DetailChange.type, {
            key: this.key
        })
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
