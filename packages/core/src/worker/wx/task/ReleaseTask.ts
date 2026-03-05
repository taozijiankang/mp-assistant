import { BrowserContext, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskStatus, TaskType, WXTaskN } from "@mp-assistant/common/dist/work/task/index.js";
import { WXReviewStatus } from "@mp-assistant/common/dist/types/wx.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";
import { saveScreenshotBufferToFile } from "../../utils/index.js";
import { versionSatisfy } from "@mp-assistant/common/dist/utils/wx.js";

/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseWXTask {
    readonly type = TaskType.WX_PUBLISH;

    private __publishQRCodeFilePath: string = '';
    private __countdown: number = 0;
    private __currentPage: Page | null = null;
    private __refreshLoading: boolean = false;

    readonly options: WXTaskN.ReleaseTaskOptions;

    constructor(options: WXTaskN.ReleaseTaskOptions) {
        super(options);
        this.options = options;
    }

    info(): WXTaskN.PublishInfo {
        return {
            ...super.info(),
            publishQRCodeFilePath: this.__publishQRCodeFilePath,
            countdown: this.__countdown,
            refreshLoading: this.__refreshLoading,
        };
    }

    protected async _waitForQrcodeScan(page: Page, timeout: number = 180000) {
        const startDate = Date.now();

        while ((Date.now() - startDate) < timeout) {
            const openDialog = page.locator(".weui-desktop-dialog").filter({ hasText: "发布版本" })
            // 二维码过期
            const refreshBtn = openDialog.getByRole("link", { name: "刷新" })
            // 同步倒计时
            this.__countdown = Math.max(0, (timeout - (Date.now() - startDate)) / 1000);
            this.emitDetailChangeEvent();

            const refreshBtnVisible = await refreshBtn.isVisible()

            // 二维码过期时，主动刷新并重新截取二维码，避免一直等待到超时
            if (refreshBtnVisible) {
                await refreshBtn.click();
                await page.waitForTimeout(1000);
                await this.getQrcodePath();
                this.emitDetailChangeEvent();
                await new Promise((resolve) => setTimeout(resolve, 200));
                continue;
            }

            if (!refreshBtnVisible) {
                const onlineVersion = (await this._getVersionList(page))[WXTaskN.VersionType.ONLINE] || {};

                const flag = versionSatisfy(onlineVersion, this?.options?.positioner || [])

                if (flag) {
                    return;
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        throw new Error('二维码扫描超时');
    }

    /**
     * 获取二维码路径
     * @param ct - 容器
     * @returns 二维码路径
     */
    async getQrcodePath() {
        try {
            const openDialog = this.__currentPage?.locator(".weui-desktop-dialog").filter({ hasText: "发布版本" })
            if (!openDialog) return false;

            const qrCodeLocator = openDialog.locator(".weui-desktop-qrcheck__img")
            const publishQRCodeURL = await qrCodeLocator.getAttribute('src') || '';

            if (!publishQRCodeURL) return false
            // 检查图片资源加载情况
            await qrCodeLocator.evaluate((img: HTMLImageElement) => {
                return new Promise<void>((resolve, reject) => {
                    // 如果图片已经加载完成 (Already loaded)
                    if (img.complete && img.naturalWidth > 0) {
                        resolve();
                    } else {
                        // 否则监听 load 和 error 事件
                        img.onload = () => resolve();
                        img.onerror = () => reject(new Error('Image load failed'));
                    }
                });
            });

            const qrCodeBuffer = await qrCodeLocator.screenshot()
            const publishQRCodeFilePath = await saveScreenshotBufferToFile(qrCodeBuffer);

            this.__publishQRCodeFilePath = publishQRCodeFilePath;

            return true

        } catch (error) {
            console.log(error);

            return false;
        } finally {
            this.__refreshLoading = false;
        }
    }

    protected async _start(browserContent: BrowserContext) {
        const page = await this._switchMP(browserContent);
        await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

        this.__currentPage = page;

        try {
            const currentVersionData = await this._getVersionList(page)
            const testVersionData = currentVersionData[WXTaskN.VersionType.TEST]
            const onlineVersion = currentVersionData[WXTaskN.VersionType.ONLINE]

            const { positioner } = this.options

            // 判断版本校验参数
            this._addRunningReport({
                title: "版本定位条件校验中",
                timestamp: Date.now(),
            });

            if (!positioner || !positioner?.length) {
                return this._complete(TaskStatus.FAILED, {
                    msg: "缺少相关参数",
                });
            }

            // 判断线上版本是否与即将发布的版本一致
            if (onlineVersion && versionSatisfy(onlineVersion, positioner)) {
                return this._complete(TaskStatus.FAILED, {
                    msg: "当前预发布版本和线上版本一致，无需发布",
                });
            }

            // 判断是否有可发布的版本
            this._addRunningReport({
                title: "验证可发布版本中",
                timestamp: Date.now(),
                description: `当前版本: ${testVersionData?.version}`,
            });

            if (!testVersionData || testVersionData.audit_status !== WXReviewStatus.SUCCESS) {
                const testLocator = page.locator(".code_version_test")
                testLocator.waitFor({ state: "visible", timeout: 100000 })

                const screenshotBuffer = await testLocator.screenshot()
                const screenshotFilePath = await saveScreenshotBufferToFile(screenshotBuffer);

                this._addRunningReport({
                    title: "执行结果",
                    timestamp: Date.now(),
                    images: [screenshotFilePath],
                });

                return this._complete(TaskStatus.FAILED, {
                    msg: "暂无可发布的版本",
                });
            }

            // 判断可发布的版本是否为目标版本
            const isCurrentAuditTarget = versionSatisfy(testVersionData, positioner)

            if (!isCurrentAuditTarget) {
                return this._complete(TaskStatus.FAILED, {
                    msg: "未找到可发布版本",
                });
            }

            this._addRunningReport({
                title: "提交发布中",
                timestamp: Date.now(),
                description: `当前版本: ${testVersionData?.version}`,
            });

            const testVersionContainer = this._getVersionContainer(page, WXTaskN.VersionType.TEST)
            const dropDownBtn = testVersionContainer.getByRole('button', { name: "提交发布" })

            await dropDownBtn.click()
            await page.waitForTimeout(400)

            const submitDialogEl = page.locator(".weui-desktop-dialog").filter({ hasText: "发布模式" })
            const submitBtn = submitDialogEl.getByRole("button", { name: "提交" })
            await submitBtn.click()

            await page.waitForTimeout(1000)

            // 检查图片资源加载情况
            const qrCodeLoadingStatus = await this.getQrcodePath();
            if (!qrCodeLoadingStatus) {
                return this._complete(TaskStatus.FAILED, {
                    msg: "二维码加载失败",
                });
            }

            this._addRunningReport({
                title: "等待扫码发布",
                timestamp: Date.now(),
                description: `当前版本: ${testVersionData?.version}`,
            });

            //判断是否扫码发布
            await this._waitForQrcodeScan(page);

            this._addRunningReport({
                title: "发布成功",
                timestamp: Date.now(),
            });

            return this._complete(TaskStatus.COMPLETED, {
                msg: "发布成功",
            });

        } catch (error) {
            return this._complete(TaskStatus.FAILED, {
                msg: JSON.stringify(error),
            });
        } finally {
            page.close();
        }
    }
}