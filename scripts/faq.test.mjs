import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/faq.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { toggleSourceSelection, countGeneratedBySource, generateFaqDrafts } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const sources = [
  { id: 'prod-1', menu: 'products', title: '数控车床', category: '机床设备', summary: '数控车床产品', suggestedQuestion: '数控车床能加工什么？', suggestedAnswer: '适用于轴类零件加工。' },
  { id: 'honor-1', menu: 'honors', title: '质量认证', category: '体系认证', summary: '认证资料', suggestedQuestion: '有哪些认证？', suggestedAnswer: '有质量管理体系认证。' },
  { id: 'case-1', menu: 'cases', title: '产线案例', category: '制造业', summary: '客户案例', suggestedQuestion: '有哪些应用案例？', suggestedAnswer: '有产线案例。' },
];

const selected = toggleSourceSelection(new Set(), ['prod-1', 'honor-1']);
assert.deepEqual([...selected], ['prod-1', 'honor-1']);
assert.equal(toggleSourceSelection(selected, ['prod-1', 'honor-1']).size, 0);
assert.deepEqual([...toggleSourceSelection(selected, ['case-1'])], ['prod-1', 'honor-1', 'case-1']);

const saved = [{ sourceId: 'prod-1' }, { sourceId: 'prod-1' }, { sourceId: undefined }];
assert.equal(countGeneratedBySource(saved).get('prod-1'), 2);
const drafts = generateFaqDrafts(sources, selected, saved);
assert.equal(drafts.length, 2);
assert.deepEqual(drafts.map(item => item.sourceId), ['prod-1', 'honor-1']);
assert.deepEqual(drafts.map(item => item.generationNumber), [3, 1]);
assert.ok(drafts.every(item => item.selected));
assert.equal(drafts[0].question, '数控车床能加工什么？');
assert.equal(generateFaqDrafts(sources, new Set()).length, 0);
assert.deepEqual(saved, [{ sourceId: 'prod-1' }, { sourceId: 'prod-1' }, { sourceId: undefined }]);

console.log('PASS: 每个来源只生成一条、已生成次数标记和重复生成不覆盖旧条目');
