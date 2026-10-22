export type ReferenceScope = 'enterprise' | 'industry';

export interface KnowledgeReference {
  id: string;
  scope: ReferenceScope;
  library: string;
  primary: string;
  secondary: string;
  title: string;
  facts: Array<{ question: string; answer: string }>;
}

export interface ReferenceTreeNode {
  key: string;
  label: string;
  count: number;
  sourceIds: string[];
  children: ReferenceTreeNode[];
}

export interface FaqDraft {
  id: string;
  question: string;
  answer: string;
  sourceId: string;
  sourceTitle: string;
  sourceScope: ReferenceScope;
  selected: boolean;
}

export function buildReferenceTree(references: KnowledgeReference[], scope: ReferenceScope): ReferenceTreeNode[] {
  const roots: ReferenceTreeNode[] = [];
  const nodes = new Map<string, ReferenceTreeNode>();
  for (const reference of references.filter(item => item.scope === scope)) {
    let siblings = roots;
    let key = scope;
    for (const label of [reference.library, reference.primary || '未指定一级分类', reference.secondary || '未指定二级分类']) {
      key += `/${label}`;
      let node = nodes.get(key);
      if (!node) {
        node = { key, label, count: 0, sourceIds: [], children: [] };
        nodes.set(key, node);
        siblings.push(node);
      }
      if (!node.sourceIds.includes(reference.id)) {
        node.sourceIds.push(reference.id);
        node.count = node.sourceIds.length;
      }
      siblings = node.children;
    }
  }
  return roots;
}

export function toggleReferenceSelection(current: ReadonlySet<string>, sourceIds: string[]): Set<string> {
  const next = new Set(current);
  const allSelected = sourceIds.length > 0 && sourceIds.every(id => next.has(id));
  sourceIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
  return next;
}

export function generateFaqDrafts(references: KnowledgeReference[], selected: ReadonlySet<string>, existingQuestions: string[] = []): FaqDraft[] {
  const known = new Set(existingQuestions.map(item => item.trim().toLocaleLowerCase()));
  return references.filter(reference => selected.has(reference.id)).flatMap(reference => reference.facts.flatMap((fact, index) => {
    const question = fact.question.trim();
    const answer = fact.answer.trim();
    const key = question.toLocaleLowerCase();
    if (!question || !answer || known.has(key)) return [];
    known.add(key);
    return [{ id: `${reference.id}:${index}`, question, answer, sourceId: reference.id, sourceTitle: reference.title, sourceScope: reference.scope, selected: false }];
  }));
}
