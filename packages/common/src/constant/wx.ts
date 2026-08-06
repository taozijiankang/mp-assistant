export enum WXReviewStatus {
    FAIL = 3,
    SUCCESS = 2,
    REVIEWING = 1,
}

export const WXReviewStatusDict = {
    [WXReviewStatus.SUCCESS]: '审核通过待发布',
    [WXReviewStatus.REVIEWING]: '审核中',
    [WXReviewStatus.FAIL]: '审核失败',
}