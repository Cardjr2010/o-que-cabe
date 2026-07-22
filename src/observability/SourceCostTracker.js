export class SourceCostTracker {
  constructor() {
    this.entries = [];
  }

  track(entry = {}) {
    this.entries.push({
      ...entry,
      trackedAt: new Date().toISOString(),
    });
  }

  list() {
    return [...this.entries];
  }
}

export default SourceCostTracker;
