import { computed, onMounted, onUnmounted, ref } from "vue";
import { TaskStatus } from "@mp-assistant/common/dist/work/const.js";
import type { BaseTaskSummary } from "@mp-assistant/common/dist/work/BaseTask.js";

/**
 * 定时任务下次重跑的剩余倒计时（秒）
 * 仅当任务已完成/失败、且开启了定时并带有间隔时返回数值，否则返回 null
 */
export function useScheduleCountdown(getTask: () => BaseTaskSummary | null | undefined) {
  const now = ref(Date.now());
  let timer: number | undefined;

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = Date.now();
    }, 1000);
  });
  onUnmounted(() => {
    if (timer != null) window.clearInterval(timer);
  });

  return computed<number | null>(() => {
    const task = getTask();
    if (!task) return null;
    if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.FAILED) return null;
    const { scheduled, interval } = task.options;
    if (!scheduled || interval == null || task.completedTime == null) return null;
    return Math.max(0, interval - Math.floor((now.value - task.completedTime) / 1000));
  });
}
