import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Pencil, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { CustomerShell } from '@/components/PortalShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { readStoredProfile } from '@/enterpriseProfile';
import {
  CUSTOMS_DATA_CUTOFF, buildPoolRows, buildProductLookups, englishNameKey, formatUsdCompact, percentOf, readEnglishNameOverrides, recentMonthsRange, summarizePool, tradeInsightListHref, writeEnglishNameOverrides,
  type PoolDataTier, type PoolProductItem, type ProductLookup,
} from '@/tradeInsight';

// ── 类型 ────────────────────────────────────────────────
type Opportunity = '极高' | '高' | '中';
type SignalLevel = '高' | '中高' | '中' | '监测';
interface TargetMarket { countryName: string; countryFlag: string; importAmountUsd: number; yoyGrowth: string; buyerCount: number; opportunity: Opportunity }
interface MarketTrend { periodLabel: string; industryInsight: string; markets: TargetMarket[] }
interface DiscoverCompany { id: string; companyName: string; countryName: string; countryFlag: string; employeeCount: string; annualRevenue: string; hasCustomsRecord: boolean; matchScore: number; logoText: string; logoColor: string }
interface CustomsSignal { id: string; companyName: string; countryName: string; countryFlag: string; importChange3m: string; signalLevel: SignalLevel; insight: string; logoText: string; logoColor: string }
interface ProductEnglishName { productName: string; englishName: string }
type LeadSource = '全球企业发现' | '海关数据';

// ── 配置常量（静态映射，不进 meta.json）────────────────────
const OPPORTUNITY_CONFIG: Record<Opportunity, { className: string }> = { '极高': { className: 'mo-bar-top' }, '高': { className: 'mo-bar-high' }, '中': { className: 'mo-bar-mid' } };
const TIER_CONFIG: Record<PoolDataTier, { note: string }> = {
  '可数': { note: '可直接当分目录入' },
  '可推算': { note: '推导链条须可被挑战' },
  '只能定性': { note: '给区间，不给假精确' },
};
// 尚未填写企业画像时的示例产品与行业
const SAMPLE_PRODUCTS = ['制动盘', '制动鼓', '轮毂单元'];
const SAMPLE_INDUSTRY = '汽车零部件';

// ── 动态数据（DataSlot）──────────────────────────────────
// 主营产品已保存的英文名（用户在本页修改过的）。未保存的产品用产品字典的标准英文名；原型另叠加浏览器中保存的修改。
const mockProductEnglishNamesData: ProductEnglishName[] = [
  { productName: '制动盘', englishName: 'Brake Disc' },
  { productName: '制动鼓', englishName: 'Brake Drum' },
  { productName: '轮毂单元', englishName: 'Wheel Hub Unit' },
];

// 客户池按标准产品返回（主营产品按英文名查产品字典换成标准产品）；原型对未在此列出的标准产品用示意模型估算。
const mockCustomerPoolData: PoolProductItem[] = [
  { productName: '制动盘', hsCode: '8708.30', hsName: '制动器及其零件', reachableCount: 382, dataTier: '可数' },
  { productName: '制动鼓', hsCode: '8708.30', hsName: '制动器及其零件', reachableCount: 288, dataTier: '可推算' },
  { productName: '轮毂单元', hsCode: '8708.70', hsName: '车轮及其零件', reachableCount: 493, dataTier: '可数' },
  { productName: '轮毂轴承', hsCode: '8708.70', hsName: '车轮及其零件', reachableCount: 64, dataTier: '只能定性' },
];

const mockMarketTrendData: MarketTrend = {
  periodLabel: '近12个月',
  industryInsight: '全球制动系统零部件市场2024-2028 CAGR预计5.8%，轻量化和电动化趋势驱动新需求。墨西哥受近岸外包政策驱动，建议优先配置西语资料。',
  markets: [
    // 近 12 个月进口额，统一折算美元（欧元按 1.08 折算）；按进口额从高到低
    { countryName: '美国', countryFlag: '🇺🇸', importAmountUsd: 3_200_000_000, yoyGrowth: '+15%', buyerCount: 2800, opportunity: '高' },
    { countryName: '德国', countryFlag: '🇩🇪', importAmountUsd: 3_024_000_000, yoyGrowth: '+22%', buyerCount: 1200, opportunity: '高' },
    { countryName: '墨西哥', countryFlag: '🇲🇽', importAmountUsd: 1_100_000_000, yoyGrowth: '+28%', buyerCount: 650, opportunity: '极高' },
    { countryName: '泰国', countryFlag: '🇹🇭', importAmountUsd: 680_000_000, yoyGrowth: '+18%', buyerCount: 420, opportunity: '中' },
    { countryName: '波兰', countryFlag: '🇵🇱', importAmountUsd: 562_000_000, yoyGrowth: '+31%', buyerCount: 340, opportunity: '高' },
    { countryName: '巴西', countryFlag: '🇧🇷', importAmountUsd: 480_000_000, yoyGrowth: '+19%', buyerCount: 290, opportunity: '中' },
    { countryName: '西班牙', countryFlag: '🇪🇸', importAmountUsd: 443_000_000, yoyGrowth: '+12%', buyerCount: 260, opportunity: '中' },
  ],
};

