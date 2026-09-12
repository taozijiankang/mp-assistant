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
     * worker 列表改变：worker 增删、名称/权重/状态变化时广播
     */
    export namespace WorkerListChanged {
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
     * worker 详情改变：单个 worker 的任务列表、登录二维码、小程序列表等变化时广播
     */
    export namespace WorkerDetailChanged {
        export const type = 'worker-detail-change';

        export type Data = { workerKey: string };
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

    /**
     * 任务详情改变：单个任务的状态、报告、属性等变化时广播
     */
    export namespace TaskDetailChanged {
        export const type = 'task-detail-change';

        export type Data = { workerKey: string; taskKey: string };
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

    /**
     * 标签改变：标签列表变化时广播
     */
    export namespace TagChanged {
        export const type = 'tag-change';

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
     * 审核模板改变：审核模板列表变化时广播
     */
    export namespace ReviewTemplateChanged {
        export const type = 'review-template-change';

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
        [WorkerListChanged.type]: WorkerListChanged.Data,
        [WorkerDetailChanged.type]: WorkerDetailChanged.Data,
        [TaskDetailChanged.type]: TaskDetailChanged.Data,
        [TagChanged.type]: TagChanged.Data,
        [ReviewTemplateChanged.type]: ReviewTemplateChanged.Data,
    }

    export class Event<T extends EventMap = EventMap> extends EventEmitter<T> { }
}
