import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/faq.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { buildReferenceTree, toggleReferenceSelection, generateFaqDrafts } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const references = [
  { id: 'e1', scope: 'enterprise', library: '企业业务知识库', primary: '产品与服务', secondary: '产品规格', title: '产品规格', facts: [{ question: '规格如何选择？', answer: '根据应用场景选择。' }, { question: '规格有几个系列？', answer: '共有三个系列。' }, { question: '规格可以定制吗？', answer: '可按项目要求定制。' }] },
  { id: 'e2', scope: 'enterprise', library: '企业业务知识库', primary: '产品与服务', secondary: '产品规格', title: '规格说明', facts: [{ question: '规格有几个？', answer: '当前有三种规格。' }] },
  { id: 'i1', scope: 'industry', library: '生物医药', primary: '行业规范', secondary: '质量管理', title: '质量指南', facts: [{ question: '质量标准是什么？', answer: '遵循现行质量管理规范。' }] },
];

const enterpriseTree = buildReferenceTree(references, 'enterprise');
assert.equal(enterpriseTree[0].count, 2);
assert.equal(enterpriseTree[0].children[0].children[0].count, 2);
assert.equal(buildReferenceTree(references, 'industry')[0].count, 1);

const selected = toggleReferenceSelection(new Set(), enterpriseTree[0].sourceIds);
assert.deepEqual([...selected], ['e1', 'e2']);
assert.equal(toggleReferenceSelection(selected, enterpriseTree[0].sourceIds).size, 0);
assert.deepEqual([...toggleReferenceSelection(selected, ['i1'])], ['e1', 'e2', 'i1']);

const drafts = generateFaqDrafts(references, new Set(['e1', 'i1']), ['规格如何选择？']);
assert.equal(drafts.length, 3);
assert.deepEqual(drafts.map(item => item.question), ['规格有几个系列？', '规格可以定制吗？', '质量标准是什么？']);
assert.equal(drafts[2].sourceTitle, '质量指南');
assert.ok(drafts.every(item => item.selected === false));
assert.equal(generateFaqDrafts(references, new Set()).length, 0);

console.log('PASS: 分类计数、批量勾选、跨范围选择、依据生成与去重');
