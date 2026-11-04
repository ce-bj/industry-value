import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);

// 静态托管下，多页路由都回退到同一个入口 index.html。
for (const route of ['attribute-templates/', 'site-info/']) {
  const target = new URL(route, dist);
  await mkdir(target, { recursive: true });
  await copyFile(new URL('index.html', dist), new URL('index.html', target));
}
