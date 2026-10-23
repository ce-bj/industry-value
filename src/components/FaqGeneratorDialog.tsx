import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FaqDraft, FaqSourceItem, FaqSourceMenu } from '@/faq';

const menuGroups: Array<{ label: string; children: Array<{ id: FaqSourceMenu; label: string }> }> = [
  { label: '产品管理', children: [{ id: 'products', label: '产品列表' }] },
  { label: '内容管理', children: [{ id: 'honors', label: '荣誉资质' }, { id: 'company', label: '企业概况' }, { id: 'cases', label: '客户案例' }] },
];

interface GeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: FaqSourceItem[];
  generatedCounts: ReadonlyMap<string, number>;
  selected: ReadonlySet<string>;
  onToggle: (sourceIds: string[]) => void;
  candidates: FaqDraft[];
  onGenerate: () => void;
  onViewResults: () => void;
  notice: string;
  onMenuChange: (menu: FaqSourceMenu) => void;
}

export function FaqGeneratorDialog({ open, onOpenChange, sources, generatedCounts, selected, onToggle, candidates, onGenerate, onViewResults, notice, onMenuChange }: GeneratorProps) {
  const [menu, setMenu] = useState<FaqSourceMenu>('products');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => sources.filter(item => item.menu === menu && (!query.trim() || `${item.title} ${item.category} ${item.fields?.join(' ') || ''}`.toLowerCase().includes(query.trim().toLowerCase()))), [sources, menu, query]);
  const selectedVisible = visible.length > 0 && visible.every(item => selected.has(item.id));
  const currentLabel = menuGroups.flatMap(group => group.children).find(item => item.id === menu)?.label || '';

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="generator-dialog">
      <DialogHeader><div className="generator-title-row"><span className="generator-title-icon"><Sparkles size={19} /></span><div><DialogTitle>AI 生成 FAQ</DialogTitle><DialogDescription>从业务栏目选择具体数据；每条选中的数据生成一条 FAQ，查看结果后确认保存。</DialogDescription></div></div></DialogHeader>
      <div className="generator-workspace">
        <aside className="generator-menu" aria-label="生成来源栏目">{menuGroups.map(group => <div key={group.label} className="generator-menu-group"><strong>{group.label}</strong>{group.children.map(item => <button type="button" key={item.id} className={menu === item.id ? 'is-active' : ''} aria-current={menu === item.id ? 'page' : undefined} onClick={() => { setMenu(item.id); setQuery(''); onMenuChange(item.id); }}>{item.label}<span>{sources.filter(source => source.menu === item.id).length}</span></button>)}</div>)}</aside>
        <section className="generator-content" aria-label={`${currentLabel}数据条目`}>
          <div className="generator-content-heading"><div><strong>{currentLabel}</strong><span>选择数据条目，可跨栏目勾选</span></div><label className="generator-search"><Search size={15} /><Input aria-label={`搜索${currentLabel}`} placeholder="搜索名称、分类或字段" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
          <div className="generator-table-wrap"><Table className="generator-source-table"><TableHeader><TableRow><TableHead className="generator-check-col"><Checkbox aria-label="全选当前筛选结果" checked={selectedVisible ? true : visible.some(item => selected.has(item.id)) ? 'indeterminate' : false} disabled={!visible.length} onCheckedChange={() => onToggle(visible.map(item => item.id))} /></TableHead>{menu === 'products' && <><TableHead>缩略图</TableHead><TableHead>产品名称</TableHead><TableHead>分类</TableHead><TableHead>字段</TableHead></>}{menu === 'company' && <><TableHead>概要图片</TableHead><TableHead>内容标题</TableHead><TableHead>所属分类</TableHead></>}{menu === 'honors' && <><TableHead>分类</TableHead><TableHead>荣誉名称</TableHead></>}{menu === 'cases' && <><TableHead>案例名称</TableHead><TableHead>案例分类</TableHead></>}<TableHead>生成状态</TableHead></TableRow></TableHeader><TableBody>{visible.map(item => {
            const count = generatedCounts.get(item.id) || 0;
            return <TableRow key={item.id}><TableCell><Checkbox aria-label={`选择${item.title}`} checked={selected.has(item.id)} onCheckedChange={() => onToggle([item.id])} /></TableCell>{(menu === 'products' || menu === 'company') && <TableCell><img className="generator-thumbnail" src={item.image} alt={item.title} /></TableCell>}{menu === 'honors' && <TableCell>{item.category}</TableCell>}<TableCell><strong className="generator-item-title">{item.title}</strong><span className="generator-item-summary">{item.summary}</span></TableCell>{(menu === 'products' || menu === 'company' || menu === 'cases') && <TableCell>{item.category}</TableCell>}{menu === 'products' && <TableCell><span className="generator-fields">{item.fields?.join('、') || '—'}</span></TableCell>}<TableCell>{count ? <span className="generator-generated">已生成 {count} 次</span> : <span className="generator-never">未生成</span>}</TableCell></TableRow>;
          })}{visible.length === 0 && <TableRow><TableCell colSpan={menu === 'products' ? 6 : menu === 'company' ? 5 : 4}><div className="table-empty">当前栏目没有匹配的数据条目</div></TableCell></TableRow>}</TableBody></Table></div>
        </section>
      </div>
      <div className="generator-selection-bar"><span>已选择 <strong>{selected.size}</strong> 条数据；已生成条目再次选择会生成新 FAQ，原有内容保留。</span>{candidates.length > 0 && <Button onClick={onViewResults}>查看待确认结果（{candidates.length}）</Button>}</div>
      {notice && <div role="status" className="generator-notice">{notice}</div>}
      <footer className="generator-footer"><span>生成后进入结果页确认保存。</span><div><Button onClick={() => onOpenChange(false)}>取消</Button><Button variant="primary" disabled={!selected.size} onClick={onGenerate}><Sparkles size={15} />生成 {selected.size} 条 FAQ</Button></div></footer>
    </DialogContent>
  </Dialog>;
}
