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
  { brand: "Britania", terms: ["britania", "britÃ‚nia"] },
  { brand: "Philips", terms: ["philips"] },
  { brand: "WAP", terms: ["wap"] },
  { brand: "Electrolux", terms: ["electrolux"] },
  { brand: "Arno", terms: ["arno"] },
];

const PHRASE_TRANSLATIONS = [
  [/\bÑ‚ÐµÐ»ÐµÐ²Ð¸Ð·Ð¾Ñ€\b/gi, "Televisor"],
  [/\bÑÐ¼Ð°Ñ€Ñ‚[\s-]?Ñ‡Ð°ÑÑ‹\b/gi, "Smartwatch"],
  [/\bÑƒÐ¼Ð½Ñ‹Ðµ[\s-]?Ñ‡Ð°ÑÑ‹\b/gi, "Smartwatch"],
  [/\bÑ‡Ð°ÑÑ‹\b/gi, "RelÃ³gio"],
  [/\bÐ¿Ð»Ð°Ð½ÑˆÐµÑ‚\b/gi, "Tablet"],
  [/\bÑÐ¼Ð°Ñ€Ñ‚Ñ„Ð¾Ð½\b/gi, "Smartphone"],
  [/\bÑ‚ÐµÐ»ÐµÑ„Ð¾Ð½\b/gi, "Celular"],
  [/\bÐ½Ð°ÑƒÑˆÐ½Ð¸ÐºÐ¸\b/gi, "Fone"],
  [/\bÑ‡ÐµÑ…Ð¾Ð»\b/gi, "Capa"],
  [/\bÐ¿Ð»ÐµÐ½ÐºÐ°\b/gi, "PelÃ­cula"],
  [/\bÐºÐ°Ð±ÐµÐ»ÑŒ\b/gi, "Cabo"],
  [/\bÐ·Ð°Ñ€ÑÐ´Ð½Ð¾Ðµ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð¾\b/gi, "Carregador"],
  [/\bÐ¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€\b/gi, "Monitor"],
  [/\bÐ½Ð¾ÑƒÑ‚Ð±ÑƒÐº\b/gi, "Notebook"],
  [/\bÐ½Ð¾ÑƒÑ‚Ð±ÑƒÐºÐ¸\b/gi, "Notebook"],
  [/\bÐ¿Ð°ÑƒÑÑ€Ð±Ð°Ð½Ðº\b/gi, "Power bank"],
  [/\bÐ·Ð°Ñ‰Ð¸Ñ‚Ð½Ð¾Ðµ ÑÑ‚ÐµÐºÐ»Ð¾\b/gi, "PelÃ­cula"],
  [/\bÑ€ÐµÐ¼ÐµÑˆÐ¾Ðº\b/gi, "Pulseira"],
  [/\bÐ±Ñ€Ð°ÑÐ»ÐµÑ‚\b/gi, "Pulseira"],
  [/\bÐ°Ð´Ð°Ð¿Ñ‚ÐµÑ€\b/gi, "Adaptador"],
  [/\bÐ¼Ñ‹ÑˆÑŒ\b/gi, "Mouse"],
  [/\bÐºÐ»Ð°Ð²Ð¸Ð°Ñ‚ÑƒÑ€Ð°\b/gi, "Teclado"],
  [/\bÐ¿Ð¾Ð´ÑÑ‚Ð°Ð²ÐºÐ°\b/gi, "Suporte"],
  [/\bÐ´ÐµÑ€Ð¶Ð°Ñ‚ÐµÐ»ÑŒ\b/gi, "Suporte"],
  [/\bÐ±ÐµÑÐ¿Ñ€Ð¾Ð²Ð¾Ð´Ð½Ñ‹Ðµ\b/gi, "Sem fio"],
  [/\bÐ¿Ñ€Ð¾Ð²Ð¾Ð´Ð½Ñ‹Ðµ\b/gi, "Com fio"],
  [/\bÐ¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ñ‹Ðµ\b/gi, "Open"],
  [/\bÑ‡ÐµÑ…Ð»Ñ‹\b/gi, "Capas"],
  [/\bÐºÐ°Ð¼ÐµÑ€[Ð°Ñ‹]\b/gi, "CÃ¢mera"],
];

