import { v4 as uuidv4 } from "uuid";

export * from "./global.js";
export * from "./wx/index.js";
export * from "./node.js";
export * from './md5.js';

export function getUUID() {
    return uuidv4();
}