import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const toModuleUrl = (path, replacements = {}) => {
  let code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from, to] of Object.entries(replacements)) code = code.replaceAll(from, to);
  return 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
};
const dictionaryUrl = toModuleUrl('../src/productDictionary.ts');
const { PRODUCT_DICTIONARY, dictionaryProductNames, resolveProduct } = await import(dictionaryUrl);
const { buildPoolRows, buildProductLookups, defaultEnglishName, englishNameKey, estimatePoolCount, formatUsdCompact, matchedProducts, percentOf, readTradeInsightQuery, recentMonthsRange, summarizePool, tradeInsightListHref } = await import(toModuleUrl('../src/tradeInsight.ts', { "'@/productDictionary'": `'${dictionaryUrl}'` }));

// 产品字典：标准名、别名（忽略大小写/全半角/首尾空格）、「以标准名开头」都能找到；找不到不猜
assert.equal(resolveProduct('制动盘', '汽车零部件').standardName, '制动盘');
assert.equal(resolveProduct(' Brake  DRUM ', '汽车零部件').standardName, '制动鼓');
assert.equal(resolveProduct('刹车盘', '汽车零部件').standardName, '制动盘');
assert.equal(resolveProduct('制动盘总成', '汽车零部件').standardName, '制动盘');
assert.equal(resolveProduct('定制改装件', '汽车零部件'), null);
assert.equal(resolveProduct('制动盘', '数控机床'), null, '只在所属行业的字典里找');
assert.equal(resolveProduct('制动盘', ['数控机床', '汽车零部件']).standardName, '制动盘', '多个所属行业依次查');
assert.equal(dictionaryProductNames(['数控机床', '汽车零部件']).length, PRODUCT_DICTIONARY.length);
assert.deepEqual(resolveProduct('滤清器', '汽车零部件').hsCodes.map(code => code.code), ['8421.23', '8421.31']);
assert.equal(dictionaryProductNames('汽车零部件').length, PRODUCT_DICTIONARY.length);
// 字典内不能有重复的写法（标准名、英文名、别名），否则同一写法会对到两个产品；每个产品都要有英文名
const allNames = PRODUCT_DICTIONARY.flatMap(item => [item.standardName, item.englishName, ...item.aliases]).map(name => name.normalize('NFKC').toLowerCase());
assert.equal(new Set(allNames).size, allNames.length);
assert.ok(PRODUCT_DICTIONARY.every(item => /^[\x20-\x7E]+$/.test(item.englishName)));
assert.equal(resolveProduct('brake disc', '汽车零部件').standardName, '制动盘', '标准英文名可查到产品');

// 默认英文名：字典标准英文名；字典没有但本身是英文的用原文；中文且字典没有的为空
assert.equal(defaultEnglishName('制动盘', '汽车零部件'), 'Brake Disc');
assert.equal(defaultEnglishName('刹车鼓', '汽车零部件'), 'Brake Drum');
assert.equal(defaultEnglishName('Custom Rotor Kit', '汽车零部件'), 'Custom Rotor Kit');
assert.equal(defaultEnglishName('定制改装件', '汽车零部件'), '');

// 按英文名查海关编码：用户改过的英文名优先；改成字典里的英文名就能查到编码，清空或查不到为待归类
const lookups = buildProductLookups(['制动盘', '制动鼓', 'Brake Drum', '定制改装件', '刹车蹄'], '汽车零部件', { [englishNameKey('刹车蹄')]: 'Brake Pad' });
assert.deepEqual(lookups.map(item => [item.productName, item.englishName, item.standardName, item.mergedWith]), [
  ['制动盘', 'Brake Disc', '制动盘', null],
  ['制动鼓', 'Brake Drum', '制动鼓', null],
  ['Brake Drum', 'Brake Drum', '制动鼓', '制动鼓'],
  ['定制改装件', '', null, null],
  ['刹车蹄', 'Brake Pad', '刹车片', null],
]);
assert.equal(lookups[4].isCustomEnglish, true);
assert.equal(lookups[4].hsCode, '8708.30');
const renamed = buildProductLookups(['制动盘'], '汽车零部件', { [englishNameKey(' 制动盘 ')]: 'Wheel Bearing' });
assert.equal(renamed[0].standardName, '轮毂轴承', '改英文名后按新英文名查编码');
assert.equal(renamed[0].hsCode, '8708.70');
assert.equal(buildProductLookups(['制动盘'], '汽车零部件', { [englishNameKey('制动盘')]: 'Something Else' })[0].hsCode, null);
assert.equal(buildProductLookups(['制动盘'], '汽车零部件', { [englishNameKey('制动盘')]: 'Brake Disc' })[0].isCustomEnglish, false, '与默认相同不算修改');

