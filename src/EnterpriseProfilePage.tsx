import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Info, Library, Plus, RefreshCcw, RotateCcw, X } from 'lucide-react';
import { OverviewShell } from '@/components/PortalShell';
import { IndustrySelect } from '@/components/IndustrySelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ACQUISITION_OPTIONS, BUSINESS_MODEL_OPTIONS, CUSTOMER_TYPE_OPTIONS, DIAGNOSIS_STEPS, DIGITAL_LEVEL_OPTIONS, EMPLOYEE_OPTIONS,
  GLOBAL_LEVEL_OPTIONS, GOAL_OPTIONS, MAX_INDUSTRIES, REVENUE_OPTIONS, aggregateIndustries, aggregateMainProducts, answersFromSites, companyNameOptions, diffSiteSnapshot, identityFromSites,
  industryKey, matchStrategy, optionLabel, readStoredProfile, siteSnapshot, validateStep, withMainIndustry, writeStoredProfile,
  type AcquisitionChannel, type CompanyNameOption, type DiagnosisAnswers, type EnterpriseProfileRecord, type OptionCard, type SiteChange, type SiteInfo,
} from '@/enterpriseProfile';
import { primaryIndustryOptions, secondaryIndustryOptions, type Industry, type IndustryCatalogItem } from '@/industry';
import { dictionaryProductNames, resolveProduct } from '@/productDictionary';
import industryCatalogData from './data/industry-catalog.json';

// ── 类型 ────────────────────────────────────────────────
interface SupportScene { icon: string; title: string }
interface WebsiteStage { order: number; name: string; badge: string; isWeakest: boolean; buyerQuestion: string; contentItems: string[]; supportScenes: SupportScene[] }
type PageMode = 'wizard' | 'result';

// ── 配置常量（不进 meta.json）────────────────────────────
const INDUSTRY_CATALOG: IndustryCatalogItem[] = industryCatalogData;
/** 已有完整行业内容（四个被、产品字典、行业均值）的行业，选择器中置顶并带图标。 */
const INDUSTRIES_WITH_CONTENT: Industry[] = [{ primary: '汽车制造行业', secondary: '汽车零部件' }];

// ── 动态数据（DataSlot）──────────────────────────────────
// 尚未填写时接口返回 status: 'empty'。原型用 localStorage 中已保存的画像覆盖它，便于在概况页与本页之间保持状态。
const mockEnterpriseProfileData: EnterpriseProfileRecord = { status: 'empty', answers: null, completedAt: null, fillCount: 0 };

// 企业下所有网站的「网站管理 › 网站设置 › 网站信息」，按网站列表顺序；每个网站可有多个所属行业（主行业 + 额外行业）。
const mockWebsiteInfosData: SiteInfo[] = [
  { siteId: 'site-cn', siteName: '中文站', domain: 'xinchi-auto.cn', companyName: '宁波鑫驰汽车零部件有限公司', industries: [{ primary: '汽车制造行业', secondary: '汽车零部件' }, { primary: '汽车制造行业', secondary: '汽车后市场' }], mainProducts: ['制动盘', '制动鼓', '轮毂单元'] },
  { siteId: 'site-en', siteName: '英文站', domain: 'xinchi-autoparts.com', companyName: 'Ningbo Xinchi Auto Parts Co., Ltd.', industries: [], mainProducts: ['制动盘', 'Brake Drum', '轮毂轴承'] },
  { siteId: 'site-ru', siteName: '俄语站', domain: 'xinchi-auto.ru', companyName: '宁波鑫驰汽车零部件有限公司', industries: [{ primary: '汽车制造行业', secondary: '汽车零部件' }, { primary: '机械设备制造', secondary: '通用零部件' }], mainProducts: ['制动盘 ', '定制改装件'] },
];

/** 原型演示：地址带 ?siteChanged=1 时，模拟评测后网站信息有变更（中文站新增主营产品「刹车片」、新增行业「汽车制造行业 / 新能源汽车」）。 */
function withDemoSiteChange(sites: SiteInfo[]): SiteInfo[] {
  if (new URLSearchParams(window.location.search).get('siteChanged') !== '1') return sites;
  return sites.map(site => site.siteId === 'site-cn'
    ? { ...site, mainProducts: [...site.mainProducts, '刹车片'], industries: [...site.industries, { primary: '汽车制造行业', secondary: '新能源汽车' }] }
    : site);
}

