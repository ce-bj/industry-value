export interface Industry { primary: string; secondary: string }
export interface IndustryCatalogItem { name: string; children: string[] }
export interface IndustryOption { value: string; /** 是否已有行业库（一级行业：其下任一二级行业已有行业库）。 */ hasLibrary: boolean }

export const formatIndustry = (industry: Industry) => `${industry.primary} / ${industry.secondary}`;

/** 该行业（一级 + 二级）是否已有行业库。 */
export const hasIndustryLibrary = (industry: Partial<Industry>, libraries: Industry[]) => libraries.some(item => item.primary === industry.primary && item.secondary === industry.secondary);

interface OptionFilter { onlyWithLibrary?: boolean; query?: string }

// 已有行业库的排在最前，其余保持行业库原有顺序。
function finalize(options: IndustryOption[], { onlyWithLibrary = false, query = '' }: OptionFilter): IndustryOption[] {
  const keyword = query.trim().toLowerCase();
  const visible = options.filter(item => (!onlyWithLibrary || item.hasLibrary) && (!keyword || item.value.toLowerCase().includes(keyword)));
  return [...visible.filter(item => item.hasLibrary), ...visible.filter(item => !item.hasLibrary)];
}

export function primaryIndustryOptions(catalog: IndustryCatalogItem[], libraries: Industry[], filter: OptionFilter = {}): IndustryOption[] {
  return finalize(catalog.map(item => ({ value: item.name, hasLibrary: item.children.some(child => hasIndustryLibrary({ primary: item.name, secondary: child }, libraries)) })), filter);
}

export function secondaryIndustryOptions(catalog: IndustryCatalogItem[], primary: string, libraries: Industry[], filter: OptionFilter = {}): IndustryOption[] {
  const children = catalog.find(item => item.name === primary)?.children ?? [];
  return finalize(children.map(child => ({ value: child, hasLibrary: hasIndustryLibrary({ primary, secondary: child }, libraries) })), filter);
}
