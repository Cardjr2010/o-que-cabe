import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function resolveProjectPath(...segments) {
  return path.join(projectRoot, ...segments);
}
