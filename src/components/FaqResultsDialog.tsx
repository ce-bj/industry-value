import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { FaqDraft } from '@/faq';

interface ResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: FaqDraft[];
  onEditCandidate: (id: string, patch: Partial<Pick<FaqDraft, 'question' | 'answer' | 'selected'>>) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  onAdd: () => void;
  notice: string;
}

export function FaqResultsDialog({ open, onOpenChange, candidates, onEditCandidate, onSelectMany, onAdd, notice }: ResultsProps) {
  const [query, setQuery] = useState('');
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const visible = useMemo(() => candidates.filter(item => {
    const matchesQuery = !query.trim() || `${item.question} ${item.answer} ${item.sourceTitle}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (!selectedOnly || item.selected);
  }), [candidates, query, selectedOnly]);
  const selectedCount = candidates.filter(item => item.selected).length;
  const selectedVisibleCount = visible.filter(item => item.selected).length;
  const viewed = candidates.find(item => item.id === viewedId);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="results-dialog">
      <DialogHeader><DialogTitle>确认保存 AI 生成结果</DialogTitle><DialogDescription>每条已选数据生成一条 FAQ。可修改问答或取消勾选，确认后保存为草稿；已有 FAQ 不会被覆盖。</DialogDescription></DialogHeader>
      <div className="results-toolbar">
        <label className="results-search"><Search size={15} /><Input aria-label="搜索生成结果" placeholder="搜索问题、答案或来源内容" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label className="results-selected-filter"><Checkbox checked={selectedOnly} onCheckedChange={checked => setSelectedOnly(checked === true)} />只看已选</label>
        <span className="results-count">显示 {visible.length} / {candidates.length} 条</span>
      </div>
      <div className="results-body">
        <div className="results-list-wrap"><Table className="results-table"><TableHeader><TableRow><TableHead className="results-checkbox-cell"><Checkbox aria-label="全选当前结果" checked={visible.length > 0 && selectedVisibleCount === visible.length ? true : selectedVisibleCount ? 'indeterminate' : false} onCheckedChange={checked => onSelectMany(visible.map(item => item.id), checked === true)} /></TableHead><TableHead className="results-number-cell">序号</TableHead><TableHead>生成的问题</TableHead><TableHead className="results-source-cell">来源内容</TableHead><TableHead className="results-action-cell">操作</TableHead></TableRow></TableHeader><TableBody>{visible.map(item => <TableRow key={item.id} className={viewedId === item.id ? 'is-viewed' : ''}><TableCell><Checkbox aria-label={`选择${item.question}`} checked={item.selected} onCheckedChange={checked => onEditCandidate(item.id, { selected: checked === true })} /></TableCell><TableCell>{candidates.indexOf(item) + 1}</TableCell><TableCell><span className="results-question">{item.question}</span><span className="results-answer-preview">{item.answer}</span></TableCell><TableCell>{item.sourceTitle}<div className="results-generation">第 {item.generationNumber} 次生成</div></TableCell><TableCell><button className="text-action" onClick={() => setViewedId(item.id)}>查看</button></TableCell></TableRow>)}{visible.length === 0 && <TableRow><TableCell colSpan={5}><div className="table-empty">没有匹配的生成结果</div></TableCell></TableRow>}</TableBody></Table></div>
        <aside className="results-detail" aria-label="FAQ 详情">{viewed ? <><div className="results-detail-heading"><strong>查看 FAQ</strong><span>第 {candidates.indexOf(viewed) + 1} 条</span></div><label>问题<Input value={viewed.question} onChange={event => onEditCandidate(viewed.id, { question: event.target.value })} /></label><label>答案<Textarea rows={7} value={viewed.answer} onChange={event => onEditCandidate(viewed.id, { answer: event.target.value })} /></label><div className="results-detail-source">来源内容：{viewed.sourceTitle} · 第 {viewed.generationNumber} 次生成</div><label className="results-detail-select"><Checkbox checked={viewed.selected} onCheckedChange={checked => onEditCandidate(viewed.id, { selected: checked === true })} />保存这条 FAQ</label></> : <div className="results-detail-empty">点击列表中的“查看”，在这里阅读完整问答并按需修改。</div>}</aside>
      </div>
      {notice && <div className="generator-notice" role="alert">{notice}</div>}
      <footer className="results-footer"><span>将保存 <strong>{selectedCount}</strong> 条为常见问题草稿；原有内容保持不变。</span><div><Button onClick={() => onOpenChange(false)}>暂不保存</Button><Button variant="primary" disabled={!selectedCount} onClick={onAdd}>确认保存（{selectedCount}）</Button></div></footer>
    </DialogContent>
  </Dialog>;
}
