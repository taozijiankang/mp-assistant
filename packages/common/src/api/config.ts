import { Config } from "../types/config.js";
import { ApiResponse } from "./type.js";

export namespace ConfigApi {
    export namespace GetConfig {
        export const url = '/config';
        export const method = 'GET';

        export type Response = ApiResponse<Config>;
    }

    export namespace SetConfig {
        export const url = '/config';
        export const method = 'POST';

        export type Request = Partial<Config>;
        export type Response = ApiResponse<Config>;
    }
}