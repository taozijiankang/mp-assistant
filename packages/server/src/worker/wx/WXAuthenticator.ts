import { BrowserContext, Page } from "playwright";
import { WXMP_HOST, WXMP_LOGIN_PATH, WXMP_HOME_URL, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { setPagePointerEventsNone } from "../../utils/browser.js";
import { getWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";
import { AuthenticatorStatus } from "mp-assistant-common/dist/constant/enum.js";
import { expect } from "playwright/test";
import { HIGHLIGHT_TIME } from "../../constant/index.js";

export class WXAuthenticator {
    private browserContent: BrowserContext | null = null;

    private status: AuthenticatorStatus = AuthenticatorStatus.NOT_LOGIN;

    private homePage: Page | null = null;

    /**
     * 扫码登陆二维码图片URL
     */
    private loginQRCodeURL: string = '';

    private wxaList: WXMPItem[] = [];

    getStatus() {
        return this.status;
    }

    getWxaList() {
        return JSON.parse(JSON.stringify(this.wxaList)) as WXMPItem[];
    }

    getLoginQRCodeURL() {
        return this.loginQRCodeURL;
    }

    async switchMP(option: Pick<WXMPItem, 'app_name' | 'username'>) {
        if (this.status !== AuthenticatorStatus.LOGIN) {
            throw new Error('用户未登录');
        }
        if (!this.browserContent) {
            throw new Error('浏览器内容未初始化');
        }
        if (!this.homePage) {
            throw new Error('首页页面未初始化');
        }
        const page = await this.browserContent.newPage();
        page.on('load', () => {
            //
        });
        await page.goto(this.homePage.url());

        // 判断页面路径
        if (new URL(page.url()).pathname !== new URL(this.homePage.url()).pathname) {
            throw new Error('请重新登录');
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
                has: page.getByText(option.app_name)
            }).and(
                page.locator('.account_item.account_item_gap', {
                    has: page.getByText(option.username)
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
            /**
             * 切换小程序账号成功后，重新打开首页页面
             * 因为有一些页面参数会被更新
             */
            await this.homePage.goto(WXMP_HOME_URL);
        }
        console.log('切换小程序账号成功');
        return page;
    }

    async init(browserContent: BrowserContext) {
        this.browserContent = browserContent;

        await this.openHomePage();
    }

    /**
     * 打开首页页面
     * 同时监听页面加载完成事件，根据页面URL判断用户是否登录
     */
    private async openHomePage() {
        const page = await this.browserContent!.newPage();
        this.homePage = page;
        // 打开首页页面
        this.homePage!.goto(WXMP_HOME_URL);
        // 监听页面加载完成
        page.on('load', async () => {
            setPagePointerEventsNone(page);
            const url = new URL(page.url());
            // 如果用户跳转到其他页面，则重新回到首页页面
            if (url.host !== WXMP_HOST) {
                page.goto(WXMP_HOME_URL);
                return;
            }
            if (url.pathname === WXMP_LOGIN_PATH) {
                console.log('用户未登录');
                this.status = AuthenticatorStatus.NOT_LOGIN;
                const loginQRCodeLocator = page.locator('img.login__type__container__scan__qrcode');
                const getQRCodeURL = async (num: number = 0): Promise<string | null> => {
                    await page.waitForTimeout(500);
                    if (num > 10) {
                        return null;
                    }
                    return await loginQRCodeLocator.getAttribute('src') || await getQRCodeURL(num + 1);
                };
                const loginQRCodeURL = await getQRCodeURL() || '';
                if (loginQRCodeURL) {
                    const buffer = await loginQRCodeLocator.screenshot();
                    // 转成base64
                    const base64 = Buffer.from(buffer).toString('base64');
                    this.loginQRCodeURL = `data:image/png;base64,${base64}`;
                } else {
                    console.error('Failed to get login QR code URL');
                }
                return;
            }
            if (WXMP_USER_PAGE_PATH_REX.test(url.pathname)) {
                console.log('用户已登录');
                this.status = AuthenticatorStatus.LOGIN;
                await this.loginSuccess();
                return;
            }

        });
        page.on('close', () => {
            // 如果首页页面关闭，则重新打开首页页面
            this.openHomePage();
        });
    }

    private async loginSuccess() {
        if (!this.homePage) {
            throw new Error('首页页面未初始化');
        }
        const wxaList = await getWxaList(this.homePage);
        this.wxaList = wxaList;
    }
}