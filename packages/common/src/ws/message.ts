import { EventEmitter } from "../event/EventEmitter.js"

export interface WSMessageFormat<T> {
    type: string;
    data: T;
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
                data: undefined
            };
        }
    }

    /**
     * 内容改变：worker 或 plan 数据发生变化时广播
     */
    export namespace ContentChanged {
        export const type = 'content-change';

        export type Data = void;
        export interface Message extends WSMessageFormat<Data> {
            type: typeof type;
        }

        export function createMessage(): Message {
            return {
                type,
                data: undefined,
            }
        }
    }

    export interface EventMap {
        [Heartbeat.type]: Heartbeat.Data,
        [ContentChanged.type]: ContentChanged.Data,
    }

    export class Event<T extends EventMap = EventMap> extends EventEmitter<T> { }
}