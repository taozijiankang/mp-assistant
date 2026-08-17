export interface PlanApp {
    /** 小程序 appid */
    appid: string;
    /** 小程序名称 */
    appName: string;
    /** 小程序图标（头像） */
    icon: string;
}

export interface Plan {
    /** 计划名称 */
    name: string;
    /** 该计划下的小程序列表 */
    apps: PlanApp[];
    /** 是否启用（可同时启用多个） */
    enabled: boolean;
}
