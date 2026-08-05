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

    fastify.post(Api.Worker.AddWXWorker.url, async (request, reply): Promise<Api.Worker.AddWXWorker.Response> => {
        const { name, syncTaskNum, weight } = request.body as Api.Worker.AddWXWorker.RequestBody;
        if (!name) {
            return getErrorApiResponse('名称不能为空', 400);
        }
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
        const { key, suspend } = request.body as Api.Worker.PauseAndRecoverWorker.RequestBody;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        worker.suspend(suspend);

        return getSuccessApiResponse(undefined, suspend ? '暂停Worker成功' : '恢复Worker成功');
    })

    fastify.delete(Api.Worker.RemoveWorker.url, async (request, reply): Promise<Api.Worker.RemoveWorker.Response> => {
        const { key } = request.body as Api.Worker.RemoveWorker.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        worker.destroy();
        WorkerStore.instance.removeWorker(worker);

        WSStore.instance.broadcast(WSMessage.Worker.ListChange.createMessage());

        return getSuccessApiResponse(undefined, '删除Worker成功');
    });

    fastify.put(Api.Worker.UpdateWorker.url, async (request, reply): Promise<Api.Worker.UpdateWorker.Response> => {
        const { key, name, weight } = request.body as Api.Worker.UpdateWorker.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }

        if (name !== undefined) worker.setName(name);
        if (weight !== undefined) worker.setWeight(weight);

        return getSuccessApiResponse(worker.info());
    });



    fastify.post(Api.Worker.AddTask.url, async (request, reply): Promise<Api.Worker.AddTask.Response> => {
        const { key, type, options } = request.body as Api.Worker.AddTask.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = createTask(type as WXTaskType, options);
        worker.addTask(task);
        return getSuccessApiResponse(task.getInfo());
    });

    fastify.delete(Api.Worker.RemoveTask.url, async (request, reply): Promise<Api.Worker.RemoveTask.Response> => {
        const { key, taskKey } = request.body as Api.Worker.RemoveTask.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = worker.getTask(taskKey);
        if (!task) {
            return getErrorApiResponse('Task not found', 404);
        }

        worker.removeTask(taskKey);

        return getSuccessApiResponse(task.getInfo(), '删除任务成功');
    });

    fastify.post(Api.Worker.AbortTask.url, async (request, reply): Promise<Api.Worker.AbortTask.Response> => {
        const { key, taskKey } = request.body as Api.Worker.AbortTask.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = worker.getTask(taskKey);
        if (!task) {
            return getErrorApiResponse('Task not found', 404);
        }

        task.abort();

        return getSuccessApiResponse(task.getInfo(), '终止任务成功');
    });

    fastify.post(Api.Worker.ResetTaskStatus.url, async (request, reply): Promise<Api.Worker.ResetTaskStatus.Response> => {
        const { key, taskKey } = request.body as Api.Worker.ResetTaskStatus.RequestBody;

        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getErrorApiResponse('Worker not found', 404);
        }
        const task = worker.getTask(taskKey);
        if (!task) {
            return getErrorApiResponse('Task not found', 404);
        }

        task.resetStatus();

        return getSuccessApiResponse(task.getInfo(), '重置任务状态成功');
    });
}   