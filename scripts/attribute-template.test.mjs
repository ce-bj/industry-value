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

const automotive = JSON.parse(readFileSync(new URL('../src/data/automotive-attributes.json', import.meta.url), 'utf8'));
assert.deepEqual(automotive.industryPath, ['汽车制造行业', '汽车零部件']);
assert.equal(automotive.products.length, 95);
assert.equal(new Set(automotive.products.map(item => item.category)).size, 10);
assert.equal(new Set(automotive.products.map(item => item.id)).size, 95);
assert.equal(automotive.attributes.length, 2470);
assert.equal(new Set(automotive.attributes.map(item => item.id)).size, 2470);
const coil = automotive.products.find(item => item.name === '点火线圈');
assert.equal(coil.category, 'SYS-01_动力系统');
assert.ok(automotive.products.some(item => item.category === coil.category && item.name === '附件皮带'));
const resistance = automotive.attributes.find(item => item.productId === coil.id && item.name === '初级电阻');
assert.equal(resistance.type, '数值');
assert.equal(resistance.description, '初级绕组直流电阻');
assert.equal(resistance.example, '0.5');
const importedResistance = addIndustryAttributes([], [resistance], coil.name)[0];
assert.equal(importedResistance.description, resistance.description);
assert.equal(importedResistance.example, resistance.example);
const optional = addIndustryAttributes([], [{ ...resistance, description: '', example: '' }], coil.name)[0];
assert.equal(optional.description, '');
assert.equal(optional.example, '');
const repeatedNames = automotive.products.filter(item => item.name === '滤清器');
assert.equal(repeatedNames.length, 2);
assert.notEqual(repeatedNames[0].id, repeatedNames[1].id);

console.log('PASS: Excel 系统分类与字段映射、选填说明与示例值、JSON 示例及规格导入');
