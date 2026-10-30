import { useMemo, useState } from 'react';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { IndustryPickerDialog, type IndustryProduct } from '@/components/IndustryPickerDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import automotiveTemplates from './data/automotive-attributes.json';
import cncLatheExample from '../docs/数控车床_属性模板.json';
import steelStructureExample from '../docs/建筑钢结构_属性模板.json';
import { addIndustryAttributes, addIndustrySpecs, exampleIndustryAttributes, exampleTemplateAttributes, type IndustryAttribute, type IndustrySpec, type TemplateAttribute, type TemplateSpec } from '@/attributeTemplate';

interface TemplateRecord { id: string; name: string; description: string; createdAt: string; productCount: number; attributes: TemplateAttribute[]; specs: TemplateSpec[] }
type EditorTab = 'attributes' | 'parameters' | 'specs' | 'buttons' | 'detail';
type PickerKind = 'attribute' | 'spec';

const baseAttributes: TemplateAttribute[] = [
  { id: 'base-name', name: '产品名称', type: 'txt', unit: '—', sourceProduct: '' },
  { id: 'base-image', name: '产品图片', type: 'image', unit: '—', sourceProduct: '' },
  { id: 'base-video', name: '产品视频', type: 'video', unit: '—', sourceProduct: '' },
];

const mockAttributeTemplatesData: TemplateRecord[] = [
  { id: 'tpl-default', name: '默认属性类型', description: '系统默认模板，全局只有一个', createdAt: '2026-09-28', productCount: 9, attributes: baseAttributes, specs: [] },
  { id: 'tpl-cnc-lathe', name: cncLatheExample.templateName, description: `来自 docs/数控车床_属性模板.json，${cncLatheExample.attributeField.length} 个属性字段`, createdAt: '2026-10-22', productCount: 0, attributes: exampleTemplateAttributes(cncLatheExample, 'cnc-lathe', '数控车床'), specs: [] },
  { id: 'tpl-steel-structure', name: steelStructureExample.templateName, description: `来自 docs/建筑钢结构_属性模板.json，${steelStructureExample.attributeField.length} 个属性字段`, createdAt: '2026-10-22', productCount: 0, attributes: exampleTemplateAttributes(steelStructureExample, 'steel-structure', '建筑钢结构'), specs: [] },
  { id: 'tpl-auto', name: '汽车零部件展示模板', description: '用于汽车零部件产品展示', createdAt: '2026-09-30', productCount: 3, attributes: [...baseAttributes, { id: 'industry-attr-brake-material', name: '摩擦材料', type: 'txt', unit: '—', sourceProduct: '刹车片', sourceId: 'attr-brake-material' }], specs: [{ id: 'industry-spec-brake-size', name: '尺寸', displayType: '文字', values: ['180×70×16 mm', '195×75×17 mm'], sourceProduct: '刹车片', sourceId: 'spec-brake-size' }] },
  { id: 'tpl-test', name: '测试1', description: '产品信息', createdAt: '2026-09-30', productCount: 1, attributes: baseAttributes, specs: [] },
];

const mockIndustryProductsData: IndustryProduct[] = [
  ...automotiveTemplates.products,
  { id: 'wheel-hub', category: '规格示例', name: '轮毂', description: '轮毂规格值示例' },
  { id: 'cnc-lathe', category: 'JSON 示例模板', name: '数控车床', description: `${cncLatheExample.attributeField.filter(field => !field.code).length} 个可选属性`, sourcePath: ['docs 示例', '数控车床'] },
  { id: 'steel-structure', category: 'JSON 示例模板', name: '建筑钢结构', description: `${steelStructureExample.attributeField.filter(field => !field.code).length} 个可选属性`, sourcePath: ['docs 示例', '建筑钢结构'] },
];

const mockIndustryAttributesData: IndustryAttribute[] = [
  ...automotiveTemplates.attributes,
  ...exampleIndustryAttributes(cncLatheExample, 'cnc-lathe'),
  ...exampleIndustryAttributes(steelStructureExample, 'steel-structure'),
];

