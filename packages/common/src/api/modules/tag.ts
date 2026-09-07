import { Tag } from "../../types/tag.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace TagApi {
    /**
     * 获取标签列表
     */
    export namespace GetTagList {
        export const url = '/tag/list';
        export const method = 'GET';

        export type ResponseData = Tag[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 保存标签列表（整体覆盖）
     */
    export namespace SetTags {
        export const url = '/tag/set';
        export const method = 'POST';

        export type RequestBody = Tag[];

        export type ResponseData = Tag[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}
