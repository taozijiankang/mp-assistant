import { defineStore } from "pinia";
import { ref } from "vue";

export const useOperationRecordStore = defineStore(
  "operation-record",
  () => {
    const currentWorkerKey = ref('');

    const setCurrentWorkerKey = (key: string) => {
      currentWorkerKey.value = key;
    }

    return {
      currentWorkerKey,
      setCurrentWorkerKey,
    }
  },
  {
    persist: true
  }
);
