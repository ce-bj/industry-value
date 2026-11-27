import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/enterpriseProfile.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const {
  DIAGNOSIS_STEPS, EMPTY_ANSWERS, MAX_INDUSTRIES, aggregateIndustries, aggregateMainProducts, answersFromSites, companyNameOptions, computeTrustScore, diffSiteSnapshot, identityFromSites,
  industryTrustBenchmark, matchStrategy, siteSnapshot, validateStep, withMainIndustry,
} = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const filled = {
  ...EMPTY_ANSWERS, companyName: '宁波鑫驰汽车零部件有限公司', industries: [{ primary: '汽车制造行业', secondary: '汽车零部件' }], industryPrimary: '汽车制造行业', industry: '汽车零部件', employeeCount: '200-500人', annualRevenue: '¥5000万-2亿',
  products: ['制动盘'], customerType: 'aftermarket', businessModel: 'oem', acquisition: ['exhibition', 'b2b'], digitalLevel: 'L3', globalLevel: 'G2', goal: 'growth',
};

assert.equal(DIAGNOSIS_STEPS.length, 7);
// 每一步都要拦住空答案，填完后全部放行
for (let step = 0; step < 7; step++) {
  assert.ok(validateStep(step, EMPTY_ANSWERS), `第 ${step + 1} 步空答案应提示`);
  assert.equal(validateStep(step, filled), null, `第 ${step + 1} 步已填应通过`);
}
assert.equal(validateStep(0, { ...filled, companyName: '   ' }), '请填写「企业名称」');
assert.equal(validateStep(0, { ...filled, industries: [] }), '请至少选择一个「所属行业」，需选到二级行业');
const elevenIndustries = Array.from({ length: 11 }, (_, i) => ({ primary: '一级', secondary: `二级${i}` }));
assert.equal(validateStep(0, { ...filled, industries: elevenIndustries }), `「所属行业」最多 ${MAX_INDUSTRIES} 个`);
assert.equal(validateStep(0, { ...filled, industries: elevenIndustries.slice(0, 10) }), null);
// 主行业 = 第一个行业
assert.deepEqual(withMainIndustry({ ...filled, industries: [{ primary: '机械设备制造', secondary: '通用零部件' }, { primary: '汽车制造行业', secondary: '汽车零部件' }] }).industry, '通用零部件');
assert.equal(validateStep(1, { ...filled, products: [] }), '请至少保留一个「主营产品」');

// 方案匹配：A 需 L4+ 且 G3+；B 为 L≤2 且 G≤2；其余为 C
assert.equal(matchStrategy({ ...filled, digitalLevel: 'L4', globalLevel: 'G3' }).planId, 'A');
assert.equal(matchStrategy({ ...filled, digitalLevel: 'L2', globalLevel: 'G2' }).planId, 'B');
assert.equal(matchStrategy(filled).planId, 'C');

// 信任评分 = L×8 + G×7 + 渠道数×5 + 15，夹在 20–95
assert.equal(computeTrustScore(3, 2, 2), 63);
assert.equal(computeTrustScore(5, 5, 7), 95);
const c = matchStrategy(filled);
assert.equal(c.trustScore, 63);
assert.equal(c.industryBenchmark, 48);
assert.equal(c.trustGap, 0, '高于行业均值时差距为 0');
const low = matchStrategy({ ...filled, digitalLevel: 'L2', globalLevel: 'G1', acquisition: ['exhibition'] });
assert.equal(low.trustScore, 43);
assert.equal(low.trustGap, 5);
// 关键发现、First Win 暂不做，结果中不再返回
assert.equal('keyFindings' in c, false);
assert.equal('firstWin' in c, false);

// 没有行业均值的行业不做对比
assert.equal(industryTrustBenchmark('数控机床'), null);
const noBenchmark = matchStrategy({ ...filled, industryPrimary: '机械设备制造', industry: '数控机床', digitalLevel: 'L1', globalLevel: 'G1', acquisition: ['exhibition'] });
assert.equal(noBenchmark.industryBenchmark, null);
assert.equal(noBenchmark.trustGap, null);

