import { ReviewTemplate } from "../../types/reviewTemplate.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace ReviewTemplateApi {
    /**
     * 获取审核模板列表
     */
    export namespace GetReviewTemplateList {
        export const url = '/review-template/list';
        export const method = 'GET';

        export type ResponseData = ReviewTemplate[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 保存审核模板列表（整体覆盖）
     */
    export namespace SetReviewTemplates {
        export const url = '/review-template/set';
        export const method = 'POST';

        export type RequestBody = ReviewTemplate[];

        export type ResponseData = ReviewTemplate[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}
