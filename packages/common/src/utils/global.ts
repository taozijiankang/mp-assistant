/**
 * 防抖函数
 * @param fn - 需要防抖的函数
 * @param delay - 防抖时间
 * @returns 防抖后的函数
 */
export function debounce(fn: Function, delay: number) {
  let timer: NodeJS.Timeout | null = null;
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 等待指定时间
 * @param ms - 等待时间（毫秒）
 * @returns 一个 Promise，在指定时间后 resolve
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param fn - 需要重试的函数
 * @param delay - 重试间隔
 * @param count - 重试次数
 * @returns 重试后的函数
 */
export function retry(fn: () => void | Promise<void>, delay: number, count: number, errors: Error[] = []) {
  return new Promise((resolve, reject) => {
    if (count <= 0) {
      throw errors;
    }
    Promise.resolve(fn())
      .then(resolve)
      .catch((error) => {
        wait(delay).then(() => {
          retry(fn, delay, count - 1, [...errors, error]).then(resolve, reject);
        });
      });
  });
}
