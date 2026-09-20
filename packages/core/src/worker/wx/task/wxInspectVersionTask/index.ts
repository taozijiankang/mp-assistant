import { TaskStatus, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXInspectVersionTaskInfo, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { requestVersionList } from "../../../../api/index.js";

export class WXInspectVersionTask extends WXTask<WXInspectVersionTaskOptions, WXInspectVersionTaskInfo> {
    readonly type = WXTaskType.WX_INSPECT_VERSION;

    async execute(): Promise<void> {
        try {
            const page = await this.newPage();

            await this.switchMP(page, this.options.appId);

            this.report('text', '正在获取版本列表...');
            const versionData = await requestVersionList(page);

            this.setAVersionData(versionData);

            this.report('text', '版本列表获取完成');

            this.end(TaskStatus.COMPLETED, '检查版本任务完成');
        } catch (error) {
            this.end(TaskStatus.FAILED, error instanceof Error ? error.message : '检查版本失败');
        }
    }
}
