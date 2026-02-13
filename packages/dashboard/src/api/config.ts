import { Api } from "mp-assistant-common/dist/api/index.js";
import { get, post } from "./request";

/**
 * 获取配置
 */
export function getConfig() {
    return get<Api.Config.GetConfig.ResponseData>(
        Api.Config.GetConfig.url
    );
}

/**
 * 设置配置
 */
export function setConfig(config: Api.Config.SetConfig.Request) {
    return post<Api.Config.SetConfig.ResponseData>(
        Api.Config.SetConfig.url,
        { body: config }
    );
}

