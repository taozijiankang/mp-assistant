import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetPlanList() {
    return request<Api.Plan.GetPlanList.ResponseData>(
        Api.Plan.GetPlanList.url,
        { method: Api.Plan.GetPlanList.method }
    );
}

export function requestSetPlans(body: Api.Plan.SetPlans.RequestBody) {
    return request<Api.Plan.SetPlans.ResponseData>(
        Api.Plan.SetPlans.url,
        { method: Api.Plan.SetPlans.method, body }
    );
}
