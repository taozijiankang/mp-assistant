import { TaskStatus, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXPublishTaskInfo, WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { requestVersionList } from "../../../../api/index.js";
import { versionSatisfy } from "@mp-assistant/common/dist/utils/wx/index.js";
import { WXAuditStatus } from "@mp-assistant/common/dist/constant/wx.js";
import { WXMP_URL, WXMP_VERSION_MANAGEMENT_URL } from "../../../../constant/wx.js";
import { expect } from "playwright/test";

export class WXPublishTask extends WXTask<WXPublishTaskOptions, WXPublishTaskInfo> {
    readonly type = WXTaskType.WX_PUBLISH;

    private versionData?: WXVersionCodeData;
    private publishQRCode?: string;

    getInfo(): WXPublishTaskInfo {
        return {
            ...super.getInfo(),
            versionData: this.versionData,
            publishQRCode: this.publishQRCode
        } as WXPublishTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.versionData = undefined;
        this.publishQRCode = undefined;
    }

    protected setAVersionData(versionData: WXVersionCodeData): void {
        this.setAProperty("versionData", versionData);
    }
    protected setAPublishQRCode(publishQRCode: string): void {
        this.setAProperty("publishQRCode", publishQRCode);
    }

    async execute(): Promise<void> {
        try {
            const page = await this.browserContent!.newPage();

            await this.switchMP(page, this.options.appId);

            // 专门调用接口的页面
            const specialPage = await this.browserContent!.newPage();
            await specialPage.goto(page.url());

            const getVersionList = async () => {
                const versionData = await requestVersionList(specialPage);
                this.setAVersionData(versionData);
                return versionData;
            }

            const versionData = await getVersionList();

            // 判断当前版本是否已发布
            const onReleaseVersionInfo = versionData.online_info?.basic_info;
            if (onReleaseVersionInfo && versionSatisfy(onReleaseVersionInfo, this.options.positioner ?? [])) {
                return this.end(TaskStatus.COMPLETED, "当前版本已发布，无需重复发布");
            }

            // 判断当前版本是否审核通过
            const onAuditVersionInfo = versionData.experience_info?.basic_info;
            if (!onAuditVersionInfo) {
                throw new Error("并没有审核版本，请先提交审核");
            }
            if (!versionSatisfy(onAuditVersionInfo, this.options.positioner ?? [])) {
                throw new Error("当前审核版本与指定版本不匹配，请检查版本号、版本昵称、版本描述是否正确");
            }
            if (onAuditVersionInfo.audit_status !== WXAuditStatus.SUCCESS) {
                throw new Error("当前审核版本未审核通过，请检查审核状态");
            }

            this.report(
                "text",
                `找到已通过审核的版本: ${onAuditVersionInfo.version}, ${onAuditVersionInfo.nick_name}, ${onAuditVersionInfo.describe}`
            );

            // 扫码验证阶段：二维码轮询出错时 reject，发布成功时由检测端 resolve 结束
            let resolvePublishVerify!: () => void;

            await Promise.all([
                // 主线
                (async () => {
                    // 如果当前页面不是MP主页，则跳转到MP主页 获取 searchParams
                    if (!page.url().startsWith(WXMP_URL)) {
                        await page.goto(WXMP_URL);
                    }

                    this.report("text", "进入版本管理页面");
                    await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

                    // 找到审核版本盒子
                    const testVersionBoxLocator = page.locator(".code_mod.mod_default_box.code_version_test", {
                        has: page.locator(".mod_default_hd", { hasText: "审核版本" })
                    });
                    await expect(testVersionBoxLocator).toBeVisible({
                        timeout: 30 * 1000
                    });
                    this.report("text", "点击提交发布");
                    // 点击提交发布按钮
                    await testVersionBoxLocator
                        .locator(".code_version_log_ft button", {
                            hasText: "提交发布"
                        })
                        .click();
                    // 提交发布弹窗
                    const publishModalLocator = page.locator(".weui-desktop-dialog", {
                        has: page.locator(".weui-desktop-dialog__title", { hasText: "发布线上版本" })
                    });
                    await expect(publishModalLocator).toBeVisible({ timeout: 30 * 1000 });
                    await publishModalLocator.locator(".weui-desktop-dialog__ft button", { hasText: "提交" }).click();
                    this.report("text", "已确认提交发布，等待管理员扫码验证");
                    // 发布验证弹窗
                    const publishVerifyModalLocator = page.locator(".weui-desktop-dialog", {
                        has: page.locator(".weui-desktop-dialog__title", { hasText: "发布版本" })
                    });
                    await expect(publishVerifyModalLocator).toBeVisible({ timeout: 30 * 1000 });

                    let qrReported = false;
                    // 扫码验证：用 promise 包裹计时器，二维码轮询出错时 reject，发布成功时由检测端 resolve 结束
                    await new Promise<void>((resolve, reject) => {
                        const interval = setInterval(async () => {
                            try {
                                // 截取验证二维码
                                const publishQRCodeLocator = publishVerifyModalLocator.locator(
                                    ".weui-desktop-dialog__bd img.weui-desktop-qrcheck__img"
                                );
                                // 检查二维码图片地址是否设置完成 （如果是前端渲染的话，这个元素的src值可能会延迟出来）
                                await expect(publishQRCodeLocator).toHaveAttribute("src", /^\/wxopen\/waqrcode/, { timeout: 3 * 1000 });
                                // 获取二维码图片地址
                                const publishQRCodeURL = (await publishQRCodeLocator.getAttribute("src")) || "";
                                // 如果二维码图片地址存在，则检查图片资源加载情况
                                if (publishQRCodeURL) {
                                    // 检查图片资源加载情况
                                    await publishQRCodeLocator.evaluate((img: HTMLImageElement) => {
                                        return new Promise<void>((resolve2, reject2) => {
                                            // 如果图片已经加载完成 (Already loaded)
                                            if (img.complete && img.naturalWidth > 0) {
                                                resolve2();
                                            } else {
                                                // 否则监听 load 和 error 事件
                                                img.onload = () => resolve2();
                                                img.onerror = () => reject2(new Error("Image load failed"));
                                            }
                                        });
                                    });
                                    const buffer = await publishQRCodeLocator.screenshot();
                                    const base64 = buffer.toString("base64");
                                    const imageSrc = `data:image/png;base64,${base64}`;
                                    if (!qrReported) {
                                        this.report("text", "请使用微信扫描二维码进行验证");
                                        qrReported = true;
                                    }

                                    this.setAPublishQRCode(imageSrc);
                                }

                                // 刷新按钮
                                const refreshButtonLocator = publishVerifyModalLocator.locator(
                                    ".weui-desktop-dialog__bd .weui-desktop-qrcheck__msg",
                                    {
                                        hasText: "二维码过期"
                                    }
                                );
                                if (await refreshButtonLocator.isVisible()) {
                                    if (qrReported) {
                                        this.report("text", "二维码已过期，正在刷新二维码");
                                        qrReported = false;
                                    }
                                    await refreshButtonLocator.locator('a[data-msgid="刷新"]').click();
                                }
                            } catch (error) {
                                clearInterval(interval);
                                reject(error);
                            }
                        }, 2000);

                        // 发布成功后由检测端调用，结束扫码轮询
                        resolvePublishVerify = () => {
                            clearInterval(interval);
                            resolve();
                        };
                    });
                })(),
                // 检测
                new Promise<void>((resolve, reject) => {
                    const complete = (error?: any) => {
                        clearInterval(interval);
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    };
                    const interval = setInterval(async () => {
                        const versionData = await getVersionList();
                        const onReleaseVersionInfo = versionData.online_info?.basic_info;
                        if (
                            onReleaseVersionInfo
                            && onReleaseVersionInfo.version === onAuditVersionInfo.version
                            && onReleaseVersionInfo.nick_name === onAuditVersionInfo.nick_name
                            && onReleaseVersionInfo.describe === onAuditVersionInfo.describe
                        ) {
                            this.end(TaskStatus.COMPLETED, "发布成功");
                            resolvePublishVerify?.();
                            complete();
                        }
                    }, 1000);
                }),
                // 整体超时兜底，避免主线/检测卡死导致任务永不结束
                new Promise<never>((_, reject) => {
                    let remain = 5 * 60;
                    this.setTimeoutCountdown(remain);
                    const interval = setInterval(() => {
                        remain -= 1;
                        if (remain <= 0) {
                            clearInterval(interval);
                            reject(new Error('发布超时'));
                        } else {
                            this.setTimeoutCountdown(remain);
                        }
                    }, 1000);
                })
            ]);
        } catch (error) {
            this.end(TaskStatus.FAILED, error instanceof Error ? error.message : "发布失败");
        }
    }
}
