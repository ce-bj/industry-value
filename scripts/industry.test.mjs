import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/industry.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { formatIndustry, hasIndustryLibrary, primaryIndustryOptions, secondaryIndustryOptions } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const catalog = [
  { name: '机械设备制造', children: ['数控机床', '工程机械'] },
  { name: '汽车制造行业', children: ['整车制造', '汽车零部件', '新能源汽车'] },
  { name: '建筑工程', children: ['钢结构'] },
];
const libraries = [{ primary: '汽车制造行业', secondary: '汽车零部件' }];

assert.equal(formatIndustry(libraries[0]), '汽车制造行业 / 汽车零部件');
assert.equal(hasIndustryLibrary({ primary: '汽车制造行业', secondary: '汽车零部件' }, libraries), true);
assert.equal(hasIndustryLibrary({ primary: '汽车制造行业', secondary: '整车制造' }, libraries), false);
assert.equal(hasIndustryLibrary({ primary: '汽车制造行业' }, libraries), false);

// 已有行业库的排在最前（一级：其下有已有行业库即算），其余保持原顺序
assert.deepEqual(primaryIndustryOptions(catalog, libraries).map(item => item.value), ['汽车制造行业', '机械设备制造', '建筑工程']);
assert.deepEqual(primaryIndustryOptions(catalog, libraries).map(item => item.hasLibrary), [true, false, false]);
assert.deepEqual(secondaryIndustryOptions(catalog, '汽车制造行业', libraries).map(item => item.value), ['汽车零部件', '整车制造', '新能源汽车']);
assert.deepEqual(secondaryIndustryOptions(catalog, '汽车制造行业', libraries).map(item => item.hasLibrary), [true, false, false]);

// 筛选：只看已有行业库 / 关键字
assert.deepEqual(primaryIndustryOptions(catalog, libraries, { onlyWithLibrary: true }).map(item => item.value), ['汽车制造行业']);
assert.deepEqual(secondaryIndustryOptions(catalog, '汽车制造行业', libraries, { onlyWithLibrary: true }).map(item => item.value), ['汽车零部件']);
assert.deepEqual(primaryIndustryOptions(catalog, libraries, { query: ' 建筑 ' }).map(item => item.value), ['建筑工程']);
assert.deepEqual(secondaryIndustryOptions(catalog, '汽车制造行业', libraries, { query: '制造' }).map(item => item.value), ['整车制造']);
assert.deepEqual(primaryIndustryOptions(catalog, libraries, { onlyWithLibrary: true, query: '建筑' }), []);
assert.deepEqual(primaryIndustryOptions(catalog, []).map(item => item.value), ['机械设备制造', '汽车制造行业', '建筑工程']);

// 未选一级 / 未知一级 -> 没有二级选项；不修改原行业库
assert.deepEqual(secondaryIndustryOptions(catalog, '', libraries), []);
assert.deepEqual(secondaryIndustryOptions(catalog, '不存在', libraries), []);
assert.deepEqual(catalog[1].children, ['整车制造', '汽车零部件', '新能源汽车']);

console.log('PASS: 行业选项排序（已有行业库置顶）、已有行业库筛选与关键字筛选');
