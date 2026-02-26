import { BrowserContext } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";

/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseWXTask {
    readonly type = TaskType.WX_PUBLISH;

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
                    msg: "暂无可发布的版本"
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
            // 转成base64
            const base64 = Buffer.from(qrCodeBuffer).toString('base64');
            const publishQRCodeURL = `data:image/png;base64,${base64}`;

            return {
                status: TaskStatus.COMPLETED,
                data: {
                    qrcodeUrl: publishQRCodeURL
                }
            }
        } catch (error) {
            return {
                status: TaskStatus.FAILED,
                data: null,
                msg: JSON.stringify(error)
            }
        }


    }
}