import { useMemo, useState } from 'react';
import { ChevronDown, Filter, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { FaqGeneratorDialog } from '@/components/FaqGeneratorDialog';
import { FaqResultsDialog } from '@/components/FaqResultsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { countGeneratedBySource, generateFaqDrafts, toggleSourceSelection, type FaqDraft, type FaqSourceItem, type FaqSourceMenu } from '@/faq';

type FaqStatus = 'published' | 'draft';
type FaqSource = '手工录入' | 'AI生成';
interface FaqItem { id: string; question: string; answer: string; category: string; publishedAt: string; status: FaqStatus; source: FaqSource; sourceId?: string; sourceTitle?: string; sourceMenu?: FaqSourceMenu; generationNumber?: number }

const mockFaqItemsData: FaqItem[] = [
  { id: 'faq-1', question: '网站的定期维护工作有哪些？', answer: '包括内容更新、安全检查、访问统计及故障排查。', category: '百度百科', publishedAt: '2023-11-07 11:40:57', status: 'published', source: '手工录入' },
  { id: 'faq-2', question: '网站设计中的UI和UX有何不同？', answer: 'UI关注界面呈现，UX关注用户完成任务的整体体验。', category: '百度百科', publishedAt: '2023-11-07 11:40:42', status: 'published', source: '手工录入' },
  { id: 'faq-3', question: '网站托管服务有哪些类型？', answer: '常见类型包括共享托管、云托管与专用服务器。', category: '百度百科', publishedAt: '2023-11-07 11:40:27', status: 'published', source: '手工录入' },
  { id: 'faq-4', question: '网站流量统计工具的作用是什么？', answer: '帮助了解访问来源、热门页面和转化路径。', category: '百度百科', publishedAt: '2023-11-07 11:40:12', status: 'published', source: '手工录入' },
  { id: 'faq-5', question: '如何选择适合自己的网站建设技术？', answer: '根据业务规模、维护团队与扩展需求选择技术方案。', category: '百度百科', publishedAt: '2023-11-07 11:39:54', status: 'published', source: '手工录入' },
  { id: 'faq-6', question: '如何开始建立自己的网站？', answer: '先明确目标、内容结构和预算，再选择建站方式。', category: '百度百科', publishedAt: '2021-09-29 09:56:03', status: 'published', source: '手工录入' },
  { id: 'faq-ai-existing', question: '数控车床适合加工哪些零件？', answer: '示例产品资料显示，该数控车床可用于轴类、盘类等零件加工；具体适配范围以产品详情为准。', category: '常见问题', publishedAt: '2026-10-22 10:20:00', status: 'published', source: 'AI生成', sourceId: 'prod-1', sourceTitle: '数控车床', sourceMenu: 'products', generationNumber: 1 },
];

const mockFaqSourceItemsData: FaqSourceItem[] = [
  { id: 'prod-1', menu: 'products', title: '数控车床', category: '机械设备 / 机床', image: '/faq/product.svg', fields: ['型号规格', '最大加工直径', '主轴转速'], summary: '面向轴类与盘类零件加工的数控设备', suggestedQuestion: '数控车床适合加工哪些零件？', suggestedAnswer: '示例产品资料显示，该数控车床可用于轴类、盘类等零件加工；具体适配范围以产品详情为准。' },
  { id: 'prod-2', menu: 'products', title: '建筑钢结构', category: '建筑材料 / 钢结构', image: '/faq/product.svg', fields: ['构件类型', '钢材牌号', '截面高度'], summary: '用于建筑结构的钢构件产品', suggestedQuestion: '建筑钢结构产品有哪些常见构件类型？', suggestedAnswer: '示例产品条目包括焊接 H 型钢、箱型柱等构件类型，具体规格应查看对应产品详情。' },
  { id: 'prod-3', menu: 'products', title: '汽车刹车片', category: '汽车零部件 / 制动系统', image: '/faq/product.svg', fields: ['摩擦材料', '厚度', '适配车型'], summary: '汽车制动系统摩擦件', suggestedQuestion: '选择汽车刹车片时应核对哪些信息？', suggestedAnswer: '应核对适配车型、安装位置、尺寸及摩擦材料，并以产品条目和车辆要求为准。' },
  { id: 'honor-1', menu: 'honors', title: '质量管理体系认证', category: '体系认证', summary: '示例资质记录，具体有效性以证书详情为准', suggestedQuestion: '如何核实质量管理体系认证是否有效？', suggestedAnswer: '应查看荣誉资质条目中的颁发机构、证书编号、适用范围及有效期，并核对原始证书。' },
  { id: 'honor-2', menu: 'honors', title: '高新技术企业证书', category: '企业荣誉', summary: '示例荣誉记录，需核对证书有效期', suggestedQuestion: '在哪里查看高新技术企业证书信息？', suggestedAnswer: '可在荣誉资质条目中查看证书名称和相关资料；当前有效状态应以证书文件为准。' },
  { id: 'honor-3', menu: 'honors', title: '产品检测报告', category: '检测报告', summary: '示例检测类资质记录', suggestedQuestion: '产品检测报告能说明哪些内容？', suggestedAnswer: '应以该报告列明的产品型号、检测项目、结果和适用范围为准，不能推及未覆盖的产品。' },
  { id: 'company-1', menu: 'company', title: '公司介绍', category: '企业概况 / 基本信息', image: '/faq/company.svg', summary: '介绍企业业务方向与服务范围', suggestedQuestion: '公司主要提供哪些产品和服务？', suggestedAnswer: '示例企业概况介绍了产品研发、制造与项目交付服务；具体业务范围以企业概况正文为准。' },
  { id: 'company-2', menu: 'company', title: '研发能力', category: '企业概况 / 企业能力', image: '/faq/company.svg', summary: '介绍研发团队与技术验证流程', suggestedQuestion: '企业的研发工作主要覆盖哪些环节？', suggestedAnswer: '示例内容包括需求分析、方案设计、样品验证与持续改进，具体能力以企业概况条目为准。' },
  { id: 'company-3', menu: 'company', title: '生产基地', category: '企业概况 / 生产能力', image: '/faq/company.svg', summary: '介绍生产场地和主要工艺', suggestedQuestion: '在哪里了解企业的生产能力？', suggestedAnswer: '可查看企业概况中的生产基地条目，了解场地、工艺与设备信息；具体产能应以已发布资料为准。' },
  { id: 'case-1', menu: 'cases', title: '数控车床加工产线升级', category: '机械制造', summary: '数控设备应用案例', suggestedQuestion: '数控车床在加工产线升级案例中发挥什么作用？', suggestedAnswer: '案例展示了以数控车床承担零件加工工序的应用方式；实际效果以案例记录为准。' },
  { id: 'case-2', menu: 'cases', title: '钢结构厂房建设项目', category: '建筑工程', summary: '建筑钢结构应用案例', suggestedQuestion: '钢结构厂房案例采用了哪些类型的构件？', suggestedAnswer: '案例介绍了钢柱、钢梁等结构构件的应用，具体型号与工程范围应查看案例详情。' },
  { id: 'case-3', menu: 'cases', title: '汽车制动系统配套项目', category: '汽车零部件', summary: '制动系统配套案例', suggestedQuestion: '汽车制动系统配套案例包含哪些工作？', suggestedAnswer: '案例展示了适配确认、样件验证和批量交付等环节，具体项目范围以客户案例内容为准。' },
];

// ACTION: 获取常见问题列表 [GET] /api/industry-scenario/faqs
function handleFetchFaqItems(params: { keyword?: string; status?: FaqStatus | 'all' }) {
  console.log('fetch FAQ list', params);
}
// ACTION: 获取可生成 FAQ 的栏目数据 [GET] /api/industry-scenario/faq-sources
function handleFetchFaqSources(params: { menu: FaqSourceMenu }) {
  console.log('fetch FAQ source items', params);
}
// ACTION: 生成 FAQ 候选预览 [POST] /api/industry-scenario/faqs/ai-preview
function handlePreviewGeneratedFaq(payload: { sourceIds: string[] }) {
  console.log('preview generated FAQ', payload);
}
// ACTION: 批量创建 FAQ 草稿 [POST] /api/industry-scenario/faqs/batch
function handleCreateFaqItems(payload: FaqItem[]) {
  console.log('create FAQ drafts', payload);
}
// ACTION: 更新 FAQ [PATCH] /api/industry-scenario/faqs/{id}
function handleUpdateFaqItem(payload: FaqItem) {
  console.log('update FAQ', payload);
}
// ACTION: 发布 FAQ 草稿 [PATCH] /api/industry-scenario/faqs/{id}/publish
function handlePublishFaqItem(id: string) {
  console.log('publish FAQ', id);
}
// ACTION: 删除 FAQ [DELETE] /api/industry-scenario/faqs/{id}
function handleDeleteFaqItem(id: string) {
  console.log('delete FAQ', id);
}

const emptyForm = { question: '', answer: '', category: '常见问题' };

export default function IndustryFaqPage() {
  const [items, setItems] = useState<FaqItem[]>(mockFaqItemsData);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<FaqStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(new Set());
  const [candidates, setCandidates] = useState<FaqDraft[]>([]);
  const [generatorNotice, setGeneratorNotice] = useState('');
  const [resultsNotice, setResultsNotice] = useState('');
  const [saveCategory, setSaveCategory] = useState('常见问题');
  const faqCategories = [...new Set(['常见问题', ...items.map(item => item.category)])];
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');

  const visibleItems = useMemo(() => items.filter(item => (statusFilter === 'all' || item.status === statusFilter) && (!keyword.trim() || `${item.question}${item.category}`.toLowerCase().includes(keyword.trim().toLowerCase()))).sort((a, b) => newestFirst ? b.publishedAt.localeCompare(a.publishedAt) : a.publishedAt.localeCompare(b.publishedAt)), [items, keyword, statusFilter, newestFirst]);
  const selectedVisible = visibleItems.length > 0 && visibleItems.every(item => selectedRows.has(item.id));
  const generatedCounts = useMemo(() => countGeneratedBySource(items), [items]);

  const fetchList = (nextKeyword = keyword, nextStatus = statusFilter) => handleFetchFaqItems({ keyword: nextKeyword, status: nextStatus });
  const openGenerator = () => { handleFetchFaqSources({ menu: 'products' }); setGeneratorOpen(true); setGeneratorNotice(''); };
  const toggleReference = (ids: string[]) => { setSelectedReferences(current => toggleSourceSelection(current, ids)); setGeneratorNotice(''); };
  const generate = () => {
    handlePreviewGeneratedFaq({ sourceIds: [...selectedReferences] });
    const next = generateFaqDrafts(mockFaqSourceItemsData, selectedReferences, items);
    setCandidates(next);
    setGeneratorNotice(next.length ? '' : '请先选择要生成 FAQ 的数据条目。');
    setResultsNotice('');
    if (next.length) { setGeneratorOpen(false); setResultsOpen(true); }
  };
  const saveGenerated = () => {
    const selected = candidates.filter(item => item.selected);
    if (!selected.length) return;
    if (selected.some(item => !item.question.trim() || !item.answer.trim())) { setResultsNotice('请补全所选 FAQ 的问题和答案。'); return; }
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ');
    const created = selected.map((item, index): FaqItem => ({ id: `ai-${Date.now()}-${index}`, question: item.question.trim(), answer: item.answer.trim(), category: saveCategory, publishedAt: now, status: 'draft', source: 'AI生成', sourceId: item.sourceId, sourceTitle: item.sourceTitle, sourceMenu: item.sourceMenu, generationNumber: item.generationNumber }));
    handleCreateFaqItems(created);
    setItems(current => [...created, ...current]);
    const addedIds = new Set(selected.map(item => item.id));
    setCandidates(current => current.filter(item => !addedIds.has(item.id)));
    setResultsOpen(false); setResultsNotice('');
    setSelectedReferences(new Set());
    setNotice(`已将 ${created.length} 条 FAQ 保存到「${saveCategory}」，状态为草稿。`);
  };
  const openEditor = (item?: FaqItem) => { setEditingId(item?.id || null); setForm(item ? { question: item.question, answer: item.answer, category: item.category } : emptyForm); setEditOpen(true); };
  const saveEditor = () => {
    if (!form.question.trim() || !form.answer.trim()) return setNotice('问题和答案均为必填。');
    if (editingId) {
      const original = items.find(item => item.id === editingId)!;
      const updated = { ...original, question: form.question.trim(), answer: form.answer.trim(), category: form.category.trim() || '常见问题' };
      handleUpdateFaqItem(updated); setItems(current => current.map(item => item.id === editingId ? updated : item));
    } else {
      const created: FaqItem = { id: `manual-${Date.now()}`, question: form.question.trim(), answer: form.answer.trim(), category: form.category.trim() || '常见问题', publishedAt: new Date().toLocaleString('sv-SE'), status: 'draft', source: '手工录入' };
      handleCreateFaqItems([created]); setItems(current => [created, ...current]);
    }
    setEditOpen(false); setNotice(editingId ? '问答已更新。' : '问答草稿已添加。');
  };
  const deleteSelected = () => { if (!selectedRows.size || !window.confirm(`确定删除选中的 ${selectedRows.size} 条问答吗？`)) return; selectedRows.forEach(handleDeleteFaqItem); setItems(current => current.filter(item => !selectedRows.has(item.id))); setSelectedRows(new Set()); setNotice('已删除所选问答。'); };
  const publish = (id: string) => { handlePublishFaqItem(id); setItems(current => current.map(item => item.id === id ? { ...item, status: 'published', publishedAt: new Date().toLocaleString('sv-SE') } : item)); setNotice('问答已发布。'); };

  return <PortalShell><div className="faq-page">
    <div className="faq-page-heading"><h1>常见问题</h1><div className="faq-search"><Input aria-label="按问题搜索" placeholder="请输入关键词" value={keyword} onChange={event => { setKeyword(event.target.value); fetchList(event.target.value); }} /><Button aria-label="搜索" onClick={() => fetchList()}><Search size={17} /></Button><Button className="filter-button" aria-label="筛选状态" aria-expanded={showFilters} onClick={() => setShowFilters(value => !value)}><Filter size={17} fill="currentColor" /></Button></div></div>
    <div className="faq-toolbar"><div className="faq-toolbar-left"><Button variant="primary" onClick={() => openEditor()}><Plus size={15} /> 添加 <span className="button-divider" /><ChevronDown size={14} /></Button><Button onClick={() => setNotice('当前分类：百度百科、常见问题。')}>分类管理</Button><Button onClick={deleteSelected} disabled={!selectedRows.size}><Trash2 size={14} /> 回收站</Button><Button onClick={() => setNewestFirst(value => !value)}>排序</Button><Button onClick={() => setNotice('可在列表中勾选问答后批量处理。')}>更多操作 <ChevronDown size={14} /></Button></div><div className="faq-toolbar-right">{candidates.length > 0 && <Button onClick={() => setResultsOpen(true)}>查看生成结果（{candidates.length}）</Button>}<Button variant="primary" className="ai-action" onClick={openGenerator}><Sparkles size={16} /> AI 生成 FAQ</Button></div></div>
    {showFilters && <div className="filter-panel"><span>发布状态</span><select aria-label="发布状态" value={statusFilter} onChange={event => { const status = event.target.value as FaqStatus | 'all'; setStatusFilter(status); fetchList(keyword, status); }}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select><Button variant="ghost" onClick={() => { setStatusFilter('all'); fetchList(keyword, 'all'); }}>重置</Button></div>}
    {notice && <div className="page-notice" role="status">{notice}<button aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
    <div className="faq-table-wrap"><Table><TableHeader><TableRow><TableHead className="select-col"><Checkbox aria-label="全选当前列表" checked={selectedVisible ? true : selectedRows.size ? 'indeterminate' : false} onCheckedChange={() => { setSelectedRows(current => { const next = new Set(current); visibleItems.forEach(item => selectedVisible ? next.delete(item.id) : next.add(item.id)); return next; }); }} /></TableHead><TableHead>问题 <span className="sort-glyph">◆</span></TableHead><TableHead className="category-col">所属分类</TableHead><TableHead className="date-col">发布时间 <span className="sort-glyph">◆</span></TableHead><TableHead className="status-col">发布状态 <span className="sort-glyph">◆</span></TableHead><TableHead className="operations-col">操作</TableHead></TableRow></TableHeader><TableBody>{visibleItems.map(item => <TableRow key={item.id}><TableCell><Checkbox aria-label={`选择${item.question}`} checked={selectedRows.has(item.id)} onCheckedChange={() => setSelectedRows(current => { const next = new Set(current); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })} /></TableCell><TableCell><div className="faq-question">{item.question}{item.source === 'AI生成' && <Badge className="source-ai">AI生成</Badge>}</div>{item.sourceTitle && <div className="faq-source">来源：{item.sourceTitle}{item.generationNumber ? ` · 第 ${item.generationNumber} 次生成` : ''}</div>}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.status === 'draft' ? '—' : item.publishedAt}</TableCell><TableCell><Badge className={item.status === 'published' ? 'status-published' : 'status-draft'}>{item.status === 'published' ? '已发布' : '草稿'}</Badge></TableCell><TableCell><button className="text-action" onClick={() => openEditor(item)}>编辑</button><span className="operation-sep">|</span>{item.status === 'draft' ? <button className="text-action" onClick={() => publish(item.id)}>发布</button> : <button className="text-action" onClick={() => { setSelectedRows(new Set([item.id])); setNotice('已选中该问答，可使用回收站操作。'); }}>更多</button>}</TableCell></TableRow>)}{visibleItems.length === 0 && <TableRow><TableCell colSpan={6}><div className="table-empty">没有匹配的常见问题</div></TableCell></TableRow>}</TableBody></Table></div>
    <div className="table-footer">共 {visibleItems.length} 条记录</div>
  </div>
  <FaqGeneratorDialog key={generatorOpen ? 'open' : 'closed'} open={generatorOpen} onOpenChange={setGeneratorOpen} sources={mockFaqSourceItemsData} generatedCounts={generatedCounts} selected={selectedReferences} onToggle={toggleReference} candidates={candidates} onGenerate={generate} onViewResults={() => { setGeneratorOpen(false); setResultsOpen(true); }} notice={generatorNotice} onMenuChange={menu => handleFetchFaqSources({ menu })} />
  <FaqResultsDialog categories={faqCategories} category={saveCategory} onCategoryChange={setSaveCategory} open={resultsOpen} onOpenChange={setResultsOpen} candidates={candidates} onEditCandidate={(id, patch) => { setCandidates(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); setResultsNotice(''); }} onSelectMany={(ids, selected) => { const idSet = new Set(ids); setCandidates(current => current.map(item => idSet.has(item.id) ? { ...item, selected } : item)); setResultsNotice(''); }} onAdd={saveGenerated} notice={resultsNotice} />
  <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="edit-dialog"><DialogHeader><DialogTitle>{editingId ? '编辑常见问题' : '添加常见问题'}</DialogTitle><DialogDescription>填写标准问题和答案，保存后可在列表中继续维护。</DialogDescription></DialogHeader><div className="edit-fields"><label>问题 <b>*</b><Input value={form.question} onChange={event => setForm(current => ({ ...current, question: event.target.value }))} /></label><label>答案 <b>*</b><Textarea rows={5} value={form.answer} onChange={event => setForm(current => ({ ...current, answer: event.target.value }))} /></label><label>所属分类<Input value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label></div><div className="edit-footer"><Button onClick={() => setEditOpen(false)}>取消</Button><Button variant="primary" onClick={saveEditor}>保存</Button></div></DialogContent></Dialog>
  </PortalShell>;
}
