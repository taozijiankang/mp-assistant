import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetConfig() {
    return request<Api.Config.GetConfig.ResponseData>(
        Api.Config.GetConfig.url,
        { method: Api.Config.GetConfig.method }
    );
}

export function requestSetConfig(config: Api.Config.SetConfig.RequestBody) {
    return request<Api.Config.SetConfig.ResponseData>(
        Api.Config.SetConfig.url,
        { method: Api.Config.SetConfig.method, body: config }
    );
}

