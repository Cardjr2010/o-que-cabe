import fs from "node:fs";
import { resolveProjectPath } from "./project-root.js";
import bundledCatalogRefreshMetadata from "../data/catalog-refresh-metadata.generated.js";

const METADATA_CANDIDATES = [
  resolveProjectPath("src", "data", "catalog-refresh-metadata.json"),
  resolveProjectPath("data", "catalog-refresh-metadata.json"),
  resolveProjectPath("public", "data", "catalog-refresh-metadata.json"),
];

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function getCatalogRefreshMetadataCandidates() {
  return [...METADATA_CANDIDATES];
}

export function resolveCatalogRefreshMetadata() {
  for (const filePath of METADATA_CANDIDATES) {
    if (!fs.existsSync(filePath)) continue;
    const data = readJson(filePath, null);
    if (data && typeof data === "object") {
      return { path: filePath, data };
    }
  }
  if (bundledCatalogRefreshMetadata && typeof bundledCatalogRefreshMetadata === "object") {
    return {
      path: "src/data/catalog-refresh-metadata.generated.js",
      data: bundledCatalogRefreshMetadata,
    };
  }
  return { path: METADATA_CANDIDATES[0], data: null };
}

export function readCatalogRefreshMetadata() {
  return resolveCatalogRefreshMetadata().data;
}
