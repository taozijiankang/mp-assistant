import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXPublishTaskInfo, WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";

export class WXPublishTask extends WXTask<WXPublishTaskOptions, WXPublishTaskInfo> {
    readonly type = WXTaskType.WX_PUBLISH;

    private versionData?: WXVersionCodeData;

    getInfo(): WXPublishTaskInfo {
        return {
            ...super.getInfo(),
            versionData: this.versionData,
        } as WXPublishTaskInfo;
    }

    protected onReset(): void {
        super.onReset();
        this.versionData = undefined;
    }

    protected setAVersionData(versionData: WXVersionCodeData): void {
        this.setAProperty('versionData', versionData);
    }
}
