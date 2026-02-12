import { useLocalStore } from "../hooks/useLocalStore.js";
import { getStoreDir } from "../pathManage.js";

export interface Config {
    executablePath: string;
    headless: boolean;
}

const { get: getConfigLocalStore, set: setConfigLocalStore } = useLocalStore<Config>('config', {
    executablePath: '',
    headless: true,
}, {
    storeDir: getStoreDir(),
});

export class ConfigStore {
    private static _instance: ConfigStore | null = null;
    public static get instance() {
        return this._instance ?? (this._instance = new ConfigStore());
    }

    private __config: Config = {
        executablePath: '',
        headless: true,
    }

    get config() {
        return this.__config;
    }

    constructor() {
        this.__config = getConfigLocalStore();
    }

    setConfig(config: Config) {
        this.__config = config;
        setConfigLocalStore(config);
    }
}