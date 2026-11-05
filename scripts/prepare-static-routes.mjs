import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const attributeTemplateRoute = new URL('attribute-templates/', dist);

await mkdir(attributeTemplateRoute, { recursive: true });
await copyFile(new URL('index.html', dist), new URL('index.html', attributeTemplateRoute));
