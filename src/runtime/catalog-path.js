import fs from "node:fs";
import { resolveProjectPath } from "./project-root.js";

const CANDIDATES = [
  resolveProjectPath("src", "data", "products.seed.js"),
  resolveProjectPath("src", "data", "products.seed.json"),
  resolveProjectPath("data", "products.seed.json"),
  resolveProjectPath("public", "data", "products.seed.json"),
];

export function resolveCatalogSeedPath(preferredPath = "") {
  const preferred = String(preferredPath || "").trim();
  if (preferred && fs.existsSync(preferred)) return preferred;
  for (const candidate of CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return preferred || CANDIDATES[0];
}

export function getCatalogSeedCandidates() {
  return [...CANDIDATES];
}
