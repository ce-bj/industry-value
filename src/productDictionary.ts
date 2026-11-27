// 产品字典：用户可填写的主营产品 → 标准产品（中文名 + 英文名）→ 海关编码。由运营按二级行业维护（运营清单第 7 项）。
// 企业画像第 2 步用它给出可选产品；市场与机会按产品的英文名查字典得到海关编码，并把别名合并为同一个产品。

export interface HsCode { code: string; name: string }
export interface DictionaryProduct {
  industry: string;          // 二级行业
  standardName: string;      // 标准产品名（中文）
  englishName: string;       // 标准英文名：市场与机会默认显示的英文名，用来查海关编码与报关描述
  aliases: string[];         // 别名 / 常见写法（中英文）
  hsCodes: HsCode[];         // 海关编码（6 位，可多个）
  customsKeywords: string[]; // 报关描述关键词（含主要进口国语言），用于同一编码下区分产品
}

const BRAKE: HsCode = { code: '8708.30', name: '制动器及其零件' };
const WHEEL: HsCode = { code: '8708.70', name: '车轮及其零件' };
const SUSPENSION: HsCode = { code: '8708.80', name: '悬挂系统及其零件' };
const OTHER_PARTS: HsCode = { code: '8708.99', name: '其他机动车辆零件' };

export const PRODUCT_DICTIONARY: DictionaryProduct[] = [
  { industry: '汽车零部件', standardName: '制动盘', englishName: 'Brake Disc', aliases: ['刹车盘', '刹车碟', 'brake rotor'], hsCodes: [BRAKE], customsKeywords: ['BRAKE DISC', 'ROTOR', 'VENTILATED', 'DISCO DE FRENO', 'BREMSSCHEIBE'] },
  { industry: '汽车零部件', standardName: '制动鼓', englishName: 'Brake Drum', aliases: ['刹车鼓'], hsCodes: [BRAKE], customsKeywords: ['BRAKE DRUM', 'TAMBOR DE FRENO', 'BREMSTROMMEL'] },
  { industry: '汽车零部件', standardName: '刹车片', englishName: 'Brake Pad', aliases: ['制动片', '制动衬片'], hsCodes: [BRAKE], customsKeywords: ['BRAKE PAD'] },
  { industry: '汽车零部件', standardName: '制动钳', englishName: 'Brake Caliper', aliases: ['刹车卡钳', '卡钳'], hsCodes: [BRAKE], customsKeywords: ['CALIPER'] },
  { industry: '汽车零部件', standardName: '轮毂单元', englishName: 'Wheel Hub Unit', aliases: ['轮毂总成', 'hub unit', 'wheel hub assembly'], hsCodes: [WHEEL], customsKeywords: ['HUB UNIT', 'HUB ASSY'] },
  { industry: '汽车零部件', standardName: '轮毂轴承', englishName: 'Wheel Bearing', aliases: ['车轮轴承', 'hub bearing'], hsCodes: [WHEEL], customsKeywords: ['WHEEL BEARING', 'HUB BEARING'] },
  { industry: '汽车零部件', standardName: '控制臂', englishName: 'Control Arm', aliases: ['摆臂', '下摆臂'], hsCodes: [SUSPENSION], customsKeywords: ['CONTROL ARM'] },
  { industry: '汽车零部件', standardName: '减震器', englishName: 'Shock Absorber', aliases: ['避震器', '减振器'], hsCodes: [SUSPENSION], customsKeywords: ['SHOCK ABSORBER'] },
  { industry: '汽车零部件', standardName: '转向机', englishName: 'Steering Gear', aliases: ['方向机', '转向器'], hsCodes: [{ code: '8708.94', name: '转向盘、转向柱、转向器及其零件' }], customsKeywords: ['STEERING GEAR', 'STEERING RACK'] },
  { industry: '汽车零部件', standardName: '变速箱零件', englishName: 'Gearbox Parts', aliases: ['变速器零件', 'transmission parts'], hsCodes: [{ code: '8708.40', name: '变速箱及其零件' }], customsKeywords: ['GEARBOX', 'TRANSMISSION'] },
  { industry: '汽车零部件', standardName: '离合器', englishName: 'Clutch', aliases: ['离合器片', '离合器压盘'], hsCodes: [{ code: '8708.93', name: '离合器及其零件' }], customsKeywords: ['CLUTCH'] },
  { industry: '汽车零部件', standardName: '消声器', englishName: 'Muffler', aliases: ['排气管', '消音器', 'exhaust pipe'], hsCodes: [{ code: '8708.92', name: '消声器、排气管及其零件' }], customsKeywords: ['MUFFLER', 'EXHAUST'] },
  { industry: '汽车零部件', standardName: '散热器', englishName: 'Radiator', aliases: ['水箱'], hsCodes: [{ code: '8708.91', name: '散热器及其零件' }], customsKeywords: ['RADIATOR'] },
  { industry: '汽车零部件', standardName: '底盘支架', englishName: 'Chassis Bracket', aliases: ['底盘件'], hsCodes: [OTHER_PARTS], customsKeywords: ['CHASSIS', 'BRACKET'] },
  { industry: '汽车零部件', standardName: '滤清器', englishName: 'Engine Filter', aliases: ['机油滤清器', '空气滤清器', '机滤', '空滤', 'oil filter', 'air filter'], hsCodes: [{ code: '8421.23', name: '内燃机用机油或燃油滤清器' }, { code: '8421.31', name: '内燃机用进气过滤器' }], customsKeywords: ['OIL FILTER', 'AIR FILTER'] },
];

/** 统一写法后再比较：去首尾空格、全角转半角、忽略大小写、合并连续空格。 */
export function normalizeProductName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** 二级行业：一个或多个（企业可有多个所属行业，按顺序依次查字典）。不传则查全部行业。 */
export type IndustryScope = string | string[] | undefined;

function inScope(item: DictionaryProduct, industries: IndustryScope): boolean {
  if (industries === undefined) return true;
  return (Array.isArray(industries) ? industries : [industries]).includes(item.industry);
}

/** 一个产品的全部写法：标准中文名、标准英文名、别名。 */
export function productNames(item: DictionaryProduct): string[] {
  return [item.standardName, item.englishName, ...item.aliases];
}

/** 在所属行业的字典里找标准产品：先比标准名、英文名和别名，再按「以标准名开头」兜底（如「制动盘总成」→ 制动盘）。找不到返回 null，不猜。 */
export function resolveProduct(name: string, industries?: IndustryScope): DictionaryProduct | null {
  const key = normalizeProductName(name);
  if (!key) return null;
  const candidates = PRODUCT_DICTIONARY.filter(item => inScope(item, industries));
  return candidates.find(item => productNames(item).some(alias => normalizeProductName(alias) === key))
    ?? candidates.find(item => key.startsWith(normalizeProductName(item.standardName)))
    ?? null;
}

/** 所属行业下用户可以填写的产品（标准名），用于输入提示。 */
export function dictionaryProductNames(industries: IndustryScope): string[] {
  return PRODUCT_DICTIONARY.filter(item => inScope(item, industries)).map(item => item.standardName);
}

export function formatHsCodes(codes: HsCode[]): string {
  return codes.map(code => code.code).join('、');
}
