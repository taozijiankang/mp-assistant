import { WSMessage } from "mp-assistant-common/dist/ws/index.js";
import { WSStore } from "../store/WSStore.js";

export class WSMessageEvent extends WSMessage.Event {
    private static __instance: WSMessageEvent | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new WSMessageEvent());
    }

    constructor() {
        super();

        /**
         * 转发消息
         */
        this.on('*', (type, event) => {
            WSStore.instance.broadcast({
                type,
                data: event
            });
        })
    }
}