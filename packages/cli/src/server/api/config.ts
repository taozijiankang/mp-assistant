import { FastifyInstance } from "fastify";
import { ConfigStore } from "../../store/ConfigStore.js";
import { Api } from "mp-assistant-common/dist/api/index.js";
import { getApiResponse } from "mp-assistant-common/dist/api/index.js";


export const registerConfigApi = (fastify: FastifyInstance) => {
    fastify.get(Api.Config.GetConfig.url, async (request, reply): Promise<Api.Config.GetConfig.Response> => {
        return getApiResponse({
            data: ConfigStore.instance.config,
        });
    });

    fastify.post(Api.Config.SetConfig.url, async (request, reply): Promise<Api.Config.SetConfig.Response> => {
        const config = request.body as Api.Config.SetConfig.Request;
        ConfigStore.instance.setConfig(config);
        return getApiResponse({
            data: ConfigStore.instance.config,
        });
    });
}