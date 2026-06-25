export default class CatalogExporter {
  toJson(products = []) {
    return JSON.stringify(products, null, 2);
  }

  toCsv(products = []) {
    const headers = [
      "id","externalId","title","category","brand","model","price","currency","image","productUrl","affiliateUrl","marketplace","condition","availability","seller","rating","shipping","installments","lastCheckedAt","importedAt","updatedAt","status"
    ];
    const escape = (value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
      return text;
    };
    const rows = [headers.join(",")];
    for (const item of products) {
      rows.push(headers.map((header) => escape(item[header])).join(","));
    }
    return rows.join("\n");
  }
}
