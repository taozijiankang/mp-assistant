import { FastifyInstance } from "fastify";
import { TagStore } from "../../../store/TagStore.js";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { getSuccessApiResponse } from "@mp-assistant/common/dist/api/utils.js";

export const registerTagApi = (fastify: FastifyInstance) => {
    fastify.get(Api.Tag.GetTagList.url, async (request, reply): Promise<Api.Tag.GetTagList.Response> => {
        return getSuccessApiResponse(TagStore.instance.tagList);
    });

    fastify.post(Api.Tag.SetTags.url, async (request, reply): Promise<Api.Tag.SetTags.Response> => {
        const tags = request.body as Api.Tag.SetTags.RequestBody;
        TagStore.instance.setTagList(tags);
        return getSuccessApiResponse(TagStore.instance.tagList, '保存标签成功');
    });
};
