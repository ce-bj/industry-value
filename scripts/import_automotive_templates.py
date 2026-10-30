"""从总索引及对应产品 Excel 提取原型数据；只读源工作簿。"""
import json
import sys
from pathlib import Path

import openpyxl

root = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'src/data/automotive-attributes.json'
index = openpyxl.load_workbook(root / '00_模板总索引.xlsx', read_only=True, data_only=True)
products, attributes = [], []
legacy_ids = {'活塞': 'piston', '火花塞': 'spark-plug', '刹车片': 'brake-pad', '紧固件': 'hex-bolt'}
for row in list(index.active.values)[1:]:
    system, name, expected = row[:3]
    if not isinstance(system, str) or not system.startswith('SYS-'):
        continue
    category = system.replace(' ', '_', 1)
    product_id = legacy_ids.get(name) or f'{category.split("_")[0]}-{name}'
    file = root / category / f'{name}_属性模板.xlsx'
    workbook = openpyxl.load_workbook(file, read_only=True, data_only=True)
    sheet = next(sheet for sheet in workbook if sheet.title.endswith('字段定义'))
    rows = list(sheet.values)
    headers = rows[0]
    fields = [dict(zip(headers, row)) for row in rows[1:] if row[1]]
    assert len(fields) == expected, (name, expected, len(fields))
    products.append({'id': product_id, 'category': category, 'name': name,
                     'description': f'{len(fields)} 个属性字段', 'sourceFile': f'{category}/{file.name}'})
    for i, field in enumerate(fields, 1):
        text = lambda key: '' if field.get(key) is None else str(field[key])
        attributes.append({'id': f'{product_id}-field-{i}', 'productId': product_id,
                           'name': text('数据项/字段名'), 'type': text('字段类型'),
                           'unit': text('单位') or '—', 'description': text('说明'),
                           'example': text('示例值'), 'group': text('分组'),
                           'values': [v.strip() for v in text('选项值').split(',') if v.strip()]})
    workbook.close()
index.close()
assert len(products) == 95
assert len({p['id'] for p in products}) == len(products)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps({'industryPath': ['汽车制造行业', '汽车零部件'],
                              'source': '00_模板总索引.xlsx 及各产品的字段定义工作表',
                              'products': products, 'attributes': attributes}, ensure_ascii=False, indent=2) + '\n')
print(f'已提取 {len(products)} 个产品、{len(attributes)} 个字段 → {target}')
