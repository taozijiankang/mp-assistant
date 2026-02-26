import { Api } from "mp-assistant-common/dist/api/index.js";
import { request } from "../request";

export function requestUploadFile(file: File) {
    return request<Api.Common.UploadFile.ResponseData>(
        Api.Common.UploadFile.url,
        { method: Api.Common.UploadFile.method, file }
    );
}