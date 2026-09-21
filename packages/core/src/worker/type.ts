export interface ExecutorCommonMessage {
    type: string;
    data: any;
}

/**
 * 把 { TO_A_INIT: undefined, TO_A_END: {...}, ... } 这种映射转成可辨识联合：
 * { type: 'TO_A_INIT'; data: undefined } | { type: 'TO_A_END'; data: {...} } | ...
 * 让 type 与 data 一一对应，switch 收窄类型时自动推导出 data 的类型。
 */
export type ExecutorCustomMessage<T extends Record<string, any>> = {
    [K in keyof T]: {
        type: K;
        data: T[K];
    }
}[keyof T];