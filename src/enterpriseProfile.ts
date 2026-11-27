// 企业画像：7 步评测的题目配置、策略匹配与原型持久化。
import type { Industry } from '@/industry';
// 题目与匹配规则来自「客户增长引擎（候选C）」原型的企业诊断（data.js / diagnosis.js）。

export type CustomerType = 'tier1' | 'aftermarket' | 'distributor' | 'mixed';
export type BusinessModel = 'oem' | 'odm' | 'trading';
export type AcquisitionChannel = 'exhibition' | 'b2b' | 'customs' | 'linkedin' | 'google' | 'referral' | 'agent';
export type DigitalLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type GlobalLevel = 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
export type GoalKey = 'growth' | 'profit' | 'global' | 'brand' | 'digital';
export type PlanId = 'A' | 'B' | 'C';

export interface DiagnosisAnswers {
  companyName: string;
  industries: Industry[];  // 所属行业，最多 10 个；第一个为主行业
  industryPrimary: string; // 主行业的一级行业（= industries[0].primary）
  industry: string;        // 主行业的二级行业：决定行业均值、四个被
  employeeCount: string;
  annualRevenue: string;
  products: string[];
  customerType: CustomerType | '';
  businessModel: BusinessModel | '';
  acquisition: AcquisitionChannel[];
  digitalLevel: DigitalLevel | '';
  globalLevel: GlobalLevel | '';
  goal: GoalKey | '';
}

export interface EnterpriseProfileRecord {
  status: 'empty' | 'completed';
  answers: DiagnosisAnswers | null;
  completedAt: string | null;
  fillCount: number;
  siteSnapshot?: SiteSnapshot | null; // 完成评测时各网站网站信息的快照，用于判断网站信息是否有变更
}

/** 所属行业最多保留的个数 */
export const MAX_INDUSTRIES = 10;

export function industryKey(industry: Industry): string {
  return `${industry.primary} / ${industry.secondary}`;
}

/** 主行业（第一个）同步到 industryPrimary / industry。 */
export function withMainIndustry(answers: DiagnosisAnswers): DiagnosisAnswers {
  const main = answers.industries[0];
  return { ...answers, industryPrimary: main?.primary ?? '', industry: main?.secondary ?? '' };
}

export interface OptionCard<T extends string> { value: T; label: string; icon: string; desc: string }

export const EMPTY_ANSWERS: DiagnosisAnswers = {
  companyName: '', industries: [], industryPrimary: '', industry: '', employeeCount: '', annualRevenue: '', products: [],
  customerType: '', businessModel: '', acquisition: [], digitalLevel: '', globalLevel: '', goal: '',
};

export const DIAGNOSIS_STEPS = [
  { step: 1, title: '企业身份识别', subtitle: '已从网站信息带入企业名称与所属行业，可修改', icon: '🏢' },
  { step: 2, title: '规模与产品', subtitle: '主营产品已汇总各网站的网站信息，可修改补充', icon: '📊' },
  { step: 3, title: '客户与经营模式', subtitle: '目标客户类型与经营方式', icon: '👥' },
  { step: 4, title: '获客现状', subtitle: '当前获客渠道与方式（可多选）', icon: '📡' },
  { step: 5, title: '数字化水平', subtitle: '评估企业当前的数字化成熟度', icon: '💻' },
  { step: 6, title: '全球化程度', subtitle: '评估企业国际化深度与广度', icon: '🌍' },
  { step: 7, title: '核心目标', subtitle: '未来 12-18 个月最重要的目标是什么？', icon: '🎯' },
] as const;

export const EMPLOYEE_OPTIONS = ['<50人', '50-200人', '200-500人', '500-2000人', '>2000人'];
export const REVENUE_OPTIONS = ['<¥1000万', '¥1000万-5000万', '¥5000万-2亿', '¥2亿-10亿', '>¥10亿'];

export const CUSTOMER_TYPE_OPTIONS: OptionCard<CustomerType>[] = [
  { value: 'tier1', label: 'Tier1/主机厂', icon: '🏭', desc: '直接供货给整车厂或一级供应商' },
  { value: 'aftermarket', label: '售后市场', icon: '🔧', desc: '面向维修和替换市场' },
  { value: 'distributor', label: '分销商/贸易商', icon: '📦', desc: '通过中间商出口' },
  { value: 'mixed', label: '混合模式', icon: '🔄', desc: '多种渠道并行' },
];