const mockIndustrySpecsData: IndustrySpec[] = [
  { id: 'spec-piston-diameter', productId: 'piston', name: '直径', displayType: '文字', values: ['76 mm', '78 mm', '80 mm', '82 mm', '84 mm'], description: '活塞标称直径可选值' },
  { id: 'spec-piston-pin', productId: 'piston', name: '销孔尺寸', displayType: '文字', values: ['18 mm', '20 mm', '22 mm'], description: '活塞销孔直径可选值' },
  { id: 'spec-plug-thread', productId: 'spark-plug', name: '螺纹尺寸', displayType: '文字', values: ['M10×1', 'M12×1.25', 'M14×1.25'], description: '火花塞安装螺纹' },
  { id: 'spec-plug-gap', productId: 'spark-plug', name: '间隙', displayType: '文字', values: ['0.7 mm', '0.8 mm', '0.9 mm', '1.0 mm'], description: '火花塞电极间隙' },
  { id: 'spec-brake-size', productId: 'brake-pad', name: '尺寸', displayType: '文字', values: ['180×70×16 mm', '185×72×16 mm', '190×74×17 mm', '195×75×17 mm', '200×78×18 mm', '205×80×18 mm', '210×82×19 mm', '215×84×20 mm'], description: '按长 × 宽 × 厚表示的刹车片规格' },
  { id: 'spec-brake-position', productId: 'brake-pad', name: '安装位置', displayType: '文字', values: ['前轴', '后轴'], description: '刹车片适用安装位置' },
  { id: 'spec-hub-diameter', productId: 'wheel-hub', name: '直径', displayType: '文字', values: ['15 英寸', '16 英寸', '17 英寸', '18 英寸', '19 英寸', '20 英寸'], description: '轮毂标称直径' },
  { id: 'spec-hub-holes', productId: 'wheel-hub', name: '孔距', displayType: '文字', values: ['5×100', '5×108', '5×112', '5×114.3'], description: '螺栓孔数量和节圆直径' },
  { id: 'spec-bolt-size', productId: 'hex-bolt', name: '尺寸', displayType: '文字', values: ['M6×20', 'M6×25', 'M8×20', 'M8×30', 'M10×25', 'M10×30', 'M12×30', 'M12×40'], description: '公称直径 × 长度，包含多个标准值' },
  { id: 'spec-bolt-grade', productId: 'hex-bolt', name: '强度等级', displayType: '文字', values: ['8.8', '10.9', '12.9'], description: '可选机械性能等级' },
];

// ACTION: 获取属性模板列表 [GET] /api/product/attribute-templates
function handleFetchAttributeTemplates(params: { keyword?: string }) {
  console.log('fetch attribute templates', params);
}
// ACTION: 获取行业产品树 [GET] /api/industry-products
function handleFetchIndustryProducts(params: { industryPath: string }) {
  console.log('fetch industry products', params);
}
// ACTION: 获取产品行业属性项 [GET] /api/industry-products/attributes
function handleFetchIndustryAttributes(params: { productId?: string; category?: string }) {
  console.log('fetch industry attributes', params);
}
// ACTION: 获取产品行业属性值规格 [GET] /api/industry-products/specifications
function handleFetchIndustrySpecs(params: { productId?: string; category?: string }) {
  console.log('fetch industry specifications', params);
}
// ACTION: 新增属性模板 [POST] /api/product/attribute-templates
function handleCreateAttributeTemplate(payload: TemplateRecord) {
  console.log('create attribute template', payload);
}
// ACTION: 更新属性模板 [PATCH] /api/product/attribute-templates/{id}
function handleUpdateAttributeTemplate(payload: TemplateRecord) {
  console.log('update attribute template', payload);
}

const editorTabs: Array<{ id: EditorTab; label: string }> = [
  { id: 'attributes', label: '产品属性' }, { id: 'parameters', label: '产品参数' },
  { id: 'specs', label: '规格类型' }, { id: 'buttons', label: '扩展按钮' }, { id: 'detail', label: '扩展详情页签' },
];

