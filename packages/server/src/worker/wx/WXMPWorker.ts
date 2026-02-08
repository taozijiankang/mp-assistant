import { BaseWorker } from "../BaseWorker.js";
import { WXAuthenticator } from "./WXAuthenticator.js";

export class WXMPWorker extends BaseWorker {
    authenticator = new WXAuthenticator();

    protected async _init() {
        await this.authenticator.init(this.browserContent);
    }

    getInfo() {
        return {
            status: this.authenticator.getStatus(),
            wxaList: this.authenticator.getWxaList(),
            loginQRCodeURL: this.authenticator.getLoginQRCodeURL(),
        }
    }
}
