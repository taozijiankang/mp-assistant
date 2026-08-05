import { WXTaskInfo, WXTaskOptions, WXTaskType } from "@mp-assistant/common/dist/work/index.js";
import { BaseTask } from "../BaseTask.js";
import { WXTaskExecutorMessage } from "./WXTaskExecutor.js";
import { ExecutorCustomMessage } from "../type.js";

export abstract class WXTask<
    Options extends WXTaskOptions = WXTaskOptions,
    Info extends WXTaskInfo = WXTaskInfo
> extends BaseTask<Options, Info> {
    declare readonly type: WXTaskType;

    /** 登录二维码 base64 data URL，由 executor 通过 LOGIN_QR_CODE 消息上报 */
    protected loginQRCode?: string;
    /** 是否已登录 */
    protected isLogin?: boolean;

    getInfo(): Info {
        return {
            ...super.getInfo(),
            loginQRCode: this.loginQRCode,
            isLogin: this.isLogin,
        } as Info;
    }

    protected onExecutorMessage(message: ExecutorCustomMessage<WXTaskExecutorMessage>): void {
        const { type, data } = message;
        switch (type) {
            case 'CHANGE_LOGIN_STATUS': {
                this.isLogin = data.isLogin;
                this.worker?.changeDetail();
                return;
            }
            case 'LOGIN_QR_CODE': {
                this.loginQRCode = data.imageSrc;
                this.worker?.changeDetail();
                return;
            }
            default: {
                super.onExecutorMessage(message);
                return;
            }
        }
    }
}
