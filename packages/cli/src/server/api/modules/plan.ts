import { FastifyInstance } from "fastify";
import { PlanStore } from "../../../store/PlanStore.js";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { getSuccessApiResponse } from "@mp-assistant/common/dist/api/utils.js";

export const registerPlanApi = (fastify: FastifyInstance) => {
    fastify.get(Api.Plan.GetPlanList.url, async (request, reply): Promise<Api.Plan.GetPlanList.Response> => {
        return getSuccessApiResponse(PlanStore.instance.planList);
    });

    fastify.post(Api.Plan.SetPlans.url, async (request, reply): Promise<Api.Plan.SetPlans.Response> => {
        const plans = request.body as Api.Plan.SetPlans.RequestBody;
        PlanStore.instance.setPlanList(plans);
        return getSuccessApiResponse(PlanStore.instance.planList, '保存计划成功');
    });
};
