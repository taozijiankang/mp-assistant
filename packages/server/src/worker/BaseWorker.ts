import { BrowserContext, chromium, LaunchOptions } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { getChromeUserDataDir } from "../pathManage.js";
import path from "path";
import { wait } from "mp-assistant-common/dist/utils/global.js";
import { BaseTask } from "./BaseTask.js";
import { TaskExecResultType } from "mp-assistant-common/dist/constant/enum.js";

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
    await this.taskCycleRun();
    await wait(100);
    this.taskCycle();
  }
  private async taskCycleRun() {
    // 默认运行第一个工作
    if (!this.getCurrentJob()) {
      this.setCurrentJobKey(this.jobList[0]?.key ?? '');
    }
    const currentJob = this.getCurrentJob();
    if (!currentJob) {
      return;
    }
    // 默认运行第一个任务
    if (!this.getCurrentTask()) {
      this.setCurrentTaskKey(currentJob.taskList[0]?.key ?? '');
    }
    const currentTask = this.getCurrentTask();
    if (!currentTask) {
      return;
    }
    // 执行任务
    const currentTaskExecResult = await currentTask.exec(this.getBrowserContent());
    // 如果运行失败则重新执行整个job的任务
    if (currentTaskExecResult === TaskExecResultType.FAILED) {
      this.setCurrentTaskKey(currentJob.taskList[0]?.key ?? '');
      //
      return;
    }
    // 如果任务成功或者等待后续则跳到下一个任务或者下一个job
    if (currentTaskExecResult === TaskExecResultType.COMPLETED || currentTaskExecResult === TaskExecResultType.WAITING_NEXT) {
      const nextTaskIndex = currentJob.taskList.findIndex(task => task.key === currentTask.key) + 1;
      if (nextTaskIndex < currentJob.taskList.length) {
        this.setCurrentTaskKey(currentJob.taskList[nextTaskIndex]?.key ?? '');
      }
      // 当前job的任务全部完成 则跳到下一个job
      else {
        const currentJobIndex = this.jobList.findIndex(job => job.key === currentJob.key) + 1;
        if (currentJobIndex < this.jobList.length) {
          this.setCurrentJobKey(this.jobList[currentJobIndex]?.key ?? '');
        } else {
          // 回到第一个job 循环执行 直到任务全部完成
          this.setCurrentJobKey('');
        }
        //
        this.succeedJobList.push(currentJob);
        this.jobList = this.jobList.filter(job => job.key !== currentJob.key);
      }
    }
  }

  close() {
    this.browserContent?.close();
  }

  protected async _onClose() { }

  protected async _init() { }
}
