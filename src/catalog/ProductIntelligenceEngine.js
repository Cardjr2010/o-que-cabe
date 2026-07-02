import {
  buildDisplayTitle,
  extractBrand,
  extractModel,
  inferCategoryFromFields,
  inferProductType,
  normalizeText,
  resolvePortugueseDisplayTitle,
  sanitizeCategory,
} from "./ProductNormalizer.js";

const DEFAULT_MIN_COUNT = 5;

const STOP_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "com",
  "sem",
  "a",
  "o",
  "os",
  "as",
  "um",
  "uma",
  "no",
  "na",
  "nos",
  "nas",
  "por",
  "of",
  "the",
  "and",
  "for",
  "to",
]);

const SOURCE_RELIABILITY = [
  { match: ["saldao"], value: 0.92 },
  { match: ["infostore", "info store"], value: 0.9 },
  { match: ["actionpay"], value: 0.88 },
  { match: ["awin"], value: 0.87 },
  { match: ["ccp"], value: 0.84 },
  { match: ["flores online"], value: 0.82 },
  { match: ["isabela flores"], value: 0.82 },
  { match: ["authentical"], value: 0.8 },
  { match: ["mi_shop", "mi shop", "mishop"], value: 0.7 },
  { match: ["mercadolivre", "mercado livre"], value: 0.68 },
];

