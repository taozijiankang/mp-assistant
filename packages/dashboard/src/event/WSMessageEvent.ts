import { WSMessage } from "@mp-assistant/common/dist/ws";
import { WSConnection } from "../ws/WSConnection";

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
        WSConnection.instance.on('message', (message) => {
            this.emit(message.type as any, message.data);
        });
    }
}