const mockDiscoverCompaniesData: DiscoverCompany[] = [
  { id: 'dc-nemak', companyName: 'Nemak S.A.B.', countryName: '墨西哥', countryFlag: '🇲🇽', employeeCount: '22,000人', annualRevenue: '$4.2B', hasCustomsRecord: true, matchScore: 95, logoText: 'NM', logoColor: '#047857' },
  { id: 'dc-mubea', companyName: 'Mubea GmbH', countryName: '德国', countryFlag: '🇩🇪', employeeCount: '12,000人', annualRevenue: '€2.5B', hasCustomsRecord: true, matchScore: 92, logoText: 'MB', logoColor: '#0f766e' },
  { id: 'dc-benteler', companyName: 'Benteler Automotive', countryName: '德国', countryFlag: '🇩🇪', employeeCount: '30,000人', annualRevenue: '€8.5B', hasCustomsRecord: true, matchScore: 88, logoText: 'BN', logoColor: '#155e75' },
  { id: 'dc-gestamp', companyName: 'Gestamp', countryName: '西班牙', countryFlag: '🇪🇸', employeeCount: '43,000人', annualRevenue: '€9.1B', hasCustomsRecord: true, matchScore: 85, logoText: 'GS', logoColor: '#b45309' },
  { id: 'dc-zf', companyName: 'ZF Friedrichshafen', countryName: '德国', countryFlag: '🇩🇪', employeeCount: '160,000人', annualRevenue: '€46.6B', hasCustomsRecord: true, matchScore: 84, logoText: 'ZF', logoColor: '#1e3a8a' },
  { id: 'dc-aisin', companyName: 'Aisin Seiki', countryName: '日本', countryFlag: '🇯🇵', employeeCount: '120,000人', annualRevenue: '¥4.9T', hasCustomsRecord: false, matchScore: 82, logoText: 'AS', logoColor: '#0e7490' },
  { id: 'dc-meritor', companyName: 'Meritor Inc.', countryName: '美国', countryFlag: '🇺🇸', employeeCount: '9,600人', annualRevenue: '$4.5B', hasCustomsRecord: true, matchScore: 80, logoText: 'MR', logoColor: '#b91c1c' },
];

const mockCustomsSignalsData: CustomsSignal[] = [
  { id: 'cs-brose', companyName: 'Brose Group', countryName: '德国', countryFlag: '🇩🇪', importChange3m: '↑35%', signalLevel: '高', insight: '已终止与一家中国供应商合作——切入窗口', logoText: 'BR', logoColor: '#1e40af' },
  { id: 'cs-nemak', companyName: 'Nemak S.A.B.', countryName: '墨西哥', countryFlag: '🇲🇽', importChange3m: '↑22%', signalLevel: '中高', insight: '供应链多元化，首次从亚洲采购制动零部件', logoText: 'NM', logoColor: '#047857' },
  { id: 'cs-dana', companyName: 'Dana Inc.', countryName: '美国', countryFlag: '🇺🇸', importChange3m: '↑18%', signalLevel: '中', insight: '现有供应商产能不足，寻找第二货源', logoText: 'DN', logoColor: '#dc2626' },
  { id: 'cs-mubea', companyName: 'Mubea GmbH', countryName: '德国', countryFlag: '🇩🇪', importChange3m: '→ 平稳', signalLevel: '监测', insight: '长期稳定采购，轻量化需求增加', logoText: 'MB', logoColor: '#0f766e' },
  { id: 'cs-autodoc', companyName: 'Autodoc SE', countryName: '德国', countryFlag: '🇩🇪', importChange3m: '↑41%', signalLevel: '高', insight: '欧洲最大在线汽配分销商，SKU 驱动、看重装柜经济性', logoText: 'AD', logoColor: '#155e75' },
  { id: 'cs-parts-authority', companyName: 'Parts Authority', countryName: '美国', countryFlag: '🇺🇸', importChange3m: '↑15%', signalLevel: '中高', insight: '售后分销连锁覆盖 45 州，偏好现货与快速补货', logoText: 'PA', logoColor: '#0f766e' },
  { id: 'cs-atu', companyName: 'A.T.U Auto-Teile-Unger', countryName: '德国', countryFlag: '🇩🇪', importChange3m: '↑12%', signalLevel: '中', insight: '连锁维修 550+ 门店，门店无决策人、靠门户自助选型', logoText: 'AT', logoColor: '#5b21b6' },
];

