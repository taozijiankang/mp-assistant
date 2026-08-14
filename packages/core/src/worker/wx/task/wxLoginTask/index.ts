import { TaskStatus, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXLoginTaskInfo, WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { Page } from "playwright";
import { expect } from "playwright/test";
import { requestWxaList } from "../../../../api/index.js";
import { WXMP_URL, WXMP_USER_PAGE_PATH_REX, WXMP_NO_LOGIN_PATH } from "../../../../constant/wx.js";

export class WXLoginTask extends WXTask<WXLoginTaskOptions, WXLoginTaskInfo> {
    readonly type = WXTaskType.WX_LOGIN;

    /** 微信小程序列表，由 executor 通过 UPDATE_WXA_LIST 消息上报 */
    private wxaList?: WXMPItem[];

    getInfo(): WXLoginTaskInfo {
        return {
            ...super.getInfo(),
            wxaList: this.wxaList,
        } as WXLoginTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.wxaList = undefined;
    }

    protected setAWxaList(wxaList: WXMPItem[]): void {
        this.setAProperty('wxaList', wxaList);
    }

    async execute(): Promise<void> {
        try {
            const page = await this.createPage();

            if (this.options.action === 'logout') {
                await this.logout(page);

                this.end(TaskStatus.COMPLETED, '退出登录完成');
                return;
            }

            await this.login(page);

            await this.getWxaList(page);

            this.end(TaskStatus.COMPLETED, '登录任务完成');
        } catch (error) {
            this.end(TaskStatus.FAILED, error instanceof Error ? error.message : '登录失败');
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

        this.setAWxaList(wxaList);

        this.report('text', '小程序列表获取完成');
    }
}
