import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "./project-root.js";

const CANDIDATES = [
  resolveProjectPath("src", "data", "products.seed.json"),
  resolveProjectPath("data", "products.seed.json"),
  resolveProjectPath("public", "data", "products.seed.json"),
];

export function resolveCatalogSeedPath(preferredPath = "") {
  const preferred = String(preferredPath || "").trim();
  const normalizedPreferred = preferred ? path.resolve(preferred) : "";
  const canonical = new Set(CANDIDATES.map((candidate) => path.resolve(candidate)));

  if (normalizedPreferred && fs.existsSync(normalizedPreferred) && !canonical.has(normalizedPreferred)) {
    return normalizedPreferred;
  }

  for (const candidate of CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }

  if (normalizedPreferred) return normalizedPreferred;
  return CANDIDATES[0];
}

export function getCatalogSeedCandidates() {
  return [...CANDIDATES];
}
