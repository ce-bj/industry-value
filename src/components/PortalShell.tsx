import type { ReactNode } from 'react';
import { ChevronDown, CircleHelp, FileText, Globe2, LayoutGrid, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react';

type TopNavItem = '概况' | '网站管理' | '营销管理' | '客户管理' | '业务中心' | '服务中心' | '安全中心' | '数据分析' | '管理设置';
const topNavigation: TopNavItem[] = ['概况', '网站管理', '营销管理', '客户管理', '业务中心', '服务中心', '安全中心', '数据分析', '管理设置'];
const topNavigationLinks: Partial<Record<TopNavItem, string>> = { '概况': '/overview/', '网站管理': '/', '客户管理': '/customer/market-opportunity/' };
export type CustomerMenuItem = '市场与机会' | '外贸客户洞察' | '广交会采购商' | '全球企业库' | '我的收藏';
const customerInsightNavigation: { label: CustomerMenuItem; href?: string }[] = [
  { label: '市场与机会', href: '/customer/market-opportunity/' },
  { label: '外贸客户洞察', href: '/customer/trade-insight/' },
  { label: '广交会采购商' }, { label: '全球企业库' }, { label: '我的收藏' },
];
const primaryNavigation = [
  { icon: LayoutGrid, label: '产品管理' }, { icon: Menu, label: '内容管理' },
  { icon: ShieldCheck, label: '审核管理' }, { icon: Menu, label: '表单管理' },
  { icon: Search, label: 'SEO优化' }, { icon: Sparkles, label: 'AI智能搜索' }, { icon: LayoutGrid, label: '可视化管理' },
  { icon: Globe2, label: '国际化翻译' }, { icon: ShieldCheck, label: '网站设置' },
];
const contentNavigation = ['企业概况', '新闻资讯', '图册展示', '视频展示', '企业网点', '常见问题', '文件下载', '友情链接', '领导介绍', '发展历程', '荣誉资质', '客户案例'];
const productNavigation = ['产品列表', '分类管理', '属性模板', '标记管理', '品牌管理', '筛选管理', '橱窗管理'];
type ShellSection = 'content' | 'product' | 'aiSearch';
const sectionConfig: Record<ShellSection, { primary: string; navigation: string[]; current: string; href: string; crumb: string; label: string }> = {
  content: { primary: '内容管理', navigation: contentNavigation, current: '常见问题', href: '/', crumb: '生物药行业解决方案', label: '内容' },
  product: { primary: '产品管理', navigation: productNavigation, current: '属性模板', href: '/attribute-templates/', crumb: '数字门户全球营销版', label: '产品' },
  aiSearch: { primary: 'AI智能搜索', navigation: [], current: 'AI智能搜索', href: '/ai-search/', crumb: '数字门户全球营销版', label: 'AI智能搜索' },
};
const primaryLinks: Record<string, string> = { '产品管理': sectionConfig.product.href, '内容管理': sectionConfig.content.href, 'AI智能搜索': sectionConfig.aiSearch.href };

function PortalTopbar({ active }: { active: TopNavItem }) {
  return <header className="portal-topbar">
    <div className="portal-brand"><span className="portal-brand-mark">◉</span><span><strong>数字门户</strong><small>CE DIGITAL PORTAL</small></span></div>
    <nav className="portal-topnav" aria-label="主导航">{topNavigation.map(item => {
      const href = topNavigationLinks[item];
      const className = item === active ? 'is-active' : '';
      return href ? <a key={item} href={href} className={className} aria-current={item === active ? 'page' : undefined}>{item}</a> : <span key={item} className={className}>{item}</span>;
    })}</nav>
    <div className="portal-top-actions"><span>👩🏻‍💼 运营助手</span><Search size={19} /><LayoutGrid size={18} /></div>
  </header>;
}

export function PortalShell({ children, section = 'content', pageTitle }: { children: ReactNode; section?: ShellSection; pageTitle?: string }) {
  const config = sectionConfig[section];
  return <div className="portal-app">
    <PortalTopbar active="网站管理" />
    <div className="portal-body">
      <aside className="portal-primary-nav" aria-label="网站管理导航">
        <div className="portal-site"><span className="flag">🇨🇳</span><strong>中文简体</strong><span className="flash">ϟ</span></div>
        {primaryNavigation.map(item => primaryLinks[item.label] ? <a key={item.label} href={primaryLinks[item.label]} className={`portal-primary-item ${item.label === config.primary ? 'is-active' : ''}`}><item.icon size={14} strokeWidth={1.7} /><span>{item.label}</span></a> : <div key={item.label} className="portal-primary-item"><item.icon size={14} strokeWidth={1.7} /><span>{item.label}</span></div>)}
      </aside>
      {config.navigation.length > 0 && <aside className="portal-secondary-nav" aria-label={`${config.label}管理导航`}>
        {config.navigation.map(item => <div key={item} className="portal-secondary-group">{item === config.current ? <a href={config.href} className="portal-secondary-child is-active">{item}</a> : <div className="portal-secondary-item"><span>{item}</span>{section === 'content' && <ChevronDown size={13} />}</div>}</div>)}
      </aside>}
      <main className="portal-main">
        <div className="portal-breadcrumb"><span className="crumb-pin">♧</span><span>首页</span><span className="crumb-sep">›</span><span>网站管理</span><span className="crumb-sep">›</span><span>{config.crumb}</span><span className="crumb-sep">›</span>{config.primary !== (pageTitle || config.current) && <><span>{config.primary}</span><span className="crumb-sep">›</span></>}<strong>{pageTitle || config.current}</strong><span className="breadcrumb-help"><CircleHelp size={14} /> 查看本页帮助</span></div>
        {children}
      </main>
    </div>
    <div className="portal-side-handle" aria-hidden="true">‹</div>
    <div className="portal-watermark" aria-hidden="true"><Sparkles size={14} /> 演示原型</div>
  </div>;
}

/** 客户管理 › 外贸客户洞察 栏目：左侧一级分组 + 子菜单（「市场与机会」为新增项）。 */
export function CustomerShell({ children, current }: { children: ReactNode; current: CustomerMenuItem }) {
  return <div className="portal-app">
    <PortalTopbar active="客户管理" />
    <div className="portal-body">
      <aside className="customer-nav" aria-label="客户管理导航">
        <div className="customer-nav-group"><FileText size={15} /><strong>外贸客户洞察</strong></div>
        {customerInsightNavigation.map(item => item.href
          ? <a key={item.label} href={item.href} className={`customer-nav-item ${item.label === current ? 'is-active' : ''}`} aria-current={item.label === current ? 'page' : undefined}>{item.label}{item.label === '市场与机会' && <span className="customer-nav-new">新</span>}</a>
          : <span key={item.label} className="customer-nav-item">{item.label}</span>)}
      </aside>
      <main className="portal-main customer-main">
        <div className="portal-breadcrumb"><span className="crumb-pin">♧</span><span>首页</span><span className="crumb-sep">›</span><span>客户管理</span><span className="crumb-sep">›</span><span>外贸客户洞察</span>{current !== '外贸客户洞察' && <><span className="crumb-sep">›</span><strong>{current}</strong></>}<span className="breadcrumb-help"><CircleHelp size={14} /> 查看本页帮助</span></div>
        {children}
      </main>
    </div>
    <div className="portal-watermark" aria-hidden="true"><Sparkles size={14} /> 演示原型</div>
  </div>;
}

/** 「概况」类页面：无左侧菜单，整宽浅蓝背景。传入 breadcrumb 时显示面包屑（首页 › 概况 › …）。 */
export function OverviewShell({ children, breadcrumb }: { children: ReactNode; breadcrumb?: string }) {
  return <div className="portal-app overview-app">
    <PortalTopbar active="概况" />
    {breadcrumb && <div className="portal-breadcrumb overview-breadcrumb"><span className="crumb-pin">♧</span><span>首页</span><span className="crumb-sep">›</span><a href="/overview/">概况</a><span className="crumb-sep">›</span><strong>{breadcrumb}</strong><span className="breadcrumb-help"><CircleHelp size={14} /> 查看本页帮助</span></div>}
    <main className="overview-main">{children}</main>
    <div className="portal-watermark" aria-hidden="true"><Sparkles size={14} /> 演示原型</div>
  </div>;
}