// 网站需要具备的内容（四个被），按二级行业返回；没有内容的行业返回空数组。第一期只有汽车零部件。
const mockWebsiteStagesData: WebsiteStage[] = [
  { order: 1, name: '被看见', badge: '证据要能被读到', isWeakest: false, buyerQuestion: '客户在问：谁做这个 OE 号？', contentItems: ['一个 OE 号一页 · 适配车型', '关键尺寸与图纸编号', '参数写成文字与表格，不做图片'], supportScenes: [{ icon: '🔍', title: '规格级页面' }, { icon: '🌐', title: '客户池推断名单' }, { icon: '✉️', title: '邮件与序列触达' }, { icon: '🪪', title: '行业数字名片' }] },
  { order: 2, name: '被信任', badge: '⚠ 最易失守', isWeakest: true, buyerQuestion: '客户在问：资格与追溯管得住吗？', contentItems: ['IATF / ECE 证书：机构 · 编号 · 有效期', '批次追溯：批号 → 原料 → 检验', '图纸保密与索赔流程写明白'], supportScenes: [{ icon: '🛡️', title: '企业信任中心' }, { icon: '🔖', title: '批次追溯' }] },
  { order: 3, name: '被选择', badge: '离钱最近', isWeakest: false, buyerQuestion: '客户在问：能不能替代、多久到？', contentItems: ['替代号匹配', '装柜与价格阶梯估算', '带 OE 号与数量的询价单'], supportScenes: [{ icon: '🔄', title: '替代号匹配' }, { icon: '🧮', title: '装柜与价格阶梯' }, { icon: '💬', title: '门户 AI 对话接待' }, { icon: '📋', title: '询价单与合格线' }] },
  { order: 4, name: '被依赖', badge: '守复购', isWeakest: false, buyerQuestion: '客户在问：下一款车还找你吗？', contentItems: ['客户专属空间：订单与质检报告', '变更（ECN）主动推送', '停产件与替代号自助查询'], supportScenes: [{ icon: '🏠', title: '客户专属空间' }, { icon: '🤝', title: '伙伴门户' }, { icon: '📊', title: '门户运营看板' }] },
];
const STAGES_SAMPLE_INDUSTRY = '汽车零部件';

// ── 交互句柄（ActionSlot）────────────────────────────────
// ACTION: 获取企业画像 [GET] /api/industry-scenario/enterprise-profile
function handleFetchEnterpriseProfile() {
  console.log('fetch enterprise profile');
}

// ACTION: 获取企业各网站的网站信息（公司名称、所属行业、主营产品） [GET] /api/industry-scenario/websites/site-info
function handleFetchWebsiteInfos() {
  console.log('fetch website infos');
}

// ACTION: 保存企业画像（首次填写与重新填写都整体覆盖） [PUT] /api/industry-scenario/enterprise-profile
function handleSaveEnterpriseProfile(answers: DiagnosisAnswers) {
  console.log('save enterprise profile', answers);
}

// ACTION: 按行业获取网站需具备的四态内容 [GET] /api/industry-scenario/website-stages
function handleFetchWebsiteStages(params: { industry: string }) {
  console.log('fetch website stages', params);
}

function formatNow(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** 复制一份答案用于编辑；旧画像只存了一个二级行业时，按行业目录补出一级行业并转成行业列表。 */
function normalizeAnswers(answers: DiagnosisAnswers): DiagnosisAnswers {
  let industries = (answers.industries ?? []).map(item => ({ ...item }));
  if (!industries.length && answers.industry) {
    const primary = answers.industryPrimary || INDUSTRY_CATALOG.find(item => item.children.includes(answers.industry))?.name || '';
    industries = [{ primary, secondary: answers.industry }];
  }
  return withMainIndustry({ ...answers, industries, products: [...answers.products], acquisition: [...answers.acquisition] });
}

function formatAnswerIndustry(answers: DiagnosisAnswers): string {
  return answers.industries[0] ? industryKey(answers.industries[0]) : answers.industry;
}

function hasIndustryContent(industry: Industry): boolean {
  return INDUSTRIES_WITH_CONTENT.some(item => industryKey(item) === industryKey(industry));
}

function OptionCardGrid<T extends string>({ options, isSelected, onSelect, columns = 4 }: { options: OptionCard<T>[]; isSelected: (value: T) => boolean; onSelect: (value: T) => void; columns?: number }) {
  return <div className="ep-option-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={isSelected(option.value)} className={`ep-option-card ${isSelected(option.value) ? 'is-selected' : ''}`} onClick={() => onSelect(option.value)}>
      <span className="ep-option-icon">{option.icon}</span>
      <span className="ep-option-label">{option.label}</span>
      <span className="ep-option-desc">{option.desc}</span>
    </button>)}
  </div>;
}

