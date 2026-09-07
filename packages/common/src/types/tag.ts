export interface TagApp {
    /** 小程序 appid */
    appid: string;
    /** 小程序名称 */
    appName: string;
    /** 小程序图标（头像） */
    icon: string;
}

export interface Tag {
    /** 标签名称 */
    name: string;
    /** 该标签下的小程序列表 */
    apps: TagApp[];
    /** 是否启用（可同时启用多个） */
    enabled: boolean;
    /** 标签颜色（hex，如 #409eff） */
    color: string;
}
