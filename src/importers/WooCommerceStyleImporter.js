import ProductImporter, { normalizeImportedProduct, loadSeedProducts } from "./ProductImporter.js";

export class WooCommerceStyleImporter extends ProductImporter {
  importProducts(rawProducts = []) {
    return (Array.isArray(rawProducts) ? rawProducts : [])
      .map((product) => normalizeImportedProduct({
        ...product,
        sourceType: product.sourceType || "woocommerce-style",
      }))
      .filter(Boolean);
  }

  loadSeedProducts() {
    return loadSeedProducts(this.seedPath);
  }
}

export { normalizeImportedProduct };
export default WooCommerceStyleImporter;
