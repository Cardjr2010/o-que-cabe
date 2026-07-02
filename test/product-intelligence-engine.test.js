import test from "node:test";
import assert from "node:assert/strict";

import ProductIntelligenceEngine, { classifyProductIntelligence } from "../src/catalog/ProductIntelligenceEngine.js";

test("furadeira vai para Ferramentas", () => {
  const intelligence = classifyProductIntelligence({
    title: "Furadeira Bosch GSB 18V",
    price: 499,
    image: "https://example.com/furadeira.png",
    productUrl: "https://example.com/furadeira",
  });

  assert.equal(intelligence.department, "Casa e Construção");
  assert.equal(intelligence.category, "Ferramentas");
  assert.equal(intelligence.productType, "principal");
  assert.equal(intelligence.isAccessory, false);
  assert.ok(intelligence.searchKeywords.includes("furadeira"));
});

test("parafuso vai para Ferragens", () => {
  const intelligence = classifyProductIntelligence({
    title: "Parafuso Philips 4x20mm",
    price: 9.9,
    image: "https://example.com/parafuso.png",
    productUrl: "https://example.com/parafuso",
  });

  assert.equal(intelligence.department, "Casa e Construção");
  assert.equal(intelligence.category, "Ferragens");
  assert.equal(intelligence.productType, "principal");
  assert.equal(intelligence.isAccessory, false);
});

test("SSD vai para Informática", () => {
  const intelligence = classifyProductIntelligence({
    title: "SSD Kingston NVMe 1TB",
    price: 349.9,
    image: "https://example.com/ssd.png",
    productUrl: "https://example.com/ssd",
  });

  assert.equal(intelligence.department, "Informática");
  assert.equal(intelligence.category, "Informática");
  assert.equal(intelligence.subcategory, "Armazenamento");
});

test("iPhone vai para Celulares", () => {
  const intelligence = classifyProductIntelligence({
    title: "Apple iPhone 13 128GB",
    price: 2999.9,
    image: "https://example.com/iphone.png",
    productUrl: "https://example.com/iphone",
  });

  assert.equal(intelligence.department, "Celulares");
  assert.equal(intelligence.category, "Celulares");
  assert.equal(intelligence.subcategory, "iPhone");
});

test("notebook vai para Notebooks", () => {
  const intelligence = classifyProductIntelligence({
    title: "Notebook Lenovo IdeaPad 1",
    price: 2499.9,
    image: "https://example.com/notebook.png",
    productUrl: "https://example.com/notebook",
  });

  assert.equal(intelligence.department, "Notebooks");
  assert.equal(intelligence.category, "Notebooks");
  assert.equal(intelligence.productType, "principal");
});

test("monitor vai para Monitores", () => {
  const intelligence = classifyProductIntelligence({
    title: "Monitor Gamer 144Hz 24 Polegadas",
    price: 899.9,
    image: "https://example.com/monitor.png",
    productUrl: "https://example.com/monitor",
  });

  assert.equal(intelligence.department, "Monitores");
  assert.equal(intelligence.category, "Monitores");
  assert.equal(intelligence.subcategory, "Monitores Gamer");
});

test("TV vai para TVs", () => {
  const intelligence = classifyProductIntelligence({
    title: "Smart TV LG 4K 50 polegadas",
    price: 1899.9,
    image: "https://example.com/tv.png",
    productUrl: "https://example.com/tv",
  });

  assert.equal(intelligence.department, "TVs");
  assert.equal(intelligence.category, "TVs");
  assert.ok(["Smart TV", "4K"].includes(intelligence.subcategory));
});

test("buquê vai para Flores e Presentes", () => {
  const intelligence = classifyProductIntelligence({
    title: "Buquê de rosas vermelhas",
    price: 79.9,
    image: "https://example.com/buque.png",
    productUrl: "https://example.com/buque",
  });

  assert.equal(intelligence.department, "Flores e Presentes");
  assert.equal(intelligence.category, "Flores e Presentes");
  assert.equal(intelligence.subcategory, "Buquês");
});

test("película é acessório", () => {
  const intelligence = classifyProductIntelligence({
    title: "Película de vidro para iPhone 13",
    price: 29.9,
    image: "https://example.com/pelicula.png",
    productUrl: "https://example.com/pelicula",
  });

  assert.equal(intelligence.department, "Acessórios");
  assert.equal(intelligence.category, "Acessórios");
  assert.equal(intelligence.productType, "accessory");
  assert.equal(intelligence.isAccessory, true);
});

test("cabo é acessório", () => {
  const intelligence = classifyProductIntelligence({
    title: "Cabo USB-C 2 metros",
    price: 39.9,
    image: "https://example.com/cabo.png",
    productUrl: "https://example.com/cabo",
  });

  assert.equal(intelligence.department, "Cabos e Carregadores");
  assert.equal(intelligence.category, "Cabos e Carregadores");
  assert.equal(intelligence.productType, "accessory");
  assert.equal(intelligence.isAccessory, true);
});

test("produto principal vence acessório em busca ampla", () => {
  const engine = new ProductIntelligenceEngine();
  const products = [
    {
      title: "Capa para iPhone 13",
      price: 39.9,
      image: "https://example.com/capa.png",
      productUrl: "https://example.com/capa",
      marketplace: "saldao_informatica",
    },
    {
      title: "Apple iPhone 13 128GB",
      price: 2999.9,
      image: "https://example.com/iphone.png",
      productUrl: "https://example.com/iphone",
      marketplace: "saldao_informatica",
    },
  ];

  const enriched = engine.enrichCatalog(products);
  assert.equal(enriched[0].isAccessory, true);
  assert.equal(enriched[1].isAccessory, false);
  assert.equal(enriched[0].department, "Acessórios");
  assert.equal(enriched[1].department, "Celulares");
});

test("outros não aparece como categoria principal da home", () => {
  const engine = new ProductIntelligenceEngine({ minCount: 1 });
  const analysis = engine.buildHomeData([
    {
      title: "Parafuso Philips 4x20mm",
      price: 9.9,
      image: "https://example.com/parafuso.png",
      productUrl: "https://example.com/parafuso",
    },
    {
      title: "Apple iPhone 13",
      price: 2999.9,
      image: "https://example.com/iphone.png",
      productUrl: "https://example.com/iphone",
    },
    {
      title: "Produto genérico",
      price: 19.9,
      image: "https://example.com/outro.png",
      productUrl: "https://example.com/outro",
      normalizedCategory: "outros",
    },
  ]);

  const categories = Array.isArray(analysis.categories) ? analysis.categories : [];
  assert.ok(categories.some((item) => item.category === "celulares" || item.label === "Celulares"));
  assert.ok(categories.some((item) => item.category === "ferragens" || item.label === "Ferragens"));
  assert.notEqual(categories[0]?.category, "outros");
  assert.ok((analysis.shortcuts || []).every((item) => item.category !== "outros"));
});
