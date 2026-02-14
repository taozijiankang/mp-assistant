import { FastifyInstance } from "fastify";
import { registerConfigApi } from "./config.js";
import { registerWorkerApi } from "./worker.js";

export const registerApi = (fastify: FastifyInstance) => {
    registerConfigApi(fastify);
    registerWorkerApi(fastify);
}