export default function AttributeTemplatePage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>(mockAttributeTemplatesData);
  const [keyword, setKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tab, setTab] = useState<EditorTab>('attributes');
  const [fields, setFields] = useState<TemplateAttribute[]>(baseAttributes);
  const [specs, setSpecs] = useState<TemplateSpec[]>([]);
  const [pickerKind, setPickerKind] = useState<PickerKind | null>(null);
  const [manualKind, setManualKind] = useState<PickerKind | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualExample, setManualExample] = useState('');
  const [notice, setNotice] = useState('');
  const visibleTemplates = useMemo(() => templates.filter(item => !keyword.trim() || `${item.name}${item.description}`.toLowerCase().includes(keyword.trim().toLowerCase())), [templates, keyword]);

  const startEditor = (record?: TemplateRecord, duplicate = false) => {
    setEditingId(record && !duplicate ? record.id : null);
    setName(record ? duplicate ? `${record.name} - 副本` : record.name : '');
    setDescription(record?.description || '');
    setFields(record ? [...record.attributes] : [...baseAttributes]);
    setSpecs(record ? [...record.specs] : []);
    setTab('attributes'); setNotice(''); setEditorOpen(true);
  };
  const openPicker = (kind: PickerKind) => {
    handleFetchIndustryProducts({ industryPath: '汽车制造行业/汽车零部件' });
    const firstProductId = mockIndustryProductsData[0].id;
    kind === 'attribute' ? handleFetchIndustryAttributes({ productId: firstProductId }) : handleFetchIndustrySpecs({ productId: firstProductId });
    setPickerKind(kind);
  };
  const importSelected = (ids: string[]) => {
    const chosen = new Set(ids);
    for (const product of mockIndustryProductsData) {
      if (pickerKind === 'attribute') {
        const matches = mockIndustryAttributesData.filter(item => item.productId === product.id && chosen.has(item.id));
        if (matches.length) setFields(current => addIndustryAttributes(current, matches, product.name));
      } else {
        const matches = mockIndustrySpecsData.filter(item => item.productId === product.id && chosen.has(item.id));
        if (matches.length) setSpecs(current => addIndustrySpecs(current, matches, product.name));
      }
    }
    setNotice(`已加入 ${ids.length} 条行业${pickerKind === 'attribute' ? '属性' : '规格'}，保存模板后生效。`);
  };
  const saveTemplate = () => {
    if (!name.trim()) { setNotice('请先填写属性模板名称。'); return; }
    const original = templates.find(item => item.id === editingId);
    const record: TemplateRecord = { id: editingId || `tpl-${Date.now()}`, name: name.trim(), description: description.trim(), createdAt: original?.createdAt || new Date().toISOString().slice(0, 10), productCount: original?.productCount || 0, attributes: fields, specs };
    if (editingId) { handleUpdateAttributeTemplate(record); setTemplates(current => current.map(item => item.id === editingId ? record : item)); }
    else { handleCreateAttributeTemplate(record); setTemplates(current => [record, ...current]); }
    setEditorOpen(false); setNotice(editingId ? '属性模板已更新。' : '属性模板已新增。');
  };
  const addManual = () => {
    if (!manualName.trim()) { setNotice('请填写名称。'); return; }
    const id = `manual-${Date.now()}`;
    if (manualKind === 'attribute') setFields(current => [...current, { id, name: manualName.trim(), type: manualDetail.trim() || '文本', unit: '—', sourceProduct: '', description: manualDescription.trim(), example: manualExample.trim() }]);
    if (manualKind === 'spec') setSpecs(current => [...current, { id, name: manualName.trim(), displayType: '文字', values: manualDetail.split(/[，,\n]/).map(item => item.trim()).filter(Boolean), sourceProduct: '' }]);
    setManualKind(null); setManualName(''); setManualDetail(''); setNotice('已添加自定义项，保存模板后生效。');
  };

  return <PortalShell section="product" pageTitle={editorOpen ? editingId ? '编辑属性模板' : '新增属性模板' : '属性模板'}><div className="template-page">
    {!editorOpen ? <><div className="template-page-heading"><h1>属性模板</h1><label className="template-list-search"><Input aria-label="搜索属性模板" placeholder="请输入模板名称" value={keyword} onChange={event => { setKeyword(event.target.value); handleFetchAttributeTemplates({ keyword: event.target.value }); }} /><Search size={16} /></label></div><Button variant="primary" onClick={() => startEditor()}>新增自定义模板</Button>{notice && <div className="template-notice" role="status">{notice}</div>}<div className="template-list-table"><Table><TableHeader><TableRow><TableHead>属性模板名称</TableHead><TableHead>说明</TableHead><TableHead>创建时间</TableHead><TableHead>产品数</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{visibleTemplates.map(item => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.description}</TableCell><TableCell>{item.createdAt}</TableCell><TableCell>{item.productCount}</TableCell><TableCell><button className="text-action" onClick={() => startEditor(item)}>编辑</button><span className="operation-sep">|</span><button className="text-action" onClick={() => startEditor(item, true)}>复制新增</button></TableCell></TableRow>)}{visibleTemplates.length === 0 && <TableRow><TableCell colSpan={5}><div className="table-empty">没有匹配的属性模板</div></TableCell></TableRow>}</TableBody></Table></div><div className="table-footer">共 {visibleTemplates.length} 条记录</div></> : <><div className="template-page-heading"><h1>{editingId ? '编辑属性模板' : '新增属性模板'}</h1><Button onClick={() => { setEditorOpen(false); setNotice(''); }}><ChevronLeft size={14} /> 返回</Button></div><div className="template-editor-form"><label><span><b>*</b> 属性模板名：</span><Input placeholder="请输入名称" value={name} onChange={event => setName(event.target.value)} /></label><label><span>说明：</span><Textarea placeholder="请输入" rows={2} value={description} onChange={event => setDescription(event.target.value)} /></label></div><div className="template-tabs" role="tablist" aria-label="属性模板内容">{editorTabs.map(item => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
      {tab === 'attributes' && <section className="template-section"><div className="template-section-toolbar"><div><Button variant="primary" onClick={() => { setManualKind('attribute'); setManualName(''); setManualDetail(''); setManualDescription(''); setManualExample(''); }}><Plus size={15} /> 添加属性项</Button><Button onClick={() => openPicker('attribute')}>选择行业属性模板</Button></div><span>汽车制造行业 / 汽车零部件 · 10 个系统、95 个产品</span></div><div className="template-editor-table"><Table><TableHeader><TableRow><TableHead>属性名</TableHead><TableHead>类型</TableHead><TableHead>说明（选填）</TableHead><TableHead>示例值（选填）</TableHead><TableHead>单位</TableHead><TableHead>可选值</TableHead><TableHead>来源产品</TableHead><TableHead>显示状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{fields.map(item => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.type}</TableCell><TableCell><Input className="template-field-note" aria-label={`${item.name}说明`} placeholder="选填" value={item.description || ''} onChange={event => setFields(current => current.map(field => field.id === item.id ? { ...field, description: event.target.value } : field))} /></TableCell><TableCell><Input className="template-field-example" aria-label={`${item.name}示例值`} placeholder="选填" value={item.example || ''} onChange={event => setFields(current => current.map(field => field.id === item.id ? { ...field, example: event.target.value } : field))} /></TableCell><TableCell>{item.unit}</TableCell><TableCell><span className="template-attribute-values" title={item.values?.join('、')}>{item.values?.length ? `${item.values.slice(0, 3).join('、')}${item.values.length > 3 ? ` 等 ${item.values.length} 项` : ''}` : '—'}</span></TableCell><TableCell>{item.sourceProduct || '系统 / 自定义'}</TableCell><TableCell><span className="template-visible">◉ 显示</span></TableCell><TableCell>{item.id.startsWith('base-') ? <span className="template-fixed">基础字段</span> : <button className="text-action" onClick={() => setFields(current => current.filter(field => field.id !== item.id))}>移除</button>}</TableCell></TableRow>)}</TableBody></Table></div></section>}
      {tab === 'specs' && <section className="template-section"><div className="template-section-toolbar"><div><Button variant="primary" onClick={() => { setManualKind('spec'); setManualName(''); setManualDetail(''); setManualDescription(''); setManualExample(''); }}><Plus size={15} /> 添加规格</Button><Button onClick={() => openPicker('spec')}>选择行业属性值规格</Button></div><span>按产品选择规格名及其可选属性值</span></div><div className="template-editor-table"><Table><TableHeader><TableRow><TableHead>规格名</TableHead><TableHead>显示类型</TableHead><TableHead>规格值</TableHead><TableHead>来源产品</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{specs.map(item => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.displayType}</TableCell><TableCell><div className="template-spec-values">{item.values.slice(0, 4).join('、')}{item.values.length > 4 ? ` 等 ${item.values.length} 个值` : ''}</div></TableCell><TableCell>{item.sourceProduct || '自定义'}</TableCell><TableCell><button className="text-action" onClick={() => setSpecs(current => current.filter(spec => spec.id !== item.id))}>移除</button></TableCell></TableRow>)}{specs.length === 0 && <TableRow><TableCell colSpan={5}><div className="table-empty">尚未添加规格，可从行业属性值规格库选择</div></TableCell></TableRow>}</TableBody></Table></div></section>}
      {tab !== 'attributes' && tab !== 'specs' && <div className="template-other-tab">{editorTabs.find(item => item.id === tab)?.label}沿用现有模板配置方式，本期行业库选择不涉及此页签。</div>}
      {notice && <div className="template-notice" role="status">{notice}</div>}<div className="template-editor-footer"><Button onClick={() => setEditorOpen(false)}>取消</Button><Button variant="primary" onClick={saveTemplate}>保存属性模板</Button></div></>}
    <IndustryPickerDialog key={pickerKind || 'closed'} kind={pickerKind || 'attribute'} open={pickerKind !== null} onOpenChange={open => !open && setPickerKind(null)} products={mockIndustryProductsData} attributes={mockIndustryAttributesData} specs={mockIndustrySpecsData} excludedIds={new Set((pickerKind === 'spec' ? specs : fields).map(item => item.sourceId).filter((id): id is string => Boolean(id)))} onFilterChange={filter => pickerKind === 'spec' ? handleFetchIndustrySpecs(filter) : handleFetchIndustryAttributes(filter)} onConfirm={importSelected} />
    <Dialog open={manualKind !== null} onOpenChange={open => !open && setManualKind(null)}><DialogContent className="template-manual-dialog"><DialogHeader><DialogTitle>{manualKind === 'spec' ? '添加规格' : '添加属性项'}</DialogTitle><DialogDescription>填写当前模板的自定义内容。</DialogDescription></DialogHeader><div className="template-manual-fields"><label>名称 <b>*</b><Input value={manualName} onChange={event => setManualName(event.target.value)} /></label><label>{manualKind === 'spec' ? '规格值（用逗号分隔）' : '字段类型'}<Textarea rows={3} placeholder={manualKind === 'spec' ? '例如：M6×20，M8×30' : '例如：txt、number'} value={manualDetail} onChange={event => setManualDetail(event.target.value)} /></label>{manualKind === 'attribute' && <><label>说明（选填）<Textarea rows={2} value={manualDescription} onChange={event => setManualDescription(event.target.value)} /></label><label>示例值（选填）<Input value={manualExample} onChange={event => setManualExample(event.target.value)} /></label></>}</div><div className="template-manual-footer"><Button onClick={() => setManualKind(null)}>取消</Button><Button variant="primary" disabled={!manualName.trim() || (manualKind === 'spec' && !manualDetail.trim())} onClick={addManual}>添加</Button></div></DialogContent></Dialog>
  </div></PortalShell>;
}