const CYRILLIC_MAP = new Map([
  ["Ð", "A"], ["Ð‘", "B"], ["Ð’", "V"], ["Ð“", "G"], ["Ð”", "D"], ["Ð•", "E"], ["Ð", "E"], ["Ð–", "Zh"], ["Ð—", "Z"], ["Ð˜", "I"], ["Ð™", "Y"],
  ["Ðš", "K"], ["Ð›", "L"], ["Ðœ", "M"], ["Ð", "N"], ["Ðž", "O"], ["ÐŸ", "P"], ["Ð ", "R"], ["Ð¡", "S"], ["Ð¢", "T"], ["Ð£", "U"], ["Ð¤", "F"],
  ["Ð¥", "Kh"], ["Ð¦", "Ts"], ["Ð§", "Ch"], ["Ð¨", "Sh"], ["Ð©", "Shch"], ["Ðª", ""], ["Ð«", "Y"], ["Ð¬", ""], ["Ð­", "E"], ["Ð®", "Yu"], ["Ð¯", "Ya"],
  ["Ð°", "a"], ["Ð±", "b"], ["Ð²", "v"], ["Ð³", "g"], ["Ð´", "d"], ["Ðµ", "e"], ["Ñ‘", "e"], ["Ð¶", "zh"], ["Ð·", "z"], ["Ð¸", "i"], ["Ð¹", "y"],
  ["Ðº", "k"], ["Ð»", "l"], ["Ð¼", "m"], ["Ð½", "n"], ["Ð¾", "o"], ["Ð¿", "p"], ["Ñ€", "r"], ["Ñ", "s"], ["Ñ‚", "t"], ["Ñƒ", "u"], ["Ñ„", "f"],
  ["Ñ…", "kh"], ["Ñ†", "ts"], ["Ñ‡", "ch"], ["Ñˆ", "sh"], ["Ñ‰", "shch"], ["ÑŠ", ""], ["Ñ‹", "y"], ["ÑŒ", ""], ["Ñ", "e"], ["ÑŽ", "yu"], ["Ñ", "ya"],
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
  "controle remoto",
  "remote control",
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
  "proteÃ§Ã£o",
  "pelicula",
  "screen protector",
];

const PIECE_KEYWORDS = [
  "peca",
  "peÃ§a",
  "replacement",
  "spare",
  "module",
  "modulo",
  "mÃ³dulo",
  "sensor",
  "board",
  "placa",
  "battery",
  "bateria",
];

const CATEGORY_RULES = [
  { category: "ferramenta", terms: ["ferramenta", "ferramentas", "broca", "furadeira", "serra", "martelo", "alicate", "parafusadeira", "torque", "chave allen", "chave philips", "chave estrela", "chave fixa", "chave catraca", "trena", "soquete", "bits"] },
  { category: "ferragem", terms: ["parafuso", "porca", "arruela", "bucha", "prego", "rebite", "dobradi", "cadeado", "fechadura", "gancho", "argola", "corrente", "mola", "abraÃ§adeira", "abracadeira"] },
  { category: "construcao", terms: ["tinta", "cola", "cimento", "argamassa", "reboco", "massa corrida", "selante", "vedante", "fita veda", "telha", "piso", "revestimento", "construcao", "construÃ§Ã£o"] },
  { category: "roteador", terms: ["roteador", "router", "wifi", "wi-fi", "mesh", "deco", "tp-link", "archer", "starlink"] },
  { category: "casa", terms: ["casa", "cozinha", "banheiro", "limpeza", "organizador", "utilidade", "utensilio", "utensÃ­lio", "decoracao", "decoraÃ§Ã£o", "jardim", "lar"] },
  { category: "tablet", terms: ["tablet", "ipad", "galaxy tab", "tab ", "redmi pad", "xiaomi pad", "mi pad", "pad se", "pad pro"] },
  { category: "tv", terms: ["smart tv", "smarttv", "televisor", "televis", "tv ", "oled", "qled", "roku"] },
  { category: "notebook", terms: ["notebook", "laptop", "vivobook", "ideapad", "aspire", "inspiron", "thinkpad", "loq"] },
  { category: "monitor", terms: ["monitor"] },
  { category: "relogio", terms: ["smartwatch", "relogio", "relÃ³gio", "watch", "fit", "band"] },
  { category: "fone", terms: ["fone", "headphone", "earbud", "airpods", "buds", "auricular", "audio"] },
  { category: "carregador", terms: ["carregador", "charger", "fonte", "power adapter"] },
  { category: "cabo", terms: ["cabo", "cable", "usb c", "usb-c", "type c"] },
  { category: "pelicula", terms: ["pelicula", "pelÃ­cula", "screen protector", "protective film", "glass", "folha protetora"] },
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
  "roteador",
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
  const fallbackMap = {
    "\u0410": "A", "\u0411": "B", "\u0412": "V", "\u0413": "G", "\u0414": "D", "\u0415": "E", "\u0401": "E", "\u0416": "Zh", "\u0417": "Z", "\u0418": "I", "\u0419": "Y",
    "\u041A": "K", "\u041B": "L", "\u041C": "M", "\u041D": "N", "\u041E": "O", "\u041F": "P", "\u0420": "R", "\u0421": "S", "\u0422": "T", "\u0423": "U", "\u0424": "F",
    "\u0425": "Kh", "\u0426": "Ts", "\u0427": "Ch", "\u0428": "Sh", "\u0429": "Shch", "\u042A": "", "\u042B": "Y", "\u042C": "", "\u042D": "E", "\u042E": "Yu", "\u042F": "Ya",
    "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "g", "\u0434": "d", "\u0435": "e", "\u0451": "e", "\u0436": "zh", "\u0437": "z", "\u0438": "i", "\u0439": "y",
    "\u043A": "k", "\u043B": "l", "\u043C": "m", "\u043D": "n", "\u043E": "o", "\u043F": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t", "\u0443": "u", "\u0444": "f",
    "\u0445": "kh", "\u0446": "ts", "\u0447": "ch", "\u0448": "sh", "\u0449": "shch", "\u044A": "", "\u044B": "y", "\u044C": "", "\u044D": "e", "\u044E": "yu", "\u044F": "ya",
  };
  return String(value || "")
    .split("")
    .map((char) => CYRILLIC_MAP.get(char) ?? fallbackMap[char] ?? char)
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
    /(?:for|para|compat[iÃ­]vel com|compatible with|Ð´Ð»Ñ)\s+(.+)$/i,
    /(?:para|for|compat[iÃ­]vel com|compatible with|Ð´Ð»Ñ)\s+(.+?)\s*(?:[\-â€“â€”;,.]|$)/i,
    /\bcompat(?:ible)?\s+with\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) return cleanTitle(match[1]);
  }
  return "";
}

