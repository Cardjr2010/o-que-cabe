const catalogRefreshMetadata = {
  "refreshedAt": "2026-07-24T10:06:38.798Z",
  "fresh": true,
  "analyzedCount": 2607,
  "publishedCount": 1660,
  "hiddenCount": 947,
  "activeSourceCounts": [
    {
      "source": "saldao_informatica",
      "label": "Saldão da Informática",
      "analyzedCount": 610,
      "publishedCount": 200,
      "hiddenCount": 410
    },
    {
      "source": "infostore",
      "label": "Info Store - Informática",
      "analyzedCount": 1997,
      "publishedCount": 1460,
      "hiddenCount": 537
    }
  ],
  "sources": [
    {
      "source": "saldao_informatica",
      "label": "Saldão da Informática",
      "analyzedCount": 610,
      "publishedCount": 200,
      "hiddenCount": 410,
      "rejectedReasons": [
        {
          "reason": "JSON_LD_PRODUCT_MISSING",
          "count": 345
        },
        {
          "reason": "UNAVAILABLE_UNAVAILABLE",
          "count": 65
        }
      ]
    },
    {
      "source": "infostore",
      "label": "Info Store - Informática",
      "analyzedCount": 1997,
      "publishedCount": 1460,
      "hiddenCount": 537,
      "rejectedReasons": [
        {
          "reason": "UNAVAILABLE_UNAVAILABLE",
          "count": 473
        },
        {
          "reason": "JSON_LD_PRODUCT_MISSING",
          "count": 47
        },
        {
          "reason": "HTTP_404",
          "count": 17
        }
      ]
    }
  ]
};

export default catalogRefreshMetadata;
