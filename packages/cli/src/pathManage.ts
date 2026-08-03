import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRootDir() {
  return path.join(__dirname, "..");
}

export function getChromeUserDataDir() {
  const dir = path.join(os.homedir(), 'mp-assistant', '.chrome_user_data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getStoreDir() {
  const dir = path.join(os.homedir(), 'mp-assistant', '.store');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getFilesDir() {
  const dir = path.join(os.homedir(), 'mp-assistant', '.files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}