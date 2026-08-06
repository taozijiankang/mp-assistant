import { WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";
import { ExecutorCustomMessage } from "../../../type.js";
import { WXMP_NO_LOGIN_PATH, WXMP_URL, WXMP_USER_PAGE_PATH_REX } from "../../../../constant/wx.js";
import { expect, Page } from "playwright/test";
import { requestWxaList } from "../../../../api/index.js";

export interface WXLoginExecutorMessage extends WXTaskExecutorMessage {
    /** 更新小程序列表 */
    UPDATE_WXA_LIST: {
        wxaList: WXMPItem[];
    };
}

export class WXLoginExecutor extends WXTaskExecutor<WXLoginTaskOptions> {
    protected sendToTaskMessage(message: ExecutorCustomMessage<WXLoginExecutorMessage>): void {
        super.sendToTaskMessage(message as any);
    }

    async execute(): Promise<void> {
        try {
            const page = await this.createPage();

            if (this.options.action === 'logout') {

                await this.logout(page);

                this.completed('退出登录完成');
                return;
            }

            await this.login(page);

            await this.getWxaList(page);

            this.completed('登录任务完成');
        } catch (error) {
            this.failed(error instanceof Error ? error.message : '登录失败');
        }
    }

    async logout(page: Page) {
        await page.goto(WXMP_URL);
        const url = new URL(page.url());

        // 判断页面路径
        if (!WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
            return;
        }

        this.report('text', '正在退出登录...');

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

        const switchMPButtonLocator = page.locator('.menu_box_account_info_item')
            .filter({ hasText: '退出登录' });

        await switchMPButtonLocator.click();

        await page.waitForEvent('load');

        const url2 = new URL(page.url());
        if (url2.pathname !== WXMP_NO_LOGIN_PATH) {
            throw new Error('退出登录失败');
        }

        this.report('text', '退出登录成功');
    }

    private async getWxaList(page: Page) {
        this.report('text', '正在获取小程序列表...');

        await page.goto(WXMP_URL);
        const wxaList = await requestWxaList(page);
        this.sendToTaskMessage({
            type: 'UPDATE_WXA_LIST',
            data: { wxaList },
        });

        this.report('text', '小程序列表获取完成');
    }
}
