import { Config } from "../../types/config.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace ConfigApi {
    /**
     * 获取配置
     */
    export namespace GetConfig {
        export const url = '/config';
        export const method = 'GET';

        export type ResponseData = Config;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }


    /**
     * 设置配置
     */
    export namespace SetConfig {
        export const url = '/config';
        export const method = 'POST';

        export type RequestBody = Partial<Config>;

        export type ResponseData = Config;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}