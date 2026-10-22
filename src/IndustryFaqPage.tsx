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
import { generateFaqDrafts, toggleReferenceSelection, type FaqDraft, type KnowledgeReference } from '@/faq';

type FaqStatus = 'published' | 'draft';
type FaqSource = '手工录入' | 'AI生成';
interface FaqItem { id: string; question: string; answer: string; category: string; publishedAt: string; status: FaqStatus; source: FaqSource; sourceTitle?: string }

const mockFaqItemsData: FaqItem[] = [
  { id: 'faq-1', question: '网站的定期维护工作有哪些？', answer: '包括内容更新、安全检查、访问统计及故障排查。', category: '百度百科', publishedAt: '2023-11-07 11:40:57', status: 'published', source: '手工录入' },
  { id: 'faq-2', question: '网站设计中的UI和UX有何不同？', answer: 'UI关注界面呈现，UX关注用户完成任务的整体体验。', category: '百度百科', publishedAt: '2023-11-07 11:40:42', status: 'published', source: '手工录入' },
  { id: 'faq-3', question: '网站托管服务有哪些类型？', answer: '常见类型包括共享托管、云托管与专用服务器。', category: '百度百科', publishedAt: '2023-11-07 11:40:27', status: 'published', source: '手工录入' },
  { id: 'faq-4', question: '网站流量统计工具的作用是什么？', answer: '帮助了解访问来源、热门页面和转化路径。', category: '百度百科', publishedAt: '2023-11-07 11:40:12', status: 'published', source: '手工录入' },
  { id: 'faq-5', question: '如何选择适合自己的网站建设技术？', answer: '根据业务规模、维护团队与扩展需求选择技术方案。', category: '百度百科', publishedAt: '2023-11-07 11:39:54', status: 'published', source: '手工录入' },
  { id: 'faq-6', question: '如何开始建立自己的网站？', answer: '先明确目标、内容结构和预算，再选择建站方式。', category: '百度百科', publishedAt: '2021-09-29 09:56:03', status: 'published', source: '手工录入' },
];

const mockReferenceKnowledgeData: KnowledgeReference[] = [
  { id: 'en-1', scope: 'enterprise', library: '企业公共知识库', primary: '品牌与企业', secondary: '公司介绍', title: '企业能力介绍', facts: [{ question: '企业能为生物药客户提供哪些服务？', answer: '企业提供生物药项目咨询、方案设计和交付支持。' }, { question: '企业通常如何推进项目交付？', answer: '项目按需求确认、方案评审、实施验证和验收交付四个阶段推进。' }, { question: '项目交付后可以获得哪些支持？', answer: '可获得使用培训、问题响应和定期维护建议。' }] },
  { id: 'en-2', scope: 'enterprise', library: '企业公共知识库', primary: '品牌与企业', secondary: '资质证书', title: '企业资质清单', facts: [{ question: '企业有哪些质量管理资质？', answer: '企业具备质量管理体系认证，并持续更新相关资质文件。' }, { question: '在哪里查看最新资质文件？', answer: '可联系项目负责人获取当前有效的资质文件清单及副本。' }, { question: '资质文件过期后如何处理？', answer: '应向资质管理人员核实更新状态，并使用最新有效版本。' }] },
  { id: 'en-3', scope: 'enterprise', library: '企业业务知识库', primary: '产品与服务', secondary: '产品规格', title: '制药设备规格手册', facts: [{ question: '如何选择合适的制药设备规格？', answer: '应结合产能、工艺要求和场地条件选择设备规格。' }, { question: '设备选型前需要确认哪些参数？', answer: '需确认批次规模、物料特性、工艺温度和可用空间等参数。' }, { question: '设备规格是否支持按项目调整？', answer: '可根据工艺和现场条件评估定制需求，最终以方案确认结果为准。' }] },
  { id: 'en-4', scope: 'enterprise', library: '企业业务知识库', primary: '产品与服务', secondary: '售前咨询', title: '售前咨询指南', facts: [{ question: '方案咨询前需要准备哪些资料？', answer: '建议准备产能目标、工艺流程和现有设备清单。' }, { question: '售前方案通常包括哪些内容？', answer: '通常包含需求分析、设备建议、实施范围和初步交付计划。' }, { question: '如何确认方案是否适合现有产线？', answer: '需结合现场调研结果与工艺参数，由双方共同评审适配性。' }] },
  { id: 'in-1', scope: 'industry', library: '生物医药', primary: '行业规范', secondary: '质量管理', title: '生物药质量管理指南', facts: [{ question: '生物药项目应重点关注哪些质量管理环节？', answer: '应重点关注原料追溯、过程控制、检验放行和偏差处理。' }, { question: '如何记录生产过程中的偏差？', answer: '应按质量体系要求记录偏差、评估影响、落实纠正措施并留存审核记录。' }, { question: '原料追溯需要保留哪些信息？', answer: '应保留供应商、批次、检验、领用和投料等可关联的记录。' }] },
  { id: 'in-2', scope: 'industry', library: '生物医药', primary: '行业规范', secondary: '生产要求', title: '生产环境要求', facts: [{ question: '生物药生产环境有哪些基本要求？', answer: '需按工艺风险划分洁净区域，并对环境监测与污染控制建立制度。' }, { question: '生产环境监测一般关注什么？', answer: '通常关注空气洁净度、微生物水平、温湿度及压差等指标。' }, { question: '洁净区域变更后要做什么？', answer: '应评估变更风险，并完成必要的确认、监测和记录更新。' }] },
  { id: 'in-3', scope: 'industry', library: '生物医药', primary: '行业应用', secondary: '解决方案', title: '生物药行业解决方案', facts: [{ question: '生物药行业解决方案通常包括哪些模块？', answer: '通常包括工艺设计、设备选型、质量控制与交付实施。' }, { question: '解决方案如何匹配不同生产规模？', answer: '应依据目标产能、工艺路线和扩产计划调整设备与实施方案。' }, { question: '方案实施前需要完成哪些评估？', answer: '建议完成工艺可行性、场地条件、质量风险和实施资源评估。' }] },
  { id: 'in-4', scope: 'industry', library: '医疗器械', primary: '行业规范', secondary: '注册与合规', title: '医疗器械合规概要', facts: [{ question: '医疗器械项目启动前要核对什么？', answer: '应核对产品分类、适用标准、注册路径及质量体系要求。' }, { question: '如何确定医疗器械产品分类？', answer: '应结合产品预期用途、工作原理和适用的分类目录进行判断。' }, { question: '注册资料准备通常涉及哪些内容？', answer: '通常涉及产品技术要求、检验资料、风险管理资料和质量体系文件。' }] },
];

