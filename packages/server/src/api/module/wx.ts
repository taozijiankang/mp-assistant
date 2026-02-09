import { Page } from "playwright";
import { WXMP_HOST } from "../../constant/wx.js";
import { WXMPItem } from "mp-assistant-common/dist/types/wx.js";

/**
 * 获取用户的小程序列表
 * @param page 
 * @returns 小程序列表
 * @throws 如果获取失败，则抛出错误
 */
export async function getWxaList(page: Page): Promise<WXMPItem[]> {
    const url = new URL(page.url());
    const response = await page.request.get(`https://${WXMP_HOST}/wxamp/cgi/getWxaList${url.search}&random=${Math.random()}`);
    if (response.ok()) {
        try {
            const result = await response.json();
            return result?.wax_list || []
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        throw new Error(`Failed to get WXMP list: ${response.status()}`);
    }
    return [];
}