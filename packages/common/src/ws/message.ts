export interface WSMessageFormat<T> {
    type: string;
    data?: T;
}

export namespace WSMessage {
    /** 心跳消息 */
    export namespace Heartbeat {
        export const type = 'heartbeat';

        export const loopInterval = 1000; // 心跳发送间隔，单位毫秒
        export const timeout = 5000; // 心跳超时时间，单位毫秒

        export type Data = void;
        export interface Message extends WSMessageFormat<Data> {
            type: typeof type;
        }

        export function createMessage(): Message {
            return {
                type,
            };
        }
    }
}