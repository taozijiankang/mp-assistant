import path from "path";

/**
 * 规范化路径字符串
 * @param pathStr - 路径字符串
 * @returns 规范化后的路径字符串
 */
export function pathNormalize(pathStr: string) {
    return pathStr.replaceAll(path.sep, '/');
}