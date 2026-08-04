import { TaskStatus, WorkerStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorkerInfo, BaseWorkerOptions, WorkerEvent } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { BrowserContext, chromium, LaunchOptions } from "playwright";
import path from "node:path";
import { wait } from "@mp-assistant/common/dist/utils/global.js";
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

  constructor({ options, key }: {
    options: Options;
    key?: string;
  }) {
    super();
    
    this.key = key || `worker-${getUUID()}`;
    this.options = options;
    this.status = WorkerStatus.INIT;
    this.createdTime = new Date().toISOString();
  }

  info(): Info {
    return {
      key: this.key,
      type: this.type,
      status: this.status,
      createdTime: this.createdTime,
      options: this.options as BaseWorkerOptions,
      taskList: this.taskList.map(t => t.getInfo()),
    } as Info;
  }

  getTask(taskKey: string): BaseTask | undefined {
    return this.taskList.find(t => t.getKey() === taskKey);
  }

  addTask(task: BaseTask): void {
    task.on('detailChange', () => {
      this.changeDetail();
    });
    this.taskList.push(task);
    this.changeDetail();
  }

  removeTask(taskKey: string): void {
    const task = this.taskList.find(t => t.getKey() === taskKey);
    if (task) {
      task.off('detailChange');
    }
    this.taskList = this.taskList.filter(t => t.getKey() !== taskKey);
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

  protected changeDetail(): void {
    this.emit('detailChange', this.info() as Info);
  }

  destroy(): void {
    this.destroyed = true;
    this.taskList.forEach(t => {
      t.off('detailChange');
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
    } else if (!v && this.status === WorkerStatus.PAUSED) {
      this.status = WorkerStatus.RUNNING;
    }
  }

  async launch(options: Pick<LaunchOptions, 'headless'>, chromeUserDataDir: string) {
    if (this.status !== WorkerStatus.INIT) {
      throw new Error(`Worker ${this.key} is not in init status`);
    }
    this.status = WorkerStatus.RUNNING;

    // 获取可用端口作为 Chrome DevTools Protocol 远程调试端口
    const debugPort = await getPort({ port: 9222 });
    this.debugPort = debugPort;

    // 启动浏览器
    this.browserContent = await chromium.launchPersistentContext(
      path.join(chromeUserDataDir, this.key),
      {
        ...options,
        args: [
          `--remote-debugging-port=${debugPort}`,
        ],
        viewport: null,
      });

    // 开始任务循环
    this.taskCycle();
  }

  private async taskCycle() {
    if (this.destroyed) return;
    try {
      if (this.status === WorkerStatus.RUNNING) {
        const onRunningTaskNum = this.taskList.filter(task => task.getStatus() === TaskStatus.RUNNING).length;
        const syncTaskNum = Math.max(0, this.options.syncTaskNum - onRunningTaskNum);
        const idleTask = this.taskList.filter(task => task.getStatus() === TaskStatus.IDLE).slice(0, syncTaskNum);
        idleTask.forEach(task => {
          task.run(this.debugPort!);
        });
      }
    } catch (error) {
      console.error('[BaseWorker] taskCycle error', error);
    } finally {
      await wait(0);
      this.taskCycle();
    }
  }
}
