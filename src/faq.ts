export type FaqSourceMenu = 'products' | 'honors' | 'company' | 'cases';

export interface FaqSourceItem {
  id: string;
  menu: FaqSourceMenu;
  title: string;
  category: string;
  image?: string;
  fields?: string[];
  summary: string;
  suggestedQuestion: string;
  suggestedAnswer: string;
}

export interface FaqDraft {
  id: string;
  question: string;
  answer: string;
  sourceId: string;
  sourceTitle: string;
  sourceMenu: FaqSourceMenu;
  generationNumber: number;
  selected: boolean;
}

export function toggleSourceSelection(current: ReadonlySet<string>, sourceIds: string[]): Set<string> {
  const next = new Set(current);
  const allSelected = sourceIds.length > 0 && sourceIds.every(id => next.has(id));
  sourceIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
  return next;
}

export function countGeneratedBySource(items: Array<{ sourceId?: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  items.forEach(item => {
    if (item.sourceId) counts.set(item.sourceId, (counts.get(item.sourceId) || 0) + 1);
  });
  return counts;
}

export function generateFaqDrafts(sources: FaqSourceItem[], selected: ReadonlySet<string>, savedItems: Array<{ sourceId?: string }> = []): FaqDraft[] {
  const counts = countGeneratedBySource(savedItems);
  return sources.filter(source => selected.has(source.id)).map(source => ({
    id: `${source.id}:preview`,
    question: source.suggestedQuestion.trim(),
    answer: source.suggestedAnswer.trim(),
    sourceId: source.id,
    sourceTitle: source.title,
    sourceMenu: source.menu,
    generationNumber: (counts.get(source.id) || 0) + 1,
    selected: true,
  }));
}
