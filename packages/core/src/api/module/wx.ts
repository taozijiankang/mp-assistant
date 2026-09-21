import { Page } from "playwright";
import { WXMPItem, WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { WXMP_URL } from "../../constant/wx.js";

/**
 * 获取用户的小程序列表
 * 注意：该接口需要在小程序管理后台页面中使用，且需要登录状态
 * @param page 
 * @returns 小程序列表
 * @throws 如果获取失败，则抛出错误
 */
export async function requestWxaList(page: Page): Promise<WXMPItem[]> {
    const url = new URL(page.url());
    // page.request 复用当前页面的 Cookie（登录态），故必须在已登录的后台页面内调用；url.search 携带 token，random 仅用于破缓存
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
 * 注意：该接口需要在小程序管理后台页面中使用，且需要登录状态
 * @param page 
 * @returns 小程序版本列表
 * @throws 如果获取失败，则抛出错误
 */
export async function requestVersionList(page: Page): Promise<WXVersionCodeData> {
    const urlParams = new URLSearchParams(page.url())
    // 版本数据走统一的 cgi/route 转发接口：path 指向版本管理页，token 取自当前 URL（登录态）
    const queryParams = 'path=' + encodeURIComponent(`/wxopen/wacodepage?action=getcodepage&f=json&lang=zh_CN`) + `&token=${urlParams.get('token')}&lang=zh_CN&random=${Math.random()}`

    const response = await page.request.get(`${WXMP_URL}/wxamp/cgi/route`, {
        params: queryParams
    });
    if (response.ok()) {
        const result = await response.json();
        // code_data 是被 JSON 字符串化的数据，需二次 parse 还原成对象
        return JSON.parse(result.code_data) as WXVersionCodeData;
    } else {
        throw new Error(`Failed to get version list: ${response.status()}`);
    }
}
