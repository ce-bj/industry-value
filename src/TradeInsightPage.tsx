import { useEffect, useMemo, useState, type FocusEvent } from 'react';
import { ArrowLeft, CalendarDays, Star, X } from 'lucide-react';
import { CustomerShell } from '@/components/PortalShell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { readStoredProfile } from '@/enterpriseProfile';
import { MARKET_OPPORTUNITY_PATH, matchedProducts, readTradeInsightQuery } from '@/tradeInsight';

// ── 类型 ────────────────────────────────────────────────
type CompanyRole = 'buyer' | 'supplier';
interface Shipment { tradeDate: string; productName: string; quantity: string; amountUsd: number }
interface TradeCompany {
  id: string; companyName: string; countryName: string; countryFlag: string; role: CompanyRole;
  productDescriptions: string[]; hsCode: string; matchedTradeCount: number; tradeAmountUsd: number;
  originCountry: string; exportPort: string; importPort: string; lastTradeDate: string; recentShipments: Shipment[];
}
interface TradeFilters { startDate: string; endDate: string; originCountry: string; destinationCountry: string; exportPort: string; importPort: string }
type InsightTab = 'records' | 'companies' | 'trend' | 'regions' | 'buyers' | 'suppliers';

// ── 配置常量（静态映射，不进 meta.json）────────────────────
const ROLE_CONFIG: Record<CompanyRole, { label: string }> = { buyer: { label: '采购商' }, supplier: { label: '供应商' } };
const INSIGHT_TABS: { value: InsightTab; label: string }[] = [
  { value: 'records', label: '数据列表' }, { value: 'companies', label: '公司数据' }, { value: 'trend', label: '市场趋势分析' },
  { value: 'regions', label: '国家地区分析' }, { value: 'buyers', label: '采购商分析' }, { value: 'suppliers', label: '供应商分析' },
];
const FILTER_LABELS: Record<keyof TradeFilters, string> = { startDate: '开始日期', endDate: '结束日期', originCountry: '原产国', destinationCountry: '目的国', exportPort: '出口港', importPort: '进口港' };
const EMPTY_FILTERS: TradeFilters = { startDate: '', endDate: '', originCountry: '', destinationCountry: '', exportPort: '', importPort: '' };
const ORIGIN_COUNTRY_OPTIONS = ['中国', '越南', '印度', '泰国', '土耳其'];
const SAMPLE_INDUSTRY = '汽车零部件';
const ENTRY_TEXT = { discover: '全球企业发现', signals: '海关数据信号' } as const;

