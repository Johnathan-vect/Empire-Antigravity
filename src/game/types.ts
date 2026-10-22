export type TabId = "home" | "finance" | "stock" | "biz" | "assets";
export type ThemeMode = "dark" | "light" | "system";
export type Speed = 0 | 1 | 2 | 5;
export type Industry = "imbiss" | "cafe" | "shop";
export type LocationId = "kiez" | "viertel" | "zentrum" | "bahnhof" | "mall";
export type CompanyScaleId = "local" | "smallChain" | "largeChain";
export type CompanyStatus = "active" | "paused" | "insolvent" | "buyback";
export type LoanOwner = "company" | "player";
export type Gender = "m" | "w" | "d";
export type Role = "kueche" | "theke" | "allround";
export type EventKind = "info" | "warning" | "critical";
export type HangarCategory = "status" | "garage" | "harbor" | "hangar";
export type CollectionCategoryId =
  | "coins"
  | "paintings"
  | "uniques"
  | "retroCars"
  | "jewels"
  | "stamps";

export interface CompanyUpgrades {
  equipment: number;
  storage: number;
  marketing: number;
  autoOrder: boolean;
}

export interface IndustryDef {
  id: Industry;
  name: string;
  blurb: string;
  minNetWorth: number;
  licenseFee: number;
  foundingFee: number;
  baseRent: number;
  avgTicket: string;
  estDailyRevenue: string;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  blurb: string;
  freqMult: number;
  rentMult: number;
  synergyIndustry?: Industry;
  synergyBonus?: number;
  synergyLabel?: string;
}

export interface CustomerTrafficBreakdown {
  hourlyTraffic: number;
  baseLocationFreq: number;
  synergyBonusPct: number;
  synergyLabel?: string;
  priceAttractivenessPct: number;
  scaleMult: number;
  hygieneFactorPct: number;
  occupancyPct: number;
  occupancyLabel: string;
  capacityMax: number;
}

export interface CompanyScaleDef {
  id: CompanyScaleId;
  name: string;
  blurb: string;
  feeMult: number;
  rentMult: number;
  volumeMult: number;
  minNetWorth: number;
}

export interface MergerDef {
  id: string;
  name: string;
  subtitle: string;
  blurb: string;
  targetIndustry: Industry;
  requirements: { industry: Industry; count: number; minLevel: number }[];
  mergerFee: number;
  synergyMult: number;
  bonusSlots: number;
  reputationGain: number;
}

export interface ProductDef {
  id: string;
  name: string;
  baseCost: number;
  fairPrice: number;
  demandWeight: number;
  unlockLevel: number;
  ownerCap: number;
  industry?: Industry;
}

export interface SupplierDef {
  id: string;
  name: string;
  priceMult: number;
  quality: number;
  blurb: string;
}

export interface SupplierOffer {
  id: string;
  name: string;
  blurb: string;
  priceMult: number;
  quality: number;
  reliability: number;
  leadTimeMinutes: number;
  hiringFee: number;
  minOrderQty: number;
  maxOrderQty: number;
  baseMaxOrderQty: number;
  maxOrderCap: number;
  growthStep: number;
  highMoodHours: number;
  satisfaction: number;
  moodGainMult: number;
  moodDecayPerDay: number;
}

export interface StockDef {
  ticker: string;
  name: string;
  sector: string;
  base: number;
  vol: number;
  dividendYield: number;
  style: "dividend" | "growth";
  blurb: string;
  logo: string;
}

export interface CryptoDef {
  symbol: string;
  name: string;
  category: string;
  base: number;
  vol: number;
  marketCapRank: number;
  isHot?: boolean;
  blurb: string;
  color: string;
}

export interface CryptoHolding {
  symbol: string;
  coins: number;
  avgCost: number;
}

export interface PossessionDef {
  id: string;
  name: string;
  category: string;
  hangar?: HangarCategory;
  blurb: string;
  price: number;
  reputation: number;
  minNetWorth: number;
  image?: string;
  comingSoon?: boolean;
}

export interface RealEstateUpgradeDef {
  id: string;
  name: string;
  cost: number;
  rentBoostPct: number;
}

export interface RealEstateDef {
  id: string;
  name: string;
  city: string;
  category: string;
  price: number;
  dailyRent: number;
  blurb: string;
  minNetWorth: number;
  accentColor: string;
  upgrades: RealEstateUpgradeDef[];
}

export interface OwnedProperty {
  propertyId: string;
  purchasedAt: number;
  upgrades: string[];
  lifetimeRent: number;
}

export interface CollectionCategoryDef {
  id: CollectionCategoryId;
  name: string;
  subtitle: string;
  bonusReputation: number;
  bonusCreditLimit: number;
  accentColor: string;
}

export interface CollectionItemDef {
  id: string;
  categoryId: CollectionCategoryId;
  name: string;
  era: string;
  price: number;
  reputation: number;
  blurb: string;
}

export interface RichListEntry {
  rank: number;
  name: string;
  title: string;
  netWorth: number;
}

export interface LifetimeStats {
  fromCompanies: number;
  fromRentals: number;
  fromDividends: number;
  fromStockTrading: number;
  fromCryptoTrading: number;
  mergersCompleted: number;
}

