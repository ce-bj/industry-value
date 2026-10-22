import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/attributeTemplate.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { addIndustryAttributes, addIndustrySpecs, exampleIndustryAttributes, exampleTemplateAttributes } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

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

for (const [fileName, productId, productName, expectedCustomCount] of [
  ['数控车床_属性模板.json', 'cnc-lathe', '数控车床', 22],
  ['建筑钢结构_属性模板.json', 'steel-structure', '建筑钢结构', 21],
]) {
  const example = JSON.parse(readFileSync(new URL(`../docs/${fileName}`, import.meta.url), 'utf8'));
  const templateFields = exampleTemplateAttributes(example, productId, productName);
  const selectableFields = exampleIndustryAttributes(example, productId);
  assert.equal(templateFields.length, example.attributeField.length);
  assert.equal(selectableFields.length, expectedCustomCount);
  assert.equal(templateFields.filter(field => field.id.startsWith('base-')).length, 15);
  assert.equal(selectableFields.some(field => field.name === '产品名称'), false);
  const dropdown = selectableFields.find(field => field.name === (productId === 'cnc-lathe' ? '机床类型' : '构件类型'));
  assert.equal(dropdown?.type, '下拉单选');
  assert.equal(dropdown.values.length, productId === 'cnc-lathe' ? 8 : 10);
  const imported = addIndustryAttributes([], [dropdown], productName);
  assert.deepEqual(imported[0].values, dropdown.values);
  assert.equal(addIndustryAttributes(imported, [dropdown], productName).length, 1);
}

console.log('PASS: JSON 示例字段、可选值及行业属性与规格导入');
