import type { APISuccessRes } from "@mp-assistant/common/dist/api/type";
import { ref } from "vue";

/**
 * 使用api请求的钩子
 */
export const useApiCall = <D, P extends any[]>(
  request: (...args: P) => Promise<APISuccessRes<D>>,
  {
    onCallAfter
  }: {
    onCallAfter?: () => void | Promise<void>;
  } = {}
) => {
  const loading = ref(false);
  const data = ref<D | null>(null);

  const call = async (...params: P): Promise<APISuccessRes<D>> => {
    loading.value = true;
    try {
      const res = await request(...params);
      data.value = res.data;
      await onCallAfter?.();
      return res;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return { call, loading, data };
};