// ── 交互句柄（ActionSlot）────────────────────────────────
// ACTION: 按主营产品获取客户池（逐品类可触达企业量与取数档位） [GET] /api/industry-scenario/customer-pool
function handleFetchCustomerPool(params: { products: string[] }) {
  console.log('fetch customer pool', params);
}

// ACTION: 获取目标市场进口趋势 [GET] /api/industry-scenario/market-trend
function handleFetchMarketTrend(params: { products: string[] }) {
  console.log('fetch market trend', params);
}

// ACTION: 获取全球企业发现名单（谁可能会买） [GET] /api/industry-scenario/company-discovery
function handleFetchDiscoverCompanies(params: { products: string[] }) {
  console.log('fetch discover companies', params);
}

// ACTION: 获取海关数据信号（谁在买） [GET] /api/industry-scenario/customs-signals
function handleFetchCustomsSignals(params: { products: string[] }) {
  console.log('fetch customs signals', params);
}

// ACTION: 获取主营产品已保存的英文名 [GET] /api/industry-scenario/main-products/english-names
function handleFetchProductEnglishNames() {
  console.log('fetch product english names');
}

// ACTION: 保存主营产品的英文名（用于查海关编码；传空表示恢复默认） [PUT] /api/industry-scenario/main-products/english-name
function handleSaveProductEnglishName(params: ProductEnglishName) {
  console.log('save product english name', params);
}

// ACTION: 加入跟进名单 [POST] /api/industry-scenario/follow-leads
function handleAddFollowLead(lead: { companyName: string; countryName: string; source: LeadSource; reason: string }) {
  console.log('add follow lead', lead);
}

function CompanyLogo({ text, color }: { text: string; color: string }) {
  return <span className="mo-logo" style={{ background: color }} aria-hidden="true">{text}</span>;
}

