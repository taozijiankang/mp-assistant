import { WXReviewStatus } from "../types/wx.js";

export const WXReviewStatusDict = {
    [WXReviewStatus.SUCCESS]: '审核通过待发布',
    [WXReviewStatus.REVIEWING]: '审核中',
    [WXReviewStatus.FAIL]: '审核失败',
}