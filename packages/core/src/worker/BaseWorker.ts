import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { getChromeUserDataDir } from "../pathManage.js";
import path from "path";
import { wait } from "mp-assistant-common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";
import { TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { WorkerType } from "mp-assistant-common/dist/work/index.js";
import { BaseWorkInfo } from "mp-assistant-common/dist/work/type.js";

export abstract class BaseWorker {
  readonly type?: WorkerType;

  private readonly __key: string;

  private __name: string = '';

  private __browserContent: BrowserContext | null = null;

  private __taskList: BaseTask[] = [];

  private __completedTaskList: BaseTask[] = [];

  private __currentRunningTaskKey = '';

  get key() {
    return this.__key;
  }

  get name() {
    return this.__name;
  }

  set name(name: string) {
    this.__name = name;
  }

  get browserContent() {
    return this.__browserContent;
  }

  get taskList() {
    return [...this.__taskList];
  }

  get currentRunningTask() {
    return this.__taskList.find(task => task.key === this.__currentRunningTaskKey);
  }
  set currentRunningTaskKey(key: string) {
    this.__currentRunningTaskKey = this.__taskList.find(task => task.key === key)?.key ?? '';
  }

  get completedTaskList() {
    return [...this.__completedTaskList];
  }

  constructor(options?: {
    key?: string;
    name?: string;
  }) {
    const { key, name } = options ?? {};
    this.__key = key ?? getUUID();
    this.__name = name ?? '';
  }

  info(): BaseWorkInfo {
    return {
      key: this.key,
      name: this.name,
      type: this.type!,
      taskList: this.taskList.map(task => task.info()),
      currentRunningTaskKey: this.__currentRunningTaskKey,
      completedTaskList: this.completedTaskList.map(task => task.info()),
    }
  }

  async init(options: Pick<LaunchOptions, 'executablePath' | 'headless'>) {
    this.__browserContent = await chromium.launchPersistentContext(
      path.join(getChromeUserDataDir(), this.key),
      {
        ...options,
        viewport: null,
      });
    await this._init();
    // 开始任务循环
    this.__taskCycle();
  }

  addTask(task: BaseTask) {
    this.__taskList.push(task);
  }

  async removeTask(taskKey: string) {
    const task = this.__taskList.find(t => t.key === taskKey);
    if (task) {
      await task.destroy();
    }
    this.__taskList = this.__taskList.filter(t => t.key !== taskKey);
  }

  destroy() {
    this.__browserContent?.close();
  }

  private async __taskCycle() {
    try {
      await this._taskCycleExecutor();
    } catch (error) {
      console.error('任务执行失败', error);
    }
    finally {
      await wait(0);
      this.__taskCycle();
    }
  }

  protected _completeTask(task: BaseTask) {
    if (this.__taskList.some(item => item.key === task.key) && task.status === TaskStatus.COMPLETED) {
      this.__completedTaskList.push(task);
      this.__taskList = this.__taskList.filter(t => t.key !== task.key);
    }
  }

  protected async _init() {
    //
  }

  protected abstract _taskCycleExecutor(): Promise<void>;
}