export const BUSINESS_MODEL_OPTIONS: OptionCard<BusinessModel>[] = [
  { value: 'oem', label: 'OEM配套', icon: '⚙️', desc: '按主机厂规格定制生产' },
  { value: 'odm', label: 'ODM设计+制造', icon: '🎨', desc: '自主研发设计能力' },
  { value: 'trading', label: '纯贸易出口', icon: '🚢', desc: '采购后转售' },
];

export const ACQUISITION_OPTIONS: OptionCard<AcquisitionChannel>[] = [
  { value: 'exhibition', label: '展会', icon: '🎪', desc: '广交会、Automechanika等' },
  { value: 'b2b', label: 'B2B平台', icon: '🌐', desc: '阿里巴巴国际站、中国制造网等' },
  { value: 'customs', label: '海关数据', icon: '🚢', desc: '主动搜索进口商数据' },
  { value: 'linkedin', label: 'LinkedIn开发', icon: '💼', desc: '社交媒体主动触达' },
  { value: 'google', label: 'Google搜索', icon: '🔍', desc: '自然搜索流量获客' },
  { value: 'referral', label: '老客户推荐', icon: '🤝', desc: '口碑传播与转介绍' },
  { value: 'agent', label: '外贸代理', icon: '🏢', desc: '通过代理公司出口' },
];

export const DIGITAL_LEVEL_OPTIONS: OptionCard<DigitalLevel>[] = [
  { value: 'L1', label: 'L1 · 纸质化', icon: '📋', desc: '依赖纸质记录和Excel，无管理系统' },
  { value: 'L2', label: 'L2 · 基础信息化', icon: '🖥️', desc: '有ERP/财务系统，但独立站较弱' },
  { value: 'L3', label: 'L3 · 数字化运营', icon: '🔗', desc: 'ERP+CRM+独立站基本打通' },
  { value: 'L4', label: 'L4 · 智能驱动', icon: '🤖', desc: 'AI辅助决策，数据自动化流转' },
  { value: 'L5', label: 'L5 · 数字原生', icon: '🚀', desc: '全链路数字化，AI嵌入业务流程' },
];

export const GLOBAL_LEVEL_OPTIONS: OptionCard<GlobalLevel>[] = [
  { value: 'G1', label: 'G1 · 纯内贸', icon: '🇨🇳', desc: '仅国内销售，无出口业务' },
  { value: 'G2', label: 'G2 · 出口贸易', icon: '🚢', desc: '有出口业务但渠道单一' },
  { value: 'G3', label: 'G3 · 多市场布局', icon: '🌏', desc: '2个以上海外市场，有本地代理' },
  { value: 'G4', label: 'G4 · 海外运营', icon: '🏗️', desc: '有海外仓库/办公室/团队' },
  { value: 'G5', label: 'G5 · 全球一体化', icon: '🌐', desc: '全球供应链+多地生产研发' },
];

export const GOAL_OPTIONS: OptionCard<GoalKey>[] = [
  { value: 'growth', label: '快速增长', icon: '📈', desc: '重点拓展新客户和新市场，快速做大营收' },
  { value: 'profit', label: '利润优化', icon: '💰', desc: '优化利润率，提升高价值客户占比' },
  { value: 'global', label: '全球化突破', icon: '🌍', desc: '打入新国家/区域市场，建立海外存在' },
  { value: 'brand', label: '品牌建设', icon: '🏆', desc: '提升品牌知名度和行业影响力' },
  { value: 'digital', label: '数字化转型', icon: '🔧', desc: '升级数字化能力，优化运营效率' },
];

const GOAL_STRATEGY_LABEL: Record<GoalKey, string> = {
  growth: '客户增长优先', profit: '利润结构优化', global: '全球市场突破', brand: '品牌价值提升', digital: '数字化能力升级',
};

/** 行业平均信任评分（运营清单第 5 项）：按二级行业，同行业样本企业信任评分的平均值。未提供的行业不做对比。 */
const INDUSTRY_TRUST_BENCHMARKS: Record<string, number> = { '汽车零部件': 48 };

export function industryTrustBenchmark(industry: string): number | null {
  return INDUSTRY_TRUST_BENCHMARKS[industry] ?? null;
}

/** 信任评分 = 数字化等级×8 + 全球化等级×7 + 获客渠道数×5 + 15，限制在 20–95。 */
export function computeTrustScore(digitalLevel: number, globalLevel: number, channelCount: number): number {
  return Math.min(95, Math.max(20, digitalLevel * 8 + globalLevel * 7 + channelCount * 5 + 15));
}

