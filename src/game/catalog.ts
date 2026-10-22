import type {
  CollectionCategoryDef,
  CollectionCategoryId,
  CollectionItemDef,
  CommodityPrices,
  CompanyScaleDef,
  CompanyScaleId,
  CryptoDef,
  DistrictCompetitor,
  Industry,
  IndustryDef,
  LocationDef,
  LocationId,
  LoanCategory,
  MacroCycle,
  MacroState,
  MergerDef,
  PossessionDef,
  ProductDef,
  RealEstateDef,
  RichListEntry,
  StockDef,
  SupplierDef,
} from "./types";

export const SAVE_KEY = "empire.save.v2";
export const SAVE_KEY_LEGACY = "empire.save.v1";
export const SAVE_VERSION = 2;

export const START_CASH = 25_000;
export const LICENSE_IMBISS = 1_000;
export const FOUNDING_FEE = 5_000;
/** @deprecated use FOUNDING_FEE */
export const FOUNDING_COST = FOUNDING_FEE;
export const WORKING_CAPITAL = 0;
export const CREDIT_LIMIT_START = 15_000;
export const INTEREST_ANNUAL = 0.1;

export const DEFAULT_MACRO: MacroState = {
  cycle: "normal",
  interestRate: 0.065,
  inflationRate: 0.022,
  cycleDaysRemaining: 60,
  commodities: {
    meat: 1.0,
    grain: 1.0,
    coffeeBeans: 1.0,
    hardware: 1.0,
  },
  trendLabel: "Stabile Binnenkonjunktur",
};

export const PRODUCT_COMMODITY_MAP: Record<string, keyof CommodityPrices> = {
  hotdog: "meat",
  pommes: "grain",
  doener: "meat",
  pizza: "grain",
  taco: "meat",
  c_espresso: "coffeeBeans",
  c_croissant: "grain",
  c_matcha: "coffeeBeans",
  c_bagel: "grain",
  c_cake: "grain",
  s_shirt: "hardware",
  s_audio: "hardware",
  s_watch: "hardware",
  s_sneaker: "hardware",
  s_jacket: "hardware",
};

export const DEFAULT_DISTRICT_COMPETITORS: DistrictCompetitor[] = [
  {
    id: "comp_yilmaz_1",
    name: "Yilmaz Grillpalast",
    rivalName: "Tarek Yilmaz",
    industry: "imbiss",
    locationId: "bahnhof",
    marketSharePct: 35,
    reputation: 28,
  },
  {
    id: "comp_yilmaz_2",
    name: "Metropol Kiez-Döner",
    rivalName: "Tarek Yilmaz",
    industry: "imbiss",
    locationId: "kiez",
    marketSharePct: 40,
    reputation: 25,
  },
  {
    id: "comp_lindner_1",
    name: "Feinbäckerei Lindner",
    rivalName: "Nora Lindner",
    industry: "cafe",
    locationId: "viertel",
    marketSharePct: 45,
    reputation: 34,
  },
  {
    id: "comp_rossi_1",
    name: "Caffè Rossi Spezialitäten",
    rivalName: "Matteo Rossi",
    industry: "cafe",
    locationId: "zentrum",
    marketSharePct: 50,
    reputation: 52,
  },
  {
    id: "comp_vance_1",
    name: "Vance Design & Mode",
    rivalName: "Clara Vance",
    industry: "shop",
    locationId: "mall",
    marketSharePct: 48,
    reputation: 68,
  },
];

export interface CreditOfferDef {
  id: "micro" | "classic" | "invest";
  name: string;
  subtitle: string;
  annualRate: number;
  maxAmount: number;
  minReputation: number;
  minNetWorth?: number;
  blurb: string;
  badge: string;
}

export const CREDIT_OFFERS: CreditOfferDef[] = [
  {
    id: "micro",
    name: "Schneller Betriebsmittel-Kredit",
    subtitle: "Kurzfristige Liquidität ohne Bonitätsprüfung",
    annualRate: 0.115,
    maxAmount: 3_000,
    minReputation: 0,
    blurb: "Sofortige Bereitstellung für Wareneinkauf oder dringende Rechnungen.",
    badge: "Sofort verfügbar",
  },
  {
    id: "classic",
    name: "Klassischer Unternehmerkredit",
    subtitle: "Günstiges Geschäftsdarlehen für Wachstum & Ausbauten",
    annualRate: 0.078,
    maxAmount: 15_000,
    minReputation: 15,
    blurb: "Solide Wachstumsfinanzierung für Personal, Stufen-Upgrades und Werbekampagnen.",
    badge: "Ab 15 Ruf",
  },
  {
    id: "invest",
    name: "Großinvestitions-Darlehen",
    subtitle: "Zinsgünstiges Investitionskapital für Expansion & Immobilien",
    annualRate: 0.054,
    maxAmount: 85_000,
    minReputation: 25,
    minNetWorth: 50_000,
    blurb: "Niedrigzins-Finanzierung für Immobilien, Filialketten und langfristige Vermögenswerte.",
    badge: "Ab 25 Ruf",
  },
];
export const YEAR_LENGTH_DAYS = 360;
export const EARLY_YEAR_MIN_GROWTH = 0.1;
export const YEAR1_NET_WORTH_BASE = 25_000;
export const LEVEL2_REVENUE = 5_000;
export const LEVEL2_COST = 3_000;
export const LIVING_PER_DAY = 0;
export const CLEANING_COST = 40;
export const HYGIENE_START = 70;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;
export const DAYS_PER_MONTH = 30;
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const OWNER_PROD = 0.62;
export const STARTING_STOCK = 0;
export const HISTORY_CAP = 60;
export const STOCK_HISTORY_CAP = 720;
export const STOCK_SPREAD = 0.004;
export const CRYPTO_SPREAD = 0.006;
export const LEDGER_CAP = 80;
export const MAX_APPLICATIONS = 4;
export const MAX_PRODUCT_SLOTS = 5;

/** 1×: 8 echte Minuten sind ein Spieltag. */
export const REAL_MINUTES_PER_GAME_DAY = 8;
export const REAL_SECONDS_PER_GAME_DAY = REAL_MINUTES_PER_GAME_DAY * 60;
export const GAME_MINUTES_PER_REAL_SECOND = MINUTES_PER_DAY / REAL_SECONDS_PER_GAME_DAY;

export const INDUSTRIES: IndustryDef[] = [
  {
    id: "imbiss",
    name: "Imbiss & Streetfood",
    blurb: "Kompakte Gründung, schneller Warenumschlag. Der ideale Startpunkt für jeden Unternehmer.",
    minNetWorth: 0,
    licenseFee: 1_000,
    foundingFee: 5_000,
    baseRent: 20,
    avgTicket: "3–8 €",
    estDailyRevenue: "400–1.200 €",
  },
  {
    id: "cafe",
    name: "Café & Bistro",
    blurb: "Stilvoller Treffpunkt mit Spezialitätenkaffee, Snacks und hoher Kundenbindung. Höhere Margen.",
    minNetWorth: 45_000,
    licenseFee: 4_500,
    foundingFee: 14_000,
    baseRent: 45,
    avgTicket: "4–12 €",
    estDailyRevenue: "1.200–3.500 €",
  },
  {
    id: "shop",
    name: "Einzelhandel & Trendshop",
    blurb: "Mode, Premium-Audio und Lifestyle-Hardware. Hohes Warenwert-Volumen und starke Stückgewinne.",
    minNetWorth: 110_000,
    licenseFee: 12_000,
    foundingFee: 32_000,
    baseRent: 120,
    avgTicket: "40–180 €",
    estDailyRevenue: "3.000–9.000 €",
  },
];

