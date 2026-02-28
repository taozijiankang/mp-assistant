import { BrowserContext, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { VersionListItem, WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";
import { saveScreenshotBufferToFile } from "../../utils/index.js";

/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseWXTask {
    readonly type = TaskType.WX_PUBLISH;

    private __publishQRCodeFilePath: string = '';
    private __countdown: number = 0;

    protected async _waitForQrcodeScan(page: Page, testVersion: VersionListItem, timeout: number = 600000): Promise<void> {
        const startDate = Date.now();

        while ((Date.now() - startDate) < timeout) {
            // 同步倒计时
            this.__countdown = Math.max(0, (timeout - (Date.now() - startDate)) / 1000);

            const onlineVersion = (await this._getVersionList(page))[WXTaskN.VersionType.ONLINE];
            const flag =
                onlineVersion?.version === testVersion.version &&
                onlineVersion?.nick_name === testVersion.nick_name &&
                onlineVersion?.describe === testVersion.describe;

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
            const testVersionList = currentVersionData[WXTaskN.VersionType.TEST]

            if (!testVersionList || testVersionList.status !== WXReviewStatus.SUCCESS) {
                return {
                    status: TaskStatus.FAILED,
                    data: null,
                    msg: "暂无可发布的版本",
                    endTimestamp: Date.now(),
                }
            }

            const testVersionContainer = this._getVersionContainer(page, WXTaskN.VersionType.TEST)
            const dropDownBtn = testVersionContainer.getByRole('button', { name: "提交发布" })

            await dropDownBtn.click()
            await page.waitForTimeout(400)

            const submitDialogEl = page.locator(".weui-desktop-dialog").filter({ hasText: "发布模式" })
            const submitBtn = submitDialogEl.getByRole("button", { name: "提交" })
            await submitBtn.click()

            await page.waitForTimeout(1000)
            const openDialog = page.locator(".weui-desktop-dialog").filter({ hasText: "发布版本" })
            const qrCodeBuffer = await openDialog.locator(".weui-desktop-qrcheck__img").screenshot()

            const publishQRCodeFilePath = await saveScreenshotBufferToFile(qrCodeBuffer);

            this.__publishQRCodeFilePath = publishQRCodeFilePath;

            //判断发布成功
            await this._waitForQrcodeScan(page, testVersionList);

            return {
                status: TaskStatus.COMPLETED,
                endTimestamp: Date.now(),
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