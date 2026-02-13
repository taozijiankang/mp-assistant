import { useLocalStore } from "../hooks/useLocalStore.js";
import { getStoreDir } from "../pathManage.js";
import { Config } from "mp-assistant-common/dist/types/config.js";

const DEFAULT_CONFIG: Config = {
    executablePath: '',
    headless: true,
    port: 3001,
}

const { get: getConfigLocalStore, set: setConfigLocalStore } = useLocalStore<Config>('config', DEFAULT_CONFIG, {
    storeDir: getStoreDir(),
});

export class ConfigStore {
    private static _instance: ConfigStore | null = null;
    public static get instance() {
        return this._instance ?? (this._instance = new ConfigStore());
    }

    private __config: Config = {
        ...DEFAULT_CONFIG,
    }

    get config() {
        return this.__config;
    }

    constructor() {
        this.__config = getConfigLocalStore();
    }

    setConfig(config: Partial<Config>) {
        this.__config = {
            ...this.__config,
            ...config,
        };
        setConfigLocalStore(this.__config);
    }
}