function LevelList<T extends string>({ options, value, onSelect }: { options: OptionCard<T>[]; value: T | ''; onSelect: (value: T) => void }) {
  return <div className="ep-level-list">
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className={`ep-level-card ${value === option.value ? 'is-selected' : ''}`} onClick={() => onSelect(option.value)}>
      <span className="ep-level-icon">{option.icon}</span>
      <span className="ep-level-info"><span className="ep-level-label">{option.label}</span><span className="ep-level-desc">{option.desc}</span></span>
      <span className="ep-level-check">{value === option.value && <Check size={14} />}</span>
    </button>)}
  </div>;
}

/** 企业名称：可输入的下拉框。下拉列出各网站的公司名称（相同名称合并），也可直接输入。 */
function CompanyNameCombobox({ value, options, onChange }: { value: string; options: CompanyNameOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return <div className="ep-combobox" ref={root} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <div className="ep-combobox-field">
      <Input aria-label="企业名称" placeholder="请输入企业名称" value={value} onChange={event => onChange(event.target.value)} />
      {options.length > 0 && <button type="button" className="ep-combobox-toggle" aria-label="从网站信息中选择企业名称" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}><ChevronDown size={15} /></button>}
    </div>
    {open && <ul className="ep-combobox-list" role="listbox" aria-label="各网站的公司名称">
      {options.map(option => <li key={option.companyName} role="option" aria-selected={option.companyName === value}>
        <button type="button" className={option.companyName === value ? 'is-selected' : ''} onClick={() => { onChange(option.companyName); setOpen(false); }}>
          <span>{option.companyName}</span>
          <small>{option.siteNames.length > 1 ? `来自 ${option.siteNames.length} 个网站：${option.siteNames.join('、')}` : `来自 ${option.siteNames[0]}`}</small>
        </button>
      </li>)}
    </ul>}
  </div>;
}

