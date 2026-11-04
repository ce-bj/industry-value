import { useState, type KeyboardEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { IndustryPills } from '@/components/IndustryPills';
import { SiteIndustryDialog } from '@/components/SiteIndustryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import industryCatalog from './data/industry-catalog.json';
import { loadSiteIndustries, saveSiteIndustries, type IndustryCatalogItem, type SiteIndustry } from '@/siteIndustry';

const mockIndustryCatalogData: IndustryCatalogItem[] = industryCatalog;
const mockMainBusinessIndustries = ['冶金制品', '汽车制造行业', '机械设备制造', '建筑工程', '电子电气'];
const mockMainProductsData = ['钢水包', '中间包', '铁水包', '铁水称量车', '钢包车', '渣盘车(渣罐车)', '转炉炉壳', '轧钢备件'];

// ACTION: 获取行业库（一级 - 二级行业） [GET] /api/industries
function handleFetchIndustryCatalog() {
  console.log('fetch industry catalog');
}
// ACTION: 获取网站所属行业 [GET] /api/site/industries
function handleFetchSiteIndustries() {
  console.log('fetch site industries');
}
// ACTION: 保存网站所属行业 [PUT] /api/site/industries
function handleSaveSiteIndustries(payload: { industries: SiteIndustry[] }) {
  console.log('save site industries', payload);
}

export default function SiteInfoPage() {
  const [industries, setIndustries] = useState<SiteIndustry[]>(() => { handleFetchIndustryCatalog(); handleFetchSiteIndustries(); return loadSiteIndustries(); });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [products, setProducts] = useState<string[]>(mockMainProductsData);
  const [productDraft, setProductDraft] = useState('');

  const saveIndustries = (next: SiteIndustry[]) => {
    handleSaveSiteIndustries({ industries: next });
    saveSiteIndustries(next);
    setIndustries(next);
    setNotice('所属行业已保存，属性模板中的「选择行业属性模板」将按这些行业展示行业库。');
  };
  const clearIndustries = () => { handleSaveSiteIndustries({ industries: [] }); saveSiteIndustries([]); setIndustries([]); setNotice('已清除所属行业（演示用），属性模板将重新提示完善行业信息。'); };
  const addProduct = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const value = productDraft.trim();
    if (value && !products.includes(value)) setProducts(current => [...current, value]);
    setProductDraft('');
  };

  return <PortalShell section="site" pageTitle="网站信息"><div className="site-info-page">
    <h1>网站信息</h1>
    {notice && <div className="template-notice" role="status">{notice}</div>}
    <form className="site-info-form" onSubmit={event => event.preventDefault()}>
      <div className="site-info-row"><label htmlFor="site-company-name">公司名称：</label><div><Input id="site-company-name" placeholder="请输入公司名称" /></div></div>
      <div className="site-info-row"><label htmlFor="site-company-intro">公司介绍：</label><div><Textarea id="site-company-intro" rows={4} placeholder="请输入公司介绍" /></div></div>
      <div className="site-info-row" data-testid="site-industry-row">
        <span className="site-info-label"><b>*</b> 所属行业：</span>
        <div className="site-industry-field">
          <div className="site-industry-display">
            {industries.length ? <IndustryPills industries={industries} ariaLabel="所属行业" /> : <span className="site-industry-empty">尚未设置所属行业</span>}
            <Button size="small" variant={industries.length ? 'secondary' : 'primary'} onClick={() => setDialogOpen(true)}>{industries.length ? '修改行业' : '选择行业'}</Button>
            {industries.length > 0 && <button type="button" className="text-action site-industry-reset" onClick={clearIndustries}>清除（演示用）</button>}
          </div>
          <p className="site-info-hint">主行业必填，额外行业最多 2 个。行业库、属性模板等行业知识将按所属行业匹配。</p>
          <p className="site-info-hint site-info-warning">默认使用系统预留行业，主动更新后，一年至多调整一次。</p>
        </div>
      </div>
      <div className="site-info-row"><label htmlFor="site-main-industry"><b>*</b> 主营行业：</label><div className="site-info-select"><select id="site-main-industry" defaultValue="冶金制品">{mockMainBusinessIndustries.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div></div>
      <div className="site-info-row"><label htmlFor="site-business-model">经营模式：</label><div><Input id="site-business-model" placeholder="请输入经营模式" /></div></div>
      <div className="site-info-row"><span className="site-info-label"><b>*</b> 主营产品：</span><div className="site-info-tags">{products.map(item => <span key={item} className="site-info-tag">{item}<button type="button" aria-label={`移除${item}`} onClick={() => setProducts(current => current.filter(product => product !== item))}><X size={11} /></button></span>)}<input aria-label="输入主营产品后回车添加" placeholder="请输入主营产品" value={productDraft} onChange={event => setProductDraft(event.target.value)} onKeyDown={addProduct} /></div></div>
    </form>
    <SiteIndustryDialog open={dialogOpen} onOpenChange={setDialogOpen} catalog={mockIndustryCatalogData} value={industries} onSave={saveIndustries} />
  </div></PortalShell>;
}
