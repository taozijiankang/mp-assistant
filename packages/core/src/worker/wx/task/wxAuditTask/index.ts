import { TaskStatus, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXAuditTaskInfo, WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { requestVersionList } from "../../../../api/index.js";
import { versionSatisfy } from "@mp-assistant/common/dist/utils/index.js";
import { WXAuditStatus } from "@mp-assistant/common/dist/constant/wx.js";
import { WXMP_AUDIT_PAGE_URL, WXMP_URL, WXMP_VERSION_MANAGEMENT_URL } from "../../../../constant/wx.js";
import { expect } from "playwright/test";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";

export class WXAuditTask extends WXTask<WXAuditTaskOptions, WXAuditTaskInfo> {
    readonly type = WXTaskType.WX_AUDIT;

    private versionData?: WXVersionCodeData;

    getInfo(): WXAuditTaskInfo {
        return {
            ...super.getInfo(),
            versionData: this.versionData,
        } as WXAuditTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.versionData = undefined;
    }

    protected setAVersionData(versionData: WXVersionCodeData): void {
        this.setAProperty('versionData', versionData);
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

            // 先找到可提审的版本
            const versionData = await getVersionList();
            // 待提审版本info
            const developVersionInfo = versionData.develop_info
                ?.info_list
                ?.map(item => item.basic_info)
                ?.filter(Boolean)
                .find(item => versionSatisfy(item!, this.options.positioner ?? []));
            if (!developVersionInfo) {
                throw new Error('未找到可提审的版本');
            }

            this.report('text', `找到可提审的版本: ${developVersionInfo.version}, ${developVersionInfo.nick_name}, ${developVersionInfo.describe}`);

            // 判断当前版本是否已发布
            const onReleaseVersionInfo = versionData.online_info?.basic_info;
            if (
                onReleaseVersionInfo
                && onReleaseVersionInfo.version === developVersionInfo.version
                && onReleaseVersionInfo.nick_name === developVersionInfo.nick_name
                && onReleaseVersionInfo.describe === developVersionInfo.describe
            ) {
                this.end(TaskStatus.COMPLETED, "当前版本已发布");
                return;
            }

            const onAuditVersionInfo = versionData.experience_info?.basic_info;
            if (
                onAuditVersionInfo
                && [WXAuditStatus.REVIEWING, WXAuditStatus.SUCCESS].includes(onAuditVersionInfo.audit_status!)
            ) {
                if (
                    onAuditVersionInfo.version === developVersionInfo.version
                    && onAuditVersionInfo.nick_name === developVersionInfo.nick_name
                    && onAuditVersionInfo.describe === developVersionInfo.describe
                ) {
                    this.end(TaskStatus.COMPLETED, "当前版本已提交审核");
                    return;
                }
            }

            await Promise.all([
                // 主线
                (async () => {
                    // 如果当前页面不是MP主页，则跳转到MP主页 获取 searchParams
                    if (!page.url().startsWith(WXMP_URL)) {
                        await page.goto(WXMP_URL);
                    }

                    await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

                    // 如果有其他版本在审核中就取消它
                    const onAuditVersionInfo = versionData.experience_info?.basic_info;
                    if (onAuditVersionInfo && onAuditVersionInfo.audit_status! === WXAuditStatus.REVIEWING) {
                        this.report('text', `有版本正在审核中，开始撤回审核`);

                        // 如果不是当前版本，则取消审核
                        // 审核版本盒子定位器
                        const developVersionBoxLocator = page.locator('.code_mod.mod_default_box.code_version_test', {
                            has: page.locator('.mod_default_hd', { hasText: '审核版本' })
                        });
                        await expect(developVersionBoxLocator).toBeVisible({
                            timeout: 30 * 1000
                        });

                        await developVersionBoxLocator.locator('.code_version_log_ft .weui-desktop-operation-group button').click();
                        await developVersionBoxLocator.locator('.code_version_log_ft li[data-component="mp-dropdown-item"]', {
                            hasText: '撤回审核'
                        }).click();

                        // 撤销审核弹窗
                        const cancelAuditModalLocator = page.locator('.weui-desktop-dialog', {
                            has: page.locator('.weui-desktop-dialog__title', { hasText: '撤回审核' })
                        });
                        await expect(cancelAuditModalLocator).toBeVisible({ timeout: 30 * 1000 })
                        await cancelAuditModalLocator.locator('.weui-desktop-dialog__ft button', { hasText: '确认撤回' }).click();

                        this.report('text', `撤回审核成功`);

                        // 更新一下版本信息
                        await getVersionList();

                        await page.reload();
                    }

                    const auditPage = await this.browserContent!.newPage();
                    const url = new URL(page.url());
                    url.searchParams.append('action', 'get_class');
                    url.searchParams.append('openid', developVersionInfo.open_id);
                    url.searchParams.append('user_name', developVersionInfo.nick_name);
                    await auditPage.goto(`${WXMP_AUDIT_PAGE_URL}${url.search}`);

                    /**
                     * 填写表单
                     */

                    this.report('text', `开始填写表单`);

                    // 等待提交审核页面加载完成
                    await expect(auditPage.locator('.main_hd h2', { hasText: '提交审核' })).toBeVisible({ timeout: 30 * 1000 });
                    const submitFormBoxLocator = auditPage.locator('.main_bd', {
                        has: auditPage.locator('form[data-component="mp-form"]')
                    });

                    // 填写版本描述
                    submitFormBoxLocator.locator('form>div').filter({
                        has: auditPage.locator('.weui-desktop-form__label', { hasText: '版本描述' })
                    }).locator('textarea').fill(this.options.populateData?.versionDescription ?? '');

                    const images = this.options.populateData?.imagePreviews ?? [];
                    const videos = this.options.populateData?.videoPreview ?? "";

                    await Promise.all([
                        // 传图片
                        images.length > 0 ? new Promise<void>(async (resolve, reject) => {
                            this.report('text', `开始上传图片`);
                            const timeout = setTimeout(() => {
                                complete(new Error('上传图片超时'));
                            }, 30 * 1000);
                            const interval = setInterval(async () => {
                                const cont = await submitFormBoxLocator.locator('form>div').filter({
                                    has: auditPage.locator('.weui-desktop-form__label', { hasText: '图片预览' })
                                }).locator('.mp-upload-preview li.weui-desktop-upload__img').count();
                                if (cont === images.length) {
                                    complete();
                                }
                            }, 500);
                            const complete = (error?: any) => {
                                clearTimeout(timeout);
                                clearInterval(interval);
                                if (error) {
                                    this.report('text', `上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            };
                            try {
                                for (const image of images) {
                                    await submitFormBoxLocator.locator('form>div').filter({
                                        has: auditPage.locator('.weui-desktop-form__label', { hasText: '图片预览' })
                                    }).locator('input[type="file"]').setInputFiles(image);
                                }
                            } catch (error) {
                                complete(error);
                            }
                        }) : Promise.resolve(),
                        // 传视频
                        videos ? new Promise<void>(async (resolve, reject) => {
                            this.report('text', `开始上传视频`);
                            const timeout = setTimeout(() => {
                                complete(new Error('上传视频超时'));
                            }, 30 * 1000);
                            const interval = setInterval(async () => {
                                const cont = await submitFormBoxLocator.locator('form>div').filter({
                                    has: auditPage.locator('.weui-desktop-form__label', { hasText: '视频预览' })
                                }).locator('.mp-upload-preview div.video-item').count();
                                if (cont === 1) {
                                    complete();
                                }
                            }, 500);
                            const complete = (error?: any) => {
                                clearTimeout(timeout);
                                clearInterval(interval);
                                if (error) {
                                    this.report('text', `上传视频失败: ${error instanceof Error ? error.message : '未知错误'}`);
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            };
                            try {
                                await submitFormBoxLocator.locator('form>div').filter({
                                    has: auditPage.locator('.weui-desktop-form__label', { hasText: '视频预览' })
                                }).locator('input[type="file"]').setInputFiles(videos);
                            } catch (error) {
                                complete(error);
                            }
                        }) : Promise.resolve(),
                    ]);

                    this.report('text', `开始提交审核`);

                    await submitFormBoxLocator.locator('.tool_bar a', { hasText: '提交审核' }).click();
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
                        const onAuditVersionInfo = versionData.experience_info?.basic_info;
                        if (
                            onAuditVersionInfo
                            // 审核中或者审核通过就提审成功
                            && [WXAuditStatus.REVIEWING, WXAuditStatus.SUCCESS].includes(onAuditVersionInfo.audit_status!)
                            //
                            && onAuditVersionInfo.version === developVersionInfo.version
                            && onAuditVersionInfo.nick_name === developVersionInfo.nick_name
                            && onAuditVersionInfo.describe === developVersionInfo.describe
                        ) {
                            this.end(TaskStatus.COMPLETED, "当前版本已提交审核");
                            complete();
                        }
                    }, 1000);
                }),
                // 整体超时兜底，避免主线/检测卡死导致任务永不结束
                new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('提交审核超时')), 5 * 60 * 1000);
                })
            ]);
        } catch (error) {
            this.end(TaskStatus.FAILED, error instanceof Error ? error.message : '提审失败');
        }
    }
}
