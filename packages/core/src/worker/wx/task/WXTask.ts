import { TaskExecResult } from "mp-assistant-common/dist/work/task/type.js";
import { BrowserContext, Page } from "playwright";
import { BaseTask } from "../../BaseTask.js";
import { WXMP_HOME_URL, WXMP_USER_PAGE_PATH_REX } from "../../../constant/wx.js";
import { expect } from "playwright/test";

export interface BaseWXTaskParams {
    /** 小程序名称 */
    app_name: string;
    /** 小程序原始id */
    username: string;
}

export class WXTask extends BaseTask<BaseWXTaskParams> {
    protected _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        throw new Error("Method not implemented.");
    }

    protected async _switchMP(browserContent: BrowserContext) {
        return await (new Promise<Page>(async (resolve, reject) => {
            let page: Page | null = null;
            try {
                page = await browserContent.newPage();
                await page.goto(WXMP_HOME_URL);
                const url = new URL(page.url());

                // 判断页面路径
                if (!WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                    await page.close();
                    throw new Error('用户未登录');
                }

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
                        has: page.getByText(this.params.app_name)
                    }).and(
                        page.locator('.account_item.account_item_gap', {
                            has: page.getByText(this.params.username)
                        })
                    )
                );
                if (!await expect(mpItemLocator).toBeVisible({ timeout: 1000 }).then(() => true, () => false)) {
                    throw new Error('未找到小程序账号项');
                }
                if (!await mpItemLocator.locator('.current_login').filter({ hasText: '当前登录' }).isVisible()) {
                    await mpItemLocator.click();
                    await page.waitForEvent('load');
                }
                this._addRunningReport({
                    title: '切换小程序',
                    description: `切换小程序: ${this.params.app_name} - ${this.params.username}`,
                    timestamp: Date.now(),
                    images: [],
                });
                resolve(page);
            }
            catch (error) {
                await page?.close();
                reject(error);
            }
        }));
    }
}