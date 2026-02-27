import type { WSMessageFormat } from "mp-assistant-common/dist/ws";
import { WSMessage, WSUrl } from "mp-assistant-common/dist/ws/index.js";
import { EventEmitter } from "mp-assistant-common/dist/event/EventEmitter";

/**
 * 获取 API 基础 URL
 * 生产环境下使用相对路径（同源部署），开发环境通过 vite proxy 代理
 */
const getBaseURL = () => {
    return new URL(WSUrl, import.meta.env.VITE_BASE_API_URL || location.origin).href;
};

export interface BaseWSConnectEventMap {
    /** 收到ws消息 */
    message: WSMessageFormat<any>;
}

export class WSConnection extends EventEmitter<BaseWSConnectEventMap> {
    private static __instance: WSConnection | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new WSConnection());
    }

    private __ws: WebSocket | null = null;
    private __heartbeatTimer: number | null = null;
    private __activeTime: number = 0;
    private __timeoutTimer: number | null = null;

    constructor() {
        super();
    }

    connect() {
        this.__ws = new WebSocket(getBaseURL());

        this.__ws.addEventListener('open', () => {
            console.log('WebSocket 连接已打开');

            this.__activeTime = Date.now();

            // 连接建立后定时发送心跳消息
            this.__heartbeatTimer = setInterval(() => {
                this.sendMessage(WSMessage.Heartbeat.createMessage());
            }, WSMessage.Heartbeat.loopInterval);

            // 定时检查连接状态，关闭超时的连接
            this.__timeoutTimer = setInterval(() => {
                if (Date.now() - this.__activeTime > WSMessage.Heartbeat.timeout) {
                    console.warn('WebSocket 连接超时，正在关闭连接');
                    this.__ws?.close();
                }
            }, 500);
        });

        this.__ws.addEventListener('message', (event) => {
            // 收到响应，更新活跃时间
            this.__activeTime = Date.now();
            try {
                const message: WSMessageFormat<any> = JSON.parse(event.data);
                // 只处理非心跳消息。
                if (message.type !== WSMessage.Heartbeat.type) {
                    this.emit('message', message);
                }
            }
            catch (e) {
                // 不是json格式的消息，忽略
                return;
            }
        });

        this.__ws.addEventListener('close', () => {
            console.log('WebSocket 连接已关闭');
            this.__resetConnection();
        });

        this.__ws.addEventListener('error', (error) => {
            console.error('WebSocket 连接错误:', error);
            this.__ws?.close(); // 发生错误时关闭连接，触发重连机制
        });
    }

    private __resetConnection() {
        console.log('重置 WebSocket 连接');
        if (this.__heartbeatTimer) {
            clearInterval(this.__heartbeatTimer);
            this.__heartbeatTimer = null;
        }
        if (this.__timeoutTimer) {
            clearInterval(this.__timeoutTimer);
            this.__timeoutTimer = null;
        }
        this.__ws = null;
        setTimeout(() => {
            this.connect();
        }, 3000);
    }

    sendMessage(message: WSMessageFormat<any>) {
        if (this.__ws && this.__ws.readyState === WebSocket.OPEN) {
            try {
                this.__ws.send(JSON.stringify(message));
            } catch (e) {
                console.error('发送消息失败:', e);
            }
        } else {
            console.warn('WebSocket 连接未打开，无法发送消息');
        }
    }
}