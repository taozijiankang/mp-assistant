export interface WXMPItem {
    app_headimg: string;
    app_name: string;
    appid: string;
    email: string;
    type: string;
    username: string;
}

export interface WXMPVersionItem {
    code_data?: string
    ret?: number
}
export interface VersionListItem {
    audit_id?: number;
    audit_status?: number;
    avatar?: string;
    describe?: string;
    fail_reason?: string;
    is_speedup?: number;
    nick_name?: string;
    open_id?: string;
    status?: number;
    time?: number;
    version?: string;
    warning_api_list?: any[];
    is_exper?: boolean;
}

export enum WXReviewStatus {
    SUCCESS = 3,
    REVIEWING = 2,
    FAIL = 1,
    EXPERIENCE = 0
}