import { FastifyInstance } from "fastify";
import { ReviewTemplateStore } from "../../../store/ReviewTemplateStore.js";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { getSuccessApiResponse } from "@mp-assistant/common/dist/api/utils.js";

export const registerReviewTemplateApi = (fastify: FastifyInstance) => {
    fastify.get(Api.ReviewTemplate.GetReviewTemplateList.url, async (request, reply): Promise<Api.ReviewTemplate.GetReviewTemplateList.Response> => {
        return getSuccessApiResponse(ReviewTemplateStore.instance.reviewTemplateList);
    });

    fastify.post(Api.ReviewTemplate.SetReviewTemplates.url, async (request, reply): Promise<Api.ReviewTemplate.SetReviewTemplates.Response> => {
        const templates = request.body as Api.ReviewTemplate.SetReviewTemplates.RequestBody;
        ReviewTemplateStore.instance.setReviewTemplateList(templates);
        return getSuccessApiResponse(ReviewTemplateStore.instance.reviewTemplateList, '保存审核模板成功');
    });
};
