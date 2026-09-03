import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetReviewTemplateList() {
    return request<Api.ReviewTemplate.GetReviewTemplateList.ResponseData>(
        Api.ReviewTemplate.GetReviewTemplateList.url,
        { method: Api.ReviewTemplate.GetReviewTemplateList.method }
    );
}

export function requestSetReviewTemplates(body: Api.ReviewTemplate.SetReviewTemplates.RequestBody) {
    return request<Api.ReviewTemplate.SetReviewTemplates.ResponseData>(
        Api.ReviewTemplate.SetReviewTemplates.url,
        { method: Api.ReviewTemplate.SetReviewTemplates.method, body }
    );
}
