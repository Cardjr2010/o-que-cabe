import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../runtime/project-root.js";

const DEFAULT_FILE = resolveProjectPath("data", "price-observations.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export class PriceObservationStore {
  constructor({ filePath = DEFAULT_FILE } = {}) {
    this.filePath = filePath;
  }

  readAll() {
    return readJson(this.filePath, []);
  }

  record(observation = {}) {
    const current = this.readAll();
    current.push(observation);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(current.slice(-5000), null, 2), "utf8");
    return observation;
  }
}

export default PriceObservationStore;
