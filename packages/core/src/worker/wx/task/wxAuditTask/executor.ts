import { WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXTaskExecutor, WXTaskExecutorMessage } from "../../WXTaskExecutor.js";
import { WXMP_AUDIT_PAGE_URL, WXMP_URL, WXMP_VERSION_MANAGEMENT_URL } from "../../../../constant/wx.js";
import { expect } from "playwright/test";
import { versionSatisfy } from "@mp-assistant/common/dist/utils/index.js";
import { getVersionList } from "../../../../api/index.js";
import { WXAuditStatus } from "@mp-assistant/common/dist/constant/wx.js";

export interface WXAuditExecutorMessage extends WXTaskExecutorMessage {
}

export class WXAuditExecutor extends WXTaskExecutor<WXAuditTaskOptions> {
    async execute(): Promise<void> {
        try {
            const page = await this.createPage();

            await this.switchMP(page, this.options.appId);

            // 先找到可提审的版本
            const versionData = await getVersionList(page);
            const versionInfo = versionData.develop_info
                ?.info_list
                ?.map(item => item.basic_info)
                ?.filter(Boolean)
                .find(item => versionSatisfy(item!, this.options.positioner ?? []));
            if (!versionInfo) {
                throw new Error('未找到可提审的版本');
            }

            // 判断当前版本是否已提审
            const onAuditVersionInfo = versionData.experience_info?.basic_info;
            if (onAuditVersionInfo && onAuditVersionInfo.audit_status !== undefined) {
                // 如果是当前版本
                if (
                    onAuditVersionInfo.version === versionInfo.version
                    && onAuditVersionInfo.nick_name === versionInfo.nick_name
                    && onAuditVersionInfo.describe === versionInfo.describe
                ) {
                    if (onAuditVersionInfo.audit_status === WXAuditStatus.SUCCESS) {
                        this.completed('当前版本审核通过待发布');
                        return;
                    }
                }
            }

            // 如果当前页面不是MP主页，则跳转到MP主页 获取 searchParams
            if (!page.url().startsWith(WXMP_URL)) {
                await page.goto(WXMP_URL);
            }

            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

            // 开发版本盒子定位器
            const developVersionBoxLocator = page.locator('.code_mod.mod_default_box.code_version_dev', {
                has: page.locator('.mod_default_hd', { hasText: '开发版本' })
            });
            await expect(developVersionBoxLocator).toBeVisible({
                timeout: 30 * 1000
            });

            const developVersionItemLocator = developVersionBoxLocator.locator('.code_version_log')
                .filter({
                    has: page.locator('.simple_preview_value', { hasText: versionInfo.version })
                })
                .filter({
                    has: page.locator('.simple_preview_value', { hasText: versionInfo.nick_name })
                })
                .filter({
                    has: page.locator('.simple_preview_value', { hasText: versionInfo.describe })
                });

            await expect(developVersionItemLocator).toBeVisible();

            this.report('text', `点击提交审核`);

            developVersionItemLocator.locator('button', {
                hasText: '提交审核'
            }).click();

            // 提交审核的相关须知 弹窗
            const auditNoticeModalLocator = page.locator('.weui-desktop-dialog', {
                has: page.locator('.weui-desktop-dialog__title', { hasText: '提交审核的相关须知' })
            });
            await expect(auditNoticeModalLocator).toBeVisible({ timeout: 30 * 1000 })
            await auditNoticeModalLocator.locator('.weui-desktop-form__check-label[data-component="mp-checkbox"]').click();
            await auditNoticeModalLocator.locator('.weui-desktop-dialog__ft button', { hasText: '下一步' }).click();
            // 代码审核进行安全测试提醒
            const codeAuditSecurityTestModalLocator = page.locator('.weui-desktop-dialog', {
                has: page.locator('.weui-desktop-dialog__bd', { hasText: '代码审核进行安全测试提醒' })
            });
            await expect(codeAuditSecurityTestModalLocator).toBeVisible({ timeout: 3 * 1000 })
            await codeAuditSecurityTestModalLocator.locator('.weui-desktop-dialog__ft button', { hasText: '继续提交' }).click();

            const auditPage = await this.browserContent.waitForEvent('page', {
                predicate: page => page.url().startsWith(WXMP_AUDIT_PAGE_URL),
                timeout: 30 * 1000
            });

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
                    });
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
                videos ? await new Promise<void>(async (resolve, reject) => {
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
                    });
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

            // 提交审核
            await new Promise<void>(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    complete(new Error('提交审核超时'));
                }, 30 * 1000);

                const interval = setInterval(() => {
                    auditPage.locator('div.main_bd .msg_content', {
                        hasText: "已提交审核"
                    }).isVisible().then((visible) => {
                        if (visible) {
                            complete();
                        }
                    });
                });

                const complete = (error?: any) => {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }

                await submitFormBoxLocator.locator('.tool_bar a', { hasText: '提交审核' }).click();
            });

            this.completed('提审任务完成');
        } catch (error) {
            this.failed(error instanceof Error ? error.message : '提审失败');
        }
    }
}
