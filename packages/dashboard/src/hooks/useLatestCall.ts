import { ref } from "vue";
import type { APISuccessRes } from "@mp-assistant/common/dist/api/type";

/**
 * 单飞 + 尾调合并的数据加载钩子。
 *
 * 既不是节流也不是防抖：无论触发多少次，同一时刻最多只有一个请求在途；
 * 在途期间的触发会合并为「当前请求结束后再调用一次」，
 * 保证最终拿到最新数据，而不是按时间丢弃中间的触发。
 */
export function useLatestCall<D>(fetchFn: () => Promise<APISuccessRes<D>>) {
    const data = ref<D | null>(null);
    const loading = ref(false);

    let inFlight = false;
    let pending = false;

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

        // 在途期间又有新触发，合并为一次追加调用
        if (pending) {
            pending = false;
            void execute();
        }
    };

    const run = () => {
        if (inFlight) {
            pending = true;
            return;
        }
        void execute();
    };

    return { data, loading, run };
}
