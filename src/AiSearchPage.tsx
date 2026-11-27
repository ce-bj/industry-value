import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ── 配置常量（静态，不进 meta.json）────────────────────────
/** AI知识库 › 知识资产目录 › 新增知识 › 选择后台页面（已有功能，不在本原型内）。 */
const AI_KNOWLEDGE_BACKEND_PAGE_URL = '/ai-knowledge/assets/?create=backend-page';
const AI_KNOWLEDGE_BACKEND_PAGE_PATH = ['AI知识库', '知识资产目录', '新增知识', '选择后台页面'];
const BATCH_STATUS_OPTIONS = [
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
] as const;
type BatchStatus = typeof BATCH_STATUS_OPTIONS[number]['value'];

/**
 * 应用/数据源：来自 AI知识库中「新增知识 › 选择后台页面」添加的后台页面，本页不能新增或删除。
 * aiSearchEnabled 表示该数据源是否可被 AI智能搜索检索（不是是否加入知识库）。
 */
interface AiSearchSource { id: string; appName: string; dataSourceName: string; aiSearchEnabled: boolean }

// ── 动态数据（DataSlot）──────────────────────────────────
const mockAiSearchSourcesData: AiSearchSource[] = [
  { id: 'src-product', appName: '产品管理', dataSourceName: '产品', aiSearchEnabled: true },
  { id: 'src-faq', appName: '常见问题', dataSourceName: '常见问题', aiSearchEnabled: true },
  { id: 'src-download', appName: '文件下载', dataSourceName: '文件下载', aiSearchEnabled: true },
  { id: 'src-intro-company', appName: '介绍内容', dataSourceName: '企业概况', aiSearchEnabled: true },
  { id: 'src-intro-field', appName: '介绍内容', dataSourceName: '应用领域', aiSearchEnabled: false },
  { id: 'src-intro-service', appName: '介绍内容', dataSourceName: '服务资源', aiSearchEnabled: true },
];

// ── 交互句柄（ActionSlot）────────────────────────────────
// ACTION: 获取 AI智能搜索应用/数据源列表 [GET] /api/ai-search/sources
function handleFetchAiSearchSources(params: { appName: string }) {
  console.log('fetch ai search sources', params);
}

// ACTION: 启用/禁用单个数据源的 AI智能搜索 [PATCH] /api/ai-search/sources/{id}
function handleToggleAiSearchSource(id: string, aiSearchEnabled: boolean) {
  console.log('toggle ai search source', { id, aiSearchEnabled });
}

// ACTION: 批量启用/禁用 AI智能搜索 [PATCH] /api/ai-search/sources/batch
function handleBatchUpdateAiSearchSources(ids: string[], aiSearchEnabled: boolean) {
  console.log('batch update ai search sources', { ids, aiSearchEnabled });
}

function openBackendPagePicker() {
  // 原型中不包含 AI知识库页面，生产环境直接跳转 AI_KNOWLEDGE_BACKEND_PAGE_URL。
  alert(`将跳转到「${AI_KNOWLEDGE_BACKEND_PAGE_PATH.join(' › ')}」\n${AI_KNOWLEDGE_BACKEND_PAGE_URL}\n\n（AI知识库为已有功能，本原型不包含该页面）`);
}

function SourcePathLink() {
  return <a href={AI_KNOWLEDGE_BACKEND_PAGE_URL} className="ai-search-path-link" onClick={event => { event.preventDefault(); openBackendPagePicker(); }}>
    {AI_KNOWLEDGE_BACKEND_PAGE_PATH.join(' › ')}<ArrowRight size={12} />
  </a>;
}

// ── 主组件 ────────────────────────────────────────────────
export default function AiSearchPage() {
  const [sources, setSources] = useState<AiSearchSource[]>(mockAiSearchSourcesData);
  const [appFilter, setAppFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const appNames = useMemo(() => [...new Set(sources.map(item => item.appName))], [sources]);
  const visible = appFilter ? sources.filter(item => item.appName === appFilter) : sources;
  const visibleSelected = visible.filter(item => selectedIds.includes(item.id));
  const allChecked = visible.length > 0 && visibleSelected.length === visible.length ? true : visibleSelected.length > 0 ? 'indeterminate' : false;

  function changeAppFilter(appName: string) {
    setAppFilter(appName);
    setSelectedIds([]);
    handleFetchAiSearchSources({ appName });
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? visible.map(item => item.id) : []);
  }
  function toggleRow(id: string, checked: boolean) {
    setSelectedIds(current => checked ? [...current, id] : current.filter(item => item !== id));
  }
  function setEnabled(ids: string[], aiSearchEnabled: boolean) {
    setSources(current => current.map(item => ids.includes(item.id) ? { ...item, aiSearchEnabled } : item));
  }
  function applyBatchStatus(status: BatchStatus | '') {
    if (!status) return;
    if (visibleSelected.length === 0) { alert('请先勾选应用/数据源'); return; }
    const ids = visibleSelected.map(item => item.id);
    const aiSearchEnabled = status === 'enabled';
    handleBatchUpdateAiSearchSources(ids, aiSearchEnabled);
    setEnabled(ids, aiSearchEnabled);
    setSelectedIds([]);
  }

  return <PortalShell section="aiSearch">
    <div className="ai-search-page">
      <h1>AI智能搜索</h1>
      <div className="ai-search-notice">
        <CircleAlert size={14} />
        <div>
          <p>AI 智能搜索是利用人工智能技术的搜索方式，通过自然语言处理、对全站知识进行知识库学习等手段，理解用户的自然语言提问，分析和理解用户意图，匹配出更加准确、个性化的搜索结果。仅支持AI知识库中已学习的应用/数据源。</p>
          <p>所有应用/数据源来源于 <SourcePathLink /> 中添加的后台页面。如需增加应用/数据源，请点击前往添加；本页仅设置是否可被 AI智能搜索检索。</p>
        </div>
      </div>
      <div className="ai-search-toolbar">
        <select aria-label="选择应用" value={appFilter} onChange={event => changeAppFilter(event.target.value)}>
          <option value="">全部应用</option>
          {appNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <div className="ai-search-table">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="ai-search-check"><Checkbox aria-label="全选" checked={allChecked} onCheckedChange={checked => toggleAll(checked === true)} /></TableHead>
            <TableHead>应用/数据源</TableHead>
            <TableHead>启用/禁用（AI搜索是否可用）</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {visible.map(item => <TableRow key={item.id}>
              <TableCell className="ai-search-check"><Checkbox aria-label={`选择 ${item.appName}/${item.dataSourceName}`} checked={selectedIds.includes(item.id)} onCheckedChange={checked => toggleRow(item.id, checked === true)} /></TableCell>
              <TableCell>{item.appName}/{item.dataSourceName}</TableCell>
              <TableCell><Switch aria-label={`${item.appName}/${item.dataSourceName} AI搜索是否可用`} checked={item.aiSearchEnabled} onCheckedChange={checked => { handleToggleAiSearchSource(item.id, checked); setEnabled([item.id], checked); }} /></TableCell>
            </TableRow>)}
            {visible.length === 0 && <TableRow><TableCell colSpan={3} className="ai-search-empty">暂无应用/数据源，请先在 <SourcePathLink /> 中添加后台页面</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="ai-search-footer">
        <label><Checkbox checked={allChecked} onCheckedChange={checked => toggleAll(checked === true)} />当页全选</label>
        <select aria-label="批量设置状态" value="" onChange={event => applyBatchStatus(event.target.value as BatchStatus | '')}>
          <option value="">状态</option>
          {BATCH_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
    </div>
  </PortalShell>;
}