const DEPARTMENT_RULES = [
  {
    department: "Casa e Construção",
    category: "Ferramentas",
    keywords: [
      "ferramenta",
      "furadeira",
      "parafusadeira",
      "martelete",
      "serra",
      "lixadeira",
      "esmerilhadeira",
      "chave de impacto",
      "trena",
      "alicate",
      "chave philips",
      "chave estrela",
      "chave allen",
    ],
    subcategories: [
      { label: "Parafusadeiras", keywords: ["parafusadeira", "furadeira", "chave de impacto"] },
      { label: "Serras", keywords: ["serra"] },
      { label: "Lixadeiras", keywords: ["lixadeira", "esmerilhadeira"] },
      { label: "Ferramentas Manuais", keywords: ["alicate", "trena", "chave philips", "chave allen", "chave estrela"] },
    ],
  },
  {
    department: "Casa e Construção",
    category: "Ferragens",
    keywords: [
      "parafuso",
      "porca",
      "arruela",
      "bucha",
      "prego",
      "rebite",
      "dobradi",
      "cadeado",
      "fechadura",
      "gancho",
      "argola",
      "corrente",
      "mola",
      "abracadeira",
      "abraçadeira",
    ],
    subcategories: [
      { label: "Fixação", keywords: ["parafuso", "porca", "arruela", "bucha", "prego", "rebite"] },
      { label: "Fechaduras", keywords: ["fechadura", "cadeado"] },
      { label: "Ferragens Gerais", keywords: ["dobradi", "gancho", "argola", "corrente", "mola", "abraçadeira", "abracadeira"] },
    ],
  },
  {
    department: "Casa e Construção",
    category: "Construção",
    keywords: ["cimento", "argamassa", "tinta", "selante", "vedante", "reboco", "massa corrida", "telha", "piso", "revestimento"],
    subcategories: [
      { label: "Materiais de Obra", keywords: ["cimento", "argamassa", "reboco", "massa corrida"] },
      { label: "Tintas e Selantes", keywords: ["tinta", "selante", "vedante"] },
      { label: "Revestimentos", keywords: ["telha", "piso", "revestimento"] },
    ],
  },
  {
    department: "Casa e Construção",
    category: "Casa",
    keywords: ["casa", "cozinha", "banheiro", "limpeza", "organizador", "utilidade", "utensilio", "utensílio", "decoracao", "decoração", "jardim", "lar"],
    subcategories: [
      { label: "Cozinha", keywords: ["cozinha", "utensilio", "utensílio"] },
      { label: "Organização", keywords: ["organizador", "utilidade"] },
      { label: "Decoração", keywords: ["decoracao", "decoração", "lar"] },
    ],
  },
  {
    department: "Informática",
    category: "Informática",
    keywords: [
      "ssd",
      "hd",
      "nvme",
      "memoria ram",
      "memória ram",
      "placa mãe",
      "placa mae",
      "processador",
      "roteador",
      "switch",
      "teclado",
      "mouse",
      "webcam",
      "impressora",
      "adaptador de rede",
    ],
    subcategories: [
      { label: "Armazenamento", keywords: ["ssd", "hd", "nvme"] },
      { label: "Memória", keywords: ["memoria ram", "memória ram", "ram"] },
      { label: "Redes", keywords: ["roteador", "switch", "adaptador de rede"] },
      { label: "Periféricos", keywords: ["teclado", "mouse", "webcam"] },
      { label: "Impressoras", keywords: ["impressora"] },
      { label: "Componentes", keywords: ["placa mãe", "placa mae", "processador"] },
      { label: "Tablets", keywords: ["tablet", "ipad", "galaxy tab", "redmi pad", "xiaomi pad"] },
    ],
  },
  {
    department: "Celulares",
    category: "Celulares",
    keywords: ["celular", "smartphone", "iphone", "galaxy", "redmi", "poco", "motorola", "moto", "xiaomi"],
    subcategories: [
      { label: "iPhone", keywords: ["iphone", "apple"] },
      { label: "Galaxy", keywords: ["galaxy", "samsung"] },
      { label: "Redmi", keywords: ["redmi"] },
      { label: "POCO", keywords: ["poco"] },
      { label: "Motorola", keywords: ["motorola", "moto"] },
      { label: "Xiaomi", keywords: ["xiaomi"] },
      { label: "Smartphones", keywords: ["celular", "smartphone"] },
    ],
  },
  {
    department: "Notebooks",
    category: "Notebooks",
    keywords: ["notebook", "laptop", "chromebook", "macbook", "ideapad", "thinkpad", "vivobook", "aspire", "inspiron", "loq"],
    subcategories: [
      { label: "Gaming", keywords: ["gaming", "geforce", "rtx", "gtx", "loq"] },
      { label: "Ultrafinos", keywords: ["ultra", "slim", "zenbook", "vivobook"] },
      { label: "Business", keywords: ["thinkpad", "probook", "latitude"] },
      { label: "Chromebooks", keywords: ["chromebook"] },
      { label: "MacBook", keywords: ["macbook"] },
    ],
  },
  {
    department: "Monitores",
    category: "Monitores",
    keywords: ["monitor", "led monitor", "ips", "144hz", "165hz", "240hz"],
    subcategories: [
      { label: "Monitores Gamer", keywords: ["144hz", "165hz", "240hz", "gaming"] },
      { label: "Monitores IPS", keywords: ["ips"] },
      { label: "Monitores Full HD", keywords: ["full hd", "fhd"] },
    ],
  },
  {
    department: "TVs",
    category: "TVs",
    keywords: ["tv", "smart tv", "televisão", "televisao", "oled", "qled", "4k", "roku"],
    subcategories: [
      { label: "Smart TV", keywords: ["smart tv", "smarttv"] },
      { label: "4K", keywords: ["4k"] },
      { label: "OLED", keywords: ["oled"] },
      { label: "QLED", keywords: ["qled"] },
      { label: "Roku TV", keywords: ["roku"] },
    ],
  },
  {
    department: "Áudio",
    category: "Áudio",
    keywords: ["fone", "headphone", "headset", "earbud", "buds", "airpods", "caixa de som", "soundbar", "bluetooth"],
    subcategories: [
      { label: "Fones", keywords: ["fone", "earbud", "buds", "airpods"] },
      { label: "Headsets", keywords: ["headphone", "headset"] },
      { label: "Caixas de Som", keywords: ["caixa de som"] },
      { label: "Soundbars", keywords: ["soundbar"] },
    ],
  },
  {
    department: "Flores e Presentes",
    category: "Flores e Presentes",
    keywords: ["buquê", "buque", "flores", "rosa", "cesta", "presente", "chocolate"],
    subcategories: [
      { label: "Buquês", keywords: ["buquê", "buque", "flores", "rosa"] },
      { label: "Cestas", keywords: ["cesta"] },
      { label: "Presentes", keywords: ["presente", "chocolate"] },
    ],
  },
  {
    department: "Relógios",
    category: "Relógios",
    keywords: ["relogio", "relógio", "smartwatch", "watch", "pulseira inteligente", "amazfit", "galaxy watch"],
    subcategories: [
      { label: "Smartwatch", keywords: ["smartwatch", "watch", "amazfit", "galaxy watch"] },
      { label: "Pulseiras", keywords: ["pulseira", "band"] },
      { label: "Relógios", keywords: ["relogio", "relógio"] },
    ],
  },
  {
    department: "Cabos e Carregadores",
    category: "Cabos e Carregadores",
    keywords: ["cabo", "cable", "carregador", "charger", "fonte", "adaptador", "adapter", "usb-c", "type c", "type-c"],
    subcategories: [
      { label: "Cabos", keywords: ["cabo", "cable", "usb-c", "type c", "type-c"] },
      { label: "Carregadores", keywords: ["carregador", "charger", "fonte"] },
      { label: "Adaptadores", keywords: ["adaptador", "adapter"] },
    ],
  },
  {
    department: "Peças",
    category: "Peças",
    keywords: ["peça", "peca", "replacement", "spare", "module", "modulo", "módulo", "sensor", "board", "placa", "battery", "bateria", "conector", "reposição", "reposicao"],
    subcategories: [
      { label: "Reposição", keywords: ["reposição", "reposicao", "replacement", "spare"] },
      { label: "Módulos", keywords: ["module", "modulo", "módulo", "board", "placa"] },
      { label: "Baterias", keywords: ["battery", "bateria"] },
      { label: "Conectores", keywords: ["conector"] },
    ],
  },
  {
    department: "Acessórios",
    category: "Acessórios",
    keywords: ["capa", "case", "cover", "pelicula", "film", "protector", "protetor", "vidro", "strap", "pulseira", "band", "bracelete", "dock", "power bank", "powerbank", "suporte", "stand", "holder", "base", "skin", "filtro", "shell", "bag", "casing", "acessorio", "accessory"],
    subcategories: [
      { label: "Capas", keywords: ["capa", "case", "cover", "shell"] },
      { label: "Películas", keywords: ["pelicula", "film", "protector", "protetor", "vidro"] },
      { label: "Suportes", keywords: ["suporte", "stand", "holder", "base"] },
      { label: "Pulseiras", keywords: ["strap", "pulseira", "band", "bracelete"] },
      { label: "Power Banks", keywords: ["power bank", "powerbank"] },
    ],
  },
];

