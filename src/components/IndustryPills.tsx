import { formatIndustry, industrySlotLabel, type SiteIndustry } from '@/siteIndustry';

interface IndustryPillsProps {
  industries: SiteIndustry[];
  /** 传入后，药丸变为可切换的标签页。 */
  activeIndex?: number;
  onSelect?: (index: number) => void;
  ariaLabel?: string;
}

export function IndustryPills({ industries, activeIndex, onSelect, ariaLabel = '所属行业' }: IndustryPillsProps) {
  if (!onSelect) {
    return <ul className="industry-pills" aria-label={ariaLabel}>{industries.map((item, index) => <li key={`${item.primary}/${item.secondary}`} className="industry-pill">{industrySlotLabel(index)}：{formatIndustry(item)}</li>)}</ul>;
  }
  return <div className="industry-pills" role="tablist" aria-label={ariaLabel}>{industries.map((item, index) => <button key={`${item.primary}/${item.secondary}`} type="button" role="tab" aria-selected={activeIndex === index} className={`industry-pill is-switchable ${activeIndex === index ? 'is-active' : ''}`} onClick={() => onSelect(index)}>{industrySlotLabel(index)}：{formatIndustry(item)}</button>)}</div>;
}
