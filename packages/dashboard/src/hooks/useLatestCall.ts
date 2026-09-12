import { ref } from "vue";
import type { APISuccessRes } from "@mp-assistant/common/dist/api/type";

/**
 * 单飞 + 尾调合并的数据加载钩子。
 *
 * 既不是节流也不是防抖：无论触发多少次，同一时刻最多只有一个请求在途；
 * 在途期间的触发会合并为「当前请求结束后再调用一次」，
 * 保证最终拿到最新数据，而不是按时间丢弃中间的触发。
 *
 * @param interval 两次请求之间的最小间隔（毫秒）。尾调会在上一次请求结束后
 *                 等待该间隔再发起，用于降低高频刷新场景下的网络压力；默认 0 表示立即尾调。
 */
export function useLatestCall<D>(fetchFn: () => Promise<APISuccessRes<D>>, interval = 0) {
    const data = ref<D | null>(null);
    const loading = ref(false);

    let inFlight = false;
    let pending = false;
    let waiting = false;

    const execute = async () => {
        inFlight = true;
        loading.value = true;
        try {
            const res = await fetchFn();
            data.value = res.data;
        } catch {
            // 错误已由 request 内部统一提示，静默忽略避免未处理的 Promise 拒绝
        } finally {
            inFlight = false;
            loading.value = false;
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

    const run = () => {
        // 在途或等待间隔期间的新触发都合并到 pending，不额外起请求
        if (inFlight || waiting) {
            pending = true;
            return;
        }
        void execute();
    };

    return { data, loading, run };
}