// ACTION: 获取常见问题列表 [GET] /api/industry-scenario/faqs
function handleFetchFaqItems(params: { keyword?: string; status?: FaqStatus | 'all' }) {
  console.log('fetch FAQ list', params);
}
// ACTION: 获取 FAQ 参考知识范围 [GET] /api/industry-scenario/faq-references
function handleFetchReferenceKnowledge(params: { scope: 'enterprise' | 'industry' }) {
  console.log('fetch FAQ references', params);
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
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');

  const visibleItems = useMemo(() => items.filter(item => (statusFilter === 'all' || item.status === statusFilter) && (!keyword.trim() || `${item.question}${item.category}`.toLowerCase().includes(keyword.trim().toLowerCase()))).sort((a, b) => newestFirst ? b.publishedAt.localeCompare(a.publishedAt) : a.publishedAt.localeCompare(b.publishedAt)), [items, keyword, statusFilter, newestFirst]);
  const selectedVisible = visibleItems.length > 0 && visibleItems.every(item => selectedRows.has(item.id));

  const fetchList = (nextKeyword = keyword, nextStatus = statusFilter) => handleFetchFaqItems({ keyword: nextKeyword, status: nextStatus });
  const openGenerator = () => { handleFetchReferenceKnowledge({ scope: 'enterprise' }); setGeneratorOpen(true); setGeneratorNotice(''); };
  const toggleReference = (ids: string[]) => { setSelectedReferences(current => toggleReferenceSelection(current, ids)); setGeneratorNotice(''); };
  const generate = () => {
    handlePreviewGeneratedFaq({ sourceIds: [...selectedReferences] });
    const next = generateFaqDrafts(mockReferenceKnowledgeData, selectedReferences, items.map(item => item.question));
    setCandidates(next);
    setGeneratorNotice(next.length ? '' : '所选范围暂无新的可生成问题，请换一个分类。');
    setResultsNotice('');
  };
  const saveGenerated = () => {
    const selected = candidates.filter(item => item.selected);
    if (!selected.length) return;
    if (selected.some(item => !item.question.trim() || !item.answer.trim())) { setResultsNotice('请补全所选 FAQ 的问题和答案。'); return; }
    const questions = [...items.map(item => item.question), ...selected.map(item => item.question)].map(question => question.trim().toLocaleLowerCase());
    if (new Set(questions).size !== questions.length) { setResultsNotice('所选问题与现有内容或其他已选项目重复，请修改后再加入。'); return; }
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ');
    const created = selected.map((item, index): FaqItem => ({ id: `ai-${Date.now()}-${index}`, question: item.question.trim(), answer: item.answer.trim(), category: '常见问题', publishedAt: now, status: 'draft', source: 'AI生成', sourceTitle: item.sourceTitle }));
    handleCreateFaqItems(created);
    setItems(current => [...created, ...current]);
    const addedIds = new Set(selected.map(item => item.id));
    setCandidates(current => current.filter(item => !addedIds.has(item.id)));
    setResultsOpen(false); setResultsNotice('');
    setNotice(`已将 ${created.length} 条 AI 生成的 FAQ 加入“常见问题”，状态为草稿。`);
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
    <div className="faq-table-wrap"><Table><TableHeader><TableRow><TableHead className="select-col"><Checkbox aria-label="全选当前列表" checked={selectedVisible ? true : selectedRows.size ? 'indeterminate' : false} onCheckedChange={() => { setSelectedRows(current => { const next = new Set(current); visibleItems.forEach(item => selectedVisible ? next.delete(item.id) : next.add(item.id)); return next; }); }} /></TableHead><TableHead>问题 <span className="sort-glyph">◆</span></TableHead><TableHead className="category-col">所属分类</TableHead><TableHead className="date-col">发布时间 <span className="sort-glyph">◆</span></TableHead><TableHead className="status-col">发布状态 <span className="sort-glyph">◆</span></TableHead><TableHead className="operations-col">操作</TableHead></TableRow></TableHeader><TableBody>{visibleItems.map(item => <TableRow key={item.id}><TableCell><Checkbox aria-label={`选择${item.question}`} checked={selectedRows.has(item.id)} onCheckedChange={() => setSelectedRows(current => { const next = new Set(current); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })} /></TableCell><TableCell><div className="faq-question">{item.question}{item.source === 'AI生成' && <Badge className="source-ai">AI生成</Badge>}</div>{item.sourceTitle && <div className="faq-source">依据：{item.sourceTitle}</div>}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.status === 'draft' ? '—' : item.publishedAt}</TableCell><TableCell><Badge className={item.status === 'published' ? 'status-published' : 'status-draft'}>{item.status === 'published' ? '已发布' : '草稿'}</Badge></TableCell><TableCell><button className="text-action" onClick={() => openEditor(item)}>编辑</button><span className="operation-sep">|</span>{item.status === 'draft' ? <button className="text-action" onClick={() => publish(item.id)}>发布</button> : <button className="text-action" onClick={() => { setSelectedRows(new Set([item.id])); setNotice('已选中该问答，可使用回收站操作。'); }}>更多</button>}</TableCell></TableRow>)}{visibleItems.length === 0 && <TableRow><TableCell colSpan={6}><div className="table-empty">没有匹配的常见问题</div></TableCell></TableRow>}</TableBody></Table></div>
    <div className="table-footer">共 {visibleItems.length} 条记录</div>
  </div>
  <FaqGeneratorDialog open={generatorOpen} onOpenChange={setGeneratorOpen} references={mockReferenceKnowledgeData} selected={selectedReferences} onToggle={toggleReference} candidates={candidates} onGenerate={generate} onViewResults={() => { setGeneratorOpen(false); setResultsOpen(true); }} notice={generatorNotice} onScopeChange={scope => handleFetchReferenceKnowledge({ scope })} />
  <FaqResultsDialog open={resultsOpen} onOpenChange={setResultsOpen} candidates={candidates} onEditCandidate={(id, patch) => { setCandidates(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); setResultsNotice(''); }} onSelectMany={(ids, selected) => { const idSet = new Set(ids); setCandidates(current => current.map(item => idSet.has(item.id) ? { ...item, selected } : item)); setResultsNotice(''); }} onAdd={saveGenerated} notice={resultsNotice} />
  <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="edit-dialog"><DialogHeader><DialogTitle>{editingId ? '编辑常见问题' : '添加常见问题'}</DialogTitle><DialogDescription>填写标准问题和答案，保存后可在列表中继续维护。</DialogDescription></DialogHeader><div className="edit-fields"><label>问题 <b>*</b><Input value={form.question} onChange={event => setForm(current => ({ ...current, question: event.target.value }))} /></label><label>答案 <b>*</b><Textarea rows={5} value={form.answer} onChange={event => setForm(current => ({ ...current, answer: event.target.value }))} /></label><label>所属分类<Input value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label></div><div className="edit-footer"><Button onClick={() => setEditOpen(false)}>取消</Button><Button variant="primary" onClick={saveEditor}>保存</Button></div></DialogContent></Dialog>
  </PortalShell>;
}
