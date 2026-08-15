import { TaskStatus, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXInspectVersionTaskInfo, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";
import { getVersionList } from "../../../../api/index.js";

export class WXInspectVersionTask extends WXTask<WXInspectVersionTaskOptions, WXInspectVersionTaskInfo> {
    readonly type = WXTaskType.WX_INSPECT_VERSION;

    private versionData?: WXVersionCodeData;

    getInfo(): WXInspectVersionTaskInfo {
        return {
            ...super.getInfo(),
            versionData: this.versionData,
        } as WXInspectVersionTaskInfo;
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

            this.report('text', '正在获取版本列表...');
            const versionData = await getVersionList(page);

            this.setAVersionData(versionData);

            this.report('text', '版本列表获取完成');

            this.end(TaskStatus.COMPLETED, '登录任务完成');
        } catch (error) {
            this.end(TaskStatus.FAILED, error instanceof Error ? error.message : '登录失败');
        }
    }
}
