import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);

// 静态服务器没有 SPA 回退：每个子路由放一份 index.html，直接打开或刷新都能进入对应页面。
for (const route of ['attribute-templates', 'overview', 'enterprise-profile', 'customer/market-opportunity', 'customer/trade-insight', 'ai-search']) {
  const routeDir = new URL(`${route}/`, dist);
  await mkdir(routeDir, { recursive: true });
  await copyFile(new URL('index.html', dist), new URL('index.html', routeDir));
}
