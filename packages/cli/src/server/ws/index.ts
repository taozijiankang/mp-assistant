import { FastifyInstance } from "fastify";

export const registerWebSocket = async (fastify: FastifyInstance) => {
    fastify.get('/ws', { websocket: true }, (socket, request) => {
        socket.on('message', (message: string) => {
            console.log('收到消息:', message.toString());
            socket.send(JSON.stringify({ type: 'reply', data: 'hello' }));
        });

        socket.on('close', () => {
            console.log('连接关闭');
        });
    });

}