import { Browser, BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";

export class BaseWorker {
  key: string;
  private browserContent_: BrowserContext | null = null;

  constructor() {
    this.key = getUUID();
  }

  get browserContent() {
    if (!this.browserContent_) {
      throw new Error("Browser content not initialized");
    }
    return this.browserContent_!;
  }

  async init(browser: Browser) {
    this.browserContent_ = await browser.newContext({
      viewport: null,
    });

    this.browserContent_.on('close', () => {
      this._onClose();
    });

    await this._init();
  }

  close() {
    this.browserContent_?.close();
  }

  protected async _onClose() { }

  protected async _init() { }
}
