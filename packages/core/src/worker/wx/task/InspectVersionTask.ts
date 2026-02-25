import { BrowserContext, Locator, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { TaskExecResult, WXTask } from "mp-assistant-common/dist/work/task/type.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";

/**
 * 检查小程序版本任务
 * 进入小程序版本管理页面，获取各个版本的信息
 */
export class InspectVersionTask extends BaseWXTask {
    readonly type = TaskType.WX_INSPECT_VERSION;

    protected _splitText(text: string) {
        if (!text) return []
        return text.split('\n').filter(Boolean)
    }

    protected async _parseVersionBox(box: Locator, config: WXTask.VersionConfigItem) {
        const tagElExist = await box.locator('.simple_preview_item').first().isVisible().catch(() => false)

        if (!tagElExist) return null

        try {
            const versionText = await box.locator('.simple_preview_item').filter({ hasText: '版本号' }).innerText()
            const publisher = await box.locator('.simple_preview_item').filter({ hasText: config.publisherLabel }).innerText()
            const publishTime = await box.locator('.simple_preview_item').filter({ hasText: config.timeLabel }).innerText()
            const remark = await box.locator('.simple_preview_item').filter({ hasText: config.remarkLabel }).innerText()

            const actionBtn = box.getByRole('button', { name: config.actionButton })

            return {
                version: this._splitText(versionText)[1],
                publisher: this._splitText(publisher)[1],
                publishTime: this._splitText(publishTime)[1],
                remark: this._splitText(remark)[1],
                actionBtn
            }
        } catch (error) {
            console.error('解析版本信息失败:', error)
            return null
        }
    }

    protected async _getVersionList(versionType: WXTask.VersionType, page: Page): Promise<WXTask.GetVersionListResult> {
        // 等待加载完成：等待所有 loading 元素消失
        await page.locator('.empty_tips_loading').first().waitFor({ state: 'hidden', timeout: 60000 })

        const config = WXTask.VERSION_CONFIG[versionType]
        if (!config) {
            throw new Error(`不支持的版本类型: ${versionType}，可选: online | test | develop`)
        }

        const container = page.locator(config.container)


        const allVisionList = await container.locator('.code_version_log').all()
        const dataList = []

        if (allVisionList.length) {
            for (let i = 0; i < allVisionList.length; i++) {
                const item = await this._parseVersionBox(allVisionList[i] as Locator, config)
                if (item) {
                    dataList.push({ ...item })
                }
            }
        }
        return { type: versionType, data: dataList }
    }

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult<WXTask.GetVersionListResult[]>> {
        const page = await this._switchMP(browserContent);
        try {
            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);
            const data = await Promise.allSettled([
                this._getVersionList(WXTask.VersionType.ONLINE, page),
                this._getVersionList(WXTask.VersionType.TEST, page),
                this._getVersionList(WXTask.VersionType.DEVELOP, page),
            ]);

            const fulfilledResults = data.filter(
                (result): result is PromiseFulfilledResult<WXTask.GetVersionListResult> =>
                    result.status === 'fulfilled',
            );

            const currentVersionList = fulfilledResults
                .map(result => result.value)
                .filter(Boolean);

            /**
             * 获取版本管理页面中的版本列表
             */
            console.log('获取版本管理页面中的版本列表');
            return {
                status: TaskStatus.COMPLETED,
                data: currentVersionList,
            }
        } catch (error) {
            throw new Error('版本管理页面加载失败');
        }
    }
}