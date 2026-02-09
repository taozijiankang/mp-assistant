import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getProjectRootDir() {
  return path.join(__dirname, "../../../");
}

export function getPackagesDir() {
  return path.join(getProjectRootDir(), "packages");
}

export function getDashboardDir() {
  return path.join(getPackagesDir(), "dashboard");
}

export function getServerDir() {
  return path.join(getPackagesDir(), "server");
}
