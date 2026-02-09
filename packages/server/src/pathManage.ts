import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRootDir() {
  return path.join(__dirname, "..");
}

export function getChromeUserDataDir() {
  const dir = path.join(getRootDir(), './node_modules/.chrome_user_data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
} 