export const LOCATIONS: LocationDef[] = [
  {
    id: "kiez",
    name: "Nebengasse / Kiez",
    blurb: "0 € Miete · 1,00× Frequenz. Solider, risikoloser Start mit starker Kiez-Streetfood-Kultur.",
    freqMult: 1.0,
    rentMult: 0,
    synergyIndustry: "imbiss",
    synergyBonus: 1.15,
    synergyLabel: "+15 % Imbiss-Synergie",
  },
  {
    id: "viertel",
    name: "Belebte Geschäftsstraße",
    blurb: "Moderate Miete · 1,22× Frequenz. Beliebte Flanier- und Ausgehmeile für Café & Bistro.",
    freqMult: 1.22,
    rentMult: 1.0,
    synergyIndustry: "cafe",
    synergyBonus: 1.25,
    synergyLabel: "+25 % Café-Synergie",
  },
  {
    id: "zentrum",
    name: "Innenstadt-Zentrum",
    blurb: "Hohe Miete · 1,50× Frequenz. Maximale Besucherströme für alle Branchen mitten in der City.",
    freqMult: 1.5,
    rentMult: 2.5,
    synergyBonus: 1.10,
    synergyLabel: "+10 % Allround-Zentrumsfrequenz",
  },
  {
    id: "bahnhof",
    name: "Hauptbahnhof / Pendlerknoten",
    blurb: "Massiver Takt · 1,75× Frequenz. Riesiges Pendleraufkommen für schnelle Snacks & To-Go.",
    freqMult: 1.75,
    rentMult: 2.0,
    synergyIndustry: "imbiss",
    synergyBonus: 1.20,
    synergyLabel: "+20 % Pendler-To-Go-Bonus",
  },
  {
    id: "mall",
    name: "Shopping-Mall & Passage",
    blurb: "Exklusive Lage · 1,60× Frequenz. Starke Kaufkraft & Premium-Zielgruppe für Mode und Trends.",
    freqMult: 1.6,
    rentMult: 2.8,
    synergyIndustry: "shop",
    synergyBonus: 1.30,
    synergyLabel: "+30 % Lifestyle- & Kaufkraft-Bonus",
  },
];

export interface ScaleUpgradeDef {
  targetScale: "smallChain" | "largeChain";
  name: string;
  minLevel: number;
  minNetWorth: number;
  feeByIndustry: Record<Industry, number>;
  volumeMult: number;
  reputationGain: number;
  perks: string[];
}

export const SCALE_UPGRADES: ScaleUpgradeDef[] = [
  {
    targetScale: "smallChain",
    name: "Kleine Ladenkette",
    minLevel: 2,
    minNetWorth: 40_000,
    feeByIndustry: {
      imbiss: 9_500,
      cafe: 22_000,
      shop: 45_000,
    },
    volumeMult: 1.65,
    reputationGain: 4,
    perks: [
      "1,65× Kundenfrequenz durch 3 Filialstandorte",
      "Offizieller Filialnetz-Status im Markt",
      "+4 Ansehen (Ruf) für deine Unternehmer-Karriere",
    ],
  },
  {
    targetScale: "largeChain",
    name: "Große Ladenkette",
    minLevel: 4,
    minNetWorth: 135_000,
    feeByIndustry: {
      imbiss: 25_000,
      cafe: 55_000,
      shop: 110_000,
    },
    volumeMult: 2.6,
    reputationGain: 8,
    perks: [
      "2,60× Kundenfrequenz im gesamten Filialverbund",
      "Zentraleinkauf: -8 % dauerhafter Einkaufsrabatt",
      "+8 Ansehen (Ruf) und höchste Markenpräsenz",
    ],
  },
];

export const COMPANY_SCALES: CompanyScaleDef[] = [
  {
    id: "local",
    name: "Lokales Geschäft",
    blurb: "Einzelstandort mit kompakter Kostenstruktur und überschaubarem Startkapital.",
    feeMult: 1.0,
    rentMult: 1.0,
    volumeMult: 1.0,
    minNetWorth: 0,
  },
  {
    id: "smallChain",
    name: "Kleine Ladenkette",
    blurb: "Drei vernetzte Filialen im Stadtgebiet — 1,65× Kundenstrom bei höheren Fixkosten.",
    feeMult: 2.4,
    rentMult: 2.1,
    volumeMult: 1.65,
    minNetWorth: 40_000,
  },
  {
    id: "largeChain",
    name: "Große Ladenkette",
    blurb: "Regionale Filialkette mit Einkaufsmacht — 2,60× Absatzvolumen und hohe Markenpräsenz.",
    feeMult: 5.2,
    rentMult: 4.2,
    volumeMult: 2.6,
    minNetWorth: 135_000,
  },
];

export const MERGERS: MergerDef[] = [
  {
    id: "streetfood_alliance",
    name: "Metropol Streetfood-Allianz",
    subtitle: "Zusammenschluss zweier Imbiss-Betriebe",
    blurb: "Bündelt zwei etablierte Imbiss-Standorte zu einer regionalen Systemgastronomie-Marke mit zentraler Küchenlogistik.",
    targetIndustry: "imbiss",
    requirements: [{ industry: "imbiss", count: 2, minLevel: 3 }],
    mergerFee: 14_000,
    synergyMult: 1.25,
    bonusSlots: 1,
    reputationGain: 6,
  },
  {
    id: "roastery_group",
    name: "Hanseatische Rösterei-Gruppe",
    subtitle: "Zusammenschluss zweier Café-Betriebe",
    blurb: "Vereint zwei erfolgreiche Cafés unter einer eigenen Spezialitäten-Rösterei mit spürbarem Margen- und Frequenzschub.",
    targetIndustry: "cafe",
    requirements: [{ industry: "cafe", count: 2, minLevel: 3 }],
    mergerFee: 32_000,
    synergyMult: 1.28,
    bonusSlots: 1,
    reputationGain: 9,
  },
  {
    id: "urban_gastro_holding",
    name: "Urban Gastro & Hospitality Holding",
    subtitle: "Cross-Merger aus Imbiss und Café",
    blurb: "Verbindet schnelles Streetfood-Geschäft und Tages-Café-Kultur zu einer ganztägig hochfrequentierten Gastro-Holding.",
    targetIndustry: "cafe",
    requirements: [
      { industry: "imbiss", count: 1, minLevel: 4 },
      { industry: "cafe", count: 1, minLevel: 3 },
    ],
    mergerFee: 45_000,
    synergyMult: 1.32,
    bonusSlots: 1,
    reputationGain: 12,
  },
  {
    id: "metropol_retail_group",
    name: "Vanguard Lifestyle & Retail Konzern",
    subtitle: "Flagship-Fusion aus Café & Einzelhandel",
    blurb: "Kombiniert Concept-Stores und Kaffeekultur zu einem hochprofitablen urbanen Lifestyle-Konzern.",
    targetIndustry: "shop",
    requirements: [
      { industry: "cafe", count: 1, minLevel: 4 },
      { industry: "shop", count: 1, minLevel: 3 },
    ],
    mergerFee: 85_000,
    synergyMult: 1.38,
    bonusSlots: 2,
    reputationGain: 18,
  },
];