export interface ProductOffering {
  productId: string;
  enabled: boolean;
  price: number;
  stock: number;
  supplierId: string;
  orderedLifetime: number;
  soldLifetime?: number;
  pendingDeliveries: {
    qty: number;
    orderedQty?: number;
    arrivesAt: number;
    delayed?: boolean;
  }[];
  autoOrder?: boolean;
  contractedSupplier?: SupplierOffer | null;
  previousSupplier?: SupplierOffer | null;
  supplierBuybackPrice?: number;
  candidateSuppliers?: SupplierOffer[];
  nextSupplierSearchAt?: number;
  nextOrderAvailableAt?: number;
}

export interface Employee {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  role: Role;
  productivity: number;
  reliability: number;
  experience: number;
  wage: number;
  desiredWage: number;
  satisfaction: number;
  sickUntil: number | null;
  hiredAt: number;
}

export interface Applicant {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  role: Role;
  productivity: number;
  reliability: number;
  experience: number;
  desiredWage: number;
  expiresAt: number;
}

export interface DaySnapshot {
  day: number;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  customers: number;
}

export interface Company {
  id: string;
  name: string;
  industry: Industry;
  locationId: LocationId;
  scale?: CompanyScaleId;
  mergerId?: string;
  synergyMult?: number;
  level: number;
  cash: number;
  equityIn: number;
  equity: number;
  debt: number;
  status: CompanyStatus;
  employeeCount: number;
  productSlotMax: number;
  foundedAt: number;
  foundedAtGameYear: number;
  foundedAtIso: string;
  hygiene: number;
  hygieneBudget: number;
  rentPerDay: number;
  manager: boolean;
  managerCostPerDay: number;
  upgrades: CompanyUpgrades;
  forecast: string;
  products: ProductOffering[];
  employees: Employee[];
  todayRevenue: number;
  todayExpenses: number;
  todayCustomers: number;
  todayCogs: number;
  todayWages: number;
  lifetimeRevenue: number;
  lifetimeProfit: number;
  yesterday: DaySnapshot | null;
  history: DaySnapshot[];
  insolventAtGameDay?: number;
  buybackUntilGameDay?: number;
  buybackPrice?: number;
}

export interface Loan {
  id: string;
  owner: LoanOwner;
  companyId?: string;
  principal: number;
  remaining: number;
  annualRate: number;
  accruedInterest: number;
  createdAtGameDay: number;
}

export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
}

export interface YearEvent {
  title: string;
  body: string;
}

export interface Market {
  demand: number;
  prevDemand?: number;
  competition: number;
  competitionByIndustry?: Record<Industry, number>;
  volUntil: number;
  yearNote: string;
  pulseNote?: string;
  yearEvent?: YearEvent;
  demandByProduct: Record<string, number>;
  prevDemandByProduct?: Record<string, number>;
}

export interface EventOption {
  id: string;
  label: string;
  hint: string;
}

export interface GameEvent {
  id: string;
  kind: EventKind;
  title: string;
  body: string;
  companyId?: string;
  productId?: string;
  options: EventOption[];
  createdAt: number;
}

export interface LedgerEntry {
  id: string;
  at: number;
  label: string;
  amount: number;
  bucket:
    | "personal"
    | "company"
    | "stock"
    | "crypto"
    | "realestate"
    | "dividend"
    | "collection"
    | "loan"
    | "living"
    | "asset"
    | "license";
}

export interface NetPoint {
  t: number;
  v: number;
}

export interface OfflineReport {
  realMs: number;
  gameHours: number;
  companyProfit: number;
  stockDelta: number;
  living: number;
  result: number;
  stoppedAtYearEnd: boolean;
}

export interface InsolvencyReport {
  days: number;
  year: number;
  peakNet: number;
  endNet: number;
  fromCompanies: number;
  fromStocks: number;
  fromLiving: number;
  fromAssets: number;
  history: NetPoint[];
}

export interface Career {
  level: number;
  totalEarned: number;
  totalSpent: number;
  companiesFounded: number;
  runs: number;
  bestNetWorth: number;
}

export type CompanyTabId = "overview" | "products" | "team" | "money";

export interface UiState {
  tab: TabId;
  companyId: string | null;
  companyTab?: CompanyTabId;
  selectedTicker?: string | null;
  selectedCrypto?: string | null;
  showFounding: boolean;
  showMarketAnalysis?: boolean;
  showSettings: boolean;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastRealTs: number;
  gameMinutes: number;
  year: number;
  yearStartMinutes: number;
  rngSeed: number;
  speed: Speed;
  theme: ThemeMode;
  playerName: string;
  cash: number;
  creditLimit: number;
  reputation: number;
  licenses: Industry[];
  possessions: string[];
  realEstate: OwnedProperty[];
  collections: string[];
  companies: Company[];
  loans: Loan[];
  holdings: Holding[];
  quotes: Record<string, number>;
  quoteHistory: Record<string, number[]>;
  cryptoHoldings: CryptoHolding[];
  cryptoQuotes: Record<string, number>;
  cryptoHistory: Record<string, number[]>;
  stats: LifetimeStats;
  market: Market;
  applications: Applicant[];
  inbox: GameEvent[];
  pendingEvent: GameEvent | null;
  pendingYearEnd: boolean;
  yearNetWorthBase: number;
  ledger: LedgerEntry[];
  netHistory: NetPoint[];
  career: Career;
  seenWelcome: boolean;
  insolvent: boolean;
  insolvency: InsolvencyReport | null;
  offlineReport: OfflineReport | null;
  ui: UiState;
}

export interface SimBurst {
  companyProfit: number;
  stockDelta: number;
  living: number;
}
