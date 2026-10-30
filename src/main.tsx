import React from 'react';
import ReactDOM from 'react-dom/client';
import IndustryFaqPage from './IndustryFaqPage';
import './styles.css';
import './faq-generator.css';
import './attribute-template.css';

const AttributeTemplatePage = React.lazy(() => import('./AttributeTemplatePage'));

const isAttributePage = window.location.pathname.replace(/\/+$/, '') === '/attribute-templates';
document.title = isAttributePage ? '属性模板 · 行业知识使用场景' : '常见问题 · 行业知识使用场景';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><React.Suspense fallback={<div role="status">正在加载页面…</div>}>{isAttributePage ? <AttributeTemplatePage /> : <IndustryFaqPage />}</React.Suspense></React.StrictMode>);
