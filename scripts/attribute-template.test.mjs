import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/attributeTemplate.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { addIndustryAttributes, addIndustrySpecs } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const fields = [{ id: 'base-name', name: '产品名称', type: 'txt', unit: '—', sourceProduct: '' }];
const candidates = [
  { id: 'attr-material', productId: 'brake-pad', name: '材质', type: 'txt', unit: '—' },
  { id: 'attr-thickness', productId: 'brake-pad', name: '厚度', type: 'number', unit: 'mm' },
];
const addedFields = addIndustryAttributes(fields, candidates, '刹车片');
assert.deepEqual(addedFields.map(item => item.name), ['产品名称', '材质', '厚度']);
assert.equal(addedFields[1].sourceProduct, '刹车片');
assert.equal(addIndustryAttributes(addedFields, candidates, '刹车片').length, 3);

const specs = [{ id: 'spec-size', productId: 'brake-pad', name: '尺寸', displayType: '文字', values: ['180×70×16 mm', '195×75×17 mm'] }];
const addedSpecs = addIndustrySpecs([], specs, '刹车片');
assert.deepEqual(addedSpecs[0].values, ['180×70×16 mm', '195×75×17 mm']);
assert.equal(addedSpecs[0].sourceProduct, '刹车片');
assert.equal(addIndustrySpecs(addedSpecs, specs, '刹车片').length, 1);

console.log('PASS: 行业属性与规格加入模板、保留规格值并防止重复');
