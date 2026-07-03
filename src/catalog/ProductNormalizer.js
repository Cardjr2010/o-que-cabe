const CYRILLIC_RE = /[\u0400-\u04FF]/;
const LATIN_RE = /[A-Za-z]/;

const BRAND_RULES = [
  { brand: "Xiaomi", terms: ["xiaomi", "mi "] },
  { brand: "Redmi", terms: ["redmi"] },
  { brand: "POCO", terms: ["poco"] },
  { brand: "Samsung", terms: ["samsung", "galaxy"] },
  { brand: "Apple", terms: ["apple", "iphone", "ipad", "watch"] },
  { brand: "Motorola", terms: ["motorola", "moto "] },
  { brand: "Lenovo", terms: ["lenovo", "ideapad", "thinkpad", "loq"] },
  { brand: "ASUS", terms: ["asus", "vivobook", "zenbook", "tuf"] },
  { brand: "Acer", terms: ["acer", "aspire"] },
  { brand: "LG", terms: ["lg"] },
  { brand: "TCL", terms: ["tcl"] },
  { brand: "Amazfit", terms: ["amazfit"] },
  { brand: "Huawei", terms: ["huawei"] },
  { brand: "HONOR", terms: ["honor"] },
  { brand: "Realme", terms: ["realme"] },
  { brand: "JBL", terms: ["jbl"] },
  { brand: "Mondial", terms: ["mondial"] },
  { brand: "Britania", terms: ["britania", "britÂnia"] },
  { brand: "Philips", terms: ["philips"] },
  { brand: "WAP", terms: ["wap"] },
  { brand: "Electrolux", terms: ["electrolux"] },
  { brand: "Arno", terms: ["arno"] },
];

const PHRASE_TRANSLATIONS = [
  [/\bтелевизор\b/gi, "Televisor"],
  [/\bсмарт[\s-]?часы\b/gi, "Smartwatch"],
  [/\bумные[\s-]?часы\b/gi, "Smartwatch"],
  [/\bчасы\b/gi, "Relógio"],
  [/\bпланшет\b/gi, "Tablet"],
  [/\bсмартфон\b/gi, "Smartphone"],
  [/\bтелефон\b/gi, "Celular"],
  [/\bнаушники\b/gi, "Fone"],
  [/\bчехол\b/gi, "Capa"],
  [/\bпленка\b/gi, "Película"],
  [/\bкабель\b/gi, "Cabo"],
  [/\bзарядное устройство\b/gi, "Carregador"],
  [/\bмонитор\b/gi, "Monitor"],
  [/\bноутбук\b/gi, "Notebook"],
  [/\bноутбуки\b/gi, "Notebook"],
  [/\bпауэрбанк\b/gi, "Power bank"],
  [/\bзащитное стекло\b/gi, "Película"],
  [/\bремешок\b/gi, "Pulseira"],
  [/\bбраслет\b/gi, "Pulseira"],
  [/\bадаптер\b/gi, "Adaptador"],
  [/\bмышь\b/gi, "Mouse"],
  [/\bклавиатура\b/gi, "Teclado"],
  [/\bподставка\b/gi, "Suporte"],
  [/\bдержатель\b/gi, "Suporte"],
  [/\bбеспроводные\b/gi, "Sem fio"],
  [/\bпроводные\b/gi, "Com fio"],
  [/\bоткрытые\b/gi, "Open"],
  [/\bчехлы\b/gi, "Capas"],
  [/\bкамер[аы]\b/gi, "Câmera"],
];

