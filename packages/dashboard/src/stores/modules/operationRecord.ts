import { defineStore } from "pinia";
import { ref } from "vue";

export const useOperationRecordStore = defineStore(
  "operation-record",
  () => {
    const currentWorkerKey = ref('');

    const setCurrentWorkerKey = (key: string) => {
      currentWorkerKey.value = key;
    }

    const onSelectedTaskKey = ref('');

    const setOnSelectedTaskKey = (key: string) => {
      onSelectedTaskKey.value = key;
    }

    return {
      currentWorkerKey,
      setCurrentWorkerKey,
      onSelectedTaskKey,
      setOnSelectedTaskKey,
    }
  },
  {
    persist: true
  }
);
