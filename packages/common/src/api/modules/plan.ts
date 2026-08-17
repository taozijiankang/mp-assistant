import { Plan } from "../../types/plan.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace PlanApi {
    /**
     * 获取计划列表
     */
    export namespace GetPlanList {
        export const url = '/plan/list';
        export const method = 'GET';

        export type ResponseData = Plan[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 保存计划列表（整体覆盖）
     */
    export namespace SetPlans {
        export const url = '/plan/set';
        export const method = 'POST';

        export type RequestBody = Plan[];

        export type ResponseData = Plan[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}
