import { BrowserContext, Locator, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { VersionListItem, WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";
import { versionSatisfy } from "mp-assistant-common/dist/utils/wx.js";
import { cancelReview } from "../../../api/index.js";
import { WXMP_AUDIT_PAGE_URL, WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";
import { saveScreenshotBufferToFile } from "../../utils/index.js";
import fs from "fs";

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

    private _errorToMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message
        }

        try {
            return JSON.stringify(error)
        } catch {
            return String(error)
        }
    }

    private _buildFailedResult(msg: string, code: WXReviewStatus = WXReviewStatus.FAIL): TaskExecResult {
        return {
            status: TaskStatus.FAILED,
            data: {
                code
            },
            msg,
            endTimestamp: Date.now(),
        }
    }

    private _buildCompletedResult(msg: string, code: WXReviewStatus = WXReviewStatus.SUCCESS): TaskExecResult {
        return {
            status: TaskStatus.COMPLETED,
            data: {
                code
            },
            msg,
            endTimestamp: Date.now(),
        }
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
            for (const [index, filePath] of imgList.entries()) {
                const flag = fs.existsSync(filePath)
                if (!flag) {
                    throw new Error(`图片预览文件不存在: ${filePath}`)
                }

                await imgViewInput.setInputFiles(filePath)
                await this._waitForImgUpload(ct, index + 1)
            }
        } catch (error) {
            throw new Error(this._errorToMessage(error))
        }
    }

    // 视频上传
    protected async _uploadVideoFile(ct: Locator, videoPreview: string): Promise<void> {
        if (!videoPreview) return
        const flag = fs.existsSync(videoPreview)

        if (!flag) {
            throw new Error(`视频预览文件不存在: ${videoPreview}`)
        }

        try {
            const videoViewInput = ct.locator('[data-component="mp-form-item"]').filter({ hasText: "视频预览" }).locator('input[type="file"]')
            await videoViewInput.setInputFiles(videoPreview)
            await ct.locator(".video-item").waitFor({ state: "visible", timeout: 15000 })
        } catch (error) {
            throw new Error(this._errorToMessage(error))

        }
    }

    // 提审流程
    protected async _getAuditPage(page: Page, targetVersion: VersionListItem): Promise<TaskExecResult> {
        this._addRunningReport({
            title: "提审中",
            timestamp: Date.now(),
            description: ``,
        });

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
            await this._uploadImageFile(formLocator, populateData.imagePreview ?? '')

            // 上传视频预览文件
            await this._uploadVideoFile(formLocator, populateData.videoPreview ?? '')

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

            return this._buildCompletedResult(successLocator ? '提审成功' : '提审失败', successLocator ? WXReviewStatus.SUCCESS : WXReviewStatus.FAIL)
        } catch (error) {
            console.log('提审失败', error);
            return this._buildFailedResult(this._errorToMessage(error))
        } finally {
            await page.close();
        }
    }

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        const page = await this._switchMP(browserContent);
        let shouldClosePage = true

        try {
            const currentVersionData = await this._getVersionList(page)
            const developVersionList = currentVersionData[WXTaskN.VersionType.DEVELOP]
            const onlineVersion = currentVersionData[WXTaskN.VersionType.ONLINE]
            const testVersionData = currentVersionData[WXTaskN.VersionType.TEST]

            // 参数校验
            const { positioner, populateData } = this.options

            this._addRunningReport({
                title: "版本定位条件校验中",
                timestamp: Date.now(),
            });

            if (!positioner?.length || !populateData || !Object.keys(populateData).length) {
                return this._buildFailedResult('缺少相关参数')
            }

            this._addRunningReport({
                title: "获取提审版本中",
                timestamp: Date.now(),
                description: ``,
            });

            // 要提审的版本
            if (onlineVersion && versionSatisfy(onlineVersion, positioner)) {
                return this._buildFailedResult('当前预提审版本和线上版本一致，无需提审')
            }

            const targetVersion = developVersionList?.find(version => versionSatisfy(version, positioner))
            if (!targetVersion) {
                return this._buildFailedResult('没有找到要提审的版本')
            }

            // 当前没有审核中的版本，直接打开提审页
            if (!testVersionData || !testVersionData.audit_status) {
                shouldClosePage = false
                return await this._getAuditPage(page, targetVersion)
            }

            const isCurrentAuditTarget = versionSatisfy(testVersionData, positioner)
            let shouldOpenAuditPage = false

            switch (testVersionData.audit_status) {
                // 审核通过的版本是准备提审的版本，则不需要重新提审
                case WXReviewStatus.SUCCESS:
                    if (isCurrentAuditTarget) {
                        await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);
                        const testLocator = page.locator(".code_version_test")
                        testLocator.waitFor({ state: "visible", timeout: 100000 })

                        const screenshotBuffer = await testLocator.screenshot()
                        const screenshotFilePath = await saveScreenshotBufferToFile(screenshotBuffer);

                        this._addRunningReport({
                            title: '当前版本已通过审核，请发布',
                            description: '',
                            timestamp: Date.now(),
                            images: [screenshotFilePath],
                        })

                        return this._buildCompletedResult('当前版本已通过审核，请发布')
                    }
                    // 重新提审
                    shouldOpenAuditPage = true
                    break
                // 审核中的版本是准备提审的版本，则不需要重新提审
                case WXReviewStatus.REVIEWING:
                    if (isCurrentAuditTarget) {
                        return this._buildFailedResult('当前版本正在审核中，请耐心等待', WXReviewStatus.REVIEWING)
                    }

                    // 当前审核版本不是目标版本，先取消审核
                    await cancelReview(page)
                    await page.waitForTimeout(1000)

                    shouldOpenAuditPage = true

                    break
                case WXReviewStatus.FAIL:
                    shouldOpenAuditPage = true
                    break
            }

            if (shouldOpenAuditPage) {
                shouldClosePage = false
                return await this._getAuditPage(page, targetVersion)
            }

            return {
                status: TaskStatus.FAILED,
                endTimestamp: Date.now(),
            }
        } catch (error) {
            return this._buildFailedResult(this._errorToMessage(error))
        } finally {
            if (shouldClosePage) {
                await page.close();
            }
        }
    }
}