import { FastifyInstance } from "fastify";
import { WorkerStore } from "../../../store/WorkerStore.js";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { createWorker, isWXWorker } from "@mp-assistant/core/dist/worker/index.js";
import { ConfigStore } from "../../../store/ConfigStore.js";
import { createTask } from "@mp-assistant/core/dist/worker/wx/task/index.js";
import { getSuccessApiResponse, getErrorApiResponse } from "@mp-assistant/common/dist/api/utils.js";
import { WSStore } from "../../../store/WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/message.js";
import { WSMessageEvent } from "../../../event/WSMessageEvent.js";
import fs from 'fs';
import { WorkerStatus } from "@mp-assistant/common/dist/work/index.js";
import { TaskStatus } from "@mp-assistant/common/dist/work/task/const.js";

export const registerWorkerApi = (fastify: FastifyInstance) => {
    fastify.get(Api.Worker.GetWorkerList.url, async (request, reply): Promise<Api.Worker.GetWorkerList.Response> => {
        const workerInfos = WorkerStore.instance.workerList.map(item => {
            return item.info();
        });
        return getSuccessApiResponse(workerInfos);
    });

    fastify.get(Api.Worker.GetWorkerDetail.url, async (request, reply): Promise<Api.Worker.GetWorkerDetail.Response> => {
        const { key } = request.query as Api.Worker.GetWorkerDetail.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        return getSuccessApiResponse(worker.info());
    });

    fastify.post(Api.Worker.AddWorker.url, async (request, reply): Promise<Api.Worker.AddWorker.Response> => {
        const { type, name } = request.body as Api.Worker.AddWorker.RequestBody;

        const executablePath = ConfigStore.instance.config.executablePath;

        if (!executablePath) {
            return getErrorApiResponse('Executable path not set', 400);
        }

        if (fs.statSync(executablePath, { throwIfNoEntry: false })?.isFile() === false) {
            return getErrorApiResponse('Executable path not found', 400);
        }

        const worker = createWorker(type, {
            name,
            wsMessageEventHandler: WSMessageEvent.instance,
        });
        await worker.init({
            executablePath: ConfigStore.instance.config.executablePath,
            headless: ConfigStore.instance.config.headless,
        });

        // 如果是微信worker则自动触发登录
        if (isWXWorker(worker)) {
            worker.login();
        }

        WorkerStore.instance.addWorker(worker);

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());

        return getSuccessApiResponse(worker.info());
    });

    fastify.post(Api.Worker.PauseWorker.url, async (request, reply): Promise<Api.Worker.PauseWorker.Response> => {
        const { key } = request.query as Api.Worker.PauseWorker.RequestQuery;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        worker.pause();

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());
        return getSuccessApiResponse(undefined);
    })

    fastify.delete(Api.Worker.RemoveWorker.url, async (request, reply): Promise<Api.Worker.RemoveWorker.Response> => {
        const { key } = request.query as Api.Worker.RemoveWorker.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        // 如果任务正在运行则不能删除
        if (worker.taskList.some(item => item.status === TaskStatus.RUNNING)) {
            return getErrorApiResponse('Worker正在运行中，请先暂停，或者等任务执行完成后再删除', 400);
        }

        worker.destroy();

        WorkerStore.instance.removeWorker(worker);

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());

        return getSuccessApiResponse(undefined);
    });

    fastify.put(Api.Worker.UpdateWorker.url, async (request, reply): Promise<Api.Worker.UpdateWorker.Response> => {
        const { key } = request.query as Api.Worker.UpdateWorker.RequestQuery;
        const { name } = request.body as Api.Worker.UpdateWorker.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        worker.name = name || worker.name;

        WSStore.instance.broadcast(WSMessage.Worker.DetailChange.createMessage({ key }));

        return getSuccessApiResponse(worker.info());
    });

    fastify.post(Api.Worker.WorkerLogin.url, async (request, reply): Promise<Api.Worker.WorkerLogin.Response> => {
        const { key } = request.query as Api.Worker.WorkerLogin.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        if (isWXWorker(worker)) {
            worker.login();
            return getSuccessApiResponse(undefined);
        }
        else {
            return getErrorApiResponse('Worker type not supported', 400);
        }
    });

    fastify.post(Api.Worker.WorkerLogout.url, async (request, reply): Promise<Api.Worker.WorkerLogout.Response> => {
        const { key } = request.query as Api.Worker.WorkerLogout.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        if (isWXWorker(worker)) {
            worker.logout();
            return getSuccessApiResponse(undefined);
        }
        else {
            return getErrorApiResponse('Worker type not supported', 400);
        }
    });

    fastify.get(Api.Worker.WorkerUpdateWxaList.url, async (request, reply): Promise<Api.Worker.WorkerUpdateWxaList.Response> => {
        const { key } = request.query as Api.Worker.WorkerUpdateWxaList.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        if (isWXWorker(worker)) {
            worker.updateWxaList();
            return getSuccessApiResponse(undefined);
        }
        else {
            return getErrorApiResponse('Worker type not supported', 400);
        }
    });

    fastify.post(Api.Worker.AddTask.url, async (request, reply): Promise<Api.Worker.AddTask.Response> => {
        const { key } = request.query as Api.Worker.AddTask.RequestQuery;
        const { type, options } = request.body as Api.Worker.AddTask.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = createTask(type, options);
        if (!task) {
            return getErrorApiResponse('Task not found', 400);
        }
        worker.addTask(task);
        return getSuccessApiResponse(worker.info());
    });

    fastify.delete(Api.Worker.RemoveTask.url, async (request, reply): Promise<Api.Worker.RemoveTask.Response> => {
        const { key, taskKey } = request.query as Api.Worker.RemoveTask.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        await worker.removeTask(taskKey);
        return getSuccessApiResponse(worker.info());
    });

    fastify.get(Api.Worker.TaskDetail.url, async (request, reply): Promise<Api.Worker.TaskDetail.Response> => {
        const { key, taskKey } = request.query as Api.Worker.TaskDetail.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = worker.taskList.find(item => item.key === taskKey);
        if (!task) {
            return getErrorApiResponse('Task not found', 404);
        }
        return getSuccessApiResponse(task.info());
    });
}   