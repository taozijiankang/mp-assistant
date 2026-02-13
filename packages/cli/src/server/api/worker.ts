import { FastifyInstance } from "fastify";
import { WorkerStore } from "../../store/WorkerStore.js";
import { Api, getApiResponse } from "mp-assistant-common/dist/api/index.js";
import { createWorker } from "mp-assistant-core/dist/worker/index.js";
import { ConfigStore } from "../../store/ConfigStore.js";
import { createTask } from "mp-assistant-core/dist/worker/wx/task/index.js";

export const registerWorkerApi = (fastify: FastifyInstance) => {
    /**
     * 获取所有worker的info
     */
    fastify.get(Api.Worker.GetWorkerInfos.url, async (request, reply): Promise<Api.Worker.GetWorkerInfos.Response> => {
        const workerInfos = WorkerStore.instance.workerList.map(item => {
            return item.info();
        });
        return getApiResponse({
            data: workerInfos,
        });
    });


    /**
     * 获取指定worker的info
     */
    fastify.get(Api.Worker.GetWorkerInfo.url, async (request, reply): Promise<Api.Worker.GetWorkerInfo.Response> => {
        const { key } = request.params as Api.Worker.GetWorkerInfo.RequestParams;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        return getApiResponse({
            data: worker.info(),
        });
    });

    /**
     * 添加worker
     */
    fastify.post(Api.Worker.AddWorker.url, async (request, reply): Promise<Api.Worker.AddWorker.Response> => {
        const { type } = request.body as Api.Worker.AddWorker.RequestBody;
        const worker = createWorker(type);
        await worker.init({
            executablePath: ConfigStore.instance.config.executablePath,
            headless: ConfigStore.instance.config.headless,
        });
        WorkerStore.instance.addWorker(worker);
        return getApiResponse({
            data: worker.info(),
        });
    });

    /**
     * 删除worker
     */
    fastify.delete(Api.Worker.RemoveWorker.url, async (request, reply): Promise<Api.Worker.RemoveWorker.Response> => {
        const { key } = request.params as Api.Worker.RemoveWorker.RequestParams;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        await worker.destroy();
        WorkerStore.instance.removeWorker(worker);
        return getApiResponse();
    });

    /**
     * 修改worker
     */
    fastify.put(Api.Worker.UpdateWorker.url, async (request, reply): Promise<Api.Worker.UpdateWorker.Response> => {
        const { key } = request.params as Api.Worker.UpdateWorker.RequestParams;
        const { name } = request.body as Api.Worker.UpdateWorker.RequestBody;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        worker.name = name;
        return getApiResponse({
            data: worker.info(),
        });
    });

    /**
     * 添加任务
     */
    fastify.post(Api.Worker.AddTask.url, async (request, reply): Promise<Api.Worker.AddTask.Response> => {
        const { key } = request.params as Api.Worker.AddTask.RequestParams;
        const { type, params } = request.body as Api.Worker.AddTask.RequestBody;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        const task = createTask(type, params);
        if (!task) {
            return getApiResponse({
                code: 400,
                message: 'Task not found',
            });
        }
        worker.addTask(task);
        return getApiResponse({
            data: worker.info(),
        });
    });

    /**
     * 删除任务
     */
    fastify.delete(Api.Worker.RemoveTask.url, async (request, reply): Promise<Api.Worker.RemoveTask.Response> => {
        const { key, taskKey } = request.params as Api.Worker.RemoveTask.RequestParams;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        await worker.removeTask(taskKey);
        return getApiResponse({
            data: worker.info(),
        });
    });

    /**
     * 获取任务信息
     */
    fastify.get(Api.Worker.TaskInfo.url, async (request, reply): Promise<Api.Worker.TaskInfo.Response> => {
        const { key, taskKey } = request.params as Api.Worker.TaskInfo.RequestParams;
        const worker = WorkerStore.instance.workerList.find(item => item.key === key);
        if (!worker) {
            return getApiResponse({
                code: 404,
                message: 'Worker not found',
            });
        }
        const task = worker.taskList.find(item => item.key === taskKey);
        if (!task) {
            return getApiResponse({
                code: 404,
                message: 'Task not found',
            });
        }
        return getApiResponse({
            data: task.info(),
        });
    });
}   