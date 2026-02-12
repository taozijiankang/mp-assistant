
import path from 'path';
import { createRequire } from 'module';
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { ConfigStore } from './store/ConfigStore.js';
import { registerWebSocket } from './server/ws/index.js';
import { registerApi } from './server/api/index.js';

const require = createRequire(import.meta.url);

/**
 * Run the server!
 */
export const start = async () => {
    const fastify = Fastify({
        // logger: true
    });

    // 注册 WebSocket 插件
    await fastify.register(fastifyWebsocket);

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
    await fastify.register(registerApi, { prefix: '/api' });

    try {
        await fastify.listen({ port: ConfigStore.instance.config.port })
        console.log(`Server is running on http://localhost:${ConfigStore.instance.config.port}`);
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
