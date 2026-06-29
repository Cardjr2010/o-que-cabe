import CsvFeedProvider from "./CsvFeedProvider.js";

export default class MiShopFeedProvider extends CsvFeedProvider {
  constructor(options = {}) {
    super({
      ...options,
      networkName: "mi_shop",
      fieldAliases: {
        id: "id|externalId",
        externalId: "sku|externalId|id",
        title: "title|name|product_name",
        description: "description|summary",
        brand: "brand|manufacturer|vendor",
        category: "category|categoryName",
        model: "model|mpn",
        price: "price|salePrice|regularPrice|amount",
        currency: "currency|currencyId|currencyCode",
        image: "image|picture|thumbnail|imageLink|image_link",
        productUrl: "url|productUrl|link",
        affiliateUrl: "url|affiliateUrl|trackingLink",
        marketplace: "marketplace",
        seller: "seller|merchant|store",
        condition: "condition",
        availability: "availability",
        lastCheckedAt: "lastCheckedAt",
      },
    });
  }
}
