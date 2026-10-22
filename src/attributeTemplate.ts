export interface IndustryAttribute {
  id: string;
  productId: string;
  name: string;
  type: string;
  unit: string;
  description?: string;
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
    sourceProduct: productName, sourceId: item.id,
  }))];
}

export function addIndustrySpecs(current: TemplateSpec[], selected: IndustrySpec[], productName: string): TemplateSpec[] {
  const known = new Set(current.map(item => item.sourceId || item.id));
  return [...current, ...selected.filter(item => !known.has(item.id)).map(item => ({
    id: `industry-${item.id}`, name: item.name, displayType: item.displayType,
    values: [...item.values], sourceProduct: productName, sourceId: item.id,
  }))];
}
