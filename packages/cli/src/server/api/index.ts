import { FastifyInstance } from "fastify";
import { registerConfigApi } from "./modules/config.js";
import { registerWorkerApi } from "./modules/worker.js";

export const registerApi = (fastify: FastifyInstance) => {
    registerConfigApi(fastify);
    registerWorkerApi(fastify);
}