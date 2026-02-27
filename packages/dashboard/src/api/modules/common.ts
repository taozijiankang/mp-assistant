import { Api } from "mp-assistant-common/dist/api/index.js";
import { request } from "../request";

export function requestUploadFile(file: File) {
    return request<Api.Common.UploadFile.ResponseData>(
        Api.Common.UploadFile.url,
        { method: Api.Common.UploadFile.method, file }
    );
}

export function requestConvertFilePath(filePaths: string[]) {
    return request<Api.Common.ConvertFilePath.ResponseData>(
        Api.Common.ConvertFilePath.url,
        { method: Api.Common.ConvertFilePath.method, body: { filePaths } }
    );
}