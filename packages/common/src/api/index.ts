import { ConfigApi } from './modules/config.js';
import { WorkerApi } from './modules/worker.js';
import { CommonApi } from "./modules/common.js"

export const ApiPrefix = '/api';

export const FilesPrefix = '/files'

export namespace Api {
    export import Common = CommonApi;
    export import Config = ConfigApi;
    export import Worker = WorkerApi;
}