const DEPARTMENT_ALIASES = new Map([
  ["construcao", "Casa e Construção"],
  ["casa", "Casa e Construção"],
  ["ferramenta", "Casa e Construção"],
  ["ferragem", "Casa e Construção"],
  ["celular", "Celulares"],
  ["notebook", "Notebooks"],
  ["monitor", "Monitores"],
  ["tv", "TVs"],
  ["fone", "Áudio"],
  ["relogio", "Relógios"],
  ["carregador", "Cabos e Carregadores"],
  ["cabo", "Cabos e Carregadores"],
  ["peca", "Peças"],
  ["acessorio", "Acessórios"],
  ["tablet", "Informática"],
  ["outros", "Outros"],
]);

const CATEGORY_ALIASES = new Map([
  ["construcao", "Construção"],
  ["casa", "Casa"],
  ["ferramenta", "Ferramentas"],
  ["ferragem", "Ferragens"],
  ["celular", "Celulares"],
  ["notebook", "Notebooks"],
  ["monitor", "Monitores"],
  ["tv", "TVs"],
  ["fone", "Fones"],
  ["relogio", "Relógios"],
  ["carregador", "Carregadores"],
  ["cabo", "Cabos"],
  ["peca", "Peças"],
  ["acessorio", "Acessórios"],
  ["tablet", "Tablets"],
  ["outros", "Outros"],
]);

const MAIN_PRODUCT_KEYWORDS = [
  "celular",
  "smartphone",
  "iphone",
  "galaxy",
  "redmi",
  "poco",
  "motorola",
  "notebook",
  "laptop",
  "chromebook",
  "macbook",
  "monitor",
  "tv",
  "televisao",
  "televisão",
  "smart tv",
  "fone",
  "headset",
  "caixa de som",
  "soundbar",
  "relogio",
  "relógio",
  "smartwatch",
  "ferramenta",
  "furadeira",
  "parafusadeira",
  "roteador",
  "impressora",
];

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
  "carregador",
  "charger",
  "adaptador",
  "adapter",
  "strap",
  "pulseira",
  "band",
  "bracelete",
  "dock",
  "power bank",
  "powerbank",
  "suporte",
  "stand",
  "holder",
  "base",
  "skin",
  "filtro",
  "shell",
  "bag",
  "casing",
  "acessorio",
  "accessory",
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
  "conector",
];