export default function EnterpriseProfilePage() {
  const [record, setRecord] = useState<EnterpriseProfileRecord>(() => { handleFetchEnterpriseProfile(); return readStoredProfile() ?? mockEnterpriseProfileData; });
  const [sites] = useState<SiteInfo[]>(() => { handleFetchWebsiteInfos(); return withDemoSiteChange(mockWebsiteInfosData); });
  const [mode, setMode] = useState<PageMode>(record.status === 'completed' ? 'result' : 'wizard');
  // 首次填写：企业名称、所属行业、主营产品从各网站的网站信息带入；重新填写：用上次保存的值，可点「重置为网站信息」
  const [draft, setDraft] = useState<DiagnosisAnswers>(() => record.answers ? normalizeAnswers(record.answers) : answersFromSites(sites));
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [stepNotice, setStepNotice] = useState<string | null>(null);
  const [productInput, setProductInput] = useState('');
  const [industryPick, setIndustryPick] = useState<Industry>({ primary: '', secondary: '' });

  const nameOptions = companyNameOptions(sites);
  const productSources = aggregateMainProducts(sites);
  const industrySources = aggregateIndustries(sites);
  const industryScope = draft.industries.map(item => item.secondary);

  useEffect(() => {
    if (mode === 'result' && record.answers) handleFetchWebsiteStages({ industry: record.answers.industry });
  }, [mode, record.answers]);

  function update<K extends keyof DiagnosisAnswers>(key: K, value: DiagnosisAnswers[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setStepError(null);
  }

  function goToStep(next: number) {
    setStep(next);
    setStepError(null);
    setStepNotice(null);
    window.scrollTo({ top: 0 });
  }

  function startRefill(startStep = 0) {
    setDraft(record.answers ? normalizeAnswers(record.answers) : answersFromSites(sites));
    setMode('wizard');
    goToStep(startStep);
  }

  function cancelRefill() {
    setMode('result');
    setStepError(null);
    window.scrollTo({ top: 0 });
  }

  function goNext() {
    const error = validateStep(step, draft);
    if (error) { setStepError(error); return; }
    if (step < DIAGNOSIS_STEPS.length - 1) { goToStep(step + 1); return; }
    const answers = withMainIndustry({ ...draft, companyName: draft.companyName.trim() });
    handleSaveEnterpriseProfile(answers);
    // 记下此刻的网站信息，之后网站信息有变更时在结果页提示（不自动重算）
    const saved: EnterpriseProfileRecord = { status: 'completed', answers, completedAt: formatNow(), fillCount: record.fillCount + 1, siteSnapshot: siteSnapshot(sites) };
    writeStoredProfile(saved);
    setRecord(saved);
    setMode('result');
    window.scrollTo({ top: 0 });
  }

  function setIndustries(next: (current: Industry[]) => Industry[]) {
    setDraft(current => withMainIndustry({ ...current, industries: next(current.industries) }));
    setStepError(null);
  }

  function addIndustry() {
    if (!industryPick.primary || !industryPick.secondary) { setStepError('请选到二级行业再添加'); return; }
    if (draft.industries.some(item => industryKey(item) === industryKey(industryPick))) { setStepError('该行业已添加'); return; }
    if (draft.industries.length >= MAX_INDUSTRIES) { setStepError(`「所属行业」最多 ${MAX_INDUSTRIES} 个`); return; }
    setIndustries(current => [...current, { ...industryPick }]);
    setIndustryPick({ primary: '', secondary: '' });
  }

  function resetIdentityFromSites() {
    setDraft(current => ({ ...current, ...identityFromSites(sites) }));
    setStepError(null);
    setStepNotice('已按网站信息重置企业名称与所属行业');
  }

  function resetProductsFromSites() {
    setDraft(current => ({ ...current, products: aggregateMainProducts(sites).map(item => item.name) }));
    setStepError(null);
    setStepNotice('已按网站信息重置主营产品');
  }

  function addProduct() {
    const value = productInput.trim();
    if (!value) return;
    const key = value.normalize('NFKC').toLowerCase();
    if (!draft.products.some(item => item.normalize('NFKC').trim().toLowerCase() === key)) update('products', [...draft.products, value]);
    setProductInput('');
  }

  function toggleAcquisition(value: AcquisitionChannel) {
    // 基于最新状态切换，连续快速点击也不会丢选项
    setDraft(current => ({ ...current, acquisition: current.acquisition.includes(value) ? current.acquisition.filter(item => item !== value) : [...current.acquisition, value] }));
    setStepError(null);
  }

  if (mode === 'result' && record.answers) {
    const answers = normalizeAnswers(record.answers);
    // 原型：四个被只有汽车零部件的内容，其他行业相当于接口返回空数组
    const stages = answers.industry === STAGES_SAMPLE_INDUSTRY ? mockWebsiteStagesData : [];
    const siteChanges = record.siteSnapshot ? diffSiteSnapshot(record.siteSnapshot, siteSnapshot(sites)) : [];
    return <OverviewShell breadcrumb="企业画像"><ProfileResult record={record} answers={answers} websiteStages={stages} siteChanges={siteChanges} onRefill={startRefill} /></OverviewShell>;
  }

  const current = DIAGNOSIS_STEPS[step];
  const isLastStep = step === DIAGNOSIS_STEPS.length - 1;
  const sitesWithName = sites.filter(site => site.companyName.trim()).length;
  const suggestions = dictionaryProductNames(industryScope).filter(name => !draft.products.some(product => resolveProduct(product, industryScope)?.standardName === name));
  const isRefill = record.status === 'completed';

  return <OverviewShell breadcrumb="企业画像">
    <div className="ep-page">
      <header className="ep-heading">
        <div><h1>{record.status === 'completed' ? '重新填写企业画像' : '企业画像评测'}</h1><p>{record.status === 'completed' ? '已带入上次的填写内容，修改后点击「完成评测」将覆盖原画像。' : '7 步完成企业画像，生成增长策略，并展示网站需要具备的内容。'}</p></div>
        {record.status === 'completed' && <Button onClick={cancelRefill}><X size={14} />取消重新填写</Button>}
      </header>

      <ol className="ep-stepper" aria-label="评测进度">
        {DIAGNOSIS_STEPS.map((item, index) => <li key={item.step} className={index < step ? 'is-done' : index === step ? 'is-active' : ''} aria-current={index === step ? 'step' : undefined}>
          <span className="ep-stepper-dot">{index < step ? <Check size={11} /> : item.step}</span>
          <span className="ep-stepper-label">{item.title}</span>
        </li>)}
      </ol>

      <section className="ep-card ep-step-card">
        <div className="ep-step-header">
          <span className="ep-step-icon">{current.icon}</span>
          <div><div className="ep-step-num">步骤 {current.step}/{DIAGNOSIS_STEPS.length}</div><h2>{current.title}</h2><p>{current.subtitle}</p></div>
        </div>

        <div className="ep-step-body">
          {step === 0 && <>
            <div className="ep-source-note"><span>{isRefill ? '已带入上次保存的企业名称与所属行业。' : `已读取 ${sites.length} 个网站的「网站管理 › 网站设置 › 网站信息」。`}{sitesWithName === 0 && '各网站均未填写公司名称，请手动输入。'}</span><Button size="small" onClick={resetIdentityFromSites}><RefreshCcw size={13} />重置为网站信息</Button></div>
            {stepNotice && <div className="ep-step-notice" role="status">{stepNotice}</div>}
            <div className="ep-field">
              <label>企业名称 <em>*</em></label>
              <CompanyNameCombobox value={draft.companyName} options={nameOptions} onChange={value => update('companyName', value)} />
              <div className="ep-hint-left">默认取第一个网站的公司名称；可从下拉中选择其他网站的公司名称，也可直接输入。修改不会影响网站信息。</div>
            </div>
            <div className="ep-field">
              <label>所属行业 <em>*</em> <span className="ep-label-note">（已选 {draft.industries.length} / {MAX_INDUSTRIES}）</span></label>
              <ul className="ep-industry-list" aria-label="已选所属行业">
                {draft.industries.length === 0 && <li className="ep-muted">暂无行业，请在下方添加</li>}
                {draft.industries.map((industry, index) => {
                  const key = industryKey(industry);
                  const sources = industrySources.find(item => industryKey(item.industry) === key)?.siteNames;
                  return <li key={key} className={`ep-industry-chip ${index === 0 ? 'is-main' : ''}`} title={sources ? `来自 ${sources.join('、')}` : '手动添加'}>
                    {index === 0 ? <span className="ep-industry-main">主行业</span> : <button type="button" className="ep-industry-set-main" onClick={() => setIndustries(current => [industry, ...current.filter(item => industryKey(item) !== key)])}>设为主行业</button>}
                    <span>{key}</span>
                    {hasIndustryContent(industry) && <Library size={13} className="industry-library-icon" aria-label="已有完整行业内容" />}
                    <button type="button" className="ep-industry-remove" aria-label={`移除 ${key}`} onClick={() => setIndustries(current => current.filter(item => industryKey(item) !== key))}><X size={12} /></button>
                  </li>;
                })}
              </ul>
              <div className="ep-industry-row">
                <IndustrySelect label="一级行业" placeholder="选择一级行业" value={industryPick.primary} options={query => primaryIndustryOptions(INDUSTRY_CATALOG, INDUSTRIES_WITH_CONTENT, { query })} onChange={primary => setIndustryPick({ primary, secondary: '' })} />
                <span className="ep-industry-sep">›</span>
                <IndustrySelect label="二级行业" placeholder={industryPick.primary ? '选择二级行业' : '请先选择一级行业'} disabled={!industryPick.primary} value={industryPick.secondary} options={query => secondaryIndustryOptions(INDUSTRY_CATALOG, industryPick.primary, INDUSTRIES_WITH_CONTENT, { query })} onChange={secondary => setIndustryPick(current => ({ ...current, secondary }))} />
                <Button onClick={addIndustry} disabled={draft.industries.length >= MAX_INDUSTRIES}><Plus size={14} />添加行业</Button>
              </div>
              <div className="ep-hint-left">已汇总各网站「网站信息 › 所属行业」（主行业与额外行业）全部列出，最多保留 {MAX_INDUSTRIES} 个{industrySources.length > MAX_INDUSTRIES && `（网站信息共 ${industrySources.length} 个，已保留前 ${MAX_INDUSTRIES} 个）`}。第一个为主行业，决定行业均值与四个被；主营产品按全部所属行业的产品字典匹配。<Library size={13} className="industry-library-icon" /> 表示已有完整行业内容。</div>
            </div>
          </>}

          {step === 1 && <>
            <div className="ep-field"><label>员工人数 <em>*</em></label><div className="ep-select-row">{EMPLOYEE_OPTIONS.map(option => <button key={option} type="button" aria-pressed={draft.employeeCount === option} className={`ep-select-card ${draft.employeeCount === option ? 'is-selected' : ''}`} onClick={() => update('employeeCount', option)}>{option}</button>)}</div></div>
            <div className="ep-field"><label>年营收规模 <em>*</em></label><div className="ep-select-row">{REVENUE_OPTIONS.map(option => <button key={option} type="button" aria-pressed={draft.annualRevenue === option} className={`ep-select-card ${draft.annualRevenue === option ? 'is-selected' : ''}`} onClick={() => update('annualRevenue', option)}>{option}</button>)}</div></div>
            <div className="ep-field">
              <div className="ep-source-note"><span>{isRefill ? '已带入上次保存的主营产品。' : `已汇总 ${sites.length} 个网站「网站信息 › 主营产品」，相同产品已合并。`}</span><Button size="small" onClick={resetProductsFromSites}><RefreshCcw size={13} />重置为网站信息</Button></div>
              {stepNotice && <div className="ep-step-notice" role="status">{stepNotice}</div>}
              <label>主营产品 <em>*</em></label>
              <div className="ep-product-tags">
                {draft.products.length === 0 && <span className="ep-muted">暂无产品，请在下方添加</span>}
                {draft.products.map(product => {
                  const sources = productSources.find(item => item.name === product)?.siteNames;
                  const matched = resolveProduct(product, industryScope);
                  const tip = `${sources ? `来自 ${sources.join('、')}` : '手动添加'}${matched ? (matched.standardName === product ? '' : ` · 按「${matched.standardName}」统计`) : ' · 产品字典未收录，市场与机会中显示待归类'}`;
                  return <span key={product} className={`ep-product-tag ${matched ? '' : 'is-unmatched'}`} title={tip}>{product}{!matched && <em>未收录</em>}<button type="button" aria-label={`移除 ${product}`} onClick={() => update('products', draft.products.filter(item => item !== product))}><X size={12} /></button></span>;
                })}
              </div>
              <div className="ep-product-add"><Input list="ep-product-dictionary" value={productInput} placeholder="输入或选择产品名称，按回车添加" onChange={event => setProductInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addProduct(); } }} /><Button onClick={addProduct}><Plus size={14} />添加</Button></div>
              <datalist id="ep-product-dictionary">{suggestions.map(name => <option key={name} value={name} />)}</datalist>
              <div className="ep-hint-left">{suggestions.length ? `可从所属行业的产品字典中选择（还有 ${suggestions.length} 个可选）。` : '所属行业暂无产品字典，可直接输入。'}标「未收录」的产品不在字典中，市场与机会中显示待归类。悬停标签可查看来源网站。修改不会影响网站信息。</div>
            </div>
          </>}

          {step === 2 && <>
            <div className="ep-field"><label>目标客户类型</label><OptionCardGrid options={CUSTOMER_TYPE_OPTIONS} isSelected={value => draft.customerType === value} onSelect={value => update('customerType', value)} /></div>
            <div className="ep-field"><label>经营模式</label><OptionCardGrid options={BUSINESS_MODEL_OPTIONS} columns={3} isSelected={value => draft.businessModel === value} onSelect={value => update('businessModel', value)} /></div>
          </>}

          {step === 3 && <div className="ep-field">
            <label>选择你当前使用的获客渠道（可多选）</label>
            <OptionCardGrid options={ACQUISITION_OPTIONS} columns={3} isSelected={value => draft.acquisition.includes(value)} onSelect={toggleAcquisition} />
            <div className="ep-selected-count">已选：{draft.acquisition.length} 个渠道</div>
          </div>}

          {step === 4 && <div className="ep-field"><label>选择最符合你当前状态的等级</label><LevelList options={DIGITAL_LEVEL_OPTIONS} value={draft.digitalLevel} onSelect={value => update('digitalLevel', value)} /></div>}
          {step === 5 && <div className="ep-field"><label>选择最符合你当前状态的等级</label><LevelList options={GLOBAL_LEVEL_OPTIONS} value={draft.globalLevel} onSelect={value => update('globalLevel', value)} /></div>}
          {step === 6 && <div className="ep-field"><label>选择最重要的一个目标</label><OptionCardGrid options={GOAL_OPTIONS} columns={5} isSelected={value => draft.goal === value} onSelect={value => update('goal', value)} /></div>}
        </div>
        {stepError && <div className="ep-step-error" role="alert">{stepError}</div>}
      </section>

      <div className="ep-wizard-nav">
        <div>{step > 0 && <Button onClick={() => goToStep(step - 1)}><ArrowLeft size={14} />上一步</Button>}</div>
        <Button variant="primary" onClick={goNext}>{isLastStep ? '完成评测，查看结果' : '下一步'}<ArrowRight size={14} /></Button>
      </div>
    </div>
  </OverviewShell>;
}

