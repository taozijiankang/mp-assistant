import { Api } from "mp-assistant-common/dist/api/index.js";
import { getBaseApiURL, request } from "../request";

export function requestUploadFile(file: File) {
    return request<Api.Common.UploadFile.ResponseData>(
        Api.Common.UploadFile.url,
        { method: Api.Common.UploadFile.method, file }
    );
}

export function getFileUrl(filePath: string) {
    return getBaseApiURL() + Api.Common.GetFile.url + `?filePath=${encodeURIComponent(filePath)}`;
}