export default function MarketOpportunityPage() {
  // 我方主营产品：只读，取「企业画像」第 2 步保存的主营产品（多网站聚合后经用户确认）；本页不增删
  const [profile] = useState(() => readStoredProfile()?.answers ?? null);
  const hasProfileProducts = Boolean(profile?.products.length);
  const products = hasProfileProducts && profile ? profile.products : SAMPLE_PRODUCTS;
  const industry = profile?.industry || SAMPLE_INDUSTRY; // 主行业
  // 主营产品按全部所属行业的产品字典匹配（旧画像只有一个行业）
  const industryScope = profile?.industries?.length ? profile.industries.map(item => item.secondary) : [industry];
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [followed, setFollowed] = useState<Set<string>>(() => new Set());
  const [detailNotice, setDetailNotice] = useState<string | null>(null);
  const [trend] = useState<MarketTrend>(mockMarketTrendData);
  const [discoverCompanies] = useState<DiscoverCompany[]>(mockDiscoverCompaniesData);
  const [customsSignals] = useState<CustomsSignal[]>(mockCustomsSignalsData);
  // 英文名修改值，键为主营产品的统一写法
  const [englishOverrides, setEnglishOverrides] = useState<Record<string, string>>(() => {
    handleFetchProductEnglishNames();
    const saved: Record<string, string> = {};
    mockProductEnglishNamesData.forEach(item => { saved[englishNameKey(item.productName)] = item.englishName; });
    return { ...saved, ...readEnglishNameOverrides() };
  });
  const [editingEnglish, setEditingEnglish] = useState<{ productName: string; value: string } | null>(null);

  useEffect(() => {
    handleFetchCustomerPool({ products });
    handleFetchMarketTrend({ products });
    handleFetchDiscoverCompanies({ products });
    handleFetchCustomsSignals({ products });
    // 仅首屏加载；改动产品后由「重新获取名单」重新拉取客户池
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每个主营产品按英文名查海关编码；查到同一标准产品的合并计数
  const lookups = useMemo(() => buildProductLookups(products, industryScope, englishOverrides), [products, industryScope.join('|'), englishOverrides]); // eslint-disable-line react-hooks/exhaustive-deps
  const poolRows = useMemo(() => buildPoolRows(lookups, mockCustomerPoolData), [lookups]);
  const pool = summarizePool(poolRows);
  // 「更多」带去外贸客户洞察的产品关键词：已查到海关编码的产品英文名（待归类的不带）
  const keywordProducts = poolRows.filter(row => row.hsCode !== null).map(row => row.englishName);

  function saveEnglishName(lookup: ProductLookup, value: string) {
    const englishName = value.trim();
    const next = { ...englishOverrides };
    // 与默认英文名相同或清空 → 恢复默认
    if (englishName && englishName !== lookup.defaultEnglishName) next[englishNameKey(lookup.productName)] = englishName;
    else delete next[englishNameKey(lookup.productName)];
    handleSaveProductEnglishName({ productName: lookup.productName, englishName: next[englishNameKey(lookup.productName)] ?? '' });
    writeEnglishNameOverrides(next);
    setEnglishOverrides(next);
    setEditingEnglish(null);
  }
  const recentRange = recentMonthsRange(CUSTOMS_DATA_CUTOFF, 3);
  const maxAmount = Math.max(...trend.markets.map(market => market.importAmountUsd));

  function refreshPool() {
    handleFetchCustomerPool({ products });
    setUpdatedAt(new Date());
  }

  // 「查看企业详情」跳转企业详情页；原型不做真实跳转，只提示
  function showDetailNotice(companyName: string) {
    setDetailNotice(companyName);
    window.setTimeout(() => setDetailNotice(current => current === companyName ? null : current), 2500);
  }

  function followLead(key: string, lead: Parameters<typeof handleAddFollowLead>[0]) {
    handleAddFollowLead(lead);
    setFollowed(current => new Set(current).add(key));
  }

  const updatedLabel = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}-${String(updatedAt.getDate()).padStart(2, '0')} ${String(updatedAt.getHours()).padStart(2, '0')}:${String(updatedAt.getMinutes()).padStart(2, '0')}`;
  const tierRows: { tier: PoolDataTier; label: string }[] = [{ tier: '可数', label: '可数档占比' }, { tier: '可推算', label: '可推算档' }, { tier: '只能定性', label: '只能定性档' }];

  return <CustomerShell current="市场与机会">
    <div className="mo-page">
      <header className="mo-heading">
        <div><h1>市场与机会</h1><p>外贸客户洞察 · 按我方主营产品找市场、找买家；点名单右上角「更多」进入外贸客户洞察查看海关交易数据。</p></div>
      </header>

      {/* ── 客户池总览 ── */}
      <section className="mo-card">
        <div className="mo-card-head"><h2>🏊 客户池总览</h2><Badge className="mo-muted-badge">示意值 · 待接数据源</Badge></div>
        <div className="mo-products">
          <div className="mo-products-head">
            <div><strong>🧠 我方主营产品</strong><span>{hasProfileProducts ? `（来自企业画像 · 主行业 ${industry}${industryScope.length > 1 ? ` 等 ${industryScope.length} 个行业` : ''}）` : '（尚未填写企业画像，以下为示例产品）'}</span><a className="mo-product-edit" href="/enterprise-profile/"><Pencil size={12} />{hasProfileProducts ? '去企业画像修改产品' : '去填写企业画像'}</a></div>
            <Button variant="primary" onClick={refreshPool}><RefreshCw size={13} />重新获取名单</Button>
          </div>
          <div className="mo-hs">
            <div className="mo-hs-title">产品 ↔ 英文名 ↔ 海关编码：按英文名在所属行业的产品字典中查海关编码，英文名可修改；查到同一产品的只计一次</div>
            <Table className="mo-product-table">
              <TableHeader><TableRow><TableHead>主营产品</TableHead><TableHead>英文名（用于查海关编码）</TableHead><TableHead>海关编码</TableHead><TableHead>编码名称 / 说明</TableHead></TableRow></TableHeader>
              <TableBody>
                {lookups.map(lookup => <TableRow key={lookup.productName}>
                  <TableCell className="mo-product-name">{lookup.productName}</TableCell>
                  <TableCell>
                    {editingEnglish?.productName === lookup.productName
                      ? <div className="mo-en-edit">
                          <Input autoFocus aria-label={`${lookup.productName} 的英文名`} placeholder={lookup.defaultEnglishName || '输入英文名，如 Brake Disc'} value={editingEnglish.value} onFocus={event => event.target.select()} onChange={event => setEditingEnglish({ productName: lookup.productName, value: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') saveEnglishName(lookup, editingEnglish.value); if (event.key === 'Escape') setEditingEnglish(null); }} />
                          <Button size="small" variant="primary" onClick={() => saveEnglishName(lookup, editingEnglish.value)}>保存</Button>
                          <Button size="small" onClick={() => setEditingEnglish(null)}>取消</Button>
                        </div>
                      : <div className="mo-en-view">
                          <span className={lookup.englishName ? 'mo-en-name' : 'mo-en-empty'}>{lookup.englishName || '未填写'}</span>
                          {lookup.isCustomEnglish && <span className="mo-en-tag" title={`默认：${lookup.defaultEnglishName || '无'}`}>已修改</span>}
                          <button type="button" className="text-action mo-en-action" aria-label={`${lookup.englishName ? '修改' : '填写'} ${lookup.productName} 的英文名`} onClick={() => setEditingEnglish({ productName: lookup.productName, value: lookup.englishName })}><Pencil size={12} />{lookup.englishName ? '修改' : '填写'}</button>
                          {lookup.isCustomEnglish && <button type="button" className="text-action mo-en-action" aria-label={`恢复 ${lookup.productName} 的默认英文名`} onClick={() => saveEnglishName(lookup, '')}><RotateCcw size={12} />恢复默认</button>}
                        </div>}
                  </TableCell>
                  <TableCell>{lookup.hsCode ? <code className="mo-hs-code">{lookup.hsCode}</code> : '—'}</TableCell>
                  <TableCell>{lookup.hsCode
                    ? <span className="mo-hs-name">{lookup.hsName}{lookup.mergedWith && <em> · 与「{lookup.mergedWith}」为同一产品，只计一次</em>}</span>
                    : <em className="mo-unmatched">{lookup.englishName ? '待归类 —— 英文名未查到海关编码，不计入客户池' : '待归类 —— 请填写英文名'}</em>}</TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>
          <div className="mo-products-foot">共 <b>{pool.productCount}</b> 个品类计入客户池{pool.unmatchedCount > 0 && <>（另有 <b>{pool.unmatchedCount}</b> 个待归类）</>} · 每个品类按“可触达企业量”计入名单 · 最近更新 <b>{updatedLabel}</b></div>
        </div>
        <div className="mo-metrics">
          <div className="mo-metric"><span>客户池规模（总量）</span><strong>{pool.total.toLocaleString()}</strong><small>家 · 判据：能数出总数</small></div>
          {tierRows.map(row => <div key={row.tier} className="mo-metric"><span>{row.label}</span><strong>{percentOf(pool.byTier[row.tier], pool.total)}%</strong><small>{pool.byTier[row.tier].toLocaleString()} 家 · {TIER_CONFIG[row.tier].note}</small></div>)}
        </div>
      </section>

      {/* ── 目标市场进口趋势 ── */}
      <section className="mo-card">
        <div className="mo-card-head"><h2>📈 目标市场进口趋势</h2><span className="mo-head-note">{trend.periodLabel} · 条长为进口额（美元）</span></div>
        <div className="mo-bars">
          {trend.markets.map(market => <div key={market.countryName} className="mo-bar-row">
            <span className="mo-bar-label">{market.countryFlag} {market.countryName}</span>
            <span className="mo-bar-track"><span className={`mo-bar-fill ${OPPORTUNITY_CONFIG[market.opportunity].className}`} style={{ width: `${market.importAmountUsd / maxAmount * 100}%` }} /></span>
            <span className="mo-bar-value">{formatUsdCompact(market.importAmountUsd)}</span>
            <span className={`mo-opportunity ${OPPORTUNITY_CONFIG[market.opportunity].className}`}>机会{market.opportunity}</span>
          </div>)}
        </div>
        <div className="mo-market-tiles">
          {trend.markets.map(market => <div key={market.countryName} className="mo-market-tile"><span>{market.countryFlag}</span><strong>{formatUsdCompact(market.importAmountUsd)}</strong><small>{market.countryName} · 同比 {market.yoyGrowth}</small><small>采购商 {market.buyerCount.toLocaleString()} 家</small></div>)}
        </div>
        <div className="mo-insight"><Sparkles size={14} /><span><b>AI 洞察：</b>{trend.industryInsight}</span></div>
      </section>

      <div className="mo-two-col">
        {/* ── 全球企业发现 ── */}
        <section className="mo-card">
          <div className="mo-card-head"><h2>🌐 全球企业发现 · 谁可能会买</h2><a className="mo-more" href={tradeInsightListHref('discover', keywordProducts)} title={`按主营产品（${keywordProducts.join('、')}）查看外贸客户洞察`} aria-label={`更多：按主营产品（${keywordProducts.join('、')}）查看外贸客户洞察`}>更多<ChevronRight size={13} /></a></div>
          <div className="mo-tip">海关数据告诉你<b>“谁在买”</b>。企业发现告诉你<b>“谁应该买”</b>。</div>
          <ul className="mo-lead-list">
            {discoverCompanies.map(company => <li key={company.id} className="mo-lead">
              <span className={`mo-rank ${company.matchScore >= 90 ? 'is-hot' : ''}`}>{company.matchScore}%</span>
              <CompanyLogo text={company.logoText} color={company.logoColor} />
              <div className="mo-lead-info">
                <strong>{company.companyName}</strong>
                <span>{company.countryFlag} {company.countryName} · {company.employeeCount} · {company.annualRevenue}</span>
                <small className={company.hasCustomsRecord ? 'has-record' : ''}>{company.hasCustomsRecord ? '✅ 有海关记录' : '❌ 无海关记录'}</small>
              </div>
              <div className="mo-lead-actions">
                <Button size="small" variant="primary" disabled={followed.has(company.id)} onClick={() => followLead(company.id, { companyName: company.companyName, countryName: company.countryName, source: '全球企业发现', reason: `AI推荐匹配度${company.matchScore}%` })}>{followed.has(company.id) ? '已加入' : '+ 加入跟进名单'}</Button>
                <Button size="small" onClick={() => showDetailNotice(company.companyName)}>查看企业详情<ArrowRight size={12} /></Button>
              </div>
            </li>)}
          </ul>
        </section>

        {/* ── 海关数据信号 ── */}
        <section className="mo-card">
          <div className="mo-card-head"><h2>🚢 海关数据信号 · 谁在买</h2><a className="mo-more" href={tradeInsightListHref('signals', keywordProducts, recentRange)} title={`主营产品近 3 个月（${recentRange.start} 至 ${recentRange.end}）的全部采购商`} aria-label={`更多：主营产品近 3 个月（${recentRange.start} 至 ${recentRange.end}）的全部采购商`}>更多<ChevronRight size={13} /></a></div>
          <div className="mo-tip">按主营产品对应的 HS 编码取数，近 3 个月（{recentRange.start} 至 {recentRange.end}）进口量变化 · 数据截至 {CUSTOMS_DATA_CUTOFF}。</div>
          <ul className="mo-lead-list">
            {customsSignals.map(signal => <li key={signal.id} className="mo-lead">
              <span className={`mo-rank ${signal.signalLevel === '高' ? 'is-hot' : ''}`}>{signal.signalLevel}</span>
              <CompanyLogo text={signal.logoText} color={signal.logoColor} />
              <div className="mo-lead-info">
                <strong>{signal.companyName}</strong>
                <span>{signal.countryFlag} {signal.countryName} · 近3月进口量 <b className="mo-change">{signal.importChange3m}</b></span>
                <small>{signal.insight}</small>
              </div>
              <div className="mo-lead-actions">
                <Button size="small" variant="primary" disabled={followed.has(signal.id)} onClick={() => followLead(signal.id, { companyName: signal.companyName, countryName: signal.countryName, source: '海关数据', reason: `近3月进口量${signal.importChange3m}` })}>{followed.has(signal.id) ? '已加入' : '+ 加入跟进名单'}</Button>
                <Button size="small" onClick={() => showDetailNotice(signal.companyName)}>查看企业详情<ArrowRight size={12} /></Button>
              </div>
            </li>)}
          </ul>
        </section>
      </div>
    </div>
    {detailNotice && <div className="mo-toast" role="status">将跳转「{detailNotice}」的企业详情页（原型不做跳转）</div>}
  </CustomerShell>;
}
