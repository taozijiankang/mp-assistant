export enum WXAuditStatus {
    FAIL = 3,
    SUCCESS = 2,
    REVIEWING = 1,
}

export const WXAuditStatusDict = {
    [WXAuditStatus.SUCCESS]: '审核通过待发布',
    [WXAuditStatus.REVIEWING]: '审核中',
    [WXAuditStatus.FAIL]: '审核失败',
}