import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/siteIndustry.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { draftFromIndustries, formatIndustry, industrySlotLabel, loadSiteIndustries, normalizeIndustryDraft, saveSiteIndustries, validateIndustryDraft, SITE_INDUSTRY_STORAGE_KEY } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const catalog = [
  { name: '汽车制造行业', children: ['整车制造', '汽车零部件'] },
  { name: '机械设备制造', children: ['数控机床'] },
];

assert.equal(industrySlotLabel(0), '主行业');
assert.equal(industrySlotLabel(2), '额外行业 2');
assert.equal(formatIndustry({ primary: '汽车制造行业', secondary: '整车制造' }), '汽车制造行业 / 整车制造');

// 草稿固定 3 个槽位
assert.equal(draftFromIndustries([]).length, 3);
assert.deepEqual(draftFromIndustries([{ primary: '汽车制造行业', secondary: '整车制造' }])[0], { primary: '汽车制造行业', secondary: '整车制造' });

// 主行业必填，额外行业可空
assert.deepEqual(Object.keys(validateIndustryDraft([{}, {}, {}], catalog)), ['0']);
assert.deepEqual(validateIndustryDraft([{ primary: '汽车制造行业', secondary: '整车制造' }, {}, {}], catalog), {});
// 选了一级必须选二级
assert.equal(validateIndustryDraft([{ primary: '汽车制造行业' }, {}, {}], catalog)[0], '请选择二级行业');
assert.equal(validateIndustryDraft([{ primary: '汽车制造行业', secondary: '整车制造' }, { primary: '机械设备制造' }, {}], catalog)[1], '请选择二级行业');
// 重复行业
const duplicated = validateIndustryDraft([{ primary: '汽车制造行业', secondary: '整车制造' }, { primary: '机械设备制造', secondary: '数控机床' }, { primary: '汽车制造行业', secondary: '整车制造' }], catalog);
assert.deepEqual(Object.keys(duplicated), ['2']);
assert.equal(duplicated[2], '与主行业重复');
// 同一一级下不同二级可以并存
assert.deepEqual(validateIndustryDraft([{ primary: '汽车制造行业', secondary: '整车制造' }, { primary: '汽车制造行业', secondary: '汽车零部件' }, {}], catalog), {});
// 不在行业库中
assert.equal(validateIndustryDraft([{ primary: '汽车制造行业', secondary: '数控机床' }, {}, {}], catalog)[0], '所选行业不在行业库中');

// 规范化：去掉空槽位，主行业在前，最多 3 个
assert.deepEqual(normalizeIndustryDraft([{ primary: 'A', secondary: 'a' }, {}, { primary: 'B', secondary: 'b' }]), [{ primary: 'A', secondary: 'a' }, { primary: 'B', secondary: 'b' }]);
assert.equal(normalizeIndustryDraft([1, 2, 3, 4].map(n => ({ primary: `P${n}`, secondary: `S${n}` }))).length, 3);

// 存取：没有记录时为空，损坏数据被忽略，最多保留 3 个
const store = new Map();
const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
assert.deepEqual(loadSiteIndustries(storage), []);
saveSiteIndustries([{ primary: '汽车制造行业', secondary: '整车制造' }], storage);
assert.deepEqual(loadSiteIndustries(storage), [{ primary: '汽车制造行业', secondary: '整车制造' }]);
store.set(SITE_INDUSTRY_STORAGE_KEY, '{bad json');
assert.deepEqual(loadSiteIndustries(storage), []);
store.set(SITE_INDUSTRY_STORAGE_KEY, JSON.stringify([{ primary: 'A', secondary: 'a' }, { primary: 1 }, null, { primary: 'B', secondary: 'b' }, { primary: 'C', secondary: 'c' }, { primary: 'D', secondary: 'd' }]));
assert.deepEqual(loadSiteIndustries(storage).map(item => item.primary), ['A', 'B', 'C']);
saveSiteIndustries([], storage);
assert.equal(store.has(SITE_INDUSTRY_STORAGE_KEY), false);

console.log('PASS: 所属行业草稿校验、规范化与本地存取');
