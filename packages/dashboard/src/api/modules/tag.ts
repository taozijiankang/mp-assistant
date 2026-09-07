import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetTagList() {
    return request<Api.Tag.GetTagList.ResponseData>(
        Api.Tag.GetTagList.url,
        { method: Api.Tag.GetTagList.method }
    );
}

export function requestSetTags(body: Api.Tag.SetTags.RequestBody) {
    return request<Api.Tag.SetTags.ResponseData>(
        Api.Tag.SetTags.url,
        { method: Api.Tag.SetTags.method, body }
    );
}
