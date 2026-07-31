const catalogRefreshMetadata = {
  "refreshedAt": "2026-07-31T17:45:46.520Z",
  "fresh": true,
  "analyzedCount": 3317,
  "publishedCount": 2382,
  "hiddenCount": 935,
  "activeSourceCounts": [
    {
      "source": "saldao_informatica",
      "label": "Saldão da Informática",
      "analyzedCount": 610,
      "publishedCount": 202,
      "hiddenCount": 408
    },
    {
      "source": "infostore",
      "label": "Info Store - Informática",
      "analyzedCount": 1989,
      "publishedCount": 1462,
      "hiddenCount": 527
    },
    {
      "source": "amazon",
      "label": "Amazon",
      "analyzedCount": 437,
      "publishedCount": 437,
      "hiddenCount": 0
    },
    {
      "source": "mercado_livre",
      "label": "Mercado Livre",
      "analyzedCount": 281,
      "publishedCount": 281,
      "hiddenCount": 0
    }
  ],
  "sources": [
    {
      "source": "saldao_informatica",
      "label": "Saldão da Informática",
      "analyzedCount": 610,
      "publishedCount": 202,
      "hiddenCount": 408,
      "rejectedReasons": [
        {
          "reason": "JSON_LD_PRODUCT_MISSING",
          "count": 344
        },
        {
          "reason": "UNAVAILABLE_UNAVAILABLE",
          "count": 64
        }
      ]
    },
    {
      "source": "infostore",
      "label": "Info Store - Informática",
      "analyzedCount": 1989,
      "publishedCount": 1462,
      "hiddenCount": 527,
      "rejectedReasons": [
        {
          "reason": "UNAVAILABLE_UNAVAILABLE",
          "count": 477
        },
        {
          "reason": "JSON_LD_PRODUCT_MISSING",
          "count": 44
        },
        {
          "reason": "HTTP_404",
          "count": 6
        }
      ]
    },
    {
      "source": "amazon",
      "label": "Amazon",
      "analyzedCount": 437,
      "publishedCount": 437,
      "hiddenCount": 0,
      "rejectedReasons": []
    },
    {
      "source": "mercado_livre",
      "label": "Mercado Livre",
      "analyzedCount": 281,
      "publishedCount": 281,
      "hiddenCount": 0,
      "rejectedReasons": []
    }
  ]
};

export default catalogRefreshMetadata;
