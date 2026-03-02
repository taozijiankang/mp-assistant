import { BrowserContext, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { VersionListItem, WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";
import { saveScreenshotBufferToFile } from "../../utils/index.js";
import { versionSatisfy } from "mp-assistant-common/dist/utils/wx.js";

/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseWXTask {
    readonly type = TaskType.WX_PUBLISH;

    private __publishQRCodeFilePath: string = '';
    private __countdown: number = 0;

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
        };
    }

    protected async _waitForQrcodeScan(page: Page, timeout: number = 60000): Promise<void> {
        const startDate = Date.now();

        while ((Date.now() - startDate) < timeout) {
            // 同步倒计时
            this.__countdown = Math.max(0, (timeout - (Date.now() - startDate)) / 1000);

            this.emitDetailChangeEvent();
            const onlineVersion = (await this._getVersionList(page))[WXTaskN.VersionType.ONLINE] || {};

            const flag = versionSatisfy(onlineVersion, this?.options?.positioner || [])

            if (flag) {
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        throw new Error('二维码扫描超时');
    }

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        const page = await this._switchMP(browserContent);
        await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

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
                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "缺少相关参数",
                    endTimestamp: Date.now(),
                }
            }

            // 判断线上版本是否与即将发布的版本一致
            if (onlineVersion && versionSatisfy(onlineVersion, positioner)) {
                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "当前预发布版本和线上版本一致，无需发布",
                    endTimestamp: Date.now(),
                }
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

                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "暂无可发布的版本",
                    endTimestamp: Date.now(),
                }
            }

            // 判断可发布的版本是否为目标版本
            const isCurrentAuditTarget = versionSatisfy(testVersionData, positioner)

            if (!isCurrentAuditTarget) {
                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "未找到可发布版本",
                    endTimestamp: Date.now(),
                }
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
            const openDialog = page.locator(".weui-desktop-dialog").filter({ hasText: "发布版本" })

            const qrCodeLocator = openDialog.locator(".weui-desktop-qrcheck__img")

            const publishQRCodeURL = await qrCodeLocator.getAttribute('src') || '';

            if (publishQRCodeURL) {
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

                this._addRunningReport({
                    title: "等待扫码发布",
                    timestamp: Date.now(),
                    description: `当前版本: ${testVersionData?.version}`,
                });

                //判断发布成功
                await this._waitForQrcodeScan(page);

                this._addRunningReport({
                    title: "发布成功",
                    timestamp: Date.now(),
                });

                return {
                    status: TaskStatus.COMPLETED,
                    endTimestamp: Date.now(),
                }
            } else {
                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "二维码加载失败",
                    endTimestamp: Date.now(),
                }
            }
        } catch (error) {
            return {
                status: TaskStatus.FAILED,
                data: null,
                msg: JSON.stringify(error),
                endTimestamp: Date.now(),
            }
        } finally {
            page.close();
        }
    }
}