// 多网站：企业名称按网站顺序列出、相同合并、空的跳过；行业取第一个设置了行业的网站；主营产品聚合去重
const sites = [
  { siteId: 'a', siteName: '中文站', domain: 'a.cn', companyName: '', industries: [], mainProducts: ['制动盘', '制动鼓'] },
  { siteId: 'b', siteName: '英文站', domain: 'b.com', companyName: 'Ningbo Xinchi Auto Parts Co., Ltd.', industries: [{ primary: '汽车制造行业', secondary: '汽车零部件' }, { primary: '汽车制造行业', secondary: '汽车后市场' }], mainProducts: ['制动盘 ', 'Brake Drum', 'ＡＢＳ传感器'] },
  { siteId: 'c', siteName: '俄语站', domain: 'c.ru', companyName: '宁波鑫驰汽车零部件有限公司', industries: [{ primary: '汽车制造行业', secondary: '汽车零部件' }, { primary: '机械设备制造', secondary: '' }, { primary: '机械设备制造', secondary: '通用零部件' }], mainProducts: ['brake drum', 'ABS传感器'] },
  { siteId: 'd', siteName: '日语站', domain: 'd.jp', companyName: 'Ningbo Xinchi Auto Parts Co., Ltd.', industries: [], mainProducts: [] },
];
assert.deepEqual(companyNameOptions(sites), [
  { companyName: 'Ningbo Xinchi Auto Parts Co., Ltd.', siteNames: ['英文站', '日语站'] },
  { companyName: '宁波鑫驰汽车零部件有限公司', siteNames: ['俄语站'] },
]);
// 所属行业：各网站全部列出、相同合并、未选到二级的跳过
assert.deepEqual(aggregateIndustries(sites).map(item => [item.industry.secondary, item.siteNames]), [['汽车零部件', ['英文站', '俄语站']], ['汽车后市场', ['英文站']], ['通用零部件', ['俄语站']]]);
const identity = identityFromSites(sites);
assert.deepEqual(identity.industries.map(item => item.secondary), ['汽车零部件', '汽车后市场', '通用零部件']);
assert.equal(identity.industry, '汽车零部件', '第一个行业为主行业');
// 超过 10 个只保留前 10 个
const manyIndustries = [{ siteId: 'm', siteName: '多行业站', domain: 'm.com', companyName: 'X', industries: Array.from({ length: 12 }, (_, i) => ({ primary: '一级', secondary: `二级${i}` })), mainProducts: [] }];
assert.equal(aggregateIndustries(manyIndustries).length, 12);
assert.equal(identityFromSites(manyIndustries).industries.length, MAX_INDUSTRIES);
assert.equal(identityFromSites(manyIndustries).industries[9].secondary, '二级9');
assert.deepEqual(aggregateMainProducts(sites), [
  { name: '制动盘', siteNames: ['中文站', '英文站'] },
  { name: '制动鼓', siteNames: ['中文站'] },
  { name: 'Brake Drum', siteNames: ['英文站', '俄语站'] },
  { name: 'ＡＢＳ传感器', siteNames: ['英文站', '俄语站'] },
]);
const initial = answersFromSites(sites);
assert.equal(initial.companyName, 'Ningbo Xinchi Auto Parts Co., Ltd.', '第一个网站公司名称为空时取下一个');
assert.deepEqual(initial.products, ['制动盘', '制动鼓', 'Brake Drum', 'ＡＢＳ传感器']);
assert.equal(answersFromSites([]).companyName, '');
assert.deepEqual(answersFromSites([]).industries, []);

// 网站信息变更：与评测时的快照比较，列出新增 / 移除；写法差异（空格、大小写）不算变更
const before = siteSnapshot(sites);
assert.deepEqual(diffSiteSnapshot(before, siteSnapshot(sites)), []);
const changedSites = sites.map(site => site.siteId === 'a' ? { ...site, mainProducts: [...site.mainProducts, '刹车片', ' BRAKE DRUM '], companyName: '鑫驰集团' } : site);
assert.deepEqual(diffSiteSnapshot(before, siteSnapshot(changedSites)), [
  { field: '公司名称', added: ['鑫驰集团'], removed: [] },
  { field: '主营产品', added: ['刹车片'], removed: [] },
]);
const removedIndustry = sites.map(site => site.siteId === 'c' ? { ...site, industries: [] } : site);
assert.deepEqual(diffSiteSnapshot(before, siteSnapshot(removedIndustry)), [{ field: '所属行业', added: [], removed: ['机械设备制造 / 通用零部件'] }]);

console.log('enterprise profile tests passed');
