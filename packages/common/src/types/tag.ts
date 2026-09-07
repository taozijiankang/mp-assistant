export interface TagApp {
    /** 小程序 appid */
    appid: string;
    /** 小程序名称 */
    appName: string;
    /** 小程序图标（头像） */
    icon: string;
}

export type TagType = "mark" | "hidden";

export interface Tag {
    /** 标签名称 */
    name: string;
    /** 该标签下的小程序列表 */
    apps: TagApp[];
    /** 是否启用（可同时启用多个） */
    enabled: boolean;
    /** 标签颜色（hex，如 #409eff） */
    color: string;
    /** 标签类型：标记 / 隐藏（隐藏类型的标签会让其下小程序在版本视图和总览中隐藏） */
    type: TagType;
}
