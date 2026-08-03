import { FastifyInstance } from "fastify";
import { WorkerStore } from "../../../store/WorkerStore.js";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { getSuccessApiResponse, getErrorApiResponse } from "@mp-assistant/common/dist/api/utils.js";
import { WSStore } from "../../../store/WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/message.js";
import { WorkerType, WXTaskType } from "@mp-assistant/common/dist/work/index.js";
import { createTask, createWorker } from "@mp-assistant/core/dist/worker/index.js";
import { ConfigStore } from "../../../store/ConfigStore.js";
import { getChromeUserDataDir } from "../../../pathManage.js";

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

    fastify.post(Api.Worker.AddWXWorker.url, async (request, reply): Promise<Api.Worker.AddWXWorker.Response> => {
        const { name, syncTaskNum, weight } = request.body as Api.Worker.AddWXWorker.RequestBody;
        const worker = createWorker(WorkerType.WX, {
            name,
            syncTaskNum,
            weight,
        });
        worker.launch({
            headless: ConfigStore.instance.config.headless,
        }, getChromeUserDataDir());

        WorkerStore.instance.addWorker(worker);

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());

        return getSuccessApiResponse(worker.info());
    });

    fastify.post(Api.Worker.PauseAndRecoverWorker.url, async (request, reply): Promise<Api.Worker.PauseAndRecoverWorker.Response> => {
        const { key, suspend } = request.query as Api.Worker.PauseAndRecoverWorker.RequestQuery;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        worker.suspend(suspend);

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());

        return getSuccessApiResponse(undefined, suspend ? '暂停Worker成功' : '恢复Worker成功');
    })

    fastify.delete(Api.Worker.RemoveWorker.url, async (request, reply): Promise<Api.Worker.RemoveWorker.Response> => {
        const { key } = request.query as Api.Worker.RemoveWorker.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        return getSuccessApiResponse(undefined);
    });

    fastify.put(Api.Worker.UpdateWorker.url, async (request, reply): Promise<Api.Worker.UpdateWorker.Response> => {
        const { key } = request.query as Api.Worker.UpdateWorker.RequestQuery;
        const { name, weight } = request.body as Api.Worker.UpdateWorker.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        return getSuccessApiResponse(worker.info());
    });

    fastify.post(Api.Worker.MarkWXAppId.url, async (request, reply): Promise<Api.Worker.MarkWXAppId.Response> => {
        const { key } = request.query as Api.Worker.MarkWXAppId.RequestQuery;
        const { appId, mark } = request.body as Api.Worker.MarkWXAppId.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);

        return getErrorApiResponse('Worker type not supported', 400);
    });

    fastify.post(Api.Worker.ClearAllMarkWXAppIds.url, async (request, reply): Promise<Api.Worker.ClearAllMarkWXAppIds.Response> => {
        const { key } = request.query as Api.Worker.ClearAllMarkWXAppIds.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        return getErrorApiResponse('Worker not found', 404);
    });


    fastify.post(Api.Worker.AddTask.url, async (request, reply): Promise<Api.Worker.AddTask.Response> => {
        const { key } = request.query as Api.Worker.AddTask.RequestQuery;
        const { type, options } = request.body as Api.Worker.AddTask.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = createTask(type as WXTaskType, options);
        worker.addTask(task);
        return getSuccessApiResponse(task.getInfo());
    });

    fastify.delete(Api.Worker.RemoveTask.url, async (request, reply): Promise<Api.Worker.RemoveTask.Response> => {
        const { key, taskKey } = request.query as Api.Worker.RemoveTask.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        return getErrorApiResponse('Worker not found', 404);
    });

    fastify.get(Api.Worker.TaskDetail.url, async (request, reply): Promise<Api.Worker.TaskDetail.Response> => {
        const { key, taskKey } = request.query as Api.Worker.TaskDetail.RequestQuery;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = worker.getTask(taskKey);
        if (!task) {
            return getErrorApiResponse('Task not found', 404);
        }
        return getSuccessApiResponse(task.getInfo());
    });
}   