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
 * 等待指定时间(单位: 毫秒)
 * @param ms - 等待时间（毫秒）
 * @returns 一个 Promise，在指定时间后 resolve
 */
export function waitTime(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
