// 外贸客户洞察：主营产品 → 标准产品与海关编码 → 客户池；以及页面间跳转参数。
// 规则来自「客户增长引擎（候选C）」原型的「市场与机会」（intelligence.js），产品对照改由产品字典提供。

import { formatHsCodes, normalizeProductName, productNames, resolveProduct, type IndustryScope } from '@/productDictionary';

export type PoolDataTier = '可数' | '可推算' | '只能定性';

/** 客户池接口按标准产品返回的一行。 */
export interface PoolProductItem {
  productName: string;
  hsCode: string;
  hsName: string;
  reachableCount: number;
  dataTier: PoolDataTier;
}

/** 一个主营产品按英文名查海关编码的结果。 */
export interface ProductLookup {
  productName: string;          // 主营产品（企业画像中的写法）
  englishName: string;          // 用来查海关编码的英文名：用户改过的优先，否则为默认英文名
  defaultEnglishName: string;   // 默认英文名：字典标准英文名；字典没有且本身是英文的用原文；否则为空
  isCustomEnglish: boolean;     // 英文名是否被用户改过
  standardName: string | null;  // 按英文名在字典中查到的标准产品
  hsCode: string | null;
  hsName: string | null;
  mergedWith: string | null;    // 与前面哪个主营产品查到同一标准产品（客户池只算一次）
}

/** 默认英文名：先按主营产品查字典取标准英文名；查不到且本身是英文的用原文；否则为空，需用户填写。 */
export function defaultEnglishName(productName: string, industry: IndustryScope): string {
  const entry = resolveProduct(productName, industry);
  if (entry) return entry.englishName;
  const trimmed = productName.trim();
  return /^[\x20-\x7E]+$/.test(trimmed) ? trimmed : '';
}

/** 英文名覆盖值按主营产品统一写法存，键见 englishNameKey。 */
export function englishNameKey(productName: string): string {
  return normalizeProductName(productName);
}

/** 用英文名查海关编码：英文名为空或字典中查不到 → 待归类。 */
export function buildProductLookups(products: string[], industry: IndustryScope, overrides: Record<string, string>): ProductLookup[] {
  const lookups: ProductLookup[] = [];
  products.forEach(productName => {
    const defaultName = defaultEnglishName(productName, industry);
    const override = overrides[englishNameKey(productName)]?.trim();
    const englishName = override || defaultName;
    const entry = englishName ? resolveProduct(englishName, industry) : null;
    const earlier = entry ? lookups.find(item => item.standardName === entry.standardName) : undefined;
    lookups.push({
      productName,
      englishName,
      defaultEnglishName: defaultName,
      isCustomEnglish: Boolean(override) && override !== defaultName,
      standardName: entry?.standardName ?? null,
      hsCode: entry ? formatHsCodes(entry.hsCodes) : null,
      hsName: entry ? entry.hsCodes.map(code => code.name).join('；') : null,
      mergedWith: earlier ? earlier.productName : null,
    });
  });
  return lookups;
}

/** 页面上的一行：已匹配到字典的标准产品（可能合并了多个写法），或未收录的「待归类」产品。 */
export interface PoolRow {
  productName: string;
  englishName: string;           // 查到这一行用的英文名（多个主营产品合并时取第一个）
  inputNames: string[];          // 用户主营产品中对应到这一行的写法
  hsCode: string | null;
  hsName: string | null;
  reachableCount: number | null; // 待归类为 null，不计入客户池
  dataTier: PoolDataTier | null;
}

/** 原型示意模型：同名产品恒得同一批数（180–599 家），生产环境由客户池接口按标准产品返回。 */
export function estimatePoolCount(productName: string): { reachableCount: number; dataTier: PoolDataTier } {
  let hash = 0;
  for (let i = 0; i < productName.length; i++) hash = (hash * 31 + productName.charCodeAt(i)) % 9973;
  const bucket = hash % 10;
  return { reachableCount: 180 + (hash % 420), dataTier: bucket < 6 ? '可数' : bucket < 9 ? '可推算' : '只能定性' };
}

/**
 * 把英文名查询结果换成客户池的行：查到同一标准产品的合并为一行（如「Brake Drum」并入「制动鼓」），按第一次出现的顺序排列；
 * 查不到的产品单独成行、标「待归类」，不计数。known 为接口已返回的数据，缺的用示意模型补。
 */
export function buildPoolRows(lookups: ProductLookup[], known: PoolProductItem[]): PoolRow[] {
  const rows: PoolRow[] = [];
  lookups.forEach(lookup => {
    if (!lookup.standardName) { rows.push({ productName: lookup.productName, englishName: lookup.englishName, inputNames: [lookup.productName], hsCode: null, hsName: null, reachableCount: null, dataTier: null }); return; }
    const existing = rows.find(row => row.hsCode !== null && row.productName === lookup.standardName);
    if (existing) { existing.inputNames.push(lookup.productName); return; }
    const estimate = known.find(item => item.productName === lookup.standardName) ?? estimatePoolCount(lookup.standardName);
    rows.push({ productName: lookup.standardName, englishName: lookup.englishName, inputNames: [lookup.productName], hsCode: lookup.hsCode, hsName: lookup.hsName, reachableCount: estimate.reachableCount, dataTier: estimate.dataTier });
  });
  return rows;
}

