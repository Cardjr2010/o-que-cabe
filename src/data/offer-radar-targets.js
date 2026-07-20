export const OFFER_RADAR_TARGETS = [
  {
    id: "iphone-17-pro-max-256gb",
    label: "iPhone 17 Pro Max 256GB",
    query: "iphone 17 pro max 256gb",
    category: "celulares",
    budgets: {
      mode: "total",
      totalBudget: 12000,
      monthly: 1000,
      months: 12,
    },
    aliases: [
      "iphone 17 pro max",
      "iphone 17 pro max 256gb",
      "apple iphone 17 pro max",
    ],
    videoKey: "iphone-17-pro-max",
  },
  {
    id: "iphone-17-pro-256gb",
    label: "iPhone 17 Pro 256GB",
    query: "iphone 17 pro 256gb",
    category: "celulares",
    budgets: {
      mode: "total",
      totalBudget: 10000,
      monthly: 850,
      months: 12,
    },
    aliases: [
      "iphone 17 pro",
      "iphone 17 pro 256gb",
      "apple iphone 17 pro",
    ],
    videoKey: "iphone-17-pro-max",
  },
  {
    id: "galaxy-s26-ultra-256gb",
    label: "Galaxy S26 Ultra 256GB",
    query: "galaxy s26 ultra 256gb",
    category: "celulares",
    budgets: {
      mode: "total",
      totalBudget: 9000,
      monthly: 800,
      months: 12,
    },
    aliases: [
      "galaxy s26 ultra",
      "s26 ultra",
      "samsung galaxy s26 ultra",
      "galaxy s26 ultra 256gb",
    ],
    videoKey: "galaxy-s26-ultra",
  },
  {
    id: "notebook-i5-16gb",
    label: "Notebook i5 16GB",
    query: "notebook i5 16gb",
    category: "notebooks",
    budgets: {
      mode: "total",
      totalBudget: 4000,
      monthly: 350,
      months: 12,
    },
    aliases: [
      "notebook i5 16gb",
      "notebook core i5 16gb",
      "notebook para estudar",
    ],
    videoKey: "notebook-i5-16gb",
  },
  {
    id: "monitor-gamer-144hz",
    label: "Monitor gamer 144Hz",
    query: "monitor gamer 144hz",
    category: "monitores",
    budgets: {
      mode: "total",
      totalBudget: 1500,
      monthly: 140,
      months: 12,
    },
    aliases: [
      "monitor gamer 144hz",
      "monitor 144hz",
      "monitor gamer",
    ],
    videoKey: "monitor-gamer-144hz",
  },
  {
    id: "roteador-wifi-7",
    label: "Roteador Wi-Fi 7",
    query: "roteador wi-fi 7",
    category: "casa e construcao",
    budgets: {
      mode: "total",
      totalBudget: 1800,
      monthly: 160,
      months: 12,
    },
    aliases: [
      "roteador wi-fi 7",
      "router wifi 7",
      "tp-link archer be550",
      "xiaomi be6500",
    ],
    videoKey: "roteador-wifi-7",
  },
];

export function normalizeRadarText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findOfferRadarTarget(query = "") {
  const normalizedQuery = normalizeRadarText(query);
  if (!normalizedQuery) return null;
  return OFFER_RADAR_TARGETS.find((target) => {
    const aliases = [target.query, ...(Array.isArray(target.aliases) ? target.aliases : [])];
    return aliases.some((alias) => {
      const normalizedAlias = normalizeRadarText(alias);
      return normalizedQuery === normalizedAlias || normalizedQuery.includes(normalizedAlias);
    });
  }) || null;
}
