import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { IndustryAttribute, IndustrySpec } from '@/attributeTemplate';

export interface IndustryProduct { id: string; category: string; name: string; description: string }

interface PickerProps {
  kind: 'attribute' | 'spec';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: IndustryProduct[];
  attributes: IndustryAttribute[];
  specs: IndustrySpec[];
  excludedIds: ReadonlySet<string>;
  onProductChange: (productId: string) => void;
  onConfirm: (ids: string[]) => void;
}

export function IndustryPickerDialog({ kind, open, onOpenChange, products, attributes, specs, excludedIds, onProductChange, onConfirm }: PickerProps) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(products.map(item => item.category)));
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const isSpec = kind === 'spec';
  const product = products.find(item => item.id === productId);
  const categories = [...new Set(products.map(item => item.category))];
  const rows = (isSpec ? specs : attributes).filter(item => item.productId === productId && (!query.trim() || `${item.name} ${item.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())));
  const available = rows.filter(item => !excludedIds.has(item.id));
  const allVisibleSelected = available.length > 0 && available.every(item => selectedIds.has(item.id));

  const toggle = (id: string) => setSelectedIds(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const confirm = () => {
    onConfirm([...selectedIds]);
    setSelectedIds(new Set());
    setQuery('');
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={value => { if (!value) { setSelectedIds(new Set()); setQuery(''); } onOpenChange(value); }}>
    <DialogContent className="industry-picker-dialog">
      <DialogHeader><DialogTitle>{isSpec ? '选择行业属性值规格' : '选择行业属性模板'}</DialogTitle><DialogDescription>第一期示例行业：制造业 → 汽车零部件。选择产品下的{isSpec ? '规格项' : '属性项'}，加入当前属性模板。</DialogDescription></DialogHeader>
      <div className="picker-industry-path"><strong>行业分类</strong><span>制造业</span><ChevronRight size={13} /><span>汽车零部件</span></div>
      <div className="picker-body">
        <aside className="picker-product-tree" aria-label="行业产品树"><div className="picker-pane-heading">产品分类 / 产品</div>{categories.map(category => <div key={category} className="picker-category"><button type="button" className="picker-category-button" onClick={() => setExpandedCategories(current => { const next = new Set(current); next.has(category) ? next.delete(category) : next.add(category); return next; })} aria-expanded={expandedCategories.has(category)}>{expandedCategories.has(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{category}</button>{expandedCategories.has(category) && products.filter(item => item.category === category).map(item => <button type="button" key={item.id} className={`picker-product ${productId === item.id ? 'is-active' : ''}`} onClick={() => { setProductId(item.id); setExpandedSpec(null); onProductChange(item.id); }}>{item.name}</button>)}</div>)}</aside>
        <section className="picker-options"><div className="picker-options-heading"><div><strong>{product?.name || '选择产品'}</strong><span>{product?.description}</span></div><label className="picker-search"><Search size={14} /><Input aria-label={`搜索行业${isSpec ? '规格' : '属性'}`} placeholder={`搜索${isSpec ? '规格名称' : '属性名称'}`} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
          <div className="picker-table-wrap"><Table className="picker-table"><TableHeader><TableRow><TableHead className="picker-check-col"><Checkbox aria-label="全选当前产品可用项" checked={allVisibleSelected ? true : available.some(item => selectedIds.has(item.id)) ? 'indeterminate' : false} disabled={!available.length} onCheckedChange={checked => setSelectedIds(current => { const next = new Set(current); available.forEach(item => checked === true ? next.add(item.id) : next.delete(item.id)); return next; })} /></TableHead><TableHead>{isSpec ? '规格类型' : '属性项'}</TableHead><TableHead>{isSpec ? '属性值' : '字段类型 / 单位'}</TableHead><TableHead className="picker-status-col">状态</TableHead></TableRow></TableHeader><TableBody>{rows.map(item => {
            const alreadyAdded = excludedIds.has(item.id);
            const spec = isSpec ? item as IndustrySpec : null;
            const attribute = !isSpec ? item as IndustryAttribute : null;
            return <TableRow key={item.id}><TableCell><Checkbox aria-label={`选择${item.name}`} checked={selectedIds.has(item.id) || alreadyAdded} disabled={alreadyAdded} onCheckedChange={() => toggle(item.id)} /></TableCell><TableCell><strong>{item.name}</strong><div className="picker-description">{item.description}</div></TableCell><TableCell>{spec ? <><button className="text-action picker-expand-values" onClick={() => setExpandedSpec(current => current === spec.id ? null : spec.id)} aria-expanded={expandedSpec === spec.id}>{expandedSpec === spec.id ? '收起' : '查看'} {spec.values.length} 个属性值</button><div className="picker-values-preview">{spec.values.slice(0, 3).join('、')}{spec.values.length > 3 ? '…' : ''}</div>{expandedSpec === spec.id && <div className="picker-value-list" role="group" aria-label={`${spec.name}的属性值`}>{spec.values.map(value => <span key={value}>{value}</span>)}</div>}</> : `${attribute?.type || ''} / ${attribute?.unit || '—'}`}</TableCell><TableCell>{alreadyAdded ? <span className="picker-added">已加入</span> : <span className="picker-available">可选</span>}</TableCell></TableRow>;
          })}{rows.length === 0 && <TableRow><TableCell colSpan={4}><div className="table-empty">当前产品没有匹配的{isSpec ? '规格' : '属性'}项</div></TableCell></TableRow>}</TableBody></Table></div>
        </section>
      </div>
      <footer className="picker-footer"><span>已选择 <strong>{selectedIds.size}</strong> 项，可跨产品选择</span><div><Button onClick={() => onOpenChange(false)}>取消</Button><Button variant="primary" disabled={!selectedIds.size} onClick={confirm}>加入{isSpec ? '规格类型' : '产品属性'}（{selectedIds.size}）</Button></div></footer>
    </DialogContent>
  </Dialog>;
}