export const SUPPLIER_SEARCH_COOLDOWN_MINUTES = 24 * 60; // 1 Spieltag

export const SUPPLIER_NAMES_BY_INDUSTRY: Record<Industry, string[]> = {
  imbiss: [
    "Nordfrost Großhandel",
    "Kontor Frischkost",
    "Kiez-Gastro Direkt",
    "Hanseatische Lebensmittel",
    "Metropol Gastro-Service",
    "Alpenland Feinkost",
    "Südwest Frische-Logistik",
    "Delta Food Trading",
    "Rhein-Main Großmarkt",
    "Frischwerk Express",
  ],
  cafe: [
    "Rösterei Speicherstadt",
    "Barista Kontor Nord",
    "Boulangerie & Patisserie Direkt",
    "Bio-Hofgut Sonnental",
    "Aroma Verde Import",
    "Mühlenbäckerei Kruste",
    "Caffè Cultura Großhandel",
    "Alpenmilch & Frische",
    "Stadtkaffee Manufaktur",
    "Feinbäckerei Lindner",
  ],
  shop: [
    "Nordic Design Distribution",
    "AudioTech Europe",
    "Urban Streetwear Wholesale",
    "Krono Gear Logistics",
    "Nova Trend Import",
    "Vanguard Lifestyle Supply",
    "Apex Hardware Kontor",
    "Studio Kraft Kollektion",
    "Baltikum Textil & Leder",
    "Pulse Consumer Direct",
  ],
};

export const PRODUCTS: ProductDef[] = [
  // Imbiss
  {
    id: "hotdog",
    name: "Hotdog",
    baseCost: 1.2,
    fairPrice: 3.5,
    demandWeight: 1.3,
    unlockLevel: 1,
    ownerCap: 60,
    industry: "imbiss",
  },
  {
    id: "pommes",
    name: "Pommes",
    baseCost: 0.8,
    fairPrice: 2.8,
    demandWeight: 1.3,
    unlockLevel: 1,
    ownerCap: 70,
    industry: "imbiss",
  },
  {
    id: "doener",
    name: "Döner",
    baseCost: 2.4,
    fairPrice: 6.5,
    demandWeight: 1.15,
    unlockLevel: 1,
    ownerCap: 45,
    industry: "imbiss",
  },
  {
    id: "pizza",
    name: "Pizza",
    baseCost: 2.8,
    fairPrice: 8,
    demandWeight: 1.0,
    unlockLevel: 1,
    ownerCap: 35,
    industry: "imbiss",
  },
  {
    id: "taco",
    name: "Taco",
    baseCost: 2,
    fairPrice: 5.5,
    demandWeight: 1.0,
    unlockLevel: 1,
    ownerCap: 50,
    industry: "imbiss",
  },

  // Café & Bistro
  {
    id: "c_espresso",
    name: "Espresso & Flat White",
    baseCost: 0.7,
    fairPrice: 3.4,
    demandWeight: 1.3,
    unlockLevel: 1,
    ownerCap: 65,
    industry: "cafe",
  },
  {
    id: "c_croissant",
    name: "Croissant & Gebäck",
    baseCost: 1.0,
    fairPrice: 3.8,
    demandWeight: 1.2,
    unlockLevel: 1,
    ownerCap: 55,
    industry: "cafe",
  },
  {
    id: "c_matcha",
    name: "Matcha & Iced Latte",
    baseCost: 1.5,
    fairPrice: 5.4,
    demandWeight: 1.15,
    unlockLevel: 1,
    ownerCap: 45,
    industry: "cafe",
  },
  {
    id: "c_avocado",
    name: "Avocado-Stulle & Bowl",
    baseCost: 2.8,
    fairPrice: 8.8,
    demandWeight: 1.0,
    unlockLevel: 1,
    ownerCap: 36,
    industry: "cafe",
  },
  {
    id: "c_kuchen",
    name: "Hausgemachter Kuchen",
    baseCost: 1.8,
    fairPrice: 6.2,
    demandWeight: 1.0,
    unlockLevel: 1,
    ownerCap: 40,
    industry: "cafe",
  },

  // Einzelhandel & Trendshop
  {
    id: "s_audio",
    name: "Kopfhörer & Audio",
    baseCost: 18.0,
    fairPrice: 49.0,
    demandWeight: 1.25,
    unlockLevel: 1,
    ownerCap: 25,
    industry: "shop",
  },
  {
    id: "s_streetwear",
    name: "Sneaker & Streetwear",
    baseCost: 36.0,
    fairPrice: 89.0,
    demandWeight: 1.15,
    unlockLevel: 1,
    ownerCap: 20,
    industry: "shop",
  },
  {
    id: "s_smartwatch",
    name: "Smartwatch & Zubehör",
    baseCost: 55.0,
    fairPrice: 139.0,
    demandWeight: 1.05,
    unlockLevel: 1,
    ownerCap: 15,
    industry: "shop",
  },
  {
    id: "s_backpack",
    name: "Designer-Rucksack",
    baseCost: 44.0,
    fairPrice: 115.0,
    demandWeight: 1.0,
    unlockLevel: 1,
    ownerCap: 16,
    industry: "shop",
  },
  {
    id: "s_collector",
    name: "Limitierte Sammlerbox",
    baseCost: 82.0,
    fairPrice: 220.0,
    demandWeight: 0.85,
    unlockLevel: 1,
    ownerCap: 10,
    industry: "shop",
  },
];

export const SUPPLIERS: SupplierDef[] = [
  {
    id: "billig",
    name: "Billigkost",
    priceMult: 0.8,
    quality: 0.4,
    blurb: "−20 % Einkauf, Qualität 40. Günstig, spürbar schwächere Ware.",
  },
  {
    id: "mittel",
    name: "Marktstandard",
    priceMult: 1,
    quality: 0.65,
    blurb: "Marktpreis, Qualität 65. Der Standard für den Einstieg.",
  },
  {
    id: "premium",
    name: "Premiumfrische",
    priceMult: 1.25,
    quality: 0.85,
    blurb: "+25 % Einkauf, Qualität 85. Teurer, verkauft sich besser.",
  },
];