const CYRILLIC_MAP = new Map([
  ["А", "A"], ["Б", "B"], ["В", "V"], ["Г", "G"], ["Д", "D"], ["Е", "E"], ["Ё", "E"], ["Ж", "Zh"], ["З", "Z"], ["И", "I"], ["Й", "Y"],
  ["К", "K"], ["Л", "L"], ["М", "M"], ["Н", "N"], ["О", "O"], ["П", "P"], ["Р", "R"], ["С", "S"], ["Т", "T"], ["У", "U"], ["Ф", "F"],
  ["Х", "Kh"], ["Ц", "Ts"], ["Ч", "Ch"], ["Ш", "Sh"], ["Щ", "Shch"], ["Ъ", ""], ["Ы", "Y"], ["Ь", ""], ["Э", "E"], ["Ю", "Yu"], ["Я", "Ya"],
  ["а", "a"], ["б", "b"], ["в", "v"], ["г", "g"], ["д", "d"], ["е", "e"], ["ё", "e"], ["ж", "zh"], ["з", "z"], ["и", "i"], ["й", "y"],
  ["к", "k"], ["л", "l"], ["м", "m"], ["н", "n"], ["о", "o"], ["п", "p"], ["р", "r"], ["с", "s"], ["т", "t"], ["у", "u"], ["ф", "f"],
  ["х", "kh"], ["ц", "ts"], ["ч", "ch"], ["ш", "sh"], ["щ", "shch"], ["ъ", ""], ["ы", "y"], ["ь", ""], ["э", "e"], ["ю", "yu"], ["я", "ya"],
]);

const ACCESSORY_KEYWORDS = [
  "capa",
  "case",
  "cover",
  "pelicula",
  "film",
  "protector",
  "protetor",
  "vidro",
  "cabo",
  "cable",
  "carregador",
  "charger",
  "adaptador",
  "adapter",
  "strap",
  "pulseira",
  "band",
  "bracelete",
  "bracelet",
  "dock",
  "power bank",
  "powerbank",
  "audio glasses",
  "smart audio glasses",
  "bamper",
  "bumper",
  "watch band",
  "smart band",
  "suporte",
  "stand",
  "holder",
  "base",
  "skin",
  "filtro",
  "case",
  "bumper",
  "shell",
  "bag",
  "casing",
  "protecao",
  "proteção",
  "pelicula",
  "screen protector",
];

const PIECE_KEYWORDS = [
  "peca",
  "peça",
  "replacement",
  "spare",
  "module",
  "modulo",
  "módulo",
  "sensor",
  "board",
  "placa",
  "battery",
  "bateria",
];

const CATEGORY_RULES = [
  { category: "ferramenta", terms: ["ferramenta", "ferramentas", "broca", "furadeira", "serra", "martelo", "alicate", "parafusadeira", "torque", "chave allen", "chave philips", "chave estrela", "chave fixa", "chave catraca", "trena", "soquete", "bits"] },
  { category: "ferragem", terms: ["parafuso", "porca", "arruela", "bucha", "prego", "rebite", "dobradi", "cadeado", "fechadura", "gancho", "argola", "corrente", "mola", "abraçadeira", "abracadeira"] },
  { category: "construcao", terms: ["tinta", "cola", "cimento", "argamassa", "reboco", "massa corrida", "selante", "vedante", "fita veda", "telha", "piso", "revestimento", "construcao", "construção"] },
  { category: "casa", terms: ["casa", "cozinha", "banheiro", "limpeza", "organizador", "utilidade", "utensilio", "utensílio", "decoracao", "decoração", "jardim", "lar"] },
  { category: "tablet", terms: ["tablet", "ipad", "galaxy tab", "tab ", "redmi pad", "xiaomi pad", "mi pad", "pad se", "pad pro"] },
  { category: "tv", terms: ["smart tv", "smarttv", "televisor", "televis", "tv ", "oled", "qled", "roku"] },
  { category: "notebook", terms: ["notebook", "laptop", "vivobook", "ideapad", "aspire", "inspiron", "thinkpad", "loq"] },
  { category: "monitor", terms: ["monitor"] },
  { category: "relogio", terms: ["smartwatch", "relogio", "relógio", "watch", "fit", "band"] },
  { category: "fone", terms: ["fone", "headphone", "earbud", "airpods", "buds", "auricular", "audio"] },
  { category: "carregador", terms: ["carregador", "charger", "fonte", "power adapter"] },
  { category: "cabo", terms: ["cabo", "cable", "usb c", "usb-c", "type c"] },
  { category: "pelicula", terms: ["pelicula", "película", "screen protector", "protective film", "glass", "folha protetora"] },
  { category: "capa", terms: ["capa", "case", "cover", "bumper", "shell"] },
  { category: "celular", terms: ["celular", "smartphone", "phone", "iphone", "galaxy", "moto ", "redmi note", "redmi ", "poco ", "mi note", "mi  "] },
];