/** 返回该步未完成时的提示；已完成返回 null。step 从 0 开始。 */
export function validateStep(step: number, answers: DiagnosisAnswers): string | null {
  switch (step) {
    case 0:
      if (!answers.companyName.trim()) return '请填写「企业名称」';
      if (!answers.industries.length) return '请至少选择一个「所属行业」，需选到二级行业';
      if (answers.industries.length > MAX_INDUSTRIES) return `「所属行业」最多 ${MAX_INDUSTRIES} 个`;
      return null;
    case 1:
      if (!answers.employeeCount) return '请选择「员工人数」';
      if (!answers.annualRevenue) return '请选择「年营收规模」';
      if (!answers.products.length) return '请至少保留一个「主营产品」';
      return null;
    case 2:
      if (!answers.customerType) return '请选择「目标客户类型」';
      if (!answers.businessModel) return '请选择「经营模式」';
      return null;
    case 3: return answers.acquisition.length ? null : '请至少选择一个获客渠道';
    case 4: return answers.digitalLevel ? null : '请选择数字化等级';
    case 5: return answers.globalLevel ? null : '请选择全球化等级';
    case 6: return answers.goal ? null : '请选择核心目标';
    default: return null;
  }
}

export interface StrategyResult {
  planId: PlanId;
  planName: string;
  planReason: string;
  phaseLabel: string;
  goalLabel: string;
  digitalGap: number;
  globalGap: number;
  trustScore: number;
  industryBenchmark: number | null; // 行业平均信任评分，未提供时为 null
  trustGap: number | null;          // 低于行业均值的分数；高于等于为 0；无行业均值为 null
}
// 关键发现、First Win 目标、总周期暂不做（2026-11-27），需要时参考功能说明「已移除」一节。

export function matchStrategy(answers: DiagnosisAnswers): StrategyResult {
  const dl = Number((answers.digitalLevel || 'L2').slice(1));
  const gl = Number((answers.globalLevel || 'G1').slice(1));
  const channelCount = answers.acquisition.length;
  const trustScore = computeTrustScore(dl, gl, channelCount);
  const industryBenchmark = industryTrustBenchmark(answers.industry);
  const base = {
    goalLabel: GOAL_STRATEGY_LABEL[answers.goal || 'growth'],
    digitalGap: 5 - dl,
    globalGap: 5 - gl,
    trustScore,
    industryBenchmark,
    trustGap: industryBenchmark === null ? null : Math.max(0, industryBenchmark - trustScore),
  };
  if (dl >= 4 && gl >= 3) return { ...base, planId: 'A', planName: 'A-全球化加速', phaseLabel: '加速执行', planReason: `数字化L${dl}+全球化G${gl}基础扎实，核心瓶颈在品牌和获客效率` };
  if (dl <= 2 && gl <= 2) return { ...base, planId: 'B', planName: 'B-基础建设', phaseLabel: '基础建设', planReason: `数字化L${dl}+全球化G${gl}需要先补基础，再谈增长` };
  return { ...base, planId: 'C', planName: 'C-精准深耕', phaseLabel: '精准突破', planReason: `数字化L${dl}+全球化G${gl}基础OK但获客渠道单一，需要精准突破` };
}

export function optionLabel<T extends string>(options: OptionCard<T>[], value: T | ''): string {
  return options.find(option => option.value === value)?.label ?? '—';
}

// ── 多网站：从各网站的「网站管理 › 网站设置 › 网站信息」带入企业名称、所属行业、主营产品 ──
export interface SiteInfo {
  siteId: string;
  siteName: string;
  domain: string;
  companyName: string;       // 网站信息 › 公司名称
  industries: Industry[];    // 网站信息 › 所属行业（主行业 + 额外行业），未设置为空
  mainProducts: string[];    // 网站信息 › 主营产品（标签）
}

export interface CompanyNameOption { companyName: string; siteNames: string[] }
export interface AggregatedProduct { name: string; siteNames: string[] }
export interface AggregatedIndustry { industry: Industry; siteNames: string[] }

/** 各网站的公司名称（按网站顺序），相同名称合并并记下来源网站，空的跳过。 */
export function companyNameOptions(sites: SiteInfo[]): CompanyNameOption[] {
  const options: CompanyNameOption[] = [];
  sites.forEach(site => {
    const name = site.companyName.trim();
    if (!name) return;
    const existing = options.find(option => option.companyName === name);
    if (existing) existing.siteNames.push(site.siteName); else options.push({ companyName: name, siteNames: [site.siteName] });
  });
  return options;
}