export const STOCKS: StockDef[] = [
  {
    ticker: "HLS",
    name: "Helios Energie",
    sector: "Energie",
    base: 42.4,
    vol: 1,
    dividendYield: 0.048,
    style: "dividend",
    blurb: "Überregionaler Strom- und Netzbetreiber mit solider Grundlast und attraktiver Ausschüttung.",
    logo: "/assets/aistudio/image_d464fd1c.png",
  },
  {
    ticker: "NSB",
    name: "Nordstern Bank",
    sector: "Finanzen",
    base: 78.1,
    vol: 0.7,
    dividendYield: 0.054,
    style: "dividend",
    blurb: "Konservatives Kredit- und Geschäftskundeninstitut. Höchste Dividendenrendite im Markt.",
    logo: "/assets/stocks/NSB.svg",
  },
  {
    ticker: "KTC",
    name: "Kite Handel",
    sector: "Konsum",
    base: 31.6,
    vol: 1.15,
    dividendYield: 0.019,
    style: "growth",
    blurb: "Einzelhandels- und Lieferkette für urbane Ballungsräume. Reagiert spürbar auf Konsumtrends.",
    logo: "/assets/stocks/KTC.svg",
  },
  {
    ticker: "ATL",
    name: "Atlas Logistik",
    sector: "Industrie",
    base: 54.8,
    vol: 0.9,
    dividendYield: 0.041,
    style: "dividend",
    blurb: "Fracht-, Kühlketten- und Lagerdienstleister mit verlässlichem Auftragsbestand und stabiler Dividende.",
    logo: "/assets/stocks/ATL.svg",
  },
  {
    ticker: "LMH",
    name: "Lumina Health",
    sector: "Gesundheit",
    base: 64.2,
    vol: 0.85,
    dividendYield: 0.032,
    style: "dividend",
    blurb: "Medizintechnik und Laborversorgung. Defensiver Titel mit stabiler Wertentwicklung.",
    logo: "/assets/stocks/LMH.svg",
  },
  {
    ticker: "FRG",
    name: "Forge Industrie",
    sector: "Industrie",
    base: 28.9,
    vol: 1.2,
    dividendYield: 0.015,
    style: "growth",
    blurb: "Zyklischer Maschinen- und Anlagenbauer. Höhere Kursausschläge in volatilen Marktphasen.",
    logo: "/assets/stocks/FRG.svg",
  },
  {
    ticker: "HBF",
    name: "Hafen Foods",
    sector: "Nahrung",
    base: 22.4,
    vol: 1.05,
    dividendYield: 0.036,
    style: "dividend",
    blurb: "Großhändler für Gastronomie und Streetfood. Entwickelt sich im Takt der lokalen Essensnachfrage.",
    logo: "/assets/stocks/HBF.svg",
  },
  {
    ticker: "VTX",
    name: "Vertex Soft",
    sector: "Technologie",
    base: 91.5,
    vol: 1.35,
    dividendYield: 0.008,
    style: "growth",
    blurb: "Wachstumsstarker Cloud- und Kassensystem-Anbieter. Höchste Volatilität und größte Kurschancen.",
    logo: "/assets/stocks/VTX.svg",
  },
];

export const CRYPTOS: CryptoDef[] = [
  {
    symbol: "BTCX",
    name: "BitCrown",
    category: "Digitales Gold",
    base: 2_840,
    vol: 1.85,
    marketCapRank: 1,
    isHot: true,
    blurb: "Dezentrale Leitwährung mit höchster Marktkapitalisierung. Starkes institutionelles Vertrauen.",
    color: "#f59e0b",
  },
  {
    symbol: "ETHR",
    name: "Etherion",
    category: "Smart Contracts",
    base: 420,
    vol: 2.1,
    marketCapRank: 2,
    isHot: true,
    blurb: "Führende Plattform für dezentrale Finanzprotokolle und tokenisierte Vermögenswerte.",
    color: "#6366f1",
  },
  {
    symbol: "SOLV",
    name: "SolanaV",
    category: "High-Speed L1",
    base: 94.5,
    vol: 2.65,
    marketCapRank: 3,
    isHot: true,
    blurb: "Hochgeschwindigkeits-Blockchain für Echtzeit-Handel und mobile Web3-Anwendungen.",
    color: "#14b8a6",
  },
  {
    symbol: "NXAI",
    name: "NexusCompute",
    category: "Dezentrales Compute",
    base: 38.2,
    vol: 2.95,
    marketCapRank: 4,
    isHot: true,
    blurb: "Verteiltes GPU-Rechennetzwerk mit kräftigen Kursausschlägen bei Technologie-Hypes.",
    color: "#ec4899",
  },
  {
    symbol: "AURA",
    name: "AuraPay",
    category: "Payment & DeFi",
    base: 14.8,
    vol: 2.35,
    marketCapRank: 5,
    isHot: false,
    blurb: "Grenzüberschreitendes Settlement-Netzwerk für Handels- und Logistikunternehmen.",
    color: "#3b82f6",
  },
  {
    symbol: "KOBO",
    name: "KiezCoin",
    category: "Community Token",
    base: 2.6,
    vol: 3.6,
    marketCapRank: 6,
    isHot: false,
    blurb: "Hochspekulativer Community-Token. Extreme Tagesschwankungen für risikofreudige Trader.",
    color: "#f97316",
  },
];

export const POSSESSIONS: PossessionDef[] = [
  {
    id: "bike",
    name: "Urban Bike",
    category: "Mobilität",
    hangar: "garage",
    blurb: "Mattschwarzes Commuter-Bike mit Carbonrahmen, LED-Ringlicht und handgenähtem Ledersattel.",
    price: 1_650,
    reputation: 2,
    minNetWorth: 0,
    image: "/assets/aistudio/image_3f3f7879.png",
  },
  {
    id: "watch",
    name: "Lederchronograph",
    category: "Horologie",
    hangar: "status",
    blurb: "Roségold-Gehäuse mit cremefarbenem Zifferblatt und dunkelbraunem Alligatorlederband.",
    price: 2_400,
    reputation: 3,
    minNetWorth: 0,
    image: "/assets/aistudio/image_38874229.png",
  },
  {
    id: "suit",
    name: "Maßanzug",
    category: "Garderobe",
    hangar: "status",
    blurb: "Doppelreihiger Maßanzug aus feinster dunkelblauer Schurwolle mit bordeauxroter Seidenkrawatte.",
    price: 4_200,
    reputation: 4,
    minNetWorth: 8_000,
    image: "/assets/aistudio/image_9b86b4a3.png",
  },
  {
    id: "chrono",
    name: "Stahlchronograph",
    category: "Horologie",
    hangar: "status",
    blurb: "Manufaktur-Chronograph aus gebürstetem Edelstahl mit geriffelter Lünette und smaragdgrünem Waffel-Zifferblatt.",
    price: 9_800,
    reputation: 6,
    minNetWorth: 28_000,
    image: "/assets/aistudio/image_b8f87d51.png",
  },
  {
    id: "car",
    name: "Coupe S",
    category: "Automobil",
    hangar: "garage",
    blurb: "Skulpturales Gran-Turismo-Coupé in Liquid-Silber. Unübersehbares Statement auf jedem Vorplatz.",
    price: 54_000,
    reputation: 12,
    minNetWorth: 72_000,
    image: "/assets/aistudio/image_cd510ee1.png",
  },
  {
    id: "loft",
    name: "Loft am Kanal",
    category: "Residenz",
    hangar: "status",
    blurb: "Zweigeschossiges Backstein- und Glas-Penthouse mit begrünter Dachterrasse direkt am Kai.",
    price: 128_000,
    reputation: 16,
    minNetWorth: 90_000,
    image: "/assets/aistudio/image_655dc5c4.png",
  },
  {
    id: "limo_v12",
    name: "Chauffeur-Limousine V12",
    category: "Garage",
    hangar: "garage",
    blurb: "Gepanzerte Langversion mit Fond-Arbeitsplatz, Champagnerkühler und schallisolierter Kabine.",
    price: 195_000,
    reputation: 20,
    minNetWorth: 220_000,
  },
  {
    id: "hypercar_gt",
    name: "Carbon Hypercar R",
    category: "Garage",
    hangar: "garage",
    blurb: "Limitierter Mittelmotor-Supersportwagen aus Sichtcarbon (1 von 50 weltweit).",
    price: 680_000,
    reputation: 34,
    minNetWorth: 750_000,
  },
  {
    id: "daycruiser",
    name: "Riva-Style Daycruiser 42",
    category: "Yachthafen",
    hangar: "harbor",
    blurb: "Mahagoni-Deck, Doppel-Innenborder und Liegeplatz an der ersten Brücke im Stadthafen.",
    price: 340_000,
    reputation: 26,
    minNetWorth: 380_000,
  },
  {
    id: "superyacht",
    name: "Hochsee-Yacht Solaris 68m",
    category: "Yachthafen",
    hangar: "harbor",
    blurb: "Vier Decks, Helipad, Beach-Club und permanente Stammcrew für Empfänge auf See.",
    price: 2_450_000,
    reputation: 58,
    minNetWorth: 2_800_000,
  },
  {
    id: "turboprop",
    name: "Executive Turboprop PC-X",
    category: "Flugzeughalle",
    hangar: "hangar",
    blurb: "Kurzstrecken-Geschäftsflugzeug für spontane Termine auf allen europäischen Regionalflugplätzen.",
    price: 890_000,
    reputation: 40,
    minNetWorth: 1_000_000,
  },
  {
    id: "global_jet",
    name: "Langstrecken-Jet Falcon 9000",
    category: "Flugzeughalle",
    hangar: "hangar",
    blurb: "Interkontinentaler Privatjet mit Konferenzsuite, Schlafkabine und eigenem Hangar-Terminal.",
    price: 4_800_000,
    reputation: 85,
    minNetWorth: 5_500_000,
  },
];

