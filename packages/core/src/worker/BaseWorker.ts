import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import path from "path";
import { wait } from "@mp-assistant/common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";
import { TaskStatus } from "@mp-assistant/common/dist/work/task/index.js";
import { BaseWorkerOptions, BaseWorkInfo, WorkerStatus, WorkerType, WXWorkerN } from "@mp-assistant/common/dist/work/index.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/message.js"
import { getChromeUserDataDir } from "@mp-assistant/common/dist/pathManage.js";
import fs from "fs";

export abstract class BaseWorker {
  readonly type?: WorkerType;

  private readonly __key: string;

  private __name: string = '';

  private __browserContent: BrowserContext | null = null;

  private __taskList: BaseTask[] = [];

  private __status: WorkerStatus = WorkerStatus.RUNNING;

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

  set status(status: WorkerStatus) {
    if (this.__status === status) {
      return;
    }
    this.__status = status;
    this.emitDetailChangeEvent();
  }

  get status() {
    return this.__status;
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
      status: this.status,
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

    this.emitDetailChangeEvent();
  }

  /**
   * 删除任务
   * @param taskKey 
   */
  async removeTask(taskKey: string) {
    const task = this.__taskList.find(t => t.key === taskKey);
    if (!task) {
      return;
    }
    //如果任务在运行中则不能删除
    if (task.status === TaskStatus.RUNNING) {
      return;
    }
    await task.destroy();
    this.__taskList = this.__taskList.filter(t => t.key !== taskKey);

    this.emitDetailChangeEvent();
  }

  pause() {
    this.status = WorkerStatus.PAUSED;
  }

  async destroy() {
    if (this.isLoading(WXWorkerN.LoadingType.deleteUserDataDir)) {
      return;
    }

    this.setLoading(WXWorkerN.LoadingType.deleteUserDataDir);
    this.status = WorkerStatus.DELETED;

    try {
      await this.__browserContent?.close();
      const userDataDir = path.join(getChromeUserDataDir(), this.key);
      const stats = fs.statSync(userDataDir, { throwIfNoEntry: false })

      if (stats && stats.isDirectory()) {
        // 持久化目录下可能存在缓存文件，需强制递归删除避免 ENOTEMPTY
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch (error) {

      console.log('删除用户数据目录失败', error);
    } finally {
      this.offLoading(WXWorkerN.LoadingType.deleteUserDataDir);
    }
  }

  private async __taskCycle() {
    try {
      if (this.status === WorkerStatus.RUNNING) {
        await this._taskCycleExecutor();
      }
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
    const oldCurrentRunningTaskKey = this.currentRunningTask;
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

    // 当前执行任务发生改变
    if (this.currentRunningTask !== oldCurrentRunningTaskKey) {
      this.emitDetailChangeEvent();
    }
  }

  setLoading(type: string) {
    if (!this.isLoading(type)) {
      this.__loadings.push(type);
    }

    this.emitDetailChangeEvent();
  }

  offLoading(type: string) {
    this.__loadings = this.__loadings.filter(item => item !== type);

    this.emitDetailChangeEvent();
  }

  isLoading(type: string) {
    return this.__loadings.includes(type);
  }

  emitMessage<K extends keyof WSMessage.EventMap>(type: K, data: WSMessage.EventMap[K]) {
    this.__wsMessageEventHandler.emit(type, data);
  }

  private __emitDetailChangeEventTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * 触发详情改变事件
   * 会有一层节流
   */
  emitDetailChangeEvent() {
    this.__emitDetailChangeEventTimer && clearTimeout(this.__emitDetailChangeEventTimer);
    this.__emitDetailChangeEventTimer = setTimeout(() => {
      this.emitMessage(WSMessage.Worker.DetailChange.type, {
        key: this.key,
      });
    }, 0);
  }

  protected abstract _taskCycleExecutor(): Promise<void>;
}
