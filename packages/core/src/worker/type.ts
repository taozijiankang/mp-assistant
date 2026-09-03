export interface ExecutorCommonMessage {
    type: string;
    data: any;
}

export type ExecutorCustomMessage<T extends Record<string, any>> = {
    [K in keyof T]: {
        type: K;
        data: T[K];
    }
}[keyof T];