const VALID_CATEGORY_VALUES = new Set([
  "celular",
  "tablet",
  "tv",
  "notebook",
  "relogio",
  "fone",
  "carregador",
  "cabo",
  "pelicula",
  "capa",
  "monitor",
  "ferramenta",
  "ferragem",
  "construcao",
  "casa",
  "acessorio",
  "peca",
  "compativel",
  "outros",
]);

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function preserveTitleCase(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z0-9]+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function detectLanguage(title = "") {
  const text = String(title || "");
  if (!text.trim()) return "unknown";
  const hasCyrillic = CYRILLIC_RE.test(text);
  const hasLatin = LATIN_RE.test(text);
  if (hasCyrillic && hasLatin) return "mixed";
  if (hasCyrillic) return "cyrillic";
  if (hasLatin) return "latin";
  return "unknown";
}

function transliterateCyrillic(value = "") {
  return String(value || "")
    .split("")
    .map((char) => CYRILLIC_MAP.get(char) ?? char)
    .join("");
}

function applyPhraseTranslations(value = "") {
  let output = String(value || "");
  for (const [pattern, replacement] of PHRASE_TRANSLATIONS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

function cleanTitle(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizeForAnalysis(value = "") {
  const translated = applyPhraseTranslations(value);
  return normalizeText(transliteratedForSearch(translated));
}

function transliteratedForSearch(value = "") {
  return transliterateCyrillic(value);
}

function buildDisplayTitle(title = "") {
  const language = detectLanguage(title);
  let output = cleanTitle(title);
  if (language === "cyrillic" || language === "mixed") {
    output = applyPhraseTranslations(output);
    output = transliterateCyrillic(output);
    output = output
      .replace(/\bChekhol(?:-knizhka)?\b/gi, "Capa")
      .replace(/\bZashchitnaya Plenka\b/gi, "Pel?cula Protetora")
      .replace(/\bZashchitnoe Steklo\b/gi, "Vidro Protetor")
      .replace(/\bTelevizor\b/gi, "Televisor")
      .replace(/\bKronshteyn Para Televizora\b/gi, "Suporte para televisor")
      .replace(/\bKronshteyn\b/gi, "Suporte")
      .replace(/\bBesprovodnye\b/gi, "Sem Fio")
      .replace(/\bOtkrytye\b/gi, "Abertos")
      .replace(/\bNaushniki\b/gi, "Fones")
      .replace(/\bSem Fio Abertos Fones\b/gi, "Fones sem fio abertos")
      .replace(/\bSmart-chasy\b/gi, "Rel?gio Smart")
      .replace(/\bPlanshet\b/gi, "Tablet")
      .replace(/\bDlya\b/gi, "para")
      .replace(/\bVneshniy Akkumulyator\b/gi, "Power bank")
      .replace(/\bZaryadnoe Ustroystvo\b/gi, "Carregador")
      .replace(/\bZaryadnoe\b/gi, "Carregador")
      .replace(/\bUstroystvo\b/gi, "Dispositivo")
      .replace(/\bData-kabel\b/gi, "Cabo")
      .replace(/\bPortal?niy\b/gi, "Port?til")
      .replace(/\bMobilnyy\b/gi, "Port?til")
      .replace(/\bModel Avtomobilya\b/gi, "Miniatura de carro")
      .replace(/\bPortativnaya Kolonka\b/gi, "Caixa de som port?til")
      .replace(/\bUmnaya Kolonka\b/gi, "Caixa de som inteligente")
      .replace(/\bSmartfon\b/gi, "Smartphone")
      .replace(/\bFotoprinter\b/gi, "Impressora fotogr?fica")
      .replace(/\bFotoprintera\b/gi, "Impressora fotogr?fica")
      .replace(/\bNaruzhnaya Videokamera\b/gi, "C?mera externa")
      .replace(/\bVideokamera\b/gi, "C?mera")
      .replace(/\bVneshniy Akkumulyator\b/gi, "Power bank")
      .replace(/\bPritirochnaya\b/gi, "Port?til")
      .replace(/\bChernyy\b/gi, "preto")
      .replace(/\bChernye\b/gi, "pretos")
      .replace(/\bBelyy\b/gi, "branco")
      .replace(/\bBelyye\b/gi, "brancos")
      .replace(/\bSeryy\b/gi, "cinza")
      .replace(/\bSeryye\b/gi, "cinzas")
      .replace(/\bZolotoy\b/gi, "dourado")
      .replace(/\bZheltyy\b/gi, "amarelo")
      .replace(/\bFioletovyy\b/gi, "roxo")
      .replace(/\bLavandovyy\b/gi, "lavanda")
      .replace(/\bCherno-siniy\b/gi, "preto e azul")
      .replace(/\bProzrachnyy\b/gi, "transparente")
      .replace(/\bEkrana\b/gi, "tela")
      .replace(/\bPara Da Tela\b/gi, "para a tela")
      .replace(/\bPara\b/gi, "para");
  }
  output = cleanTitle(output)
    .replace(/\s+([/+-])/g, "$1")
    .replace(/([/+-])\s+/g, "$1 ")
    .replace(/\s{2,}/g, " ");
  return preserveTitleCase(output);
}
function resolvePortugueseDisplayTitle(rawTitle = "", displayTitle = "") {
  const title = cleanTitle(rawTitle);
  const candidate = cleanTitle(displayTitle);
  if (!candidate) return buildDisplayTitle(title);
  const candidateLanguage = detectLanguage(candidate);
  const transliteratedMarkers = [
    "model avtomobilya",
    "planshet",
    "chekhol",
    "zashchitnaya",
    "zaryadnoe",
    "besprovodnye",
    "naushniki",
    "smart-chasy",
    "televizor",
    "otkrytye",
    "dlya",
    "vneshniy",
    "akkumulyator",
    "portativnaya",
    "kolonka",
    "fotoprinter",
    "naruzhnaya",
    "videokamera",
    "mish",
    "klaviatura",
    "monitora",
    "zheltyy",
    "chernyy",
    "chernye",
    "belyy",
    "belyye",
    "seryy",
    "seryye",
    "zolotoy",
    "fioletovyy",
    "lavandovyy",
    "cherno-siniy",
    "prozrachnyy",
  ];
  const candidateNormalized = normalizeForAnalysis(candidate);
  if (candidateLanguage === "cyrillic" || candidateLanguage === "mixed") {
    return buildDisplayTitle(title);
  }
  if (transliteratedMarkers.some((marker) => candidateNormalized.includes(marker))) {
    return buildDisplayTitle(title);
  }
  if (candidate === title && (detectLanguage(title) === "cyrillic" || detectLanguage(title) === "mixed")) {
    return buildDisplayTitle(title);
  }
  return candidate;
}

function extractBrand(title = "") {
  const normalized = normalizeForAnalysis(title);
  for (const rule of BRAND_RULES) {
    if (rule.terms.some((term) => normalized.includes(term))) return rule.brand;
  }
  return "";
}

function extractCompatibility(title = "") {
  const display = buildDisplayTitle(title);
  const normalized = normalizeForAnalysis(display);
  const patterns = [
    /(?:for|para|compat[ií]vel com|compatible with|для)\s+(.+)$/i,
    /(?:para|for|compat[ií]vel com|compatible with|для)\s+(.+?)\s*(?:[\-–—;,.]|$)/i,
    /\bcompat(?:ible)?\s+with\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) return cleanTitle(match[1]);
  }
  return "";
}

function detectAccessoryType(normalized) {
  if (ACCESSORY_KEYWORDS.some((term) => normalized.includes(term))) {
    if (normalized.includes("pelicula") || normalized.includes("screen protector") || normalized.includes("glass")) return "pelicula";
    if (normalized.includes("capa") || normalized.includes("case") || normalized.includes("cover") || normalized.includes("bumper") || normalized.includes("shell")) return "capa";
    if (normalized.includes("carregador") || normalized.includes("charger") || normalized.includes("fonte")) return "carregador";
    if (normalized.includes("cabo") || normalized.includes("cable") || normalized.includes("usb-c") || normalized.includes("type c")) return "cabo";
    if (normalized.includes("strap") || normalized.includes("pulseira") || normalized.includes("band") || normalized.includes("bracelet")) return "smartwatch";
    return "acessorio";
  }
  return "";
}

function detectPieceType(normalized) {
  return PIECE_KEYWORDS.some((term) => normalized.includes(term)) ? "peca" : "";
}

function detectMainCategory(normalized) {
  for (const rule of CATEGORY_RULES) {
    if (rule.terms.some((term) => normalized.includes(term))) return rule.category;
  }
  return "";
}

function sanitizeCategory(value = "", title = "") {
  const normalized = normalizeText(value);
  if (VALID_CATEGORY_VALUES.has(normalized)) return normalized;
  return detectMainCategory(normalizeForAnalysis(title)) || "outros";
}

function inferCategoryFromFields(raw = {}, title = "") {
  const normalized = normalizeForAnalysis([title, raw.description, raw.category, raw.brand, raw.model].filter(Boolean).join(" "));
  const accessoryType = detectAccessoryType(normalized);
  if (accessoryType) return accessoryType;
  const pieceType = detectPieceType(normalized);
  if (pieceType) return pieceType;
  const main = detectMainCategory(normalized);
  if (main) return main;
  return "outros";
}

function inferProductType(category = "", normalizedText = "") {
  if (["pelicula", "capa", "cabo", "carregador", "acessorio"].includes(category)) return "accessory";
  if (category === "peca") return "piece";
  if (normalizedText.includes("compat")) return "compatible";
  if (["ferramenta", "ferragem", "construcao", "casa"].includes(category)) return "product";
  return "product";
}

function extractModel(title = "", brand = "") {
  const cleanedTitle = cleanTitle(title);
  const normalizedTitle = normalizeForAnalysis(cleanedTitle);
  let model = cleanedTitle;
  if (brand) {
    const normalizedBrand = normalizeForAnalysis(brand);
    const brandPattern = new RegExp(`\\b${normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    model = model.replace(brandPattern, " ").trim();
  }

  model = model
    .replace(/\b(xiaomi|redmi|poco|samsung|apple|motorola|lenovo|asus|acer|lg|tcl|amazfit|huawei|honor|realme|jbl|mondial|britania|philips|wap|electrolux|arno)\b/gi, " ")
    .replace(/\b(celular|smartphone|tablet|notebook|laptop|tv|televisor|monitor|fone|carregador|cabo|pelicula|capa|smartwatch|relogio|relógio|accessory|acessorio|acessório)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!model) {
    const fallback = cleanedTitle.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim();
    return fallback || cleanedTitle || normalizedTitle;
  }

  return preserveTitleCase(model);
}

function containsQueryToken(text = "", term = "") {
  const normalizedText = normalizeForAnalysis(text);
  const normalizedTerm = normalizeForAnalysis(term);
  if (!normalizedText || !normalizedTerm) return false;
  if (normalizedTerm.includes(" ")) return normalizedText.includes(normalizedTerm);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(normalizedText);
}

function scoreProductMatch(product = {}, query = "") {
  const q = normalizeText(query);
  if (!q) return 0;
  const normalizedTitle = normalizeForAnalysis([product.displayTitle, product.originalTitle, product.title].filter(Boolean).join(" "));
  const normalizedBrand = normalizeForAnalysis(product.brand || "");
  const normalizedModel = normalizeForAnalysis(product.model || "");
  const normalizedCategory = normalizeForAnalysis(product.normalizedCategory || product.category || "");
  const normalizedType = normalizeForAnalysis(product.productType || "");
  const normalizedCompatibility = normalizeForAnalysis(product.compatibility || "");
  const text = normalizeForAnalysis([
    product.displayTitle,
    product.originalTitle,
    product.title,
    product.brand,
    product.model,
    product.normalizedCategory,
    product.productType,
    product.description,
    product.compatibility,
  ].filter(Boolean).join(" "));

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const accessoryIntent = /\b(capa|case|pelicula|pel??cula|carregador|cabo|fone|headphone|airpods|earbud|strap|pulseira|acessorio|acess??rio)\b/.test(q);
  const productIntent = /\b(celular|smartphone|tablet|notebook|tv|televisor|monitor|relogio|rel??gio|xiaomi|redmi|poco|iphone|samsung|motorola|lenovo|asus|acer|apple|lg|tcl)\b/.test(q);
  const accessoryMatch = queryTokens.some((token) =>
    containsQueryToken(text, token) ||
    containsQueryToken(normalizedTitle, token) ||
    containsQueryToken(normalizedModel, token) ||
    containsQueryToken(normalizedBrand, token) ||
    containsQueryToken(normalizedCategory, token) ||
    containsQueryToken(normalizedCompatibility, token)
  );
  const directMatch =
    normalizedTitle === q ||
    containsQueryToken(text, q) ||
    containsQueryToken(normalizedTitle, q) ||
    containsQueryToken(normalizedModel, q) ||
    containsQueryToken(normalizedBrand, q) ||
    containsQueryToken(normalizedCategory, q) ||
    containsQueryToken(normalizedCompatibility, q) ||
    queryTokens.every((token) => containsQueryToken(text, token)) ||
    queryTokens.some((token) => containsQueryToken(normalizedBrand, token) || containsQueryToken(normalizedModel, token));

  if (accessoryIntent && !accessoryMatch) return 0;
  if (!directMatch && !accessoryIntent && !productIntent) return 0;

  let score = 0;

  if (normalizedTitle === q) score += 90;
  if (containsQueryToken(text, q)) score += 60;
  if (containsQueryToken(normalizedTitle, q)) score += 45;
  if (normalizedModel && containsQueryToken(normalizedModel, q)) score += 30;
  if (normalizedBrand && containsQueryToken(normalizedBrand, q)) score += 20;
  if (normalizedCategory && containsQueryToken(normalizedCategory, q)) score += 15;
  if (normalizedType && normalizedType.includes(q)) score += 10;
  if (normalizedCompatibility && containsQueryToken(normalizedCompatibility, q)) score += 8;

  if (queryTokens.every((token) => containsQueryToken(text, token))) score += 25;
  if (queryTokens.some((token) => containsQueryToken(normalizedBrand, token) || containsQueryToken(normalizedModel, token))) score += 20;

  const isAccessory = String(product.isAccessory || "").toLowerCase() === "true" || ["accessory", "piece", "compatible"].includes(normalizeText(product.productType));
  const isMainProduct = !isAccessory && normalizeText(product.productType || "product") === "product";

  if (accessoryIntent) {
    if (isAccessory && accessoryMatch) score += 40;
    if (isMainProduct) score -= 20;
  } else {
    if (isMainProduct) score += 25;
    if (isAccessory) score -= 30;
  }

  if (productIntent && (normalizedCategory === q || containsQueryToken(normalizedBrand, q) || containsQueryToken(normalizedModel, q))) score += 20;
  if (/xiaomi|redmi|poco/.test(q) && /xiaomi|redmi|poco/.test(`${normalizedBrand} ${normalizedTitle} ${normalizedModel}`)) score += 20;
  if (/(celular|smartphone)/.test(q) && /(xiaomi|redmi|poco|samsung|motorola)/.test(`${normalizedBrand} ${normalizedTitle} ${normalizedModel}`)) score += 24;
  if (/(celular|smartphone)/.test(q) && /apple/.test(`${normalizedBrand} ${normalizedTitle} ${normalizedModel}`)) score -= 12;
  if (/tablet/.test(q) && normalizedCategory === "tablet") score += 25;
  if (/relogio|relógio/.test(q) && normalizedCategory === "relogio") score += 25;
  if (/fone/.test(q) && normalizedCategory === "fone") score += 20;
  if (/carregador/.test(q) && normalizedCategory === "carregador") score += 20;
  if (/cabo/.test(q) && normalizedCategory === "cabo") score += 20;
  if (/pelicula|película/.test(q) && normalizedCategory === "pelicula") score += 20;
  if (/capa/.test(q) && normalizedCategory === "capa") score += 20;
  if (/celular|smartphone|iphone/.test(q) && normalizedCategory === "celular") score += 25;
  if (/tv|televisor/.test(q) && normalizedCategory === "tv") score += 25;
  if (/notebook|laptop/.test(q) && normalizedCategory === "notebook") score += 25;
  if (/(iphone|apple iphone|samsung|galaxy|redmi|poco|motorola|moto)/.test(q)) {
    const phoneEvidence = /(celular|smartphone|phone|iphone|galaxy|samsung|redmi|poco|motorola)/.test(`${normalizedTitle} ${normalizedBrand} ${normalizedModel} ${normalizedCategory} ${normalizedType}`);
    if (phoneEvidence) score += 18;
    if (isAccessory) score -= 12;
    if (normalizedCategory === "celular" || normalizedType === "smartphone") score += 10;
    if (/(iphone|apple)/.test(q) && normalizedBrand === "apple" && phoneEvidence) score += 8;
    if (/(samsung|galaxy)/.test(q) && normalizedBrand === "samsung" && phoneEvidence) score += 8;
  }

  return directMatch ? score : 0;
}

function buildNormalizedProduct(raw = {}) {
  const originalTitle = cleanTitle(raw.originalTitle || raw.title || raw.name || raw.productName || "");
  const language = detectLanguage(originalTitle);
  const displayTitle = resolvePortugueseDisplayTitle(originalTitle, raw.displayTitle || buildDisplayTitle(originalTitle));
  const titleForAnalysis = displayTitle || originalTitle;
  const brand = cleanTitle(raw.brand || extractBrand(titleForAnalysis));
  const inferredCategory = sanitizeCategory(inferCategoryFromFields(raw, titleForAnalysis), titleForAnalysis);
  const normalizedCategory = inferredCategory !== "outros"
    ? inferredCategory
    : sanitizeCategory(raw.normalizedCategory || raw.category || "", titleForAnalysis);
  const productType = cleanTitle(raw.productType || inferProductType(normalizedCategory, normalizeForAnalysis(titleForAnalysis))).toLowerCase() || "product";
  const isAccessory = Boolean((raw.isAccessory ?? ["accessory", "piece", "compatible"].includes(normalizeText(productType))) || ["pelicula", "capa", "cabo", "carregador", "acessorio", "peca"].includes(normalizedCategory));
  const compatibility = cleanTitle(raw.compatibility || extractCompatibility(titleForAnalysis));
  const model = cleanTitle(raw.model || extractModel(titleForAnalysis, brand));
  const warnings = new Set(Array.isArray(raw.normalizationWarnings) ? raw.normalizationWarnings.filter(Boolean) : []);

  if (!originalTitle) warnings.add("Título ausente");
  if (language === "cyrillic" || language === "mixed") warnings.add("Título transliterado para português");
  if (!brand) warnings.add("Marca inferida");
  if (!model) warnings.add("Modelo inferido");
  if (!normalizedCategory || normalizedCategory === "outros") warnings.add("Categoria principal inferida");
  if (isAccessory) warnings.add("Item classificado como acessório");
  if (compatibility) warnings.add(`Compatível com ${compatibility}`);

  return {
    originalTitle,
    displayTitle,
    normalizedCategory: normalizedCategory || "outros",
    productType: productType || "product",
    brand: brand || "",
    model: model || "",
    isAccessory,
    compatibility,
    language,
    normalizationWarnings: [...warnings],
  };
}

function normalizeNormalizedFields(raw = {}, title = "") {
  const normalized = buildNormalizedProduct({
    originalTitle: raw.originalTitle || title,
    displayTitle: raw.displayTitle || "",
    brand: raw.brand || "",
    model: raw.model || "",
    normalizedCategory: raw.normalizedCategory || "",
    productType: raw.productType || "",
    isAccessory: raw.isAccessory,
    compatibility: raw.compatibility || "",
    normalizationWarnings: raw.normalizationWarnings || [],
  });
  return normalized;
}

function getHomeCategoryCandidates(items = [], options = {}) {
  const minCount = Number(options.minCount || 5);
  const counts = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const key = cleanTitle(item.normalizedCategory || item.category || "outros").toLowerCase() || "outros";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([category, count]) => ({ category, count }));
}

export {
  normalizeText,
  detectLanguage,
  transliterateCyrillic,
  buildDisplayTitle,
  resolvePortugueseDisplayTitle,
  extractBrand,
  extractModel,
  inferCategoryFromFields,
  inferProductType,
  sanitizeCategory,
  scoreProductMatch,
  normalizeNormalizedFields,
  getHomeCategoryCandidates,
  normalizeForAnalysis,
};

export default {
  normalizeText,
  detectLanguage,
  transliterateCyrillic,
  buildDisplayTitle,
  extractBrand,
  extractModel,
  inferCategoryFromFields,
  inferProductType,
  sanitizeCategory,
  scoreProductMatch,
  normalizeNormalizedFields,
  getHomeCategoryCandidates,
  normalizeForAnalysis,
};
