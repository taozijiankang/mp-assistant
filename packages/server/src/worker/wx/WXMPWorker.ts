import { BaseWorker } from "../BaseWorker.js";
import { WXAuthenticator } from "./WXAuthenticator.js";

export class WXMPWorker extends BaseWorker {
    private authenticator = new WXAuthenticator();

    protected async _init() {
        await this.authenticator.init(this.browserContent);
    }
}