// 客户池：查到同一产品的合并计数，待归类单独成行且不计数；接口已返回的数据优先
const known = [{ productName: '制动盘', hsCode: '8708.30', hsName: '制动器及其零件', reachableCount: 382, dataTier: '可数' }];
const rows = buildPoolRows(buildProductLookups(['制动盘', '制动鼓', 'Brake Drum', '定制改装件'], '汽车零部件', {}), known);
assert.deepEqual(rows.map(row => row.productName), ['制动盘', '制动鼓', '定制改装件']);
assert.deepEqual(rows.map(row => row.englishName), ['Brake Disc', 'Brake Drum', '']);
assert.deepEqual(rows[1].inputNames, ['制动鼓', 'Brake Drum']);
assert.equal(rows[0].reachableCount, 382);
assert.equal(rows[2].hsCode, null);
assert.equal(rows[2].reachableCount, null);
const summary = summarizePool(rows);
assert.equal(summary.productCount, 2);
assert.equal(summary.unmatchedCount, 1);
assert.equal(summary.total, 382 + estimatePoolCount('制动鼓').reachableCount);
assert.deepEqual(estimatePoolCount('制动鼓'), estimatePoolCount('制动鼓'));
assert.equal(percentOf(300, 400), 75);
assert.equal(percentOf(1, 0), 0);

// 金额简写（目标市场进口趋势）
assert.equal(formatUsdCompact(3_200_000_000), '$3.20B');
assert.equal(formatUsdCompact(562_000_000), '$562M');
assert.equal(formatUsdCompact(45_600), '$45.6K');
assert.equal(formatUsdCompact(800), '$800');

// 「更多」：带产品关键词（含 & 等特殊字符也能原样读回）；海关数据信号另带近 3 个月
assert.deepEqual(readTradeInsightQuery(''), { products: [], startDate: '', endDate: '', from: '' });
const discoverHref = tradeInsightListHref('discover', ['制动盘', 'Brake & Drum']);
assert.ok(discoverHref.startsWith('/customer/trade-insight/?'));
assert.deepEqual(readTradeInsightQuery(discoverHref.slice(discoverHref.indexOf('?'))), { products: ['制动盘', 'Brake & Drum'], startDate: '', endDate: '', from: 'discover' });
const signalsHref = tradeInsightListHref('signals', ['轮毂单元'], recentMonthsRange('2026-11-30'));
assert.deepEqual(readTradeInsightQuery(signalsHref.slice(signalsHref.indexOf('?'))), { products: ['轮毂单元'], startDate: '2026-09-01', endDate: '2026-11-30', from: 'signals' });
assert.equal(readTradeInsightQuery('?from=other&start=bad').from, '');
assert.equal(readTradeInsightQuery('?from=other&start=bad').startDate, '');

// 近 N 个月：含截止月，跨年正确
assert.deepEqual(recentMonthsRange('2026-11-30', 3), { start: '2026-09-01', end: '2026-11-30' });
assert.deepEqual(recentMonthsRange('2026-02-28', 3), { start: '2025-12-01', end: '2026-02-28' });

// 报关描述按字典关键词匹配（含西语、德语写法），返回命中的标准产品
assert.deepEqual(matchedProducts(['BRAKE DISC VENTILATED 300MM', 'BRAKE DRUM ASSY REAR'], ['制动盘', '制动鼓', '轮毂单元'], '汽车零部件'), ['制动盘', '制动鼓']);
assert.deepEqual(matchedProducts(['DISCO DE FRENO VENTILADO 320MM'], ['制动盘'], '汽车零部件'), ['制动盘']);
assert.deepEqual(matchedProducts(['BREMSSCHEIBE BELÜFTET VORNE'], ['制动盘'], '汽车零部件'), ['制动盘']);
assert.deepEqual(matchedProducts(['WHEEL HUB ASSEMBLY REAR AXLE'], ['轮毂单元', '制动盘'], '汽车零部件'), ['轮毂单元']);
assert.deepEqual(matchedProducts(['LED HEADLAMP'], ['制动盘'], '汽车零部件'), []);

console.log('trade insight tests passed');
