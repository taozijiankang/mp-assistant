import CryptoJS from "crypto-js";

export function md5(str: string | number) {
  return CryptoJS.MD5(str.toString()).toString();
}
