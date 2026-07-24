const catalogRefreshMetadata = {
  refreshedAt: "2026-07-23T02:26:43.398Z",
  fresh: true,
  analyzedCount: 2599,
  publishedCount: 1664,
  hiddenCount: 935,
  activeSourceCounts: [
    {
      source: "saldao_informatica",
      label: "Saldao da Informatica",
      analyzedCount: 610,
      publishedCount: 202,
      hiddenCount: 408,
    },
    {
      source: "infostore",
      label: "Info Store - Informatica",
      analyzedCount: 1989,
      publishedCount: 1462,
      hiddenCount: 527,
    },
  ],
  sources: [
    {
      source: "saldao_informatica",
      label: "Saldao da Informatica",
      analyzedCount: 610,
      publishedCount: 202,
      hiddenCount: 408,
      rejectedReasons: [
        { reason: "JSON_LD_PRODUCT_MISSING", count: 344 },
        { reason: "UNAVAILABLE_UNAVAILABLE", count: 64 },
      ],
    },
    {
      source: "infostore",
      label: "Info Store - Informatica",
      analyzedCount: 1989,
      publishedCount: 1462,
      hiddenCount: 527,
      rejectedReasons: [
        { reason: "UNAVAILABLE_UNAVAILABLE", count: 477 },
        { reason: "JSON_LD_PRODUCT_MISSING", count: 44 },
        { reason: "HTTP_404", count: 6 },
      ],
    },
  ],
};

export default catalogRefreshMetadata;