function detectAccessoryType(normalized) {
  if (/\b(cadeira|poltrona|banco)\b/.test(normalized) && /\b(suporte lombar|apoio para pes|apoio de braco|encosto)\b/.test(normalized)) {
    return "";
  }
  if (ACCESSORY_KEYWORDS.some((term) => normalized.includes(term))) {
    if (normalized.includes("pelicula") || normalized.includes("screen protector") || normalized.includes("glass")) return "pelicula";
    if (normalized.includes("capa") || normalized.includes("case") || normalized.includes("cover") || normalized.includes("bumper") || normalized.includes("shell")) return "capa";
    if (normalized.includes("carregador") || normalized.includes("charger") || normalized.includes("fonte")) return "carregador";
    if (normalized.includes("cabo") || normalized.includes("cable") || normalized.includes("usb-c") || normalized.includes("type c")) return "cabo";
    if (normalized.includes("strap") || normalized.includes("pulseira") || normalized.includes("band") || normalized.includes("bracelet")) return "smartwatch";
    if (normalized.includes("controle remoto") || normalized.includes("remote control") || normalized.includes("remote")) return "capa";
    return "acessorio";
  }
  return "";
}

function detectPieceType(normalized) {
  if (/\b(jogo|kit|conjunto)\b/.test(normalized) && /\b(toalha|toalhas|panela|panelas|talher|talheres|copo|copos|prato|pratos)\b/.test(normalized)) {
    return "";
  }
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
    .replace(/\b(celular|smartphone|tablet|notebook|laptop|tv|televisor|monitor|fone|carregador|cabo|pelicula|capa|smartwatch|relogio|relÃ³gio|accessory|acessorio|acessÃ³rio)\b/gi, " ")
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
  if (/relogio|relÃ³gio/.test(q) && normalizedCategory === "relogio") score += 25;
  if (/fone/.test(q) && normalizedCategory === "fone") score += 20;
  if (/carregador/.test(q) && normalizedCategory === "carregador") score += 20;
  if (/cabo/.test(q) && normalizedCategory === "cabo") score += 20;
  if (/pelicula|pelÃ­cula/.test(q) && normalizedCategory === "pelicula") score += 20;
  if (/capa/.test(q) && normalizedCategory === "capa") score += 20;
  if (/celular|smartphone|iphone/.test(q) && normalizedCategory === "celular") score += 25;
  if (/tv|televisor/.test(q) && normalizedCategory === "tv") score += 25;
  if (/notebook|laptop/.test(q) && normalizedCategory === "notebook") score += 25;
  if (/tv|televisor/.test(q) && /controle remoto|remote control|remote/.test(text)) score -= 35;
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

  if (!originalTitle) warnings.add("TÃ­tulo ausente");
  if (language === "cyrillic" || language === "mixed") warnings.add("TÃ­tulo transliterado para portuguÃªs");
  if (!brand) warnings.add("Marca inferida");
  if (!model) warnings.add("Modelo inferido");
  if (!normalizedCategory || normalizedCategory === "outros") warnings.add("Categoria principal inferida");
  if (isAccessory) warnings.add("Item classificado como acessÃ³rio");
  if (compatibility) warnings.add(`CompatÃ­vel com ${compatibility}`);

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



