import { TaskExecStatusType } from "mp-assistant-common/dist/constant/enum.js";
import { WXMP_HOME_URL, WXMP_USER_PAGE_PATH_REX } from "../../../constant/wx.js";
import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { HIGHLIGHT_TIME } from "../../../constant/index.js";
import { expect } from "playwright/test";
import { WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

interface SwitchMPTaskConfig {
    app_name: string;
    username: string;
}

/**
 * 切换小程序任务
 */
export class SwitchMPTask extends BaseTask<SwitchMPTaskConfig> {
    readonly type = WXTaskType.SWITCH_MP;

    async startExec(browserContent: BrowserContext): Promise<void> {
        if (this.getExecStatus() === TaskExecStatusType.RUNNING) {
            return;
        }
        this.setExecStatus(TaskExecStatusType.RUNNING);
        //
        const page = await browserContent.newPage();
        page.goto(WXMP_HOME_URL);
        page.on('load', async () => {
            try {
                const url = new URL(page.url());

                // 判断页面路径
                if (!WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                    page.close();
                    this.setExecStatus(TaskExecStatusType.FAILED);
                    return;
                }

                // 如果侧边栏被隐藏了，则点击侧边栏展开按钮
                const sidebarLocator = page.locator('div.little_menu_button');
                if (await sidebarLocator.isVisible()) {
                    sidebarLocator.highlight();
                    await page.waitForTimeout(HIGHLIGHT_TIME);
                    await sidebarLocator.click();
                }
                // 点击侧边栏中的账号信息栏
                const accountInfoLocator = page.locator('div.menu_box_other_item_wrapper.account_info');
                await expect(accountInfoLocator).toBeVisible({
                    timeout: 3 * 1000
                });
                accountInfoLocator.highlight();
                await page.waitForTimeout(HIGHLIGHT_TIME);
                await accountInfoLocator.hover();
                //点击切换小程序按钮
                const switchMPButtonLocator = page.locator('.menu_box_account_info_item')
                    .filter({ hasText: '切换账号' });
                await expect(switchMPButtonLocator).toBeVisible({
                    timeout: 3 * 1000
                });
                switchMPButtonLocator.highlight();
                await page.waitForTimeout(HIGHLIGHT_TIME);
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
                        has: page.getByText(this.config.app_name)
                    }).and(
                        page.locator('.account_item.account_item_gap', {
                            has: page.getByText(this.config.username)
                        })
                    )
                );
                if (!await expect(mpItemLocator).toBeVisible({ timeout: 1000 }).then(() => true, () => false)) {
                    throw new Error('未找到小程序账号项');
                }
                mpItemLocator.highlight();
                await page.waitForTimeout(HIGHLIGHT_TIME);
                if (!await mpItemLocator.locator('.current_login').filter({ hasText: '当前登录' }).isVisible()) {
                    await mpItemLocator.click();
                    await page.waitForEvent('load');
                }
                this.setExecStatus(TaskExecStatusType.COMPLETED);
                page.close();
            }
            catch (error) {
                this.setExecStatus(TaskExecStatusType.FAILED);
                page.close();
            }
        });

    }
    async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}