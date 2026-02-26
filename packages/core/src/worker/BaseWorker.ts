import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { getChromeUserDataDir } from "../pathManage.js";
import path, { extname } from "path";
import { wait } from "mp-assistant-common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";
import { TaskStatus } from "mp-assistant-common/dist/work/task/index.js";
import { BaseWorkerOptions, BaseWorkInfo, WorkerType } from "mp-assistant-common/dist/work/index.js";
import { WSMessage } from "mp-assistant-common/dist/ws/message.js"

export abstract class BaseWorker {
  readonly type?: WorkerType;

  private readonly __key: string;

  private __name: string = '';

  private __browserContent: BrowserContext | null = null;

  private __taskList: BaseTask[] = [];

  private __currentRunningTaskKey = '';

  private __wsMessageEventHandler: WSMessage.Event;

  /** 等待列表 */
  private __loadings: string[] = [];

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
  get currentRunningTaskKey() {
    return this.__currentRunningTaskKey;
  }
  set currentRunningTaskKey(key: string) {
    this.__currentRunningTaskKey = this.__taskList.find(task => task.key === key)?.key ?? '';
  }

  constructor(options: BaseWorkerOptions) {
    const { key, name, wsMessageEventHandler } = options;
    this.__key = key ?? getUUID();
    this.__name = name ?? '';

    this.__wsMessageEventHandler = wsMessageEventHandler;
  }

  info(): BaseWorkInfo {
    return {
      key: this.key,
      name: this.name,
      type: this.type!,
      taskList: this.taskList.map(task => task.info()),
      loadings: [...this.__loadings],
    }
  }

  async init(options: Pick<LaunchOptions, 'executablePath' | 'headless'>) {
    this.__browserContent = await chromium.launchPersistentContext(
      path.join(getChromeUserDataDir(), this.key),
      {
        ...options,
        viewport: null,
      });
    // 开始任务循环
    this.__taskCycle();
  }

  /**
   * 添加任务
   * @param task 
   */
  addTask(task: BaseTask) {
    task.worker = this;
    this.__taskList.push(task);
  }

  /**
   * 删除任务
   * @param taskKey 
   */
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

  protected async _feedTasks() {
    const currentRunningTaskIndex = this.taskList.findIndex(item => item.key === this.currentRunningTaskKey);
    this.currentRunningTaskKey =
      // 可循环
      [...this.taskList, ...this.taskList].find((item, index) => {
        if (
          // 不是当前任务
          item.key != this.currentRunningTaskKey &&
          // 序号大于当前任务
          index > currentRunningTaskIndex &&
          // 可执行
          [TaskStatus.NOT_STARTED].includes(item.status)
        ) {
          return true;
        }
        return false;
      })?.key || '';
  }

  setLoading(type: string) {
    if (!this.isLoading(type)) {
      this.__loadings.push(type);
    }

    this.emitMessage(WSMessage.Worker.DetailChange.type, {
      key: this.key,
    });
  }

  offLoading(type: string) {
    this.__loadings = this.__loadings.filter(item => item !== type);

    this.emitMessage(WSMessage.Worker.DetailChange.type, {
      key: this.key,
    });
  }

  isLoading(type: string) {
    return this.__loadings.includes(type);
  }

  emitMessage<K extends keyof WSMessage.EventMap>(type: K, data: WSMessage.EventMap[K]) {
    this.__wsMessageEventHandler.emit(type, data);
  }

  protected abstract _taskCycleExecutor(): Promise<void>;
}
