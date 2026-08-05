import { WXTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { BaseTaskExecutor, BaseTaskExecutorMessage } from "../BaseTaskExecutor.js";
import { Page } from "playwright";
import { WXMP_NO_LOGIN_PATH, WXMP_URL, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { ExecutorCustomMessage } from "../type.js";

export interface WXTaskExecutorMessage extends BaseTaskExecutorMessage {
    /** 登录二维码 */
    LOGIN_QR_CODE: {
        imageSrc: string;
    };
    /** 登录状态变更 */
    CHANGE_LOGIN_STATUS: {
        isLogin: boolean;
    };
}

export abstract class WXTaskExecutor<
    Options extends WXTaskOptions = WXTaskOptions
> extends BaseTaskExecutor<Options> {
    async login(page: Page) {
        await new Promise<void>((resolve, reject) => {
            page.goto(WXMP_URL);

            setTimeout(() => {
                reject(new Error('登录超时'));
            }, 3 * 60 * 1000);

            page.on('load', async () => {
                try {
                    const url = new URL(page.url());

                    // 用户页面
                    if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                        this.sendToTaskMessage({
                            type: 'CHANGE_LOGIN_STATUS',
                            data: { isLogin: true },
                        });
                        resolve();
                    }
                    // 登录页面
                    else if (url.pathname === WXMP_NO_LOGIN_PATH) {
                        // 扫码登录的二维码元素
                        const loginQRCodeLocator = page.locator('img.login__type__container__scan__qrcode');
                        // 检查二维码图片地址是否设置完成 （如果是前端渲染的话，这个元素的src值可能会延迟出来）
                        await expect(loginQRCodeLocator).toHaveAttribute('src', /^\/cgi-bin\/scanloginqrcode/, { timeout: 3 * 1000 });
                        // 获取二维码图片地址
                        const loginQRCodeURL = await loginQRCodeLocator.getAttribute('src') || '';
                        // 如果二维码图片地址存在，则检查图片资源加载情况
                        if (loginQRCodeURL) {
                            // 检查图片资源加载情况
                            await loginQRCodeLocator.evaluate((img: HTMLImageElement) => {
                                return new Promise<void>((resolve2, reject2) => {
                                    // 如果图片已经加载完成 (Already loaded)
                                    if (img.complete && img.naturalWidth > 0) {
                                        resolve2();
                                    } else {
                                        // 否则监听 load 和 error 事件
                                        img.onload = () => resolve2();
                                        img.onerror = () => reject2(new Error('Image load failed'));
                                    }
                                });
                            });
                            const buffer = await loginQRCodeLocator.screenshot();
                            const base64 = buffer.toString('base64');
                            const imageSrc = `data:image/png;base64,${base64}`;
                            this.sendToTaskMessage({
                                type: 'LOGIN_QR_CODE',
                                data: { imageSrc },
                            });
                        } else {
                            throw new Error('登录二维码获取失败');
                        }
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }

    protected async getLoginStatus(page: Page) {
        let isLogin = false;
        await page.goto(WXMP_URL);
        const url = new URL(page.url());
        if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
            isLogin = true;
            this.sendToTaskMessage({
                type: 'CHANGE_LOGIN_STATUS',
                data: { isLogin: true },
            });
        } else {
            isLogin = false;
            this.sendToTaskMessage({
                type: 'CHANGE_LOGIN_STATUS',
                data: { isLogin: false },
            });
        }

        return isLogin;
    }

    protected sendToTaskMessage(message: ExecutorCustomMessage<WXTaskExecutorMessage>): void {
        super.sendToTaskMessage(message as any);
    }
}
