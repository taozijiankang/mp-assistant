import { BrowserContext, Page } from "playwright";
import { BaseWorker } from "../BaseWorker.js";
import { WXMP_HOME_URL, WXMP_HOST, WXMP_LOGIN_PATH, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { getWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";
import { TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { WorkerType } from "mp-assistant-common/dist/work/index.js";

export class WXWorker extends BaseWorker {
    readonly type = WorkerType.WX;

    loginQRCodeURL: string = '';
    wxaList: WXMPItem[] = [];

    info() {
        return {
            ...super.info(),
            loginQRCodeURL: this.loginQRCodeURL,
            wxaList: this.wxaList,
        }
    }

    protected async _init() {
        this.__verifyLoginStatus(this.browserContent!);
    }

    protected async _taskCycleExecutor() {
        if (!this.browserContent) {
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
        // 当前任务未执行就去执行
        if (currentRunningTask.status === TaskStatus.NOT_STARTED) {
            // 所有任务开始前先验证登录状态
            await this.__verifyLoginStatus(this.browserContent);
            // 执行任务
            console.log('执行任务', currentRunningTask.type, currentRunningTask.key);
            currentRunningTask.run(this.browserContent);
        }
        // 当前任务执行完成或失败就去执行下一个任务
        else if (
            currentRunningTask.status === TaskStatus.COMPLETED ||
            currentRunningTask.status === TaskStatus.FAILED ||
            // 等待结果
            currentRunningTask.status === TaskStatus.WAITING_RESULT
        ) {
            this.currentRunningTaskKey = this.taskList[this.taskList.indexOf(currentRunningTask) + 1]?.key ?? '';
            if (currentRunningTask.status === TaskStatus.COMPLETED) {
                this._completeTask(currentRunningTask);
            }
        }
    }

    private async __verifyLoginStatus(browserContent: BrowserContext) {
        return new Promise<void>((resolve) => {
            this.loginQRCodeURL = '';

            let isComplete = false;
            const complete = async (page: Page) => {
                isComplete = true;
                this.loginQRCodeURL = '';
                await this.__loginSuccess(page);
                resolve();
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
                                this.loginQRCodeURL = `data:image/png;base64,${base64}`;
                            } else {
                                throw new Error('登录二维码获取失败');
                            }
                            return;
                        }
                        // 用户页面
                        if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                            await complete(page);
                            await page.close();
                            return;
                        }
                    }
                    catch (error) {
                        await page.close();
                        throw new Error('登录失败');
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

    private async __loginSuccess(page: Page) {
        const wxaList = await getWxaList(page);
        this.wxaList = wxaList;
    }
}
