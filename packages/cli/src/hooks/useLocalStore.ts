import path from "path";
import fs from "fs";

export function useLocalStore<T>(name: string, defaultValue: T, options: {
    storeDir?: string;
}) {
    const { storeDir = './' } = options;
    const localStorePath = path.join(storeDir, `${name}.json`);

    const get = () => {
        try {
            const localStore = JSON.parse(fs.readFileSync(localStorePath, 'utf-8'));
            return localStore as T;
        } catch (error) {
            set(defaultValue);
            return defaultValue;
        }
    }

    const set = (value: T) => {
        fs.writeFileSync(localStorePath, JSON.stringify(value, null, 2));
    }

    return {
        get,
        set,
    }
}