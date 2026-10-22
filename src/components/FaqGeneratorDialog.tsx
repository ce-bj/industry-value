import { useState } from 'react';
import { ChevronDown, ChevronRight, List, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildReferenceTree, type FaqDraft, type KnowledgeReference, type ReferenceTreeNode } from '@/faq';

function ReferenceNode({ node, depth, selected, onToggle }: { node: ReferenceTreeNode; depth: number; selected: ReadonlySet<string>; onToggle: (sourceIds: string[]) => void }) {
  const [open, setOpen] = useState(depth < 2);
  const selectedCount = node.sourceIds.filter(id => selected.has(id)).length;
  const checked = selectedCount === node.count;
  return <div className={`reference-node reference-depth-${depth}`}>
    <div className="reference-line">
      {node.children.length ? <button type="button" className="reference-expand" aria-label={`${open ? '收起' : '展开'}${node.label}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button> : <span className="reference-expand" />}
      <Checkbox aria-label={`选择${node.label}，${node.count}条知识`} checked={checked ? true : selectedCount ? 'indeterminate' : false} onCheckedChange={() => onToggle(node.sourceIds)} />
      <span className="reference-label">{node.label}</span><span className="reference-count">{node.count} 条知识</span>
    </div>
    {open && node.children.map(child => <ReferenceNode key={child.key} node={child} depth={depth + 1} selected={selected} onToggle={onToggle} />)}
  </div>;
}

interface GeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  references: KnowledgeReference[];
  selected: ReadonlySet<string>;
  onToggle: (sourceIds: string[]) => void;
  candidates: FaqDraft[];
  onGenerate: () => void;
  onViewResults: () => void;
  notice: string;
  onScopeChange: (scope: 'enterprise' | 'industry') => void;
}

export function FaqGeneratorDialog({ open, onOpenChange, references, selected, onToggle, candidates, onGenerate, onViewResults, notice, onScopeChange }: GeneratorProps) {
  const enterpriseTree = buildReferenceTree(references, 'enterprise');
  const industryTree = buildReferenceTree(references, 'industry');
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="generator-dialog">
      <DialogHeader><div className="generator-title-row"><span className="generator-title-icon"><Sparkles size={19} /></span><div><DialogTitle>AI 生成 FAQ</DialogTitle><DialogDescription>选择参考知识生成候选 FAQ，再到结果列表逐条查看和挑选。</DialogDescription></div></div></DialogHeader>
      <div className="generator-scroll">
        <div className="generator-section-heading"><strong>选择参考知识</strong><span>可跨两个范围勾选一级、二级分类</span></div>
        <Tabs defaultValue="enterprise" className="reference-tabs" onValueChange={value => onScopeChange(value as 'enterprise' | 'industry')}>
          <TabsList><TabsTrigger value="enterprise">企业知识 <em>{enterpriseTree.reduce((sum, node) => sum + node.count, 0)}</em></TabsTrigger><TabsTrigger value="industry">行业知识库 <em>{industryTree.reduce((sum, node) => sum + node.count, 0)}</em></TabsTrigger></TabsList>
          <TabsContent value="enterprise"><div className="reference-tree">{enterpriseTree.map(node => <ReferenceNode key={node.key} node={node} depth={0} selected={selected} onToggle={onToggle} />)}</div></TabsContent>
          <TabsContent value="industry"><div className="reference-tree">{industryTree.map(node => <ReferenceNode key={node.key} node={node} depth={0} selected={selected} onToggle={onToggle} />)}</div></TabsContent>
        </Tabs>
        <div className="generator-selection-bar"><span>已选择 <strong>{selected.size}</strong> 条参考知识</span><Button variant="primary" disabled={!selected.size} onClick={onGenerate}><Sparkles size={15} />{candidates.length ? '重新生成' : '生成 FAQ'}</Button></div>
        {candidates.length > 0 && <section className="generation-complete" role="status"><div><strong>已有 {candidates.length} 条待处理 FAQ</strong><p>点击查看生成结果，在列表中挑选要加入“常见问题”的项目。重新生成会替换这些待处理结果。</p></div><Button variant="primary" onClick={onViewResults}><List size={15} /> 查看生成结果</Button></section>}
        {notice && <div role="status" className="generator-notice">{notice}</div>}
      </div>
      <footer className="generator-footer"><span>生成结果可按需加入“常见问题”。</span><div><Button onClick={() => onOpenChange(false)}>关闭</Button></div></footer>
    </DialogContent>
  </Dialog>;
}
