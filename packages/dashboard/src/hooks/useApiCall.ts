import type { APISuccessRes } from "mp-assistant-common/dist/api/type";
import { ref } from "vue";

/**
 * 使用api请求的钩子
 */
export const useApiCall = <R extends (...params: any[]) => Promise<APISuccessRes<any>>>(
  request: R,
  {
    onCallAfter
  }: {
    onCallAfter?: () => void | Promise<void>;
  } = {}
) => {
  type P = R extends (...params: infer P) => any ? P : never;
  type D = R extends (...params: any) => Promise<APISuccessRes<infer D>> ? D : never;

  const loading = ref(false);
  const data = ref<D | null>(null);

  const call = async (...params: P) => {
    try {
      loading.value = true;
      const res = await request(...params);
      data.value = res.data;
      await onCallAfter?.();
      return res as APISuccessRes<D>;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return { call, loading, data };
};
