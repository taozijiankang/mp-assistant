import { FastifyInstance } from "fastify";
import { registerConfigApi } from "./modules/config.js";
import { registerWorkerApi } from "./modules/worker.js";
import { registerCommonApi } from "./modules/common.js";
import { registerPlanApi } from "./modules/plan.js";

export const registerApi = (fastify: FastifyInstance) => {
    registerCommonApi(fastify);
    registerConfigApi(fastify);
    registerWorkerApi(fastify);
    registerPlanApi(fastify);
}