import { TaskStatus, WorkerStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorkerInfo, BaseWorkerOptions, WorkerEvent } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { getUUID, waitTime } from "@mp-assistant/common/dist/utils/index.js";
import { BrowserContext, chromium, LaunchOptions } from "playwright";
import path from "node:path";
import { BaseTask } from "./BaseTask.js";
import { EventEmitter } from "@mp-assistant/common/dist/event/EventEmitter.js";
import getPort from "get-port";

export abstract class BaseWorker<
  Options extends BaseWorkerOptions = BaseWorkerOptions,
  Info extends BaseWorkerInfo = BaseWorkerInfo
> extends EventEmitter<WorkerEvent> {
  declare readonly type: WorkerType;

  readonly key: string;

  protected readonly options: Options;

  protected status: WorkerStatus;
  protected createdTime: string;

  private browserContent: BrowserContext | null = null;

  /** Chrome DevTools Protocol 远程调试端口 */
  protected debugPort?: number;

  private taskList: BaseTask[] = [];

  private destroyed = false;
  private processExiting = false;

  constructor({ options, key }: {
    options: Options;
    key?: string;
  }) {
    super();

    this.key = key || `worker-${getUUID()}`;
    this.options = options;
    this.status = WorkerStatus.INIT;
    this.createdTime = new Date().toISOString();

    // 监听进程退出信号，防止浏览器因进程退出而关闭时触发自动重启
    process.on('SIGINT', () => { this.processExiting = true; });
    process.on('SIGTERM', () => { this.processExiting = true; });
  }

  info(): Info {
    return {
      key: this.key,
      type: this.type,
      status: this.status,
      createdTime: this.createdTime,
      debugPort: this.debugPort,
      options: this.options as BaseWorkerOptions,
      taskList: this.taskList.map(t => t.getInfo()),
    } as Info;
  }

  getTask(taskKey: string): BaseTask | undefined {
    return this.taskList.find(t => t.getInfo().key === taskKey);
  }

  addTask(task: BaseTask): void {
    task.setWorker(this);
    this.taskList.push(task);
    this.changeDetail();
  }

  removeTask(taskKey: string): void {
    const task = this.taskList.find(t => t.getInfo().key === taskKey);
    if (task) {
      task.abort();
      task.setWorker(null);
    }
    this.taskList = this.taskList.filter(t => t.getInfo().key !== taskKey);
    this.changeDetail();
  }

  setName(name: string): void {
    this.options.name = name;
    this.changeDetail();
  }

  setWeight(weight: number): void {
    this.options.weight = weight;
    this.changeDetail();
  }

  changeDetail(): void {
    this.emit('detailChange', this.info() as Info);
  }

  destroy(): void {
    this.destroyed = true;
    this.taskList.forEach(t => {
      t.setWorker(null);
      t.abort();
    });
    if (this.browserContent) {
      this.browserContent.close();
      this.browserContent = null;
    }
  }

  /**
   * 暂停/恢复
   * @param v true: 暂停, false: 恢复
   */
  suspend(v: boolean = true) {
    if (v && this.status === WorkerStatus.RUNNING) {
      this.status = WorkerStatus.PAUSED;
      // 终止所有正在运行的任务并重置，恢复后可继续运行
      this.taskList.forEach(t => {
        if (t.getInfo().status === TaskStatus.RUNNING) {
          t.abort();
          t.resetStatus();
        }
      });
      this.changeDetail();
    } else if (!v && this.status === WorkerStatus.PAUSED) {
      this.status = WorkerStatus.RUNNING;
      this.changeDetail();
    }
  }

  async launch(options: Pick<LaunchOptions, 'headless'>, chromeUserDataDir: string) {
    if (this.status !== WorkerStatus.INIT) {
      throw new Error(`Worker ${this.key} is not in init status`);
    }
    this.status = WorkerStatus.RUNNING;

    await this.createBrowser(options, chromeUserDataDir);

    // 开始任务循环
    this.taskCycle();
  }

  /** 创建浏览器实例并监听关闭事件，意外关闭时自动重启 */
  private async createBrowser(options: Pick<LaunchOptions, 'headless'>, chromeUserDataDir: string) {
    const debugPort = await getPort({ port: 9222 });
    this.debugPort = debugPort;

    this.browserContent = await chromium.launchPersistentContext(
      path.join(chromeUserDataDir, this.key),
      {
        ...options,
        args: [
          `--remote-debugging-port=${debugPort}`,
        ],
        viewport: null,
      });

    this.browserContent.on('close', () => {
      if (this.destroyed || this.processExiting) return;
      console.warn(`[${this.key}] 浏览器意外关闭，自动重启中...`);
      this.browserContent = null;
      this.suspend(true);
      this.createBrowser(options, chromeUserDataDir).then(() => {
        this.suspend(false);
      });
    });
  }

  private async taskCycle() {
    if (this.destroyed) return;
    try {
      if (this.status === WorkerStatus.RUNNING) {
        const onRunningTaskNum = this.taskList.filter(task => task.getInfo().status === TaskStatus.RUNNING).length;
        const syncTaskNum = Math.max(0, this.options.syncTaskNum - onRunningTaskNum);
        const idleTask = this.taskList.filter(task => task.getInfo().status === TaskStatus.IDLE).slice(0, syncTaskNum);
        idleTask.forEach(task => {
          task.run(this.debugPort!);
        });
      }
    } catch (error) {
      console.error('[BaseWorker] taskCycle error', error);
    } finally {
      await waitTime(0);
      this.taskCycle();
    }
  }
}
