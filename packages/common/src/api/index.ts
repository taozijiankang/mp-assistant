import { ConfigApi } from './modules/config.js';
import { WorkerApi } from './modules/worker.js';
import { CommonApi } from "./modules/common.js"
import { TagApi } from './modules/tag.js';
import { ReviewTemplateApi } from './modules/reviewTemplate.js';

export const ApiPrefix = '/api';

export namespace Api {
    export import Common = CommonApi;
    export import Config = ConfigApi;
    export import Worker = WorkerApi;
    export import Tag = TagApi;
    export import ReviewTemplate = ReviewTemplateApi;
}