/** 多网站所属行业汇总：按网站顺序、每个网站内按行业顺序全部列出，相同行业合并并记下来源网站；只取到二级的行业。 */
export function aggregateIndustries(sites: SiteInfo[]): AggregatedIndustry[] {
  const result: AggregatedIndustry[] = [];
  sites.forEach(site => site.industries.forEach(industry => {
    if (!industry.primary || !industry.secondary) return;
    const existing = result.find(item => industryKey(item.industry) === industryKey(industry));
    if (existing) { if (!existing.siteNames.includes(site.siteName)) existing.siteNames.push(site.siteName); return; }
    result.push({ industry: { primary: industry.primary, secondary: industry.secondary }, siteNames: [site.siteName] });
  }));
  return result;
}

/** 多网站主营产品聚合：按网站顺序取标签，去首尾空格，忽略大小写与全/半角差异去重，保留第一次出现的写法与顺序。 */
export function aggregateMainProducts(sites: SiteInfo[]): AggregatedProduct[] {
  const products: AggregatedProduct[] = [];
  const keyOf = (name: string) => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  sites.forEach(site => site.mainProducts.forEach(raw => {
    const name = raw.trim();
    if (!name) return;
    const existing = products.find(item => keyOf(item.name) === keyOf(name));
    if (existing) { if (!existing.siteNames.includes(site.siteName)) existing.siteNames.push(site.siteName); return; }
    products.push({ name, siteNames: [site.siteName] });
  }));
  return products;
}

/** 第 1 步从网站信息带入的值：企业名称取第一个有公司名称的网站；所属行业为各网站行业汇总，保留前 10 个，第一个为主行业。 */
export function identityFromSites(sites: SiteInfo[]): Pick<DiagnosisAnswers, 'companyName' | 'industries' | 'industryPrimary' | 'industry'> {
  const industries = aggregateIndustries(sites).slice(0, MAX_INDUSTRIES).map(item => item.industry);
  const { industryPrimary, industry } = withMainIndustry({ ...EMPTY_ANSWERS, industries });
  return { companyName: companyNameOptions(sites)[0]?.companyName ?? '', industries, industryPrimary, industry };
}

/** 首次填写时的初始答案：第 1 步见 identityFromSites，主营产品为多网站聚合。 */
export function answersFromSites(sites: SiteInfo[]): DiagnosisAnswers {
  return { ...EMPTY_ANSWERS, ...identityFromSites(sites), products: aggregateMainProducts(sites).map(item => item.name) };
}

// ── 网站信息变更：完成评测时存快照，之后与当前网站信息比较；有变更只提示，评测结果由用户手动重新评测 ──
export interface SiteSnapshot { companyNames: string[]; industries: string[]; products: string[] }
export interface SiteChange { field: '公司名称' | '所属行业' | '主营产品'; added: string[]; removed: string[] }

export function siteSnapshot(sites: SiteInfo[]): SiteSnapshot {
  return {
    companyNames: companyNameOptions(sites).map(item => item.companyName),
    industries: aggregateIndustries(sites).map(item => industryKey(item.industry)),
    products: aggregateMainProducts(sites).map(item => item.name),
  };
}

export function diffSiteSnapshot(saved: SiteSnapshot, current: SiteSnapshot): SiteChange[] {
  const keyOf = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const diff = (field: SiteChange['field'], before: string[], after: string[]): SiteChange | null => {
    const added = after.filter(item => !before.some(old => keyOf(old) === keyOf(item)));
    const removed = before.filter(item => !after.some(now => keyOf(now) === keyOf(item)));
    return added.length || removed.length ? { field, added, removed } : null;
  };
  return [
    diff('公司名称', saved.companyNames, current.companyNames),
    diff('所属行业', saved.industries, current.industries),
    diff('主营产品', saved.products, current.products),
  ].filter((item): item is SiteChange => item !== null);
}

// ── 原型持久化：生产环境由 GET/PUT /api/industry-scenario/enterprise-profile 承担 ──
// 概况页与企业画像页是两个独立路由，用 localStorage 让「已填写」状态在页面间保留。
const STORAGE_KEY = 'industry-scenario:enterprise-profile';

export function readStoredProfile(): EnterpriseProfileRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EnterpriseProfileRecord;
    if (parsed.status !== 'completed' || !parsed.answers) return null;
    return { ...parsed, answers: { ...EMPTY_ANSWERS, ...parsed.answers } };
  } catch {
    return null;
  }
}

export function writeStoredProfile(record: EnterpriseProfileRecord): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* 隐私模式等场景下忽略 */ }
}
