import path from 'path';
import { createRequire } from 'module';
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { ConfigStore } from './store/ConfigStore.js';
import { registerWebSocket } from './server/ws/index.js';
import { registerApi } from './server/api/index.js';
import { ApiPrefix } from '@mp-assistant/common/dist/api/index.js';
import { getErrorApiResponse } from '@mp-assistant/common/dist/api/utils.js';
import { WorkerStore } from './store/WorkerStore.js';
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';
import chalk from "chalk"
import os from 'os';
import { getRootDir } from './pathManage.js';
import fs from 'fs';
import { init } from '@mp-assistant/core/dist/init.js';

const require = createRequire(import.meta.url);

const rootPackageJson = JSON.parse(fs.readFileSync(path.join(getRootDir(), 'package.json')).toString());

/**
 * Run the server!
 */
export async function start() {
    await init();
    await startServer();

    /**
     * 初始化worker
     */
    for (const worker of WorkerStore.instance.workerList) {
        await worker.init({
            headless: ConfigStore.instance.config.headless,
        });
    }
}

async function startServer() {
    const fastify = Fastify({
        // logger: true
    });

    // 注册 WebSocket 插件
    await fastify.register(fastifyWebsocket);

    fastify.register(multipart, {
        limits: {
            fileSize: 1024 * 1024 * 100, // 100MB
        },
    });

    // 设置跨域
    fastify.register(fastifyCors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // 注册静态目录，指向 @mp-assistant/dashboard 包的 dist 目录
    const dashboardDir = path.join(
        path.dirname(require.resolve('@mp-assistant/dashboard/package.json')),
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

    // 统一错误响应格式
    fastify.setErrorHandler<Error & { statusCode?: number }>((error, request, reply) => {
        const statusCode = error.statusCode ?? 500;
        reply.status(200).send(getErrorApiResponse(
            error.message || 'Internal Server Error',
            ([400, 401, 403, 404, 500].includes(statusCode) ? statusCode : 500) as 400 | 401 | 403 | 404 | 500
        ));
    });

    // 统一 404 响应格式
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(200).send(getErrorApiResponse(
            `Route ${request.method} ${request.url} not found`,
            404
        ));
    });

    try {
        await fastify.listen({ host: '0.0.0.0', port: ConfigStore.instance.config.port })
        console.log(chalk.green(`${rootPackageJson.name} 服务已启动🚀`));
        console.log(chalk.gray(`局域网访问地址:`), chalk.blue(`http://${getLocalIP()}:${ConfigStore.instance.config.port}`));
        console.log(chalk.gray(`本地访问地址:`), chalk.blue(`http://localhost:${ConfigStore.instance.config.port}`));
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName] || [];

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            // 筛选条件：IPv4、非回环地址 (loopback)、并且是运行状态
            if (alias && alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}
