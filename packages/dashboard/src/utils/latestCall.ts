/**
 * 单飞 + 尾调合并：同一时刻最多一个请求在途，在途期间的触发合并为
 * 「当前请求结束后再补一次」，保证最终拿到最新数据（既非节流也非防抖）。
 * 用于包装 WS 通知触发的高频刷新。
 *
 * @param fn 需要合并的异步函数（如 useApiCall 返回的 call）
 * @param interval 尾调与上次请求之间的最小间隔（毫秒），默认 0 表示立即尾调
 */
export function latestCall(fn: () => Promise<unknown>, interval = 0): () => Promise<void> {
  let inFlight = false;
  let pending = false;
  let waiting = false;

  const execute = async (): Promise<void> => {
    inFlight = true;
    try {
      await fn();
    } catch {
      // 错误已由 request 内部统一提示，静默忽略避免未处理的 Promise 拒绝
    } finally {
      inFlight = false;
    }

    // 在途期间又有新触发，合并为一次追加调用；间隔 interval 后再执行，避免紧贴上一次
    if (pending) {
      pending = false;
      if (interval > 0) {
        waiting = true;
        setTimeout(() => {
          waiting = false;
          void execute();
        }, interval);
      } else {
        void execute();
      }
    }
  };

  return (): Promise<void> => {
    // 在途或等待间隔期间的新触发都合并到 pending，不额外起请求
    if (inFlight || waiting) {
      pending = true;
      return Promise.resolve();
    }
    return execute();
  };
}