export const REAL_ESTATE: RealEstateDef[] = [
  {
    id: "re_micro",
    name: "Möbliertes Kiez-Apartment",
    city: "Berlin-Kreuzberg",
    category: "Wohnimmobilie",
    price: 38_000,
    dailyRent: 105,
    minNetWorth: 20_000,
    accentColor: "#45a1b8",
    blurb: "Kompaktes City-Studio mit durchgehender Vollvermietung an Berufspendler und Expats.",
    upgrades: [
      { id: "u1", name: "Einbauküche & Parkett", cost: 6_500, rentBoostPct: 20 },
      { id: "u2", name: "Smart-Home & Glasfaser", cost: 8_200, rentBoostPct: 22 },
      { id: "u3", name: "Dachloggia-Anbau", cost: 11_000, rentBoostPct: 25 },
    ],
  },
  {
    id: "re_retail",
    name: "Eck-Ladenlokal Szenestraße",
    city: "Hamburg-Schanze",
    category: "Gewerbe",
    price: 76_000,
    dailyRent: 220,
    minNetWorth: 50_000,
    accentColor: "#d97757",
    blurb: "Erdgeschoss-Fläche mit breiter Schaufensterfront und langfristigem Index-Gewerbemietvertrag.",
    upgrades: [
      { id: "u1", name: "Messing-Schaufensterfront", cost: 13_000, rentBoostPct: 20 },
      { id: "u2", name: "Klima- & Lüftungstechnik", cost: 16_500, rentBoostPct: 22 },
      { id: "u3", name: "Außenbestuhlungs-Lizenz", cost: 21_000, rentBoostPct: 25 },
    ],
  },
  {
    id: "re_altbau",
    name: "Gründerzeit-Zinshaus",
    city: "Leipzig-Waldstraße",
    category: "Mehrfamilienhaus",
    price: 155_000,
    dailyRent: 460,
    minNetWorth: 110_000,
    accentColor: "#c4a35a",
    blurb: "Acht Wohneinheiten mit historischer Stuckfassade, begrüntem Innenhof und solider Mieterstruktur.",
    upgrades: [
      { id: "u1", name: "Fassaden- & Treppenhaussanierung", cost: 26_000, rentBoostPct: 20 },
      { id: "u2", name: "Außenaufzug & Balkone", cost: 34_000, rentBoostPct: 24 },
      { id: "u3", name: "Dachgeschoss-Ausbau", cost: 48_000, rentBoostPct: 28 },
    ],
  },
  {
    id: "re_villa",
    name: "Stadtvilla am botanischen Park",
    city: "München-Bogenhausen",
    category: "Premium-Wohnen",
    price: 310_000,
    dailyRent: 940,
    minNetWorth: 220_000,
    accentColor: "#4f9d6e",
    blurb: "Repräsentative Diplomaten- und Vorstandsvilla mit Parkgrundstück und Tiefgarage.",
    upgrades: [
      { id: "u1", name: "Naturstein-Spa & Hallenbad", cost: 54_000, rentBoostPct: 22 },
      { id: "u2", name: "Gästehaus & Orangerie", cost: 68_000, rentBoostPct: 24 },
      { id: "u3", name: "Privat-Sicherheitsanlage", cost: 82_000, rentBoostPct: 26 },
    ],
  },
  {
    id: "re_logistics",
    name: "Kühl- & Logistikterminal",
    city: "Frankfurt-Süd",
    category: "Industrie & Logistik",
    price: 580_000,
    dailyRent: 1_820,
    minNetWorth: 420_000,
    accentColor: "#5b8def",
    blurb: "Vollautomatisiertes Umschlagzentrum mit 18 Laderampen direkt am Autobahnkreuz.",
    upgrades: [
      { id: "u1", name: "Photovoltaik-Großdachanlage", cost: 95_000, rentBoostPct: 22 },
      { id: "u2", name: "Hochregal-Robotik", cost: 125_000, rentBoostPct: 25 },
      { id: "u3", name: "Tiefkühl-Erweiterungshalle", cost: 160_000, rentBoostPct: 28 },
    ],
  },
  {
    id: "re_kontor",
    name: "Historisches Kontorhaus am Kai",
    city: "Hamburg-HafenCity",
    category: "Büro & Kontor",
    price: 1_150_000,
    dailyRent: 3_700,
    minNetWorth: 850_000,
    accentColor: "#9b72cf",
    blurb: "Siebengeschossiges Klinker-Kontorhaus mit Kanzleien, Reedereien und privatem Bootsanleger.",
    upgrades: [
      { id: "u1", name: "Glas-Atrium Überdachung", cost: 190_000, rentBoostPct: 22 },
      { id: "u2", name: "Executive-Konferenzetage", cost: 245_000, rentBoostPct: 25 },
      { id: "u3", name: "Panorama-Rooftop-Restaurant", cost: 310_000, rentBoostPct: 30 },
    ],
  },
  {
    id: "re_hotel",
    name: "Grand Boutique-Hotel Bellevue",
    city: "Zürich-Seefeld",
    category: "Hotellerie",
    price: 2_250_000,
    dailyRent: 7_450,
    minNetWorth: 1_650_000,
    accentColor: "#e08e45",
    blurb: "Fünf-Sterne-Stadthotel mit 64 Suiten, Michelin-prämierter Brasserie und Seeblick.",
    upgrades: [
      { id: "u1", name: "Präsidentensuite & Penthouse", cost: 380_000, rentBoostPct: 24 },
      { id: "u2", name: "Thermal-Rooftop-Pool", cost: 460_000, rentBoostPct: 26 },
      { id: "u3", name: "Private Members Lounge", cost: 580_000, rentBoostPct: 30 },
    ],
  },
  {
    id: "re_skyline",
    name: "Skyline-Finanzturm One",
    city: "Frankfurt-Bankenviertel",
    category: "Wolkenkratzer",
    price: 4_900_000,
    dailyRent: 16_800,
    minNetWorth: 3_600_000,
    accentColor: "#38bdf8",
    blurb: "42 Etagen aus Glas und Stahl im Herzen des Bankenviertels. Das Kronjuwel jedes Immobilien-Portfolios.",
    upgrades: [
      { id: "u1", name: "Hochgeschwindigkeits-Doppeldeckaufzüge", cost: 780_000, rentBoostPct: 25 },
      { id: "u2", name: "Green-Building Platin-Zertifizierung", cost: 960_000, rentBoostPct: 28 },
      { id: "u3", name: "Sky-Lobby & Helipad-Terminal", cost: 1_250_000, rentBoostPct: 32 },
    ],
  },
];

