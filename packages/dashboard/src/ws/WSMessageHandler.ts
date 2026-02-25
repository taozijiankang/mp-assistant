import { EventEmitter } from "mp-assistant-common/dist/event/EventEmitter.js";
import { WSConnection } from "./WSConnection";
import type { WSMessageFormat } from "mp-assistant-common/dist/ws";

export interface BaseWSMessageHandlerEventMap {
    /** 收到ws消息 */
    message: WSMessageFormat<any>;
}

export class WSMessageHandler<T extends BaseWSMessageHandlerEventMap> extends EventEmitter<T> {
    constructor() {
        super();
        WSConnection.instance.on('message', (message) => {
            this.emit('message', message);
        });
    }
}