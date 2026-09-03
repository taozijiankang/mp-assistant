import { defineStore } from "pinia";
import { requestGetWorkerList } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

/**
 * 全局 worker 列表 store，监听内容变更事件自动刷新
 */
export const useWorkerStore = defineStore("worker", () => {
  const { call: fetchList, loading, data: workerList } = useApiCall(requestGetWorkerList);

  const init = () => {
    fetchList();
    WSConnection.instance.on(WSMessage.ContentChanged.type, fetchList);
    WSConnection.instance.on(WSMessageEvent.connect, fetchList);
  };

  return { workerList, loading, fetchList, init };
});