export const COLLECTION_CATEGORIES: CollectionCategoryDef[] = [
  {
    id: "coins",
    name: "Münzen",
    subtitle: "Numismatische Raritäten & Goldprägungen",
    bonusReputation: 10,
    bonusCreditLimit: 8_000,
    accentColor: "#c4a35a",
  },
  {
    id: "paintings",
    name: "Gemälde",
    subtitle: "Meisterwerke & Zeitgenössische Kunst",
    bonusReputation: 18,
    bonusCreditLimit: 18_000,
    accentColor: "#d97757",
  },
  {
    id: "uniques",
    name: "Unikate",
    subtitle: "Historische Artefakte & Einzelstücke",
    bonusReputation: 24,
    bonusCreditLimit: 25_000,
    accentColor: "#9b72cf",
  },
  {
    id: "retroCars",
    name: "Retroautos",
    subtitle: "Klassische Concours-Automobile",
    bonusReputation: 28,
    bonusCreditLimit: 35_000,
    accentColor: "#45a1b8",
  },
  {
    id: "jewels",
    name: "Juwelen",
    subtitle: "Seltene Edelsteine & Kronjuwelen",
    bonusReputation: 32,
    bonusCreditLimit: 45_000,
    accentColor: "#4f9d6e",
  },
  {
    id: "stamps",
    name: "Briefmarken",
    subtitle: "Weltweit gesuchte Fehldrucke",
    bonusReputation: 14,
    bonusCreditLimit: 12_000,
    accentColor: "#5b8def",
  },
];

export const COLLECTION_ITEMS: CollectionItemDef[] = [
  // Münzen (4)
  {
    id: "col_coin_1",
    categoryId: "coins",
    name: "Hanseatischer Golddukaten",
    era: "1648 · Freie Reichsstadt",
    price: 4_800,
    reputation: 2,
    blurb: "Vorzüglich erhaltene Goldprägung mit klarem Stadtwappen und makellosem Rand.",
  },
  {
    id: "col_coin_2",
    categoryId: "coins",
    name: "Silbertaler Friedensschluss",
    era: "1714 · Barock-Prägung",
    price: 11_500,
    reputation: 3,
    blurb: "Seltene Gedenkprägung mit tiefem Relief und gewachsener Kabinettpatina.",
  },
  {
    id: "col_coin_3",
    categoryId: "coins",
    name: "Antike Aureus-Goldmünze",
    era: "112 n. Chr. · Rom",
    price: 29_000,
    reputation: 5,
    blurb: "Museumsreifes Einzelstück aus einer traditionsreichen europäischen Privatsammlung.",
  },
  {
    id: "col_coin_4",
    categoryId: "coins",
    name: "Doppel-Sovereign Probeprägung",
    era: "1887 · Unikat-Stempelglanz",
    price: 64_000,
    reputation: 8,
    blurb: "Weltweit sind nur drei Exemplare dieser polierten Platte bekannt.",
  },

  //Briefmarken (4)
  {
    id: "col_stamp_1",
    categoryId: "stamps",
    name: "Schwarzer Einser (Briefstück)",
    era: "1849 · Erstausgabe",
    price: 6_200,
    reputation: 2,
    blurb: "Vollrandiges Kabinettstück mit sauberem Stempelabschlag auf Büttenpapier.",
  },
  {
    id: "col_stamp_2",
    categoryId: "stamps",
    name: "Zinnoberrote Merkur-Post",
    era: "1851 · Zeitungsmarke",
    price: 16_800,
    reputation: 4,
    blurb: "Nur wenige Exemplare überstanden den täglichen Zeitungsversand unbeschädigt.",
  },
  {
    id: "col_stamp_3",
    categoryId: "stamps",
    name: "Kopfstehender Doppeldecker",
    era: "1918 · Luftpost-Fehldruck",
    price: 42_000,
    reputation: 6,
    blurb: "Berühmter Bogen-Fehldruck aus den Pionierjahren der internationalen Luftpost.",
  },
  {
    id: "col_stamp_4",
    categoryId: "stamps",
    name: "Blaue Karibik-Inselpost",
    era: "1847 · Gouverneurs-Brief",
    price: 92_000,
    reputation: 10,
    blurb: "Philatelistische Ikone auf Original-Einladungsbrief mit Fotoattest.",
  },

  // Gemälde (4)
  {
    id: "col_paint_1",
    categoryId: "paintings",
    name: "„Nebel über der Elbe“",
    era: "1908 · Nordischer Impressionismus",
    price: 18_500,
    reputation: 4,
    blurb: "Atmosphärisches Ölgemälde auf Leinwand im originalen vergoldeten Atelierrahmen.",
  },
  {
    id: "col_paint_2",
    categoryId: "paintings",
    name: "„Komposition in Kobalt & Ocker“",
    era: "1964 · Konstruktivismus",
    price: 46_000,
    reputation: 6,
    blurb: "Geometrische Farbflächenarbeit mit Ausstellungs-Provenienz aus Zürich und Paris.",
  },
  {
    id: "col_paint_3",
    categoryId: "paintings",
    name: "„Stillleben mit Nautiluspokal“",
    era: "1672 · Niederländische Schule",
    price: 118_000,
    reputation: 10,
    blurb: "Meisterhafte Lichtführung auf Eichenholztafel mit feinster Darstellung von Silber und Glas.",
  },
  {
    id: "col_paint_4",
    categoryId: "paintings",
    name: "„Nocturne der Metropole“",
    era: "1927 · Großformat-Triptychon",
    price: 265_000,
    reputation: 15,
    blurb: "Bedeutendes Hauptwerk der klassischen Moderne — ein Blickfang für jedes Penthouse.",
  },

  // Unikate (4)
  {
    id: "col_uniq_1",
    categoryId: "uniques",
    name: "Mechanisches Himmels-Astrolabium",
    era: "1585 · Messing & Silber",
    price: 24_000,
    reputation: 5,
    blurb: "Präzisionsinstrument eines Hofastronomen mit feinen Sternkarten-Gravuren.",
  },
  {
    id: "col_uniq_2",
    categoryId: "uniques",
    name: "Signiertes Weltraum-Chronometer",
    era: "1969 · Orbit-Mission",
    price: 68_000,
    reputation: 8,
    blurb: "Originales Bord-Instrument mit dokumentierter Flug-Historie und Missions-Siegel.",
  },
  {
    id: "col_uniq_3",
    categoryId: "uniques",
    name: "Bergkristall-Schachspiel",
    era: "1740 · Hofwerkstatt Wien",
    price: 154_000,
    reputation: 12,
    blurb: "Handgeschliffene Figuren aus Rauchquarz und Bergkristall auf einem Ebenholz-Turnierbrett.",
  },
  {
    id: "col_uniq_4",
    categoryId: "uniques",
    name: "Kodex der Hanseatischen Gilde",
    era: "1492 · Pergament-Handschrift",
    price: 340_000,
    reputation: 18,
    blurb: "Illuminiertes Kaufmanns-Kompendium mit Blattgold-Initialen und Samteinband.",
  },

  // Retroautos (4)
  {
    id: "col_car_1",
    categoryId: "retroCars",
    name: "Roadster 190 SL Cabriolet",
    era: "1958 · Silbergrau Metallic",
    price: 48_000,
    reputation: 6,
    blurb: "Matching-Numbers-Klassiker mit rotem Lederinterieur und Chrom-Speichenrädern.",
  },
  {
    id: "col_car_2",
    categoryId: "retroCars",
    name: "Gran Turismo 3.0 CS Coupé",
    era: "1972 · Nachtblau",
    price: 112_000,
    reputation: 10,
    blurb: "Rahmenlose Seitenscheiben, Reihensechszylinder und makellose Concours-Restaurierung.",
  },
  {
    id: "col_car_3",
    categoryId: "retroCars",
    name: "Flügeltürer 300 Gullwing",
    era: "1955 · Aluminium-Karosserie",
    price: 295_000,
    reputation: 16,
    blurb: "Einer der begehrtesten Nachkriegs-Sportwagen der Automobilgeschichte.",
  },
  {
    id: "col_car_4",
    categoryId: "retroCars",
    name: "Spyder Mille Miglia Werkswagen",
    era: "1953 · Rennhistorie",
    price: 650_000,
    reputation: 24,
    blurb: "Originaler Zwölfzylinder-Rennwagen mit dokumentiertem Klassensieg in Norditalien.",
  },

  // Juwelen (4)
  {
    id: "col_jewel_1",
    categoryId: "jewels",
    name: "Smaragd-Brosche Art Déco",
    era: "1925 · Platin & Kolumbien-Smaragd",
    price: 36_000,
    reputation: 6,
    blurb: "Streng geometrische Platinfassung mit einem tiefgrünen 6-Karat-Smaragd im Treppenschliff.",
  },
  {
    id: "col_jewel_2",
    categoryId: "jewels",
    name: "Kaschmir-Saphir Ring",
    era: "1910 · Kornblumenblau",
    price: 96_000,
    reputation: 10,
    blurb: "Unbehandelter 9-Karat-Saphir mit samtigem Glanz, flankiert von zwei Tropfendiamanten.",
  },
  {
    id: "col_jewel_3",
    categoryId: "jewels",
    name: "Collier „Étoile du Nord“",
    era: "1895 · Lupenreine Brillanten",
    price: 240_000,
    reputation: 16,
    blurb: "Historisches Galacollier mit insgesamt 48 Karat perfekt abgestimmter Altschliff-Diamanten.",
  },
  {
    id: "col_jewel_4",
    categoryId: "jewels",
    name: "Pink-Diamond Solitär „Aurora“",
    era: "Fancy Vivid Pink · 14,2 Karat",
    price: 580_000,
    reputation: 26,
    blurb: "Auktions-Rekordhalter von außergewöhnlicher Farbintensität und Reinheit.",
  },
];

