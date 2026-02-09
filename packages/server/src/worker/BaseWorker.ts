import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { getChromeUserDataDir } from "../pathManage.js";
import path from "path";
import { wait } from "mp-assistant-common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";

export interface WorkerJob {
  title: string;
  taskList: BaseTask[];
  key: string;
}

export abstract class BaseWorker {
  private readonly key: string;

  private browserContent: BrowserContext | null = null;

  protected jobList: WorkerJob[] = [];

  protected succeedJobList: WorkerJob[] = [];

  private currentJobInfoKey: {
    jobKey: string,
    taskKey: string,
  } = {
      jobKey: '',
      taskKey: '',
    };

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

  getJobList() {
    return this.jobList;
  }

  getSucceedJobList() {
    return this.succeedJobList;
  }

  getCurrentJob() {
    return this.jobList.find(job => job.key === this.currentJobInfoKey.jobKey);
  }

  getCurrentTask() {
    const currentJob = this.getCurrentJob();
    return currentJob?.taskList.find(task => task.key === this.currentJobInfoKey.taskKey);
  }

  protected setCurrentJobKey(key: string) {
    const job = this.jobList.find(job => job.key === key);
    if (job) {
      this.currentJobInfoKey.jobKey = job.key;
    }
  }

  protected setCurrentTaskKey(key: string) {
    const currentJob = this.getCurrentJob();
    if (currentJob) {
      const task = currentJob.taskList.find(task => task.key === key);
      if (task) {
        this.currentJobInfoKey.taskKey = task.key;
      }
    }
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

  addJob(options: Omit<WorkerJob, 'key'>): this {
    this.jobList.push({
      ...options,
      key: getUUID(),
    });
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