function cleanTitle(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeKey(value = "") {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function splitKeywords(value = "") {
  return normalizeKey(value)
    .split(/[\s/,+-]+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

function includesAny(text = "", terms = []) {
  const normalized = normalizeKey(text);
  return terms.some((term) => normalized.includes(normalizeKey(term)));
}

function findRule(text = "", rules = []) {
  const normalized = normalizeKey(text);
  for (const rule of rules) {
    if (includesAny(normalized, rule.keywords || rule.terms || [])) {
      return rule;
    }
  }
  return null;
}

function detectDepartment(normalizedText = "", rawCategory = "") {
  const directCategory = normalizeKey(rawCategory);
  if (DEPARTMENT_ALIASES.has(directCategory)) {
    return DEPARTMENT_ALIASES.get(directCategory);
  }
  const matched = findRule(normalizedText, DEPARTMENT_RULES);
  return matched?.department || "Outros";
}

function detectCategory(normalizedText = "", rawCategory = "", department = "Outros") {
  const directCategory = normalizeKey(rawCategory);
  if (CATEGORY_ALIASES.has(directCategory) && department !== "Outros") {
    return CATEGORY_ALIASES.get(directCategory);
  }
  const matched = findRule(normalizedText, DEPARTMENT_RULES);
  if (matched) return matched.category;
  if (department === "Informática") return "Informática";
  if (department === "Celulares") return "Celulares";
  if (department === "Notebooks") return "Notebooks";
  if (department === "Monitores") return "Monitores";
  if (department === "TVs") return "TVs";
  if (department === "Áudio") return "Áudio";
  if (department === "Flores e Presentes") return "Flores e Presentes";
  if (department === "Relógios") return "Relógios";
  if (department === "Cabos e Carregadores") return "Cabos e Carregadores";
  if (department === "Peças") return "Peças";
  if (department === "Acessórios") return "Acessórios";
  return department !== "Outros" ? department : "Outros";
}

function detectSubcategory(normalizedText = "", department = "Outros", category = "Outros") {
  const departmentRule = DEPARTMENT_RULES.find((rule) => rule.department === department && rule.category === category);
  if (!departmentRule) {
    if (category === "Celulares") {
      if (includesAny(normalizedText, ["iphone"])) return "iPhone";
      if (includesAny(normalizedText, ["galaxy"])) return "Galaxy";
      if (includesAny(normalizedText, ["redmi"])) return "Redmi";
      if (includesAny(normalizedText, ["poco"])) return "POCO";
      if (includesAny(normalizedText, ["motorola", "moto"])) return "Motorola";
      return "Smartphones";
    }
    if (category === "Notebooks") {
      if (includesAny(normalizedText, ["gaming", "rtx", "gtx", "loq"])) return "Gaming";
      if (includesAny(normalizedText, ["chromebook"])) return "Chromebook";
      if (includesAny(normalizedText, ["macbook"])) return "MacBook";
      return "Notebooks";
    }
    if (category === "TVs") {
      if (includesAny(normalizedText, ["oled"])) return "OLED";
      if (includesAny(normalizedText, ["qled"])) return "QLED";
      if (includesAny(normalizedText, ["roku"])) return "Roku TV";
      if (includesAny(normalizedText, ["4k"])) return "4K";
      return "Smart TV";
    }
    if (category === "Monitores") {
      if (includesAny(normalizedText, ["144hz", "165hz", "240hz", "gaming"])) return "Monitores Gamer";
      if (includesAny(normalizedText, ["ips"])) return "Monitores IPS";
      return "Monitores";
    }
    if (category === "Áudio") {
      if (includesAny(normalizedText, ["headphone", "headset"])) return "Headsets";
      if (includesAny(normalizedText, ["caixa de som"])) return "Caixas de Som";
      if (includesAny(normalizedText, ["soundbar"])) return "Soundbars";
      return "Fones";
    }
    if (category === "Flores e Presentes") {
      if (includesAny(normalizedText, ["buque", "buquê", "flores", "rosa"])) return "Buquês";
      if (includesAny(normalizedText, ["cesta"])) return "Cestas";
      return "Presentes";
    }
    if (category === "Relógios") {
      if (includesAny(normalizedText, ["smartwatch", "watch", "amazfit", "galaxy watch"])) return "Smartwatch";
      return "Relógios";
    }
    if (category === "Cabos e Carregadores") {
      if (includesAny(normalizedText, ["carregador", "charger", "fonte"])) return "Carregadores";
      if (includesAny(normalizedText, ["adaptador", "adapter"])) return "Adaptadores";
      return "Cabos";
    }
    if (category === "Peças") return "Peças de Reposição";
    if (category === "Acessórios") {
      if (includesAny(normalizedText, ["pelicula", "film", "vidro"])) return "Películas";
      if (includesAny(normalizedText, ["capa", "case", "cover"])) return "Capas";
      if (includesAny(normalizedText, ["cabo", "carregador"])) return "Cabos e Carregadores";
      if (includesAny(normalizedText, ["suporte", "stand", "holder"])) return "Suportes";
      return "Acessórios";
    }
    if (category === "Informática") {
      if (includesAny(normalizedText, ["ssd", "hd", "nvme"])) return "Armazenamento";
      if (includesAny(normalizedText, ["memoria ram", "memória ram", "ram"])) return "Memória";
      if (includesAny(normalizedText, ["roteador", "switch", "adaptador de rede"])) return "Redes";
      if (includesAny(normalizedText, ["teclado", "mouse", "webcam"])) return "Periféricos";
      if (includesAny(normalizedText, ["impressora"])) return "Impressoras";
      if (includesAny(normalizedText, ["tablet", "ipad", "galaxy tab", "redmi pad", "xiaomi pad"])) return "Tablets";
      return "Informática";
    }
    return category || department || "Outros";
  }
  const subcategory = departmentRule.subcategories.find((rule) => includesAny(normalizedText, rule.keywords));
  return subcategory?.label || departmentRule.category || category || department || "Outros";
}

function detectAccessory(normalizedText = "", category = "", subcategory = "") {
  if (category === "Peças") return true;
  if (category === "Acessórios") return true;
  if (category === "Cabos e Carregadores") return true;
  if (subcategory && ["Capas", "Películas", "Suportes", "Cabos", "Carregadores", "Adaptadores", "Power Banks", "Pulseiras", "Ferramentas Manuais"].includes(subcategory)) return true;
  if (includesAny(normalizedText, ACCESSORY_KEYWORDS)) return true;
  if (includesAny(normalizedText, PIECE_KEYWORDS)) return true;
  return false;
}

function detectAccessoryFamily(normalizedText = "") {
  if (includesAny(normalizedText, PIECE_KEYWORDS)) {
    return {
      department: "Peças",
      category: "Peças",
      subcategory: "Peças de Reposição",
      accessory: true,
    };
  }
  if (includesAny(normalizedText, ["cabo", "cable", "carregador", "charger", "fonte", "adaptador", "adapter", "usb-c", "type c", "type-c"])) {
    return {
      department: "Cabos e Carregadores",
      category: "Cabos e Carregadores",
      subcategory: includesAny(normalizedText, ["carregador", "charger", "fonte"]) ? "Carregadores" : includesAny(normalizedText, ["adaptador", "adapter"]) ? "Adaptadores" : "Cabos",
      accessory: true,
    };
  }
  if (includesAny(normalizedText, ["capa", "case", "cover", "pelicula", "film", "protector", "protetor", "vidro", "strap", "pulseira", "band", "bracelete", "dock", "power bank", "powerbank", "suporte", "stand", "holder", "base", "skin", "filtro", "shell", "bag", "casing", "acessorio", "accessory"])) {
    return {
      department: "Acessórios",
      category: "Acessórios",
      subcategory: includesAny(normalizedText, ["pelicula", "film", "protector", "protetor", "vidro"])
        ? "Películas"
        : includesAny(normalizedText, ["capa", "case", "cover", "shell"])
          ? "Capas"
          : includesAny(normalizedText, ["suporte", "stand", "holder", "base"])
            ? "Suportes"
            : includesAny(normalizedText, ["strap", "pulseira", "band", "bracelete"])
              ? "Pulseiras"
              : includesAny(normalizedText, ["power bank", "powerbank"])
                ? "Power Banks"
                : "Acessórios",
      accessory: true,
    };
  }
  return null;
}

function detectProductType(department = "Outros", category = "Outros", accessory = false, normalizedText = "") {
  if (accessory) return "accessory";
  if (includesAny(normalizedText, PIECE_KEYWORDS)) return "accessory";
  if (includesAny(normalizedText, ["compatível", "compativel", "compatible with", "compat with"])) return "accessory";
  if (["Casa e Construção", "Informática", "Celulares", "Notebooks", "Monitores", "TVs", "Áudio", "Flores e Presentes", "Relógios"].includes(department)) {
    return "principal";
  }
  if (["Ferramentas", "Ferragens", "Construção", "Casa", "Armazenamento", "Memória", "Redes", "Periféricos", "Impressoras", "Tablets", "Smartwatch", "Fones", "Presentes"].includes(category)) {
    return "principal";
  }
  return "principal";
}

function detectCompatibility(text = "") {
  const normalized = String(text || "");
  const patterns = [
    /compat[íi]vel com\s+(.+?)(?:[.;,]|$)/i,
    /compat[íi]vel\s+para\s+(.+?)(?:[.;,]|$)/i,
    /para\s+(.+?)(?:[.;,]|$)/i,
    /for\s+(.+?)(?:[.;,]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const value = cleanTitle(match[1]);
      if (value && value.length >= 3) return [value];
    }
  }
  return [];
}

function buildSearchKeywords(parts = []) {
  const terms = [];
  for (const part of parts.filter(Boolean)) {
    terms.push(...splitKeywords(part));
  }
  return uniqueValues(terms);
}

function sourceReliabilityScore(product = {}) {
  const sourceText = normalizeKey([
    product.marketplace,
    product.source,
    product.sourceType,
    product.seller,
    product.store,
  ].filter(Boolean).join(" "));
  for (const entry of SOURCE_RELIABILITY) {
    if (entry.match.some((term) => sourceText.includes(normalizeKey(term)))) {
      return entry.value;
    }
  }
  return 0.72;
}

function buildClassificationWarnings(product = {}, intelligence = {}) {
  const warnings = new Set();
  if (!product.originalTitle && !product.title) warnings.add("TÃ­tulo ausente");
  if (intelligence.language === "cyrillic" || intelligence.language === "mixed") warnings.add("TÃ­tulo transliterado para portuguÃªs");
  if (!intelligence.brand) warnings.add("Marca nÃ£o identificada");
  if (!intelligence.model) warnings.add("Modelo nÃ£o identificado");
  if (!intelligence.department || intelligence.department === "Outros") warnings.add("Departamento genÃ©rico");
  if (!intelligence.category || intelligence.category === "Outros") warnings.add("Categoria genÃ©rica");
  if (intelligence.productType === "accessory") warnings.add("Item classificado como acessÃ³rio");
  if (!String(product.image || product.thumbnail || "").trim()) warnings.add("Sem imagem vÃ¡lida");
  if (!String(product.affiliateUrl || product.productUrl || product.permalink || product.url || "").trim()) warnings.add("Sem link vÃ¡lido");
  if (!(Number(product.price || 0) > 0)) warnings.add("PreÃ§o invÃ¡lido");
  return [...warnings];
}

function buildClassificationConfidence(intelligence = {}, product = {}) {
  const signals = [
    intelligence.department && intelligence.department !== "Outros",
    intelligence.category && intelligence.category !== "Outros",
    Boolean(intelligence.subcategory),
    Boolean(intelligence.brand),
    Boolean(intelligence.model),
    Boolean(String(product.image || product.thumbnail || "").trim()),
    Boolean(String(product.affiliateUrl || product.productUrl || product.permalink || product.url || "").trim()),
    Number(product.price || 0) > 0,
  ].reduce((sum, flag) => sum + (flag ? 1 : 0), 0);
  const base = signals / 8;
  const penalty = intelligence.department === "Outros" ? 0.15 : 0;
  const accessoryPenalty = intelligence.productType === "accessory" ? 0.08 : 0;
  return clamp(base - penalty - accessoryPenalty, 0.05, 1);
}

function buildQualityScore(intelligence = {}, product = {}) {
  let score = 0;
  if (Number(product.price || 0) > 0) score += 18;
  if (String(product.image || product.thumbnail || "").trim()) score += 14;
  if (String(product.affiliateUrl || product.productUrl || product.permalink || product.url || "").trim()) score += 14;
  if (intelligence.department && intelligence.department !== "Outros") score += 12;
  if (intelligence.category && intelligence.category !== "Outros") score += 12;
  if (intelligence.subcategory) score += 8;
  if (intelligence.brand) score += 10;
  if (intelligence.model) score += 8;
  if (intelligence.productType === "principal") score += 8;
  if (intelligence.isAccessory) score -= 8;
  if (intelligence.department === "Outros") score -= 10;
  if ((intelligence.classificationWarnings || []).some((warning) => /gen[eé]rica|inv[aá]lido|ausente/i.test(warning))) score -= 8;
  score += Math.round(10 * sourceReliabilityScore(product));
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeCompatibility(text = "") {
  return detectCompatibility(text);
}

function buildIntelligence(product = {}) {
  const originalTitle = cleanTitle(product.originalTitle || product.displayTitle || product.title || product.name || product.productName || "");
  const displayTitle = cleanTitle(resolvePortugueseDisplayTitle(originalTitle, product.displayTitle || buildDisplayTitle(originalTitle) || originalTitle));
  const normalizedTitle = normalizeKey(displayTitle || originalTitle);
  const brand = cleanTitle(product.brand || extractBrand(displayTitle || originalTitle) || "");
  const model = cleanTitle(product.model || extractModel(displayTitle || originalTitle, brand) || "");
  const analysisText = [displayTitle, originalTitle, product.title, product.description, product.category, product.normalizedCategory, brand, model].filter(Boolean).join(" ");
  const accessoryFamily = detectAccessoryFamily(analysisText);
  const department = accessoryFamily?.department || detectDepartment(analysisText, product.normalizedCategory || product.category || "");
  const category = accessoryFamily?.category || detectCategory(analysisText, product.normalizedCategory || product.category || "", department);
  const subcategory = accessoryFamily?.subcategory || detectSubcategory(analysisText, department, category);
  const accessory = Boolean(accessoryFamily?.accessory) || detectAccessory(analysisText, category, subcategory);
  const productType = detectProductType(department, category, accessory, [displayTitle, originalTitle, product.title, product.description].filter(Boolean).join(" "));
  const compatibility = uniqueValues([
    ...(Array.isArray(product.compatibility) ? product.compatibility : []),
    ...normalizeCompatibility([displayTitle, originalTitle, product.title, product.description].filter(Boolean).join(" ")),
  ]);
  const searchKeywords = buildSearchKeywords([
    displayTitle,
    originalTitle,
    product.title,
    product.description,
    brand,
    model,
    department,
    category,
    subcategory,
    ...(compatibility || []),
  ]);
  const language = product.language || (/[^\x00-\x7F]/.test(originalTitle) ? "mixed" : "latin");
  const intelligence = {
    department,
    category,
    subcategory,
    productType,
    isAccessory: accessory,
    brand,
    model,
    searchKeywords,
    compatibility,
    qualityScore: 0,
    classificationMethod: "rules",
    classificationConfidence: 0,
    classificationWarnings: [],
    language,
    originalTitle,
    displayTitle,
  };
  intelligence.classificationWarnings = buildClassificationWarnings(product, intelligence);
  intelligence.classificationConfidence = buildClassificationConfidence(intelligence, product);
  intelligence.qualityScore = buildQualityScore(intelligence, product);
  return intelligence;
}

function summarizeGrouped(items = [], key = "department", minCount = DEFAULT_MIN_COUNT, maxItems = 14) {
  const map = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const value = cleanTitle(item?.[key] || "Outros") || "Outros";
    const entry = map.get(value) || {
      key: value,
      label: value,
      count: 0,
      sampleTitles: [],
      brands: new Set(),
      sources: new Set(),
    };
    entry.count += 1;
    const title = item.displayTitle || item.title || item.originalTitle || "";
    if (title && entry.sampleTitles.length < 3) entry.sampleTitles.push(title);
    if (item.brand) entry.brands.add(String(item.brand));
    if (item.marketplace || item.source) entry.sources.add(String(item.marketplace || item.source));
    map.set(value, entry);
  }
  return [...map.values()]
    .filter((entry) => entry.count >= minCount)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, maxItems)
    .map((entry) => ({
      category: normalizeKey(entry.key),
      label: entry.label,
      count: entry.count,
      sampleTitles: entry.sampleTitles,
      brands: [...entry.brands].sort(),
      sources: [...entry.sources].sort(),
    }));
}

function buildShortcutBudgets(category = "") {
  const key = normalizeKey(category);
  const budgets = {
    celular: [100, 250, 500, 1000, 1500],
    notebook: [500, 1000, 1500, 2500],
    monitor: [250, 500, 1000],
    tv: [500, 1000, 2000],
    relogio: [100, 250, 500],
    fone: [50, 100, 250],
    casa: [50, 100, 250, 500],
    presente: [50, 100, 250],
    ferramenta: [50, 100, 250, 500],
    ferragem: [20, 50, 100],
    construcao: [100, 250, 500],
    informatica: [250, 500, 1000, 2500],
    audio: [100, 250, 500],
    acessorios: [20, 50, 100, 250],
    peca: [20, 50, 100],
  };
  return budgets[key] || [100, 250, 500];
}

function buildShortcuts(categories = [], enrichedItems = []) {
  const countByCategory = new Map();
  const priceByCategory = new Map();
  for (const item of Array.isArray(enrichedItems) ? enrichedItems : []) {
    const key = normalizeKey(item.category || item.department || "Outros") || "outros";
    countByCategory.set(key, (countByCategory.get(key) || 0) + 1);
    const price = Number(item.price || 0);
    if (Number.isFinite(price) && price > 0) {
      const current = priceByCategory.get(key);
      if (!current || price < current) {
        priceByCategory.set(key, price);
      }
    }
  }

  return categories
    .filter((entry) => entry && entry.category && entry.category !== "outros")
    .slice(0, 6)
    .map((entry) => {
      const key = normalizeKey(entry.category);
      const minPrice = priceByCategory.get(key) || entry.minPrice || 0;
      const budgets = buildShortcutBudgets(key);
      const threshold = budgets.find((budget) => Number.isFinite(minPrice) && minPrice <= budget) || budgets[budgets.length - 1];
      return {
        label: `${entry.label} até ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(threshold)}`,
        subtitle: `${entry.count} itens reais · menor preço ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(minPrice || threshold)}`,
        query: entry.category,
        category: entry.category,
        count: entry.count,
        mode: "total",
        totalBudget: threshold,
        monthly: threshold,
        months: 12,
      };
    });
}

export function classifyProductIntelligence(product = {}) {
  return buildIntelligence(product);
}

export default class ProductIntelligenceEngine {
  constructor(options = {}) {
    this.options = {
      minCount: Number(options.minCount || DEFAULT_MIN_COUNT),
      maxHomeButtons: Number(options.maxHomeButtons || 6),
      maxDepartments: Number(options.maxDepartments || 14),
      maxCategories: Number(options.maxCategories || 6),
      focusLabel: options.focusLabel || "Catálogo inteligente",
    };
  }

  enrichProduct(product = {}) {
    const intelligence = classifyProductIntelligence(product);
    return {
      ...product,
      originalTitle: product.originalTitle || intelligence.originalTitle,
      displayTitle: product.displayTitle || intelligence.displayTitle,
      department: intelligence.department,
      category: intelligence.category,
      normalizedCategory: normalizeKey(intelligence.category) || normalizeKey(product.normalizedCategory || product.category || ""),
      subcategory: intelligence.subcategory,
      productType: intelligence.productType,
      isAccessory: intelligence.isAccessory,
      brand: intelligence.brand || product.brand || "",
      model: intelligence.model || product.model || "",
      searchKeywords: intelligence.searchKeywords,
      compatibility: intelligence.compatibility,
      qualityScore: intelligence.qualityScore,
      classificationMethod: intelligence.classificationMethod,
      classificationConfidence: intelligence.classificationConfidence,
      classificationWarnings: intelligence.classificationWarnings,
      intelligence,
    };
  }

  enrichCatalog(items = []) {
    return Array.isArray(items) ? items.map((item) => this.enrichProduct(item)) : [];
  }

  analyzeCatalog(items = []) {
    const enrichedItems = this.enrichCatalog(items);
    const beforeOutros = Array.isArray(items)
      ? items.filter((item) => normalizeKey(item.normalizedCategory || item.category || "outros") === "outros").length
      : 0;
    const afterOutros = enrichedItems.filter((item) => normalizeKey(item.category || item.department || "outros") === "outros").length;
    const departments = summarizeGrouped(enrichedItems, "department", this.options.minCount, this.options.maxDepartments);
    const categories = summarizeGrouped(enrichedItems, "category", this.options.minCount, this.options.maxCategories);
    const shortcuts = buildShortcuts(categories, enrichedItems).slice(0, this.options.maxHomeButtons);

    const topBrands = [...new Map(enrichedItems.map((item) => [String(item.brand || "sem marca"), String(item.brand || "sem marca")])).keys()]
      .map((brand) => ({
        brand,
        count: enrichedItems.filter((item) => String(item.brand || "sem marca") === brand).length,
      }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, "pt-BR"))
      .slice(0, 8);

    const sourceMap = new Map();
    for (const item of enrichedItems) {
      const key = String(item.marketplace || item.source || item.sourceType || "unknown").trim() || "unknown";
      const entry = sourceMap.get(key) || { source: key, count: 0 };
      entry.count += 1;
      sourceMap.set(key, entry);
    }
    const activeSources = [...sourceMap.values()].sort((a, b) => b.count - a.count || a.source.localeCompare(b.source, "pt-BR"));
    const sellerMap = new Map();
    for (const item of enrichedItems) {
      const seller = String(item.seller || item.store || item.marketplace || "Sem vendedor").trim() || "Sem vendedor";
      const entry = sellerMap.get(seller) || {
        seller,
        count: 0,
        categories: new Set(),
      };
      entry.count += 1;
      if (item.department || item.category) {
        entry.categories.add(String(item.department || item.category));
      }
      sellerMap.set(seller, entry);
    }
    const sellerSummary = [...sellerMap.values()]
      .sort((a, b) => b.count - a.count || a.seller.localeCompare(b.seller, "pt-BR"))
      .slice(0, 8)
      .map((entry) => ({
        seller: entry.seller,
        count: entry.count,
        categories: [...entry.categories].sort(),
      }));

    return {
      totalProducts: Array.isArray(items) ? items.length : 0,
      analyzedProducts: enrichedItems.length,
      focusLabel: this.options.focusLabel,
      beforeOutros,
      afterOutros,
      departments,
      categories,
      shortcuts,
      topBrands,
      activeSources,
      marketplaceSummary: activeSources,
      sellerSummary,
      brandSummary: topBrands,
      departmentSummary: departments,
      categorySummary: categories,
      homeCategories: categories,
      homeDepartments: departments,
      recommendations: shortcuts,
      items: enrichedItems,
    };
  }

  buildHomeData(items = []) {
    const analysis = this.analyzeCatalog(items);
    return {
      ok: true,
      totalProducts: analysis.totalProducts,
      analyzedProducts: analysis.analyzedProducts,
      focusLabel: analysis.focusLabel,
      beforeOutros: analysis.beforeOutros,
      afterOutros: analysis.afterOutros,
      departments: analysis.departments,
      categories: analysis.categories,
      searchCategories: analysis.departments,
      departmentCategories: analysis.departments,
      pechinchas: analysis.shortcuts,
      shortcuts: analysis.shortcuts,
      activeSources: analysis.activeSources,
      marketplaceSummary: analysis.marketplaceSummary,
      sellerSummary: analysis.sellerSummary,
      brandSummary: analysis.brandSummary,
      topBrands: analysis.topBrands,
      departmentSummary: analysis.departmentSummary,
      categorySummary: analysis.categorySummary,
    };
  }
}