export const RICH_LIST: RichListEntry[] = [
  { rank: 1, name: "Viktor von Kronenberg", title: "Kronenberg Global Reeder & Bankhaus", netWorth: 15_000_000 },
  { rank: 2, name: "Dr. Elena Lindqvist", title: "Lumina BioTech & Pharma Holding", netWorth: 8_500_000 },
  { rank: 3, name: "Henrik Falke", title: "Vertex Cloud & Venture Capital", netWorth: 4_800_000 },
  { rank: 4, name: "Charlotte de Vries", title: "De Vries Prime Real Estate", netWorth: 2_600_000 },
  { rank: 5, name: "Maximilian Dorn", title: "Dorn Maschinenbau & Stahlwerke", netWorth: 1_450_000 },
  { rank: 6, name: "Sören Albers", title: "Hanseatische Hafen- & Logistikgruppe", netWorth: 820_000 },
  { rank: 7, name: "Amina Al-Mansoor", title: "Aurum Luxury & Hospitality", netWorth: 460_000 },
  { rank: 8, name: "Konstantin Bergmann", title: "Bergmann Handelskontor", netWorth: 260_000 },
  { rank: 9, name: "Clara Vance", title: "Vance Concept Stores & Design", netWorth: 145_000 },
  { rank: 10, name: "Matteo Rossi", title: "Rossi Rösterei & Systemgastronomie", netWorth: 85_000 },
  { rank: 11, name: "Tarek Yilmaz", title: "Metropol Streetfood Kette", netWorth: 48_000 },
  { rank: 12, name: "Nora Lindner", title: "Feinbäckerei & Café-Betriebe", netWorth: 30_000 },
];

export const YEAR_EVENTS = [
  {
    title: "Mittagstisch im Viertel",
    body: "Neue Büros in der Nachbarschaft. Der Andrang zur Mittagszeit zieht an — vor allem Hotdog, Döner und Pommes.",
  },
  {
    title: "Lieferengpass Speiseöl",
    body: "Frittierware wird teurer in der Wahrnehmung. Pommes und ähnliches leiden, Getränke und Beilagen weniger.",
  },
  {
    title: "Streetfood-Hype",
    body: "Lokale Blogs schreiben über Imbisse. Tacos und Döner gewinnen, klassische Würste bleiben stabil.",
  },
  {
    title: "Bauarbeiten vor der Tür",
    body: "Weniger Laufkundschaft für ein paar Wochen. Die Konkurrenz im Kiez spürt es genauso.",
  },
  {
    title: "Neue Kette um die Ecke",
    body: "Ein Franchise eröffnet. Mehr Konkurrenz, dafür mehr Aufmerksamkeit für das Viertel.",
  },
  {
    title: "Sommertagesschicht",
    body: "Warmes Wetter, mehr Spaziergänger. Kalte und schnelle Gerichte gehen besser.",
  },
];

export const HOUR_CURVE: Record<number, number> = {
  8: 0.55,
  9: 0.7,
  10: 0.75,
  11: 1.15,
  12: 1.45,
  13: 1.35,
  14: 0.85,
  15: 0.7,
  16: 0.8,
  17: 1.05,
  18: 1.3,
  19: 1.25,
  20: 0.95,
  21: 0.6,
};

