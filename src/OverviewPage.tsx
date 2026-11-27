import { useState } from 'react';
import { ArrowRight, FileQuestion, LayoutTemplate, ScanSearch, TrendingUp } from 'lucide-react';
import { OverviewShell } from '@/components/PortalShell';
import { Badge } from '@/components/ui/badge';
import { DIAGNOSIS_STEPS, matchStrategy, readStoredProfile, type EnterpriseProfileRecord } from '@/enterpriseProfile';

// ── 配置常量（静态映射，不进 meta.json）────────────────────
const PORTAL_STATUS_CONFIG = {
  running: { label: '运营中', className: 'overview-status-running' },
  building: { label: '建设中', className: 'overview-status-building' },
  expired: { label: '已到期', className: 'overview-status-expired' },
} as const;
type PortalStatus = keyof typeof PORTAL_STATUS_CONFIG;

interface PortalOverview { versionName: string; status: PortalStatus }

// ── 动态数据（DataSlot）──────────────────────────────────
const mockPortalOverviewData: PortalOverview = { versionName: '数字门户全球营销版', status: 'running' };

// 尚未填写企业画像时接口返回 status: 'empty'。原型用 localStorage 中已保存的画像覆盖它。
const mockEnterpriseProfileData: EnterpriseProfileRecord = { status: 'empty', answers: null, completedAt: null, fillCount: 0 };

// ── 交互句柄（ActionSlot）────────────────────────────────
// ACTION: 获取门户版本与运营状态 [GET] /api/industry-scenario/portal-overview
function handleFetchPortalOverview() {
  console.log('fetch portal overview');
}

// ACTION: 获取企业画像 [GET] /api/industry-scenario/enterprise-profile
function handleFetchEnterpriseProfile() {
  console.log('fetch enterprise profile');
}

const websiteEntries = [
  { href: '/', icon: FileQuestion, title: '常见问题', desc: 'AI 根据产品、荣誉资质、企业概况、客户案例生成 FAQ' },
  { href: '/attribute-templates/', icon: LayoutTemplate, title: '属性模板', desc: '从行业属性库选择产品属性与规格值' },
];

export default function OverviewPage() {
  const [overview] = useState<PortalOverview>(() => { handleFetchPortalOverview(); return mockPortalOverviewData; });
  const [profile] = useState<EnterpriseProfileRecord>(() => { handleFetchEnterpriseProfile(); return readStoredProfile() ?? mockEnterpriseProfileData; });
  const status = PORTAL_STATUS_CONFIG[overview.status];
  const answers = profile.status === 'completed' ? profile.answers : null;
  const strategy = answers ? matchStrategy(answers) : null;

  return <OverviewShell>
    <div className="overview-page">
      <header className="overview-heading">
        <h1>运营管理控制台</h1>
        <p>依据运营管理提示与引导，可帮助您入门到精通全球营销门户的运营管理的提升！</p>
      </header>

      <section className="overview-version" aria-label="版本信息">
        <div className="overview-version-item"><strong>版本</strong><span>{overview.versionName}</span></div>
        <div className="overview-version-divider" />
        <div className="overview-version-item"><span className="overview-version-icon"><TrendingUp size={15} /></span><strong>状态</strong><span className={`overview-status ${status.className}`}>{status.label}</span></div>
      </section>

      <a className={`profile-entry ${answers ? 'is-done' : ''}`} href="/enterprise-profile/">
        <span className="profile-entry-icon"><ScanSearch size={22} /></span>
        <span className="profile-entry-body">
          <span className="profile-entry-title">企业画像 <Badge className={answers ? 'profile-entry-badge-done' : 'profile-entry-badge-todo'}>{answers ? '已完成' : '待评测'}</Badge></span>
          {answers && strategy ? <>
            <span className="profile-entry-summary"><b>{answers.companyName}</b><i>·</i>{answers.industry}<i>·</i>方案 {strategy.planName}</span>
            <span className="profile-entry-metrics">
              <span>数字化 <b>{answers.digitalLevel}</b></span>
              <span>全球化 <b>{answers.globalLevel}</b></span>
              <span>信任评分 <b>{strategy.trustScore}</b> 分</span>
              <span>更新于 {profile.completedAt}</span>
            </span>
          </> : <>
            <span className="profile-entry-summary">{DIAGNOSIS_STEPS.length} 步评测：{DIAGNOSIS_STEPS.map(step => step.title).join(' · ')}</span>
            <span className="profile-entry-metrics"><span>完成后生成增长策略，并展示网站需要具备的「四个被」内容</span></span>
          </>}
        </span>
        {/* 整张卡片是链接，这里只做按钮外观，避免链接里嵌套 button */}
        <span className="ui-button ui-button-primary profile-entry-action" aria-hidden="true">{answers ? '查看画像' : '开始评测'}<ArrowRight size={14} /></span>
      </a>

      <section className="overview-card">
        <div className="overview-card-head"><h2>网站管理</h2><span>通过对网站运营管理，持续营销推广运营，为企业持续营销获客注入发展动力</span></div>
        <div className="overview-entry-grid">
          {websiteEntries.map(entry => <a key={entry.href} className="overview-entry" href={entry.href}>
            <entry.icon size={18} />
            <span><strong>{entry.title}</strong><small>{entry.desc}</small></span>
          </a>)}
        </div>
      </section>
    </div>
  </OverviewShell>;
}
