import { BrowserContext, Page } from "playwright";
import { WXMP_HOST, WXMP_LOGIN_PATH, WXMP_HOME_URL, WXMP_USER_PAGE_PATH_REX } from "../../constant/wx.js";
import { setPagePointerEventsNone } from "../../utils/browser.js";
import { getWxaList } from "../../api/module/wx.js";
import { WXMPItem } from "../../api/interface/wx.js";

export enum AuthenticatorStatus {
    LOGIN = 'login',
    NOT_LOGIN = 'notLogin'
}

export class WXAuthenticator {
    private browserContent: BrowserContext | null = null;

    private status: AuthenticatorStatus = AuthenticatorStatus.NOT_LOGIN;

    private homePage: Page | null = null;

    /**
     * 扫码登陆二维码图片URL
     */
    private loginQRCodeURL: string = '';

    private wxaList: WXMPItem[] = [];

    async getStatus() {
        return this.status;
    }

    async getWxaList() {
        return JSON.parse(JSON.stringify(this.wxaList));
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
                const getQRCodeURL = async (num: number = 0): Promise<string | null> => {
                    await page.waitForTimeout(500);
                    if (num > 10) {
                        return null;
                    }
                    return await page.locator('img.login__type__container__scan__qrcode')
                        .getAttribute('src') || await getQRCodeURL(num + 1);
                };
                const loginQRCodeURL = await getQRCodeURL() || '';
                if (loginQRCodeURL) {
                    const response = await page.request.get(new URL(loginQRCodeURL, `https://${WXMP_HOST}`).href);
                    const buffer = await response.body();
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
        const wxaList = await getWxaList(this.homePage!);
        this.wxaList = wxaList;
    }
}