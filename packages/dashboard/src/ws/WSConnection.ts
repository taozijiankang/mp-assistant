import type { WSMessageFormat } from "@mp-assistant/common/dist/ws";
import { WSMessage, WSUrl } from "@mp-assistant/common/dist/ws/index.js";

/**
 * 获取 API 基础 URL
 * 生产环境下使用相对路径（同源部署），开发环境通过 vite proxy 代理
 */
export const getBaseWsURL = () => {
    return new URL(WSUrl, import.meta.env.VITE_BASE_API_URL || location.origin).href;
};

export enum WSMessageEvent {
    connect = 'connect',
}

interface WSMessageEventMap extends WSMessage.EventMap {
    [WSMessageEvent.connect]: void;
}

export class WSConnection extends WSMessage.Event<WSMessageEventMap> {
    private static instance_: WSConnection | null = null;
    public static get instance() {
        return this.instance_ ?? (this.instance_ = new WSConnection());
    }

    private ws: WebSocket | null = null;
    private heartbeatTimer: number | null = null;
    private activeTime: number = 0;
    private timeoutTimer: number | null = null;

    constructor() {
        super();
    }

    connect() {
        this.ws = new WebSocket(getBaseWsURL());

        this.ws.addEventListener('open', () => {
            console.log('WebSocket 连接已打开');

            this.emit(WSMessageEvent.connect);

            this.activeTime = Date.now();

            // 连接建立后定时发送心跳消息
            this.heartbeatTimer = setInterval(() => {
                this.sendMessage(WSMessage.Heartbeat.createMessage());
            }, WSMessage.Heartbeat.loopInterval);

            // 定时检查连接状态，关闭超时的连接
            this.timeoutTimer = setInterval(() => {
                if (Date.now() - this.activeTime > WSMessage.Heartbeat.timeout) {
                    console.warn('WebSocket 连接超时，正在关闭连接');
                    this.ws?.close();
                }
            }, 500);
        });

        this.ws.addEventListener('message', (event) => {
            // 收到响应，更新活跃时间
            this.activeTime = Date.now();
            try {
                const message: WSMessageFormat<any> = JSON.parse(event.data);
                
                this.emit(message.type as any, message.data);
            }
            catch (e) {
                // 不是json格式的消息，忽略
                return;
            }
        });

        this.ws.addEventListener('close', () => {
            console.log('WebSocket 连接已关闭');
            this.resetConnection();
        });

        this.ws.addEventListener('error', (error) => {
            console.error('WebSocket 连接错误:', error);
            this.ws?.close(); // 发生错误时关闭连接，触发重连机制
        });
    }

    private resetConnection() {
        console.log('重置 WebSocket 连接');
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.timeoutTimer) {
            clearInterval(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        this.ws = null;
        setTimeout(() => {
            this.connect();
        }, 3000);
    }

    sendMessage(message: WSMessageFormat<any>) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (e) {
                console.error('发送消息失败:', e);
            }
        } else {
            console.warn('WebSocket 连接未打开，无法发送消息');
        }
    }
}