function ProfileResult({ record, answers, websiteStages, siteChanges, onRefill }: { record: EnterpriseProfileRecord; answers: DiagnosisAnswers; websiteStages: WebsiteStage[]; siteChanges: SiteChange[]; onRefill: (startStep?: number) => void }) {
  const strategy = matchStrategy(answers);
  const weakestStage = websiteStages.find(stage => stage.isWeakest);
  const industryLabel = formatAnswerIndustry(answers);
  const profileRows: { step: number; items: { label: string; value: string | string[] }[] }[] = [
    { step: 0, items: [{ label: '企业名称', value: answers.companyName }, { label: `所属行业（${answers.industries.length} 个，第一个为主行业）`, value: answers.industries.map(industryKey) }] },
    { step: 1, items: [{ label: '员工人数', value: answers.employeeCount }, { label: '年营收规模', value: answers.annualRevenue }, { label: '主营产品', value: answers.products }] },
    { step: 2, items: [{ label: '目标客户类型', value: optionLabel(CUSTOMER_TYPE_OPTIONS, answers.customerType) }, { label: '经营模式', value: optionLabel(BUSINESS_MODEL_OPTIONS, answers.businessModel) }] },
    { step: 3, items: [{ label: '获客渠道', value: answers.acquisition.map(value => optionLabel(ACQUISITION_OPTIONS, value)) }] },
    { step: 4, items: [{ label: '数字化水平', value: optionLabel(DIGITAL_LEVEL_OPTIONS, answers.digitalLevel) }] },
    { step: 5, items: [{ label: '全球化程度', value: optionLabel(GLOBAL_LEVEL_OPTIONS, answers.globalLevel) }] },
    { step: 6, items: [{ label: '核心目标', value: optionLabel(GOAL_OPTIONS, answers.goal) }] },
  ];
  const trustNote = strategy.industryBenchmark === null
    ? '本行业均值待补充'
    : `行业 ${strategy.industryBenchmark}分${strategy.trustGap ? ` · 差距${strategy.trustGap}分` : ' · 已超越'}`;
  const metrics = [
    { icon: '💻', value: answers.digitalLevel, label: '数字化水平', note: `差距：${strategy.digitalGap}级` },
    { icon: '🌍', value: answers.globalLevel, label: '全球化程度', note: `差距：${strategy.globalGap}级` },
    { icon: '🛡️', value: `${strategy.trustScore}分`, label: '信任评分', note: trustNote },
    { icon: '🎯', value: strategy.goalLabel, label: '核心目标', note: strategy.phaseLabel },
  ];

  return <div className="ep-page">
    <header className="ep-heading">
      <div><h1>企业画像</h1><p>第 {record.fillCount} 次评测 · 更新于 {record.completedAt}</p></div>
      <Button variant="primary" onClick={() => onRefill(0)}><RotateCcw size={14} />重新填写</Button>
    </header>

    {siteChanges.length > 0 && <div className="ep-site-change" role="status">
      <Info size={16} />
      <div>
        <strong>网站信息有变更，评测结果未自动更新</strong>
        <ul>{siteChanges.map(change => <li key={change.field}>{change.field}：{[change.added.length ? `新增 ${change.added.join('、')}` : '', change.removed.length ? `移除 ${change.removed.join('、')}` : ''].filter(Boolean).join('；')}</li>)}</ul>
        <small>点「重新评测」后，第 1、2 步仍带入上次保存的值，可点「重置为网站信息」带入最新内容。</small>
      </div>
      <Button variant="primary" onClick={() => onRefill(0)}><RotateCcw size={14} />重新评测</Button>
    </div>}

    <section className="ep-section">
      <div className="ep-section-head"><span className="ep-section-tag">01</span><div><h2>评测结果</h2><p>根据 7 步填写内容匹配的增长策略</p></div></div>
      <div className={`ep-plan-hero plan-${strategy.planId}`}>
        <span className="ep-plan-badge">方案 {strategy.planId}</span>
        <div className="ep-plan-title">{strategy.planName}</div>
        <div className="ep-plan-reason">{strategy.planReason}</div>
        <div className="ep-plan-company">{[answers.companyName, industryLabel, answers.employeeCount, answers.annualRevenue].join('  ·  ')}</div>
      </div>
      <div className="ep-metrics">{metrics.map(metric => <div key={metric.label} className="ep-metric"><span className="ep-metric-icon">{metric.icon}</span><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.note}</small></div>)}</div>
      {/* 关键发现、First Win 目标暂不做 */}
    </section>

    <section className="ep-section">
      <div className="ep-section-head"><span className="ep-section-tag">02</span><div><h2>企业画像</h2><p>7 步填写内容，可按步骤单独修改</p></div></div>
      <div className="ep-card ep-profile-table">
        {profileRows.map(row => <div key={row.step} className="ep-profile-row">
          <div className="ep-profile-step"><span>{DIAGNOSIS_STEPS[row.step].icon}</span>{DIAGNOSIS_STEPS[row.step].title}</div>
          <dl className="ep-profile-items">{row.items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? (item.value.length ? item.value.map(value => <span key={value} className="ep-value-tag">{value}</span>) : '—') : item.value || '—'}</dd></div>)}</dl>
          <button type="button" className="text-action" onClick={() => onRefill(row.step)}>修改</button>
        </div>)}
      </div>
    </section>

    <section className="ep-section">
      <div className="ep-section-head"><span className="ep-section-tag green">03</span><div><h2>网站需要具备的内容 · 四个被</h2><p>不是漏斗，是资格赛 —— 买家一态一态往里走，过不去就出局 · 行业：{answers.industry}</p></div></div>
      {websiteStages.length === 0 ? <div className="ep-card ep-stage-empty">「{answers.industry}」的四个被内容整理中，可先查看上方评测结果。</div> : <>
        <div className="ep-stages">
          {websiteStages.map(stage => <div key={stage.order} className={`ep-card ep-stage ${stage.isWeakest ? 'is-weakest' : ''}`}>
            <span className="ep-stage-num">{stage.order}</span>
            <div className="ep-stage-head"><div className="ep-stage-name">{stage.name}<span className="ep-stage-badge">{stage.badge}</span></div><div className="ep-stage-ask">{stage.buyerQuestion}</div></div>
            <div>
              <ul className="ep-stage-items">{stage.contentItems.map(item => <li key={item}>{item}</li>)}</ul>
              <div className="ep-stage-scenes">{stage.supportScenes.map(scene => <span key={scene.title} className="ep-stage-scene"><span>{scene.icon}</span>{scene.title}</span>)}</div>
            </div>
          </div>)}
        </div>
        <div className="ep-stage-note"><b>四态不是四个页面</b>，是买家往里走的四道资格：每一态由不同的支撑场景承接。{weakestStage && <>本行业<b>最容易失守的是「{weakestStage.name}」</b> —— {weakestStage.contentItems.join('、')}都要有文件可查，不能只靠话术。</>}</div>
      </>}
    </section>
  </div>;
}
