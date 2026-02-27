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

    /**
     * 转换地址
     */
    export namespace ConvertFilePath {
        export const url = '/convert-file-path';
        export const method = 'POST';

        export type RequestBody = {
            filePaths: string[];
        }

        export type ResponseData = string[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}