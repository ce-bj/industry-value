import React from 'react';
import ReactDOM from 'react-dom/client';
import IndustryFaqPage from './IndustryFaqPage';
import './styles.css';
import './faq-generator.css';
import './attribute-template.css';
import './industry-select.css';
import './enterprise-profile.css';
import './customer-insight.css';
import './ai-search.css';

const AttributeTemplatePage = React.lazy(() => import('./AttributeTemplatePage'));
const OverviewPage = React.lazy(() => import('./OverviewPage'));
const EnterpriseProfilePage = React.lazy(() => import('./EnterpriseProfilePage'));
const MarketOpportunityPage = React.lazy(() => import('./MarketOpportunityPage'));
const TradeInsightPage = React.lazy(() => import('./TradeInsightPage'));
const AiSearchPage = React.lazy(() => import('./AiSearchPage'));

const routes: Record<string, { title: string; Page: React.ComponentType }> = {
  '/attribute-templates': { title: '属性模板', Page: AttributeTemplatePage },
  '/overview': { title: '概况', Page: OverviewPage },
  '/enterprise-profile': { title: '企业画像', Page: EnterpriseProfilePage },
  '/customer/market-opportunity': { title: '市场与机会', Page: MarketOpportunityPage },
  '/customer/trade-insight': { title: '外贸客户洞察', Page: TradeInsightPage },
  '/ai-search': { title: 'AI智能搜索', Page: AiSearchPage },
};
const route = routes[window.location.pathname.replace(/\/+$/, '')] ?? { title: '常见问题', Page: IndustryFaqPage };
document.title = `${route.title} · 行业知识使用场景`;
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><React.Suspense fallback={<div role="status">正在加载页面…</div>}><route.Page /></React.Suspense></React.StrictMode>);
