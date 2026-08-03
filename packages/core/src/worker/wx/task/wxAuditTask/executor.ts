import { BaseExecutor } from "../../../BaseExecutor.js";
import { WXAuditTaskOptions } from "@mp-assistant/common/dist/work/wx/tasks/WXAuditTask.js";

export class WXAuditExecutor extends BaseExecutor<WXAuditTaskOptions> {
    async execute(): Promise<void> {
        // TODO: 实现提审流程
    }
}