// ── 英文名修改的原型持久化：生产环境由主营产品英文名接口保存 ──
const ENGLISH_NAME_STORAGE_KEY = 'industry-scenario:product-english-names';

export function readEnglishNameOverrides(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ENGLISH_NAME_STORAGE_KEY) || '{}') as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeEnglishNameOverrides(overrides: Record<string, string>): void {
  try { window.localStorage.setItem(ENGLISH_NAME_STORAGE_KEY, JSON.stringify(overrides)); } catch { /* 隐私模式等场景下忽略 */ }
}

export interface PoolSummary { total: number; byTier: Record<PoolDataTier, number>; productCount: number; unmatchedCount: number }

export function summarizePool(rows: PoolRow[]): PoolSummary {
  const byTier: Record<PoolDataTier, number> = { '可数': 0, '可推算': 0, '只能定性': 0 };
  let total = 0;
  rows.forEach(row => {
    if (row.reachableCount === null || row.dataTier === null) return;
    byTier[row.dataTier] += row.reachableCount;
    total += row.reachableCount;
  });
  const unmatchedCount = rows.filter(row => row.hsCode === null).length;
  return { total, byTier, productCount: rows.length - unmatchedCount, unmatchedCount };
}

export function percentOf(part: number, total: number): number {
  return total ? Math.round(part / total * 100) : 0;
}

/** 美元金额简写：$3.20B、$562M、$45.6K。 */
export function formatUsdCompact(amount: number): string {
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [size, unit] of units) {
    if (Math.abs(amount) >= size) {
      const value = amount / size;
      return `$${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)}${unit}`;
    }
  }
  return `$${amount}`;
}

// ── 页面间跳转：市场与机会 →（名单右上角「更多」）→ 外贸客户洞察 ──
export const MARKET_OPPORTUNITY_PATH = '/customer/market-opportunity/';
export const TRADE_INSIGHT_PATH = '/customer/trade-insight/';

/** 从哪个名单的「更多」进入：全球企业发现 / 海关数据信号 */
export type TradeInsightEntry = 'discover' | 'signals';

export interface TradeInsightQuery {
  products: string[];          // 产品关键词（标准产品名）
  startDate: string;
  endDate: string;
  from: TradeInsightEntry | '';
}

/** 名单右上角「更多」：带主营产品关键词；海关数据信号另带近 3 个月的交易日期。 */
export function tradeInsightListHref(from: TradeInsightEntry, products: string[], dateRange?: { start: string; end: string }): string {
  const params = new URLSearchParams({ from });
  products.forEach(product => params.append('product', product));
  if (dateRange) { params.set('start', dateRange.start); params.set('end', dateRange.end); }
  return `${TRADE_INSIGHT_PATH}?${params.toString()}`;
}

export function readTradeInsightQuery(search: string): TradeInsightQuery {
  const params = new URLSearchParams(search);
  const from = params.get('from');
  const isDate = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  return {
    products: Array.from(new Set(params.getAll('product').map(item => item.trim()).filter(Boolean))),
    startDate: isDate(params.get('start')) ? params.get('start')! : '',
    endDate: isDate(params.get('end')) ? params.get('end')! : '',
    from: from === 'discover' || from === 'signals' ? from : '',
  };
}

/** 海关数据最新的完整日期。生产环境由海关数据接口返回；原型固定。 */
export const CUSTOMS_DATA_CUTOFF = '2026-11-30';

/** 近 N 个月：截止日所在月往前共 N 个自然月。例：2026-11-30、3 个月 → 2026-09-01 至 2026-11-30。 */
export function recentMonthsRange(cutoff: string, months = 3): { start: string; end: string } {
  const [year, month] = cutoff.split('-').map(Number);
  const index = year * 12 + (month - 1) - (months - 1);
  const startYear = Math.floor(index / 12);
  const startMonth = index % 12 + 1;
  return { start: `${startYear}-${String(startMonth).padStart(2, '0')}-01`, end: cutoff };
}

/**
 * 报关产品描述命中了哪些产品关键词（一般为产品英文名）：按产品字典的报关描述关键词、标准名、英文名与别名匹配（忽略大小写）。
 * 返回命中的关键词；字典中没有的关键词按原文直接匹配。
 */
export function matchedProducts(descriptions: string[], products: string[], industry: IndustryScope): string[] {
  const text = descriptions.join(' \n ').normalize('NFKC').toLowerCase();
  return products.filter(product => {
    const entry = resolveProduct(product, industry);
    const words = entry ? [...entry.customsKeywords, ...productNames(entry)] : [product];
    return words.some(word => text.includes(word.normalize('NFKC').toLowerCase()));
  });
}
