import { FastifyInstance } from "fastify";
import { ConfigStore } from "../../store/ConfigStore.js";

export const registerApi = async (fastify: FastifyInstance) => {
    fastify.get('/config', async (request, reply) => {
        return ConfigStore.instance.config;
    });
}