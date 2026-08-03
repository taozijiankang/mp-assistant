import { BrowserContext } from "playwright";

export abstract class BaseExecutor<Options = any> {
    protected options: Options;
    protected browserContext: BrowserContext;

    constructor(options: Options, browserContext: BrowserContext) {
        this.options = options;
        this.browserContext = browserContext;
    }

    abstract execute(): Promise<void>;
}
