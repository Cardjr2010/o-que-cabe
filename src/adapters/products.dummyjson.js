const BASE_URL = "https://dummyjson.com";

function toInternalProduct(product) {
  return {
    id: product.id,
    title: product.title,
    category: product.category,
    store: "Loja de Teste",
    price: product.price,
    image: product.thumbnail || product.images?.[0] || "",
    rating: product.rating,
    description: product.description || "",
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`DummyJSON HTTP ${response.status}`);
  }
  return response.json();
}

async function searchProducts(query) {
  const q = String(query || "").trim();
  const url = q
    ? `${BASE_URL}/products/search?q=${encodeURIComponent(q)}`
    : `${BASE_URL}/products?limit=30`;
  const data = await fetchJson(url);
  return (data.products || []).map(toInternalProduct);
}

async function getProduct(id) {
  const data = await fetchJson(`${BASE_URL}/products/${encodeURIComponent(id)}`);
  return toInternalProduct(data);
}

async function getProductsByCategory(category) {
  const data = await fetchJson(`${BASE_URL}/products/category/${encodeURIComponent(category)}`);
  return (data.products || []).map(toInternalProduct);
}

export default {
  searchProducts,
  getProduct,
  getProductsByCategory,
};
