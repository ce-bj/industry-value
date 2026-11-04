import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { draftFromIndustries, industrySlotLabel, MAX_EXTRA_INDUSTRIES, normalizeIndustryDraft, validateIndustryDraft, type IndustryCatalogItem, type IndustryDraft, type SiteIndustry } from '@/siteIndustry';

interface SiteIndustryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: IndustryCatalogItem[];
  value: SiteIndustry[];
  onSave: (industries: SiteIndustry[]) => void;
}

export function SiteIndustryDialog({ open, onOpenChange, catalog, value, onSave }: SiteIndustryDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="site-industry-dialog">
      {open && <SiteIndustryForm catalog={catalog} value={value} onCancel={() => onOpenChange(false)} onSave={industries => { onSave(industries); onOpenChange(false); }} />}
    </DialogContent>
  </Dialog>;
}

function SiteIndustryForm({ catalog, value, onCancel, onSave }: { catalog: IndustryCatalogItem[]; value: SiteIndustry[]; onCancel: () => void; onSave: (industries: SiteIndustry[]) => void }) {
  const [draft, setDraft] = useState<IndustryDraft>(() => draftFromIndustries(value));
  const [submitted, setSubmitted] = useState(false);
  const errors = validateIndustryDraft(draft, catalog);

  const update = (index: number, patch: Partial<SiteIndustry>) => setDraft(current => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot));
  const clear = (index: number) => setDraft(current => current.map((slot, slotIndex) => slotIndex === index ? {} : slot));
  const save = () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    onSave(normalizeIndustryDraft(draft));
  };

  return <>
    <DialogHeader><DialogTitle>选择行业</DialogTitle><DialogDescription>主行业必填，额外行业最多 {MAX_EXTRA_INDUSTRIES} 个。</DialogDescription></DialogHeader>
    <div className="site-industry-body">
      {draft.map((slot, index) => {
        const children = catalog.find(item => item.name === slot.primary)?.children ?? [];
        const label = industrySlotLabel(index);
        const error = submitted ? errors[index] : undefined;
        return <section key={index} className={`site-industry-card ${index === 0 ? 'is-main' : ''}`} aria-label={label}>
          <div className="site-industry-card-heading"><h3>{label}{index === 0 && <b aria-hidden="true"> *</b>}</h3>{index > 0 && <button type="button" className="site-industry-delete" disabled={!slot.primary && !slot.secondary} onClick={() => clear(index)} aria-label={`删除${label}`}>删除</button>}</div>
          <div className="site-industry-selects">
            <label><span>一级行业</span><span className="site-industry-select"><select aria-label={`${label}一级行业`} value={slot.primary ?? ''} onChange={event => update(index, { primary: event.target.value, secondary: '' })}><option value="">选择一级行业</option>{catalog.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label>
            <label><span>二级行业</span><span className="site-industry-select"><select aria-label={`${label}二级行业`} value={slot.secondary ?? ''} disabled={!slot.primary} onChange={event => update(index, { secondary: event.target.value })}><option value="">{slot.primary ? '选择二级行业' : '请先选择一级行业'}</option>{children.map(name => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></span></label>
          </div>
          {error && <p className="site-industry-error" role="alert">{error}</p>}
        </section>;
      })}
    </div>
    <footer className="site-industry-footer"><Button onClick={onCancel}>取消</Button><Button variant="primary" onClick={save}>保存行业</Button></footer>
  </>;
}
