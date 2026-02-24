import { ConfigApi } from './modules/config.js';
import { WorkerApi } from './modules/worker.js';

export const ApiPrefix = '/api';

export namespace Api {
    export import Config = ConfigApi;
    export import Worker = WorkerApi;
}
