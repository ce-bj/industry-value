export interface IndustryAttribute {
  id: string;
  productId: string;
  name: string;
  type: string;
  unit: string;
  description?: string;
  example?: string;
  code?: string;
  values?: string[];
}

export interface IndustrySpec {
  id: string;
  productId: string;
  name: string;
  displayType: string;
  values: string[];
  description?: string;
}

export interface TemplateAttribute {
  id: string;
  name: string;
  type: string;
  unit: string;
  sourceProduct: string;
  sourceId?: string;
  code?: string;
  values?: string[];
  description?: string;
  example?: string;
}

export interface AttributeTemplateExample {
  templateName: string;
  attributeField: Array<{
    code: string;
    attributeName: string;
    attributeType: string;
    attributeValue: string;
    unit?: string;
  }>;
}

const baseFieldTypes: Record<string, string> = {
  image: 'image', video: 'video', panorama: 'image',
  weight: 'number', volume: 'number', price: 'number', retailPrice: 'number',
  stock: 'number', moq: 'number', deliveryTime: 'number',
};

function exampleFieldId(productId: string, index: number): string {
  return `example-${productId}-${index}`;
}

function exampleFieldValues(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

export function exampleTemplateAttributes(example: AttributeTemplateExample, productId: string, productName: string): TemplateAttribute[] {
  return example.attributeField.map((field, index) => ({
    id: field.code ? `base-${field.code}` : `industry-${exampleFieldId(productId, index)}`,
    name: field.attributeName,
    type: field.attributeType || baseFieldTypes[field.code] || 'txt',
    unit: field.unit || '—',
    code: field.code,
    values: exampleFieldValues(field.attributeValue),
    sourceProduct: field.code ? '' : productName,
    sourceId: field.code ? undefined : exampleFieldId(productId, index),
  }));
}

export function exampleIndustryAttributes(example: AttributeTemplateExample, productId: string): IndustryAttribute[] {
  return example.attributeField.flatMap((field, index) => field.code ? [] : [{
    id: exampleFieldId(productId, index),
    productId,
    name: field.attributeName,
    type: field.attributeType || 'txt',
    unit: field.unit || '—',
    code: field.code,
    values: exampleFieldValues(field.attributeValue),
    description: field.attributeValue ? `${field.attributeType} · ${exampleFieldValues(field.attributeValue).length} 个可选值` : `${field.attributeType || '文本'}字段${field.unit ? ` · 单位 ${field.unit}` : ''}`,
  }]);
}

export interface TemplateSpec {
  id: string;
  name: string;
  displayType: string;
  values: string[];
  sourceProduct: string;
  sourceId?: string;
}

export function addIndustryAttributes(current: TemplateAttribute[], selected: IndustryAttribute[], productName: string): TemplateAttribute[] {
  const known = new Set(current.map(item => item.sourceId || item.id));
  return [...current, ...selected.filter(item => !known.has(item.id)).map(item => ({
    id: `industry-${item.id}`, name: item.name, type: item.type, unit: item.unit,
    sourceProduct: productName, sourceId: item.id, code: item.code, values: item.values ? [...item.values] : [],
    description: item.description, example: item.example,
  }))];
}

export function addIndustrySpecs(current: TemplateSpec[], selected: IndustrySpec[], productName: string): TemplateSpec[] {
  const known = new Set(current.map(item => item.sourceId || item.id));
  return [...current, ...selected.filter(item => !known.has(item.id)).map(item => ({
    id: `industry-${item.id}`, name: item.name, displayType: item.displayType,
    values: [...item.values], sourceProduct: productName, sourceId: item.id,
  }))];
}