// ── 动态数据（DataSlot）──────────────────────────────────
// PAGINATION: page,pageSize
const mockTradeCompaniesData: TradeCompany[] = [
  { id: 'tc-brose', companyName: 'Brose Group', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['BRAKE DISC VENTILATED 300MM OE 4F0615301', 'BRAKE DRUM ASSY REAR FOR PASSENGER CAR', 'Kode Barang: BD-4021 / BD-4022'], hsCode: '87083000', matchedTradeCount: 46, tradeAmountUsd: 1286400, originCountry: '中国', exportPort: '宁波港', importPort: 'Hamburg', lastTradeDate: '2026-10-28', recentShipments: [{ tradeDate: '2026-10-28', productName: '通风制动盘 300mm', quantity: '4,800 件', amountUsd: 96000 }, { tradeDate: '2026-09-15', productName: '后制动鼓总成', quantity: '2,400 件', amountUsd: 61200 }, { tradeDate: '2026-08-02', productName: '通风制动盘 280mm', quantity: '3,600 件', amountUsd: 68400 }] },
  { id: 'tc-nemak', companyName: 'Nemak S.A.B.', countryName: '墨西哥', countryFlag: '🇲🇽', role: 'buyer', productDescriptions: ['DISCO DE FRENO VENTILADO 320MM', 'HUB BEARING UNIT GEN3 FRONT'], hsCode: '87083000', matchedTradeCount: 19, tradeAmountUsd: 538000, originCountry: '中国', exportPort: '上海港', importPort: 'Veracruz', lastTradeDate: '2026-10-11', recentShipments: [{ tradeDate: '2026-10-11', productName: '通风制动盘 320mm', quantity: '3,000 件', amountUsd: 72000 }, { tradeDate: '2026-08-20', productName: '前轮毂单元 GEN3', quantity: '1,200 件', amountUsd: 54000 }] },
  { id: 'tc-dana', companyName: 'Dana Inc.', countryName: '美国', countryFlag: '🇺🇸', role: 'buyer', productDescriptions: ['WHEEL HUB ASSEMBLY REAR AXLE', 'BRAKE DRUM 16.5X7 HEAVY DUTY'], hsCode: '87087000', matchedTradeCount: 27, tradeAmountUsd: 912300, originCountry: '中国', exportPort: '宁波港', importPort: 'Los Angeles', lastTradeDate: '2026-11-03', recentShipments: [{ tradeDate: '2026-11-03', productName: '后轴轮毂总成', quantity: '2,000 件', amountUsd: 118000 }, { tradeDate: '2026-09-27', productName: '重卡制动鼓 16.5x7', quantity: '1,500 件', amountUsd: 84000 }] },
  { id: 'tc-mubea', companyName: 'Mubea GmbH', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['LIGHTWEIGHT BRAKE DISC COMPOSITE'], hsCode: '87083000', matchedTradeCount: 12, tradeAmountUsd: 302500, originCountry: '中国', exportPort: '上海港', importPort: 'Bremerhaven', lastTradeDate: '2026-07-19', recentShipments: [{ tradeDate: '2026-07-19', productName: '轻量化复合制动盘', quantity: '1,800 件', amountUsd: 77400 }] },
  { id: 'tc-autodoc', companyName: 'Autodoc SE', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['BRAKE DISC SET FRONT AXLE AFTERMARKET', 'BRAKE PAD + DISC KIT, 48 SKU MIXED CONTAINER'], hsCode: '87083000', matchedTradeCount: 63, tradeAmountUsd: 1874200, originCountry: '中国', exportPort: '宁波港', importPort: 'Hamburg', lastTradeDate: '2026-11-12', recentShipments: [{ tradeDate: '2026-11-12', productName: '前轴制动盘套装（拼柜 48 SKU）', quantity: '1 × 40HQ', amountUsd: 142000 }, { tradeDate: '2026-10-08', productName: '制动盘 + 刹车片套装', quantity: '1 × 40HQ', amountUsd: 128500 }] },
  { id: 'tc-parts-authority', companyName: 'Parts Authority', countryName: '美国', countryFlag: '🇺🇸', role: 'buyer', productDescriptions: ['ROTOR BRAKE DISC COATED', 'HUB ASSY W/ABS SENSOR'], hsCode: '87083000', matchedTradeCount: 31, tradeAmountUsd: 764800, originCountry: '中国', exportPort: '宁波港', importPort: 'Newark', lastTradeDate: '2026-10-30', recentShipments: [{ tradeDate: '2026-10-30', productName: '涂层制动盘', quantity: '5,200 件', amountUsd: 109200 }] },
  { id: 'tc-atu', companyName: 'A.T.U Auto-Teile-Unger', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['BREMSSCHEIBE BELÜFTET VORNE'], hsCode: '87083000', matchedTradeCount: 14, tradeAmountUsd: 287600, originCountry: '中国', exportPort: '上海港', importPort: 'Hamburg', lastTradeDate: '2026-09-04', recentShipments: [{ tradeDate: '2026-09-04', productName: '前通风制动盘', quantity: '3,000 件', amountUsd: 57000 }] },
  { id: 'tc-benteler', companyName: 'Benteler Automotive', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['CHASSIS BRACKET STEEL', 'BRAKE DRUM CASTING SEMI-FINISHED'], hsCode: '87089900', matchedTradeCount: 8, tradeAmountUsd: 196000, originCountry: '中国', exportPort: '上海港', importPort: 'Bremerhaven', lastTradeDate: '2026-06-22', recentShipments: [{ tradeDate: '2026-06-22', productName: '制动鼓毛坯', quantity: '6,000 件', amountUsd: 84000 }] },
  { id: 'tc-gestamp', companyName: 'Gestamp', countryName: '西班牙', countryFlag: '🇪🇸', role: 'buyer', productDescriptions: ['WHEEL HUB BEARING UNIT'], hsCode: '87087000', matchedTradeCount: 9, tradeAmountUsd: 233100, originCountry: '中国', exportPort: '宁波港', importPort: 'Valencia', lastTradeDate: '2026-08-14', recentShipments: [{ tradeDate: '2026-08-14', productName: '轮毂轴承单元', quantity: '2,100 件', amountUsd: 69300 }] },
  { id: 'tc-zf', companyName: 'ZF Friedrichshafen', countryName: '德国', countryFlag: '🇩🇪', role: 'buyer', productDescriptions: ['BRAKE DISC FOR EV PLATFORM, CORROSION COATED'], hsCode: '87083000', matchedTradeCount: 22, tradeAmountUsd: 845000, originCountry: '中国', exportPort: '上海港', importPort: 'Hamburg', lastTradeDate: '2026-10-21', recentShipments: [{ tradeDate: '2026-10-21', productName: '电动平台防腐制动盘', quantity: '4,000 件', amountUsd: 132000 }] },
  { id: 'tc-meritor', companyName: 'Meritor Inc.', countryName: '美国', countryFlag: '🇺🇸', role: 'buyer', productDescriptions: ['BRAKE DRUM HEAVY TRUCK 16.5"'], hsCode: '87083000', matchedTradeCount: 17, tradeAmountUsd: 468000, originCountry: '中国', exportPort: '宁波港', importPort: 'Savannah', lastTradeDate: '2026-09-30', recentShipments: [{ tradeDate: '2026-09-30', productName: '重卡制动鼓 16.5"', quantity: '2,600 件', amountUsd: 145600 }] },
  { id: 'tc-nordhaven', companyName: 'Nordhaven Auto Parts B.V.', countryName: '荷兰', countryFlag: '🇳🇱', role: 'buyer', productDescriptions: ['BRAKE DISC REAR SOLID 264MM', 'PROD SRV: MIXED BRAKE COMPONENTS'], hsCode: '87083000', matchedTradeCount: 11, tradeAmountUsd: 176400, originCountry: '中国', exportPort: '宁波港', importPort: 'Rotterdam', lastTradeDate: '2026-10-02', recentShipments: [{ tradeDate: '2026-10-02', productName: '后实心制动盘 264mm', quantity: '2,800 件', amountUsd: 44800 }] },
  { id: 'tc-lowland', companyName: 'Lowland Brake Supply B.V.', countryName: '荷兰', countryFlag: '🇳🇱', role: 'buyer', productDescriptions: ['WHEEL HUB UNIT FRONT, ABS RING'], hsCode: '87087000', matchedTradeCount: 6, tradeAmountUsd: 92800, originCountry: '越南', exportPort: 'Hai Phong', importPort: 'Rotterdam', lastTradeDate: '2026-05-18', recentShipments: [{ tradeDate: '2026-05-18', productName: '前轮毂单元（带 ABS 齿圈）', quantity: '1,600 件', amountUsd: 46400 }] },
];

