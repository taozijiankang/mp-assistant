import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace CommonApi {
    /**
     * 上传文件
     */
    export namespace UploadFile {
        export const url = '/upload-file';
        export const method = 'POST';

        export type ResponseData = string;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}