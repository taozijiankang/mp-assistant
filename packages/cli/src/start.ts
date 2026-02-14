
import path from 'path';
import { createRequire } from 'module';
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { ConfigStore } from './store/ConfigStore.js';
import { registerWebSocket } from './server/ws/index.js';
import { registerApi } from './server/api/index.js';
import { ApiPrefix, getApiResponse } from 'mp-assistant-common/dist/api/index.js';
import { WorkerStore } from './store/WorkerStore.js';
import fastifyCors from '@fastify/cors';

const require = createRequire(import.meta.url);

/**
 * Run the server!
 */
export const start = async () => {
    startServer();

    /**
     * 初始化worker
     */
    for (const worker of WorkerStore.instance.workerList) {
        await worker.init({
            executablePath: ConfigStore.instance.config.executablePath,
            headless: ConfigStore.instance.config.headless,
        });
    }
}

const startServer = async () => {
    const fastify = Fastify({
        // logger: true
    });

    // 注册 WebSocket 插件
    await fastify.register(fastifyWebsocket);

    // 设置跨域
    fastify.register(fastifyCors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // 统一错误响应格式
    fastify.setErrorHandler<Error & { statusCode?: number }>((error, request, reply) => {
        const statusCode = error.statusCode ?? 500;
        reply.status(200).send(getApiResponse({
            code: ([400, 401, 403, 404, 500].includes(statusCode) ? statusCode : 500) as 400 | 401 | 403 | 404 | 500,
            message: error.message || 'Internal Server Error',
        }));
    });

    // 统一 404 响应格式
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(200).send(getApiResponse({
            code: 404,
            message: `Route ${request.method} ${request.url} not found`,
        }));
    });

    // 注册静态目录，指向 mp-assistant-dashboard 包的 dist 目录
    const dashboardDir = path.join(
        path.dirname(require.resolve('mp-assistant-dashboard/package.json')),
        'dist'
    );
    await fastify.register(fastifyStatic, {
        root: dashboardDir,
        prefix: '/',
    });

    // WebSocket 路由
    await fastify.register(registerWebSocket);

    // api 路由
    await fastify.register(registerApi, { prefix: ApiPrefix });

    try {
        await fastify.listen({ port: ConfigStore.instance.config.port })
        console.log(`Server is running on http://localhost:${ConfigStore.instance.config.port}`);
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}