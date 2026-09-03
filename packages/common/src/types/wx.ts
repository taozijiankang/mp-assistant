import { WXAuditStatus } from "../constant/wx.js";

export interface WXMPItem {
    app_headimg: string;
    app_name: string;
    appid: string;
    email: string;
    type: string;
    username: string;
}

export interface WXVersionBasicInfo {
    open_id: string;
    version: string;
    /** 开发者昵称 */
    nick_name: string;
    time: number;
    describe: string;
    avatar: string;
    warning_api_list: any[];
    audit_id?: number;
    audit_status?: WXAuditStatus;
    status?: number;
    /** 审核失败原因 */
    fail_reason?: string;
    /** 审核拒绝原因 */
    reject_reason?: string;
    is_speedup?: number;
    is_plugin_auto_update?: number;
    inner_version?: number;
}

export interface WXVersionDevelopItem {
    basic_info?: WXVersionBasicInfo;
    is_exper?: boolean;
}

export interface WXVersionCodeData {
    online_info?: { basic_info?: WXVersionBasicInfo };
    experience_info?: { basic_info?: WXVersionBasicInfo; qr_path?: string };
    develop_info?: { info_list?: WXVersionDevelopItem[]; developer_size?: number; preview_info_list?: any[] };
    need_finance_audit?: number;
    qr_path?: string;
}
