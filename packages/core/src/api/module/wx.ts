import { Page } from "playwright";
import { WXMP_HOST } from "../../constant/wx.js";
import { WXMPItem, WXMPVersionItem } from "mp-assistant-common/dist/types/wx.js";

/**
 * 获取用户的小程序列表
 * @param page 
 * @returns 小程序列表
 * @throws 如果获取失败，则抛出错误
 */
export async function requestWxaList(page: Page): Promise<WXMPItem[]> {
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

/**
 * 查询当前小程序版本列表
 */

export async function getVersionList(page: Page): Promise<WXMPVersionItem> {
    const urlParams = new URLSearchParams(page.url())
    const queryParams = 'path=' + encodeURIComponent(`/wxopen/wacodepage?action=getcodepage&f=json&token=1268116713&lang=zh_CN`) + `&token=${urlParams.get('token')}&lang=zh_CN&random=${Math.random()}`

    const response = await page.request.get(`https://${WXMP_HOST}/wxamp/cgi/route`, {
        params: queryParams
    });
    if (response.ok()) {
        try {
            const result = await response.json();

            return result
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        throw new Error(`Failed to post WXMP list: ${response.status()}`);
    }
    return {};
}

/**
 * 取消审核小程序
 * @param page 
 * @returns 取消审核小程序状态
 */
export async function cancelReview(page: Page): Promise<WXMPItem[]> {
    const urlParams = new URLSearchParams(page.url())
    const queryParams = 'path=' + encodeURIComponent(`/wxopen/wacodepage?action=undo_expr`) + `&token=${urlParams.get('token')}&lang=zh_CN&random=${Math.random()}`

    const response = await page.request.post(`https://${WXMP_HOST}/wxamp/cgi/route`, {
        params: queryParams
    });
    if (response.ok()) {
        try {
            const result = await response.json();
            console.log(result);

            return result
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        throw new Error(`Failed to post WXMP list: ${response.status()}`);
    }
    return [];
}