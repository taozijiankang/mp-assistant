import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { getChromeUserDataDir } from "../pathManage.js";
import path from "path";
import { wait } from "mp-assistant-common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";

export abstract class BaseWorker {
  private key: string;
  private browserContent: BrowserContext | null = null;

  private taskList: BaseTask[] = [];

  protected onRunTask: BaseTask | null = null;

  constructor(options?: {
    key?: string;
  }) {
    const { key } = options ?? {};
    this.key = key ?? getUUID();

    this.taskCycle();
  }

  getKey() {
    return this.key;
  }

  getBrowserContent() {
    if (!this.browserContent) {
      throw new Error("Browser content not initialized");
    }
    return this.browserContent;
  }

  getTaskList() {
    return this.taskList;
  }

  getOnRunTask() {
    return this.onRunTask;
  }

  async init(options: Pick<LaunchOptions, 'executablePath' | 'headless'>) {
    this.browserContent = await chromium.launchPersistentContext(
      path.join(getChromeUserDataDir(), this.key),
      {
        ...options,
        viewport: null,
      });

    this.browserContent.on('close', () => {
      this._onClose();
    });

    await this._init();
  }

  addTask(...task: BaseTask[]): this {
    this.taskList.push(...task);
    return this;
  }

  private async taskCycle() {
    await this._taskCycle();
    await wait(100);
    this.taskCycle();
  }

  close() {
    this.browserContent?.close();
  }

  /**
   * 运行任务循环
   */
  protected async _taskCycle() { }

  protected async _onClose() { }

  protected async _init() { }
}
