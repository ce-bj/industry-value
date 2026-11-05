import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Library, Search } from 'lucide-react';
import type { IndustryOption } from '@/industry';

interface IndustrySelectProps {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  /** 已排好序、已按「仅看已有行业库」过滤的候选项；关键字筛选在下拉内完成。 */
  options: (query: string) => IndustryOption[];
  onChange: (value: string) => void;
}

/** 可搜索的行业下拉：已有行业库的行业置顶，并带图标。 */
export function IndustrySelect({ label, value, placeholder, disabled, options, onChange }: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const visible = open ? options(query) : [];
  const toggle = () => { setQuery(''); setOpen(current => !current); };
  const pick = (next: string) => { onChange(next); setOpen(false); };

  return <div className="industry-select" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); } }}>
    <button type="button" className={`industry-select-trigger ${value ? '' : 'is-placeholder'}`} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}：${value || placeholder}`} disabled={disabled} onClick={toggle}>
      <span>{value || placeholder}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className="industry-select-popover">
      <label className="industry-select-search"><Search size={13} aria-hidden="true" /><input autoFocus aria-label={`搜索${label}`} placeholder={`搜索${label}`} value={query} onChange={event => setQuery(event.target.value)} /></label>
      <ul role="listbox" aria-label={label}>
        {visible.map(item => <li key={item.value} role="option" aria-selected={item.value === value}><button type="button" className={`industry-option ${item.value === value ? 'is-selected' : ''}`} onClick={() => pick(item.value)}><span>{item.value}</span>{item.hasLibrary && <Library className="industry-library-icon" size={14} aria-label="已有行业库" />}</button></li>)}
        {visible.length === 0 && <li className="industry-select-empty">没有匹配的行业</li>}
      </ul>
    </div>}
  </div>;
}
