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

    export namespace Worker {
        /**
         * worker 列表改变
         */
        export namespace ListChange {
            export const type = 'worker-list-change';

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

        /**
         * 详情改变
         */
        export namespace DetailChange {
            export const type = 'worker-detail-change';

            export type Data = {
                key: string;
            };
            export interface Message extends WSMessageFormat<Data> {
                type: typeof type;
            }

            export function createMessage(data: Data): Message {
                return {
                    type,
                    data,
                }
            }
        }
    }

    export interface EventMap {
        [Worker.ListChange.type]: Worker.ListChange.Data,
        [Worker.DetailChange.type]: Worker.DetailChange.Data,
    }

    export class Event extends EventEmitter<EventMap> { }
}