import { Page } from "playwright";
import { WXMPItem, WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { WXMP_URL } from "../../constant/wx.js";

/**
 * 获取用户的小程序列表
 * @param page 
 * @returns 小程序列表
 * @throws 如果获取失败，则抛出错误
 */
export async function requestWxaList(page: Page): Promise<WXMPItem[]> {
    const url = new URL(page.url());
    const response = await page.request.get(`${WXMP_URL}/wxamp/cgi/getWxaList${url.search}&random=${Math.random()}`);
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
 * @param page 
 * @returns 小程序版本列表
 * @throws 如果获取失败，则抛出错误
 */
export async function getVersionList(page: Page): Promise<WXVersionCodeData> {
    await page.goto(WXMP_URL);

    const urlParams = new URLSearchParams(page.url())
    const queryParams = 'path=' + encodeURIComponent(`/wxopen/wacodepage?action=getcodepage&f=json&lang=zh_CN`) + `&token=${urlParams.get('token')}&lang=zh_CN&random=${Math.random()}`

    const response = await page.request.get(`${WXMP_URL}/wxamp/cgi/route`, {
        params: queryParams
    });
    if (response.ok()) {
        const result = await response.json();
        return JSON.parse(result.code_data) as WXVersionCodeData;
    } else {
        throw new Error(`Failed to get version list: ${response.status()}`);
    }
}

/**
 * 取消审核小程序
 * @param page 
 * @returns 取消审核小程序状态
 */
export async function cancelReview(page: Page): Promise<WXMPItem[]> {
    const urlParams = new URLSearchParams(page.url())
    const queryParams = 'path=' + encodeURIComponent(`/wxopen/wacodepage?action=undo_expr`) + `&token=${urlParams.get('token')}&lang=zh_CN&random=${Math.random()}`

    const response = await page.request.post(`${WXMP_URL}/wxamp/cgi/route`, {
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
