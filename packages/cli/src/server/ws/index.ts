import { FastifyInstance } from "fastify";
import { WSStore } from "../../store/WSStore.js";
import { WSUrl } from "mp-assistant-common/dist/ws/index.js";

export const registerWebSocket = async (fastify: FastifyInstance) => {
    fastify.get(WSUrl, { websocket: true }, (socket, request) => {
        WSStore.instance.connection(socket);
    });

}