export interface SiteIndustry { primary: string; secondary: string }
export interface IndustryCatalogItem { name: string; children: string[] }
export type IndustryDraft = Array<Partial<SiteIndustry>>;

export const MAX_EXTRA_INDUSTRIES = 2;
export const MAX_SITE_INDUSTRIES = MAX_EXTRA_INDUSTRIES + 1;
export const SITE_INDUSTRY_STORAGE_KEY = 'site-industries.v1';
export const SITE_INFO_PATH = '/site-info/';

export const industrySlotLabel = (index: number) => index === 0 ? '主行业' : `额外行业 ${index}`;
export const formatIndustry = (industry: SiteIndustry) => `${industry.primary} / ${industry.secondary}`;

/** 弹窗草稿：固定 3 个槽位（主行业 + 2 个额外行业）。 */
export function draftFromIndustries(industries: SiteIndustry[]): IndustryDraft {
  return Array.from({ length: MAX_SITE_INDUSTRIES }, (_, index) => ({ ...industries[index] }));
}

/** 返回每个槽位的错误提示；没有错误时为空对象。 */
export function validateIndustryDraft(draft: IndustryDraft, catalog: IndustryCatalogItem[]): Record<number, string> {
  const errors: Record<number, string> = {};
  const seen = new Map<string, number>();
  draft.slice(0, MAX_SITE_INDUSTRIES).forEach((slot, index) => {
    const { primary = '', secondary = '' } = slot;
    if (!primary && !secondary) {
      if (index === 0) errors[index] = '请选择主行业';
      return;
    }
    if (!primary) { errors[index] = '请选择一级行业'; return; }
    if (!secondary) { errors[index] = '请选择二级行业'; return; }
    if (!catalog.find(item => item.name === primary)?.children.includes(secondary)) { errors[index] = '所选行业不在行业库中'; return; }
    const key = `${primary}/${secondary}`;
    const duplicate = seen.get(key);
    if (duplicate !== undefined) { errors[index] = `与${industrySlotLabel(duplicate)}重复`; return; }
    seen.set(key, index);
  });
  return errors;
}

/** 去掉空槽位，保证主行业在最前，最多 3 个。 */
export function normalizeIndustryDraft(draft: IndustryDraft): SiteIndustry[] {
  return draft
    .slice(0, MAX_SITE_INDUSTRIES)
    .filter((slot): slot is SiteIndustry => Boolean(slot.primary && slot.secondary))
    .map(slot => ({ primary: slot.primary, secondary: slot.secondary }));
}

function parseIndustries(raw: string | null): SiteIndustry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SiteIndustry => Boolean(item) && typeof item.primary === 'string' && typeof item.secondary === 'string' && Boolean(item.primary) && Boolean(item.secondary))
      .slice(0, MAX_SITE_INDUSTRIES)
      .map(item => ({ primary: item.primary, secondary: item.secondary }));
  } catch { return []; }
}

// 原型阶段用 localStorage 在「网站信息」与「属性模板」两个页面间共享；接入后端后替换为接口。
export function loadSiteIndustries(storage?: Pick<Storage, 'getItem'>): SiteIndustry[] {
  try { return parseIndustries((storage ?? window.localStorage).getItem(SITE_INDUSTRY_STORAGE_KEY)); } catch { return []; }
}

export function saveSiteIndustries(industries: SiteIndustry[], storage?: Pick<Storage, 'setItem' | 'removeItem'>) {
  try {
    const target = storage ?? window.localStorage;
    if (industries.length) target.setItem(SITE_INDUSTRY_STORAGE_KEY, JSON.stringify(industries));
    else target.removeItem(SITE_INDUSTRY_STORAGE_KEY);
  } catch { /* 隐私模式下无法持久化，仅保留当前页面状态 */ }
}
