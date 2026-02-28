import { BrowserContext, Locator, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { VersionListItem, WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";
import { versionSatisfy } from "mp-assistant-common/dist/utils/wx.js";
import { cancelReview } from "../../../api/index.js";
import { WXMP_AUDIT_PAGE_URL } from "../../../constant/wx.js";
import { saveScreenshotBufferToFile } from "../../utils/index.js";

/**
 * 审核小程序任务
 * 进入小程序版本管理页面，选择要审核的小程序版本，并进行审核
 */
export class AuditTask extends BaseWXTask {
    readonly type = TaskType.WX_AUDIT;
    readonly options: WXTaskN.AuditTaskOptions;

    constructor(options: WXTaskN.AuditTaskOptions) {
        super(options);
        this.options = options;
    }

    // 等待图片上传完成
    protected async _waitForImgUpload(ct: Locator, num: number, timeout: number = 10000): Promise<void> {
        const startDate = Date.now()
        while (Date.now() - startDate < timeout) {
            const imgItems = await ct.locator(".weui-desktop-upload__img").all()
            if (imgItems.length === num) {
                return
            }
            await new Promise<void>(resolve => setTimeout(resolve, 200))
        }

        throw new Error(`图片上传超时，期望数量: ${num}，超时时间: ${timeout}ms`)
    }

    // 图片上传
    protected async _uploadImageFile(ct: Locator, imagePreview: string): Promise<void> {
        if (!imagePreview) return

        try {
            const imgViewInput = ct.locator('[data-component="mp-form-item"]').filter({ hasText: "图片预览" }).locator('input[type="file"]')
            const imgList = imagePreview.split(',').filter(Boolean)
            for (let i = 0; i < imgList.length; i++) {
                await imgViewInput.setInputFiles(imgList[i] || '')
                await this._waitForImgUpload(ct, i + 1)
            }
        } catch (error) {
            throw new Error(JSON.stringify(error))
        }
    }

    // 视频上传
    protected async _uploadVideoFile(ct: Locator, videoPreview: string): Promise<void> {
        if (!videoPreview) return

        try {
            const videoViewInput = ct.locator('[data-component="mp-form-item"]').filter({ hasText: "视频预览" }).locator('input[type="file"]')
            await videoViewInput.setInputFiles(videoPreview)
            await ct.locator(".video-item").waitFor({ state: "visible", timeout: 15000 })
        } catch (error) {
            throw new Error(JSON.stringify(error))

        }
    }

    // 提审流程
    protected async _getAuditPage(page: Page, targetVersion: VersionListItem): Promise<TaskExecResult> {
        const urlParams = new URLSearchParams(page.url())
        try {
            await page.goto(`${WXMP_AUDIT_PAGE_URL}?action=get_class&token=${urlParams.get('token')}&lang=zh_CN&openid=${targetVersion?.open_id}&user_name=${targetVersion?.nick_name}`)
            await page.waitForLoadState('load');
            const formLocator = page.locator('[data-component="mp-form"]')
            await formLocator.waitFor({ state: "visible" })

            const { populateData } = this.options

            if (!populateData) {
                throw new Error("缺少图片预览参数")
            }

            // 填充版本描述
            const versionDescription = populateData?.versionDescription
            const versionIntr = formLocator.locator('[data-component="mp-form-item"]').filter({ hasText: "版本描述" }).locator('textarea')
            if (versionDescription) {
                await versionIntr.fill(versionDescription)
            } else {
                throw new Error('版本描述不能为空')
            }

            // 上传图片预览文件
            await this._uploadImageFile(formLocator, populateData.imagePreview || '')

            // 上传视频预览文件
            await this._uploadVideoFile(formLocator, populateData.videoPreview || '')

            await page.locator('.tool_bar').locator('[data-msgid="提交审核"]').click()
            const successLocator = page.locator('[data-msgid="已提交审核"]');
            await successLocator.waitFor({ state: "visible", timeout: 100000 });

            const screenshotBuffer = await page.screenshot()
            const screenshotFilePath = await saveScreenshotBufferToFile(screenshotBuffer);

            this._addRunningReport({
                title: '提审成功',
                description: '提审成功',
                timestamp: Date.now(),
                images: [screenshotFilePath],
            })

            return {
                status: successLocator ? TaskStatus.COMPLETED : TaskStatus.FAILED,
                data: {
                    code: successLocator ? WXReviewStatus.SUCCESS : WXReviewStatus.FAIL
                },
                msg: successLocator ? '提审成功' : '提审失败',
                endTimestamp: Date.now(),
            }
        } catch (error) {
            console.log('提审失败', error);
            return {
                status: TaskStatus.FAILED,
                data: {
                    code: WXReviewStatus.FAIL
                },
                msg: JSON.stringify(error),
                endTimestamp: Date.now(),
            }
        } finally {
            // page.close();
        }
    }

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        const page = await this._switchMP(browserContent);
        const currentVersionData = await this._getVersionList(page)
        const developVersionList = currentVersionData[WXTaskN.VersionType.DEVELOP]
        const testVersionData = currentVersionData[WXTaskN.VersionType.TEST]

        // 参数校验
        const { positioner, populateData } = this.options
        if (!positioner || !positioner.length || !populateData || !Object.keys(populateData).length) {
            return {
                status: TaskStatus.FAILED,
                data: {
                    code: WXReviewStatus.FAIL
                },
                msg: '缺少相关参数',
                endTimestamp: Date.now(),
            }
        }

        // 要提审的版本
        const targetVersion = developVersionList?.find(version => versionSatisfy(version, positioner || []))
        if (!targetVersion) {
            return {
                status: TaskStatus.FAILED,
                data: {
                    code: WXReviewStatus.FAIL
                },
                msg: '没有找到要提审的版本',
                endTimestamp: Date.now(),
            }
        }

        // 当前有审核中的版本
        if (testVersionData) {
            const positioners = positioner || []
            const isCurrentAuditTarget = versionSatisfy(testVersionData, positioners)
            let shouldOpenAuditPage = false

            switch (testVersionData.audit_status) {
                // 审核通过的版本是准备提审的版本，则不需要重新提审
                case WXReviewStatus.SUCCESS:
                    if (isCurrentAuditTarget) {
                        return {
                            status: TaskStatus.COMPLETED,
                            data: {
                                code: WXReviewStatus.SUCCESS
                            },
                            msg: '当前版本已通过审核，请发布',
                            endTimestamp: Date.now(),
                        }
                    }
                    // 重新提审
                    shouldOpenAuditPage = true
                    break
                // 审核中的版本是准备提审的版本，则不需要重新提审
                case WXReviewStatus.REVIEWING:
                    if (isCurrentAuditTarget) {
                        return {
                            status: TaskStatus.FAILED,
                            data: {
                                code: WXReviewStatus.REVIEWING
                            },
                            msg: '当前版本正在审核中，请耐心等待',
                            endTimestamp: Date.now(),
                        }
                    }

                    // 当前审核版本不是目标版本，先取消审核
                    try {
                        await cancelReview(page)
                        await page.waitForTimeout(1000)
                        shouldOpenAuditPage = true
                    } catch (error) {
                        console.error('取消审核失败', error);
                        throw new Error('取消审核失败');
                    }
                    break
                case WXReviewStatus.FAIL:
                    shouldOpenAuditPage = Boolean(targetVersion)
                    break
            }

            if (shouldOpenAuditPage) {
                return await this._getAuditPage(page, targetVersion)
            }
        } else {
            return await this._getAuditPage(page, targetVersion)
        }

        return {
            status: TaskStatus.FAILED,
            endTimestamp: Date.now(),
        };
    }
}