export const HINTS = {
  netWorth:
    "Gesamtvermögen = Privatkonto + Firmenkassen + Lager + Aktien- & Krypto-Depot + Immobilien − alle Schulden. Lizenz und Gründungsgebühr sind versunken.",
  cash: "Dein persönliches Girokonto. Davon zahlst du Lizenz, Eigenkapital, Einlagen, Wertpapiere, Immobilien und Sammlungen.",
  demand: "Marktweite Essensnachfrage. Verschiebt sich mit jedem Geschäftsjahr.",
  competition: "Wie hart andere Betriebe um dieselben Gäste kämpfen.",
  price: "Über dem fairen Preis sinkt die Verkaufschance, darunter steigt sie — bei weniger Marge.",
  quality: "Qualität kommt vom Lieferanten: 40 / 65 / 85. Höher heißt mehr Gäste.",
  hygiene:
    "Leichter Wert 0–100. Sinkt im Betrieb. Reinigung kostet die Unternehmenskasse, hält den Wert.",
  credit:
    "Basislimit 15.000 € (wächst durch Ruf & komplette Sammlungen) über alle Firmenkredite. 10 % Zins p. a., täglich auf die Restschuld. Keine automatische Rate — nur Sondertilgung.",
  year: "Ein Geschäftsjahr hat 360 Tage. Acht echte Minuten sind ein Spieltag (1×). Pause hält alles an. Vorzeitig beenden ab +10 % Vermögen zum Vorjahr.",
  revenue:
    "Umsatz hängt von Nachfrage, Konkurrenz, Preis, Lieferant, Hygiene, Uhrzeit, Betriebsgröße und Lager ab. Ohne Ware kein Verkauf.",
  supplier: "Billig −20 %, Standard ±0, Premium +25 % Einkauf. Qualität 40 / 65 / 85.",
  founding:
    "Lizenz einmalig je Branche. Gründungsgebühr richtet sich nach Branche und gewählter Betriebsgröße — versunken. Die Kasse füllt nur eine optionale Einlage oder späterer Transfer.",
};

export function productById(id: string): ProductDef {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown product ${id}`);
  return p;
}

export function supplierById(id: string): SupplierDef {
  const s = SUPPLIERS.find((x) => x.id === id);
  if (!s) return SUPPLIERS[1]; // Fallback zu Standard "mittel"
  return s;
}

export function stockByTicker(ticker: string): StockDef {
  const s = STOCKS.find((x) => x.ticker === ticker);
  if (!s) throw new Error(`Unknown ticker ${ticker}`);
  return s;
}

export function cryptoBySymbol(symbol: string): CryptoDef {
  const c = CRYPTOS.find((x) => x.symbol === symbol);
  if (!c) throw new Error(`Unknown crypto ${symbol}`);
  return c;
}

export function possessionById(id: string): PossessionDef {
  const p = POSSESSIONS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown possession ${id}`);
  return p;
}

export function realEstateById(id: string): RealEstateDef {
  const r = REAL_ESTATE.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown real estate ${id}`);
  return r;
}

export function collectionCategoryById(id: CollectionCategoryId): CollectionCategoryDef {
  const c = COLLECTION_CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown collection category ${id}`);
  return c;
}

export function collectionItemById(id: string): CollectionItemDef {
  const item = COLLECTION_ITEMS.find((x) => x.id === id);
  if (!item) throw new Error(`Unknown collection item ${id}`);
  return item;
}

export function companyScaleById(id?: CompanyScaleId): CompanyScaleDef {
  return COMPANY_SCALES.find((x) => x.id === (id ?? "local")) ?? COMPANY_SCALES[0]!;
}

export function scaleUpgradeByTarget(target: "smallChain" | "largeChain"): ScaleUpgradeDef {
  const up = SCALE_UPGRADES.find((x) => x.targetScale === target);
  if (!up) throw new Error(`Unknown scale upgrade target ${target}`);
  return up;
}

export function mergerById(id: string): MergerDef {
  const m = MERGERS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown merger ${id}`);
  return m;
}

export function productSlotsForLevel(level: number, bonusSlots = 0): number {
  return Math.min(MAX_PRODUCT_SLOTS + 2, Math.max(1, level) + bonusSlots);
}

export function creditLimit(reputation = 18, ownedCollections: string[] = []): number {
  const repBonus = Math.max(0, reputation - 18) * 650;
  let colBonus = 0;
  for (const cat of COLLECTION_CATEGORIES) {
    const catItems = COLLECTION_ITEMS.filter((i) => i.categoryId === cat.id);
    if (catItems.length > 0 && catItems.every((i) => ownedCollections.includes(i.id))) {
      colBonus += cat.bonusCreditLimit;
    }
  }
  return CREDIT_LIMIT_START + repBonus + colBonus;
}

export function dailyInterest(remaining: number, annualRate = INTEREST_ANNUAL): number {
  if (remaining <= 0) return 0;
  return remaining * (annualRate / YEAR_LENGTH_DAYS);
}

export function buybackPriceOf(level: number, productSlotMax: number): number {
  const extraSlots = Math.max(0, productSlotMax - 1);
  return 4_000 + level * 2_000 + extraSlots * 1_500;
}

export function volumeDiscount(orderedLifetime: number): number {
  if (orderedLifetime >= 1_200) return 0.9;
  if (orderedLifetime >= 500) return 0.94;
  if (orderedLifetime >= 180) return 0.97;
  return 1;
}

export function unitCost(productId: string, supplierId: string, orderedLifetime: number): number {
  const p = productById(productId);
  const s = supplierById(supplierId);
  return p.baseCost * s.priceMult * volumeDiscount(orderedLifetime);
}

export function yearThreshold(base: number): number {
  return Math.round(base * (1 + EARLY_YEAR_MIN_GROWTH));
}

export function industryById(id: Industry): IndustryDef {
  const ind = INDUSTRIES.find((x) => x.id === id);
  if (!ind) throw new Error(`Unknown industry ${id}`);
  return ind;
}

export function locationById(id: LocationId): LocationDef {
  const loc = LOCATIONS.find((x) => x.id === id);
  if (!loc) throw new Error(`Unknown location ${id}`);
  return loc;
}

export function productsForIndustry(industry: Industry): ProductDef[] {
  return PRODUCTS.filter((p) => (p.industry ?? "imbiss") === industry);
}

export function upgradeCostForLevel(
  industry: Industry,
  toLevel: number,
): { revenueReq: number; cost: number } {
  const mult = industry === "shop" ? 7 : industry === "cafe" ? 2.6 : 1;
  const tiers: Record<number, { rev: number; cost: number }> = {
    2: { rev: 5_000, cost: 3_000 },
    3: { rev: 15_000, cost: 7_500 },
    4: { rev: 35_000, cost: 16_000 },
    5: { rev: 75_000, cost: 32_000 },
  };
  const tier = tiers[toLevel] ?? { rev: 150_000, cost: 60_000 };
  return {
    revenueReq: Math.round(tier.rev * mult),
    cost: Math.round(tier.cost * mult),
  };
}

export function companyUpgradeCost(
  industry: Industry,
  upgrade: "equipment" | "storage" | "marketing" | "autoOrder",
  currentLevel: number,
): number {
  const mult = industry === "shop" ? 4.5 : industry === "cafe" ? 2.2 : 1;
  if (upgrade === "autoOrder") {
    return Math.round(2_500 * mult);
  }
  const baseCosts = {
    equipment: 1_200,
    storage: 1_000,
    marketing: 1_500,
  };
  const nextLvl = currentLevel + 1;
  return Math.round(baseCosts[upgrade] * nextLvl * mult);
}

export function managerCostPerDayForIndustry(industry: Industry): number {
  if (industry === "shop") return 220;
  if (industry === "cafe") return 110;
  return 55;
}
