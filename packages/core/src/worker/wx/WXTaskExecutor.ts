import { WXTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { BaseTaskExecutor, BaseTaskExecutorMessage } from "../BaseTaskExecutor.js";
import { Page } from "playwright";
import { WXMP_NO_LOGIN_PATH, WXMP_URL, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { expect } from "playwright/test";
import { ExecutorCustomMessage } from "../type.js";
import { requestWxaList } from "../../api/index.js";

export interface WXTaskExecutorMessage extends BaseTaskExecutorMessage {
    /** 登录二维码 */
    LOGIN_QR_CODE: {
        imageSrc: string;
    };
}

export abstract class WXTaskExecutor<
    Options extends WXTaskOptions = WXTaskOptions
> extends BaseTaskExecutor<Options> {

    protected async login(page: Page) {
        await new Promise<void>((resolve, reject) => {
            page.goto(WXMP_URL);

            setTimeout(() => {
                reject(new Error('登录超时'));
            }, 3 * 60 * 1000);

            const complete = () => {
                this.report('text', '已登录');

                page.off('close', onClose);
                page.off('load', onLoad);

                this.sendToTaskMessage({
                    type: 'LOGIN_QR_CODE',
                    data: { imageSrc: '' },
                });

                resolve();
            }

            const onLoad = async () => {
                try {
                    const url = new URL(page.url());

                    // 用户页面
                    if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                        complete();
                    }
                    // 登录页面
                    else if (url.pathname === WXMP_NO_LOGIN_PATH) {
                        this.report('text', '正在获取登录二维码...');
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
                            this.report('text', '二维码已生成，请扫码登录');
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
            }
            const onClose = async () => {
                reject(new Error('页面关闭'));
            }

            page.on('close', onClose);
            page.on('load', onLoad);
        });
    }

    protected async switchMP(page: Page, appId: string) {
        await this.login(page);

        await page.goto(WXMP_URL);

        const wxaList = await requestWxaList(page);
        const wxaItem = wxaList.find(item => item.appid === appId);

        if (!wxaItem) {
            throw new Error('未找到小程序');
        }

        this.report('text', `切换小程序 ${wxaItem.app_name} - ${wxaItem.username}...`);

        // 如果侧边栏被隐藏了，则点击侧边栏展开按钮
        const sidebarLocator = page.locator('div.little_menu_button');
        if (await sidebarLocator.isVisible()) {
            await sidebarLocator.click();
        }
        // 点击侧边栏中的账号信息栏
        const accountInfoLocator = page.locator('div.menu_box_other_item_wrapper.account_info');
        await expect(accountInfoLocator).toBeVisible({
            timeout: 3 * 1000
        });
        await accountInfoLocator.hover();
        //点击切换小程序按钮
        const switchMPButtonLocator = page.locator('.menu_box_account_info_item')
            .filter({ hasText: '切换账号' });
        await expect(switchMPButtonLocator).toBeVisible({
            timeout: 3 * 1000
        });
        await switchMPButtonLocator.click();
        /**
         * 切换小程序
         */
        // 定位到切换账号弹窗
        const switchAccountPanelLocator = page.locator('.switch_account_panel', {
            has: page.getByText('切换账号'),
        });
        // 确保小程序列表加载出来
        await expect(
            switchAccountPanelLocator
                .locator('.platform_title')
                .and(switchAccountPanelLocator.getByText('小程序'))
        )
            .toBeVisible({
                timeout: 30 * 1000
            });
        // 定位到小程序账号项
        const mpItemLocator = switchAccountPanelLocator.locator(
            page.locator('.account_item.account_item_gap', {
                has: page.getByText(wxaItem.app_name)
            }).and(
                page.locator('.account_item.account_item_gap', {
                    has: page.getByText(wxaItem.username)
                })
            )
        );
        if (!await expect(mpItemLocator).toBeVisible({ timeout: 1000 }).then(() => true, () => false)) {
            throw new Error('未找到小程序账号项');
        }

        const buffer = await mpItemLocator.screenshot();
        const base64 = buffer.toString('base64');
        const imageSrc = `data:image/png;base64,${base64}`;

        this.report('image', imageSrc);

        if (!await mpItemLocator.locator('.current_login').filter({ hasText: '当前登录' }).isVisible()) {
            await mpItemLocator.click();
            await page.waitForEvent('load');
        }

        this.report('text', '切换小程序成功');
    }

    protected sendToTaskMessage(message: ExecutorCustomMessage<WXTaskExecutorMessage>): void {
        super.sendToTaskMessage(message as any);
    }
}
