/**
 * 节流：首次立即执行，wait 窗口内最多再补一次尾调，合并高频触发。
 */
export function throttle(fn: () => void, wait: number): () => void {
  let last = 0;
  let timer: NodeJS.Timeout | null = null;

  return () => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn();
      }, remaining);
    }
  };
}

/** 按 key 隔离的节流器，不同 key 的触发互不影响 */
export class KeyedThrottle {
  private map = new Map<string, () => void>();

  trigger(key: string, fn: () => void, wait: number): void {
    let throttled = this.map.get(key);
    if (!throttled) {
      throttled = throttle(fn, wait);
      this.map.set(key, throttled);
    }
    throttled();
  }

  clear(key: string): void {
    this.map.delete(key);
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key);
      }
    }
  }
}
