import type { ReactNode } from 'react';
import { ChevronDown, CircleHelp, Globe2, LayoutGrid, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react';

const topNavigation = ['概况', '网站管理', '营销管理', '客户管理', '业务中心', '服务中心', '安全中心', '数据分析', '管理设置'];
const primaryNavigation = [
  { icon: LayoutGrid, label: '产品管理' }, { icon: Menu, label: '内容管理' },
  { icon: ShieldCheck, label: '审核管理' }, { icon: Menu, label: '表单管理' },
  { icon: Search, label: 'SEO优化' }, { icon: LayoutGrid, label: '可视化管理' },
  { icon: Globe2, label: '国际化翻译' }, { icon: ShieldCheck, label: '网站设置' },
];
const contentNavigation = ['企业概况', '新闻资讯', '图册展示', '视频展示', '企业网点', '常见问题', '文件下载', '友情链接', '领导介绍', '发展历程', '荣誉资质', '客户案例'];
const productNavigation = ['产品列表', '分类管理', '属性模板', '标记管理', '品牌管理', '筛选管理', '橱窗管理'];

export function PortalShell({ children, section = 'content', pageTitle }: { children: ReactNode; section?: 'content' | 'product'; pageTitle?: string }) {
  const isProduct = section === 'product';
  const navigation = isProduct ? productNavigation : contentNavigation;
  const currentItem = isProduct ? '属性模板' : '常见问题';
  return <div className="portal-app">
    <header className="portal-topbar">
      <div className="portal-brand"><span className="portal-brand-mark">◉</span><span><strong>数字门户</strong><small>CE DIGITAL PORTAL</small></span></div>
      <nav className="portal-topnav" aria-label="主导航">{topNavigation.map(item => <span key={item} className={item === '网站管理' ? 'is-active' : ''}>{item}</span>)}</nav>
      <div className="portal-top-actions"><span>👩🏻‍💼 运营助手</span><Search size={19} /><LayoutGrid size={18} /></div>
    </header>
    <div className="portal-body">
      <aside className="portal-primary-nav" aria-label="网站管理导航">
        <div className="portal-site"><span className="flag">🇨🇳</span><strong>中文简体</strong><span className="flash">ϟ</span></div>
        {primaryNavigation.map(item => item.label === '产品管理' || item.label === '内容管理' ? <a key={item.label} href={item.label === '产品管理' ? '/attribute-templates/' : '/'} className={`portal-primary-item ${item.label === (isProduct ? '产品管理' : '内容管理') ? 'is-active' : ''}`}><item.icon size={14} strokeWidth={1.7} /><span>{item.label}</span></a> : <div key={item.label} className="portal-primary-item"><item.icon size={14} strokeWidth={1.7} /><span>{item.label}</span></div>)}
      </aside>
      <aside className="portal-secondary-nav" aria-label={`${isProduct ? '产品' : '内容'}管理导航`}>
        {navigation.map(item => <div key={item} className="portal-secondary-group">{item === currentItem ? <a href={isProduct ? '/attribute-templates/' : '/'} className="portal-secondary-child is-active">{item}</a> : <div className="portal-secondary-item"><span>{item}</span>{!isProduct && <ChevronDown size={13} />}</div>}</div>)}
      </aside>
      <main className="portal-main">
        <div className="portal-breadcrumb"><span className="crumb-pin">♧</span><span>首页</span><span className="crumb-sep">›</span><span>网站管理</span><span className="crumb-sep">›</span><span>{isProduct ? '数字门户全球营销版' : '生物药行业解决方案'}</span><span className="crumb-sep">›</span><span>{isProduct ? '产品管理' : '内容管理'}</span><span className="crumb-sep">›</span><strong>{pageTitle || currentItem}</strong><span className="breadcrumb-help"><CircleHelp size={14} /> 查看本页帮助</span></div>
        {children}
      </main>
    </div>
    <div className="portal-side-handle" aria-hidden="true">‹</div>
    <div className="portal-watermark" aria-hidden="true"><Sparkles size={14} /> 演示原型</div>
  </div>;
}
