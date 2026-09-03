import { ConfigApi } from './modules/config.js';
import { WorkerApi } from './modules/worker.js';
import { CommonApi } from "./modules/common.js"
import { PlanApi } from './modules/plan.js';
import { ReviewTemplateApi } from './modules/reviewTemplate.js';

export const ApiPrefix = '/api';

export namespace Api {
    export import Common = CommonApi;
    export import Config = ConfigApi;
    export import Worker = WorkerApi;
    export import Plan = PlanApi;
    export import ReviewTemplate = ReviewTemplateApi;
}
