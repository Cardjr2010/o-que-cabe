import MarketplaceProvider from "./MarketplaceProvider.js";
import MercadoLivreConnector from "../connectors/MercadoLivreConnector.js";

class MercadoLivreProvider extends MarketplaceProvider {
  async searchProducts(query, options = {}) {
    const result = await MercadoLivreConnector.searchProducts(query, options);
    return {
      ...result,
      products: Array.isArray(result.products)
        ? result.products.map((product) => this.normalizeProduct(product))
        : [],
    };
  }

  async getProduct(itemId) {
    const result = await MercadoLivreConnector.getProduct(itemId);
    if (result?.item) {
      return { ...result, item: this.normalizeProduct(result.item) };
    }
    return result;
  }

  getPermalink(item) {
    return MercadoLivreConnector.getPermalink(item);
  }

  getImage(item) {
    return MercadoLivreConnector.getProductImage(item);
  }

  normalizeProduct(rawItem) {
    const product = MercadoLivreConnector.normalizeProduct(rawItem, rawItem?.dataMode || "real-authenticated");
    return {
      ...product,
      marketplace: "mercadolivre",
      source: "mercadolivre",
      dataMode: product.dataMode || "real-authenticated",
    };
  }

  getDiagnostics() {
    return MercadoLivreConnector.getDiagnostics();
  }
}

const mercadoLivreProvider = new MercadoLivreProvider();

export { MercadoLivreProvider };
export default mercadoLivreProvider;
