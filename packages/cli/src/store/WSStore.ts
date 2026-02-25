import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { WebSocket } from "ws";
import { EventEmitter } from "mp-assistant-common/dist/event/EventEmitter.js";
import { WSMessage, WSMessageFormat } from "mp-assistant-common/dist/ws/index.js";

export interface EventMap {
    /** 收到ws消息 */
    message: WSMessageFormat<any>;
}

export class WSStore extends EventEmitter<EventMap> {
    private static __instance: WSStore | null = null
    public static get instance() {
        return this.__instance ?? (this.__instance = new WSStore());
    }

    private __connectionWsList: {
        key: string;
        ws: WebSocket;
        /** 活跃时间 时间戳（毫秒） */
        activeTime: number;
    }[] = [];

    constructor() {
        super();
        // 定时发送心跳消息
        setInterval(() => {
            this.broadcast(WSMessage.Heartbeat.createMessage());
        }, WSMessage.Heartbeat.loopInterval);

        // 定时检查连接状态，关闭超时的连接
        setInterval(() => {
            this.__connectionWsList.forEach(item => {
                if (Date.now() - item.activeTime > WSMessage.Heartbeat.timeout) {
                    item.ws.close();
                }
            });
        }, 500);
    }

    connection(ws: WebSocket) {
        const key = getUUID();
        this.__connectionWsList.push({
            key,
            ws,
            activeTime: Date.now(),
        });

        // 监听消息 
        ws.on('message', (data) => {
            try {
                const message: WSMessageFormat<any> = JSON.parse(data.toString());
                // 只处理非心跳消息。
                if (message.type !== WSMessage.Heartbeat.type) {
                    this.emit('message', message);
                }
                // 更新活跃时间
                const currentWs = this.__connectionWsList.find(item => item.key === key);
                if (currentWs) {
                    currentWs.activeTime = Date.now();
                }
            } catch (e) {
                // 不是json格式的消息，忽略
                return;
            }
        });
        // 监听关闭
        ws.on('close', () => {
            this.__connectionWsList = this.__connectionWsList.filter(item => item.ws !== ws);
        });
    }

    /**
     * 广播消息
     * @param message 
     */
    async broadcast(message: WSMessageFormat<any>) {
        await Promise.allSettled(this.__connectionWsList.map(item => {
            return new Promise<void>((res, rej) => {
                if (item.ws.readyState === WebSocket.OPEN) {
                    item.ws.send(JSON.stringify(message), (error) => {
                        if (error) {
                            rej();
                            return;
                        }
                        res();
                    });
                }
            });
        }));
    }
}