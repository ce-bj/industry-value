import React from 'react';
import ReactDOM from 'react-dom/client';
import IndustryFaqPage from './IndustryFaqPage';
import AttributeTemplatePage from './AttributeTemplatePage';
import './styles.css';
import './faq-generator.css';
import './attribute-template.css';

const isAttributePage = window.location.pathname.replace(/\/+$/, '') === '/attribute-templates';
document.title = isAttributePage ? '属性模板 · 行业知识使用场景' : '常见问题 · 行业知识使用场景';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{isAttributePage ? <AttributeTemplatePage /> : <IndustryFaqPage />}</React.StrictMode>);