// ── 交互句柄（ActionSlot）────────────────────────────────
// ACTION: 按条件获取海关公司数据 [GET] /api/industry-scenario/trade-companies
function handleFetchTradeCompanies(params: TradeFilters & { products: string[]; page: number; pageSize: number }) {
  console.log('fetch trade companies', params);
}

// ACTION: 收藏企业 [POST] /api/industry-scenario/favorite-companies
function handleAddFavoriteCompany(companyId: string) {
  console.log('add favorite company', companyId);
}

// ACTION: 取消收藏企业 [DELETE] /api/industry-scenario/favorite-companies/{id}
function handleRemoveFavoriteCompany(companyId: string) {
  console.log('remove favorite company', companyId);
}

// ACTION: 获取企业海关交易详情 [GET] /api/industry-scenario/trade-companies/{id}
function handleFetchTradeCompanyDetail(companyId: string) {
  console.log('fetch trade company detail', companyId);
}

// 日期框未填写时显示「开始日期 / 结束日期」占位，聚焦时切换为日期选择器
function showDatePicker(event: FocusEvent<HTMLInputElement>) { event.currentTarget.type = 'date'; }
function hideEmptyDatePicker(event: FocusEvent<HTMLInputElement>) { if (!event.currentTarget.value) event.currentTarget.type = 'text'; }

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function contains(value: string, keyword: string): boolean {
  return !keyword || value.toLowerCase().includes(keyword.trim().toLowerCase());
}

function matchesFilters(company: TradeCompany, filters: TradeFilters): boolean {
  return contains(company.originCountry, filters.originCountry)
    && contains(company.countryName, filters.destinationCountry)
    && contains(company.exportPort, filters.exportPort)
    && contains(company.importPort, filters.importPort)
    && (!filters.startDate || company.lastTradeDate >= filters.startDate)
    && (!filters.endDate || company.lastTradeDate <= filters.endDate);
}

export default function TradeInsightPage() {
  // 从「市场与机会」名单右上角「更多」进入时带入：产品关键词；海关数据信号另带近 3 个月
  const [entry] = useState(() => readTradeInsightQuery(window.location.search));
  const initialFilters: TradeFilters = { ...EMPTY_FILTERS, startDate: entry.startDate, endDate: entry.endDate };
  // 产品关键词按企业画像全部所属行业的产品字典匹配
  const [industry] = useState<string[]>(() => {
    const answers = readStoredProfile()?.answers;
    if (answers?.industries?.length) return answers.industries.map(item => item.secondary);
    return [answers?.industry || SAMPLE_INDUSTRY];
  });
  const [productKeywords, setProductKeywords] = useState<string[]>(entry.products);
  const [draftFilters, setDraftFilters] = useState<TradeFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<TradeFilters>(initialFilters);
  const [activeTab, setActiveTab] = useState<InsightTab>('companies');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [detailCompany, setDetailCompany] = useState<TradeCompany | null>(null);
  const [page] = useState(1);
  const pageSize = 20;

  useEffect(() => { handleFetchTradeCompanies({ ...appliedFilters, products: productKeywords, page, pageSize }); }, [appliedFilters, productKeywords, page]);

  const companies = useMemo(() => mockTradeCompaniesData
    .filter(company => matchesFilters(company, appliedFilters))
    .filter(company => productKeywords.length === 0 || matchedProducts(company.productDescriptions, productKeywords, industry).length > 0), [appliedFilters, productKeywords, industry]);
  const activeChips = (Object.keys(appliedFilters) as (keyof TradeFilters)[]).filter(key => appliedFilters[key]);
  const hasAnyCondition = activeChips.length > 0 || productKeywords.length > 0;
  const allSelected = companies.length > 0 && companies.every(company => selectedIds.has(company.id));
  const someSelected = companies.some(company => selectedIds.has(company.id));

  function updateDraft(key: keyof TradeFilters, value: string) {
    setDraftFilters(current => ({ ...current, [key]: value }));
  }

  function applyFilters() { setAppliedFilters({ ...draftFilters }); setSelectedIds(new Set()); }
  function resetFilters() { setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setProductKeywords([]); setSelectedIds(new Set()); }
  function removeProductKeyword(product: string) { setProductKeywords(current => current.filter(item => item !== product)); setSelectedIds(new Set()); }
  function removeChip(key: keyof TradeFilters) {
    const next = { ...appliedFilters, [key]: '' };
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function toggleFavorite(companyId: string) {
    const isFavorite = favoriteIds.has(companyId);
    if (isFavorite) handleRemoveFavoriteCompany(companyId); else handleAddFavoriteCompany(companyId);
    setFavoriteIds(current => { const next = new Set(current); if (isFavorite) next.delete(companyId); else next.add(companyId); return next; });
  }

  function toggleSelected(companyId: string, checked: boolean) {
    setSelectedIds(current => { const next = new Set(current); if (checked) next.add(companyId); else next.delete(companyId); return next; });
  }

  function openDetail(company: TradeCompany) {
    handleFetchTradeCompanyDetail(company.id);
    setDetailCompany(company);
  }

  return <CustomerShell current="外贸客户洞察">
    <div className="ti-page">
      {entry.from && <div className="ti-entry">
        <a href={MARKET_OPPORTUNITY_PATH}><ArrowLeft size={14} />返回市场与机会</a>
        <span>来自「{ENTRY_TEXT[entry.from]}」：{entry.from === 'signals' ? <>主营产品 <b>{entry.products.join('、') || '—'}</b> 近 3 个月（{entry.startDate} 至 {entry.endDate}）的全部采购商</> : <>按主营产品 <b>{entry.products.join('、') || '—'}</b> 查看海关公司数据</>}，可在下方修改条件。</span>
      </div>}

      <section className="ti-card">
        <h2 className="ti-card-title">筛选</h2>
        <div className="ti-filter-grid">
          <label className="ti-filter-field ti-filter-date"><span>交易日期</span>
            <span className="ti-date-range"><CalendarDays size={14} /><Input type={draftFilters.startDate ? 'date' : 'text'} placeholder="开始日期" onFocus={showDatePicker} onBlur={hideEmptyDatePicker} aria-label="开始日期" value={draftFilters.startDate} onChange={event => updateDraft('startDate', event.target.value)} /><i>至</i><Input type={draftFilters.endDate ? 'date' : 'text'} placeholder="结束日期" onFocus={showDatePicker} onBlur={hideEmptyDatePicker} aria-label="结束日期" value={draftFilters.endDate} onChange={event => updateDraft('endDate', event.target.value)} /></span>
          </label>
          <label className="ti-filter-field"><span>原产国</span><Input list="ti-origin-countries" placeholder="请输入区域名称" value={draftFilters.originCountry} onChange={event => updateDraft('originCountry', event.target.value)} /></label>
          <label className="ti-filter-field"><span>目的国</span><Input placeholder="请输入区域名称" value={draftFilters.destinationCountry} onChange={event => updateDraft('destinationCountry', event.target.value)} /></label>
          <label className="ti-filter-field"><span>出口港</span><Input placeholder="请输入出口港" value={draftFilters.exportPort} onChange={event => updateDraft('exportPort', event.target.value)} /></label>
          <label className="ti-filter-field"><span>进口港</span><Input placeholder="请输入进口港" value={draftFilters.importPort} onChange={event => updateDraft('importPort', event.target.value)} /></label>
          <div className="ti-filter-actions"><Button variant="primary" onClick={applyFilters}>筛选</Button><Button onClick={resetFilters}>重置</Button></div>
        </div>
        <datalist id="ti-origin-countries">{ORIGIN_COUNTRY_OPTIONS.map(country => <option key={country} value={country} />)}</datalist>
        <div className="ti-chips">
          <span className="ti-chips-label">已选条件：</span>
          <button type="button" className={`ti-chip ${hasAnyCondition ? '' : 'is-active'}`} onClick={resetFilters}>全部</button>
          {productKeywords.map(product => <span key={`product-${product}`} className="ti-chip is-active">产品：{product}<button type="button" aria-label={`移除产品条件 ${product}`} onClick={() => removeProductKeyword(product)}><X size={11} /></button></span>)}
          {activeChips.map(key => <span key={key} className="ti-chip is-active">{key === 'startDate' || key === 'endDate' ? `${FILTER_LABELS[key]}：` : ''}{appliedFilters[key]}<button type="button" aria-label={`移除${FILTER_LABELS[key]}条件`} onClick={() => removeChip(key)}><X size={11} /></button></span>)}
        </div>
      </section>

      <section className="ti-card">
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as InsightTab)}>
          <TabsList>{INSIGHT_TABS.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}</TabsList>
          <TabsContent value="companies">
            <h3 className="ti-result-title">为您匹配 {companies.length} 线索符合您的搜索</h3>
            <div className="ti-table-wrap">
              <Table className="ti-table">
                <TableHeader><TableRow>
                  <TableHead className="ti-select-col"><Checkbox aria-label="全选" checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={checked => setSelectedIds(checked === true ? new Set(companies.map(company => company.id)) : new Set())} /></TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead className="ti-count-col">与我方产品匹配的交易次数</TableHead>
                  <TableHead className="ti-amount-col">交易总金额</TableHead>
                  <TableHead className="ti-ops-col">操作</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {companies.length === 0 && <TableRow><TableCell colSpan={5} className="ti-empty">没有符合条件的公司，请调整筛选条件。</TableCell></TableRow>}
                  {companies.map(company => <TableRow key={company.id} className="ti-row">
                    <TableCell className="ti-select-col"><Checkbox aria-label={`选择 ${company.companyName}`} checked={selectedIds.has(company.id)} onCheckedChange={checked => toggleSelected(company.id, checked === true)} /></TableCell>
                    <TableCell>
                      <div className="ti-company-name">{company.companyName}</div>
                      <div className="ti-company-role">{company.countryFlag} {company.countryName}{ROLE_CONFIG[company.role].label}</div>
                      {productKeywords.length > 0 && <div className="ti-row-match">匹配产品：{matchedProducts(company.productDescriptions, productKeywords, industry).join('、')}</div>}
                      <dl className="ti-company-detail">
                        <div><dt>产品描述:</dt><dd>{company.productDescriptions.map(line => <span key={line}>{line}</span>)}</dd></div>
                        <div><dt>HS编码:</dt><dd>{company.hsCode}</dd></div>
                      </dl>
                    </TableCell>
                    <TableCell className="ti-count-col">{company.matchedTradeCount}</TableCell>
                    <TableCell className="ti-amount-col">{formatUsd(company.tradeAmountUsd)}</TableCell>
                    <TableCell className="ti-ops-col">
                      <button type="button" className={`text-action ti-favorite ${favoriteIds.has(company.id) ? 'is-on' : ''}`} aria-pressed={favoriteIds.has(company.id)} onClick={() => toggleFavorite(company.id)}><Star size={14} />{favoriteIds.has(company.id) ? '已收藏' : '收藏'}</button>
                      <span className="operation-sep">|</span>
                      <button type="button" className="text-action" onClick={() => openDetail(company)}>查看详情</button>
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          {INSIGHT_TABS.filter(tab => tab.value !== 'companies').map(tab => <TabsContent key={tab.value} value={tab.value}><div className="ti-placeholder">「{tab.label}」沿用现有外贸客户洞察页面，本原型只展开「公司数据」。</div></TabsContent>)}
        </Tabs>
      </section>
    </div>

    <Dialog open={detailCompany !== null} onOpenChange={open => { if (!open) setDetailCompany(null); }}>
      <DialogContent className="ti-detail-dialog">
        {detailCompany && <>
          <DialogHeader><DialogTitle>{detailCompany.companyName}</DialogTitle><DialogDescription>{detailCompany.countryFlag} {detailCompany.countryName}{ROLE_CONFIG[detailCompany.role].label} · 最近交易 {detailCompany.lastTradeDate}</DialogDescription></DialogHeader>
          <div className="ti-detail-body">
            <dl className="ti-detail-grid">
              <div><dt>匹配交易次数</dt><dd>{detailCompany.matchedTradeCount}</dd></div>
              <div><dt>交易总金额</dt><dd>{formatUsd(detailCompany.tradeAmountUsd)}</dd></div>
              <div><dt>HS编码</dt><dd>{detailCompany.hsCode}</dd></div>
              <div><dt>原产国</dt><dd>{detailCompany.originCountry}</dd></div>
              <div><dt>出口港 → 进口港</dt><dd>{detailCompany.exportPort} → {detailCompany.importPort}</dd></div>
            </dl>
            <h4>近期交易</h4>
            <Table className="ti-shipments">
              <TableHeader><TableRow><TableHead>交易日期</TableHead><TableHead>产品</TableHead><TableHead>数量</TableHead><TableHead>金额</TableHead></TableRow></TableHeader>
              <TableBody>{detailCompany.recentShipments.map(shipment => <TableRow key={`${shipment.tradeDate}-${shipment.productName}`}><TableCell>{shipment.tradeDate}</TableCell><TableCell>{shipment.productName}</TableCell><TableCell>{shipment.quantity}</TableCell><TableCell>{formatUsd(shipment.amountUsd)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </CustomerShell>;
}
