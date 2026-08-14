import { motion } from "framer-motion";
import { Check, Filter } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PlanComparisonTable from "./PlanComparisonTable";
import PayPerUseApps from "./PayPerUseApps";

export default function PricingSection({ publicData = {}, selectedCurrency }) {
  const [billingMap, setBillingMap] = useState({});
  const [activeTab, setActiveTab] = useState("plans");
  const [expandedAppsId, setExpandedAppsId] = useState(null);
  const [appSearchMap, setAppSearchMap] = useState({});
  const [appCategoryFilterMap, setAppCategoryFilterMap] = useState({});
  const [filterOpenMap, setFilterOpenMap] = useState({});

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['appCategoriesPublic'],
    queryFn: () => base44.entities.AppCategory.list()
  });

  const { data: dbApps = [] } = useQuery({
    queryKey: ['appsPublic'],
    queryFn: () => base44.entities.App.list()
  });

  const apps = dbApps.length > 0 ? dbApps : (publicData?.apps || []);

  const defaultCurrency = selectedCurrency || {
    decimal_places: 2,
    thousands_separator: ',',
    decimal_separator: '.',
    symbol_position: 'right',
    symbol_space: false,
    symbol: 'ر.س',
    exchange_rate: 1
  };

  // الأسعار مخزنة بالعملة الافتراضية (exchange_rate=1 أو العملة الأساسية)
  // نحوّلها للعملة المختارة بقسمة على معدل العملة الأساسية ثم الضرب في معدل العملة المختارة
  const baseCurrencies = useMemo(() => publicData?.currencies || [], [publicData]);
  const baseCurrency = useMemo(
    () => baseCurrencies.find(c => c.is_default) || baseCurrencies.find(c => c.code === 'SAR') || { exchange_rate: 1 },
    [baseCurrencies]
  );

  const convertPrice = (price) => {
    if (price === undefined || price === null) return price;
    const baseRate = baseCurrency.exchange_rate || 1;
    const targetRate = defaultCurrency.exchange_rate || 1;
    return (Number(price) / baseRate) * targetRate;
  };

  const formatNumber = (price) => {
    if (price === undefined || price === null) return '';
    const currency = defaultCurrency;
    const converted = convertPrice(price);
    const parts = Number(converted).toFixed(currency.decimal_places ?? 2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    const thousands = currency.thousands_separator ?? ',';
    if (thousands) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    }
    const decimal = currency.decimal_separator ?? '.';
    return decimalPart ? `${integerPart}${decimal}${decimalPart}` : integerPart;
  };

  const renderPrice = (price, className = "text-4xl font-bold text-foreground") => {
    const currency = defaultCurrency;
    const sym = currency.symbol || '';
    const space = currency.symbol_space ? ' ' : '';
    const num = formatNumber(price);
    // دائماً: الرمز على اليسار والرقم على اليمين منه بصرياً
    // نستخدم flexbox مع dir="ltr" لضمان الترتيب البصري الصحيح
    if (currency.symbol_position === 'left') {
      return (
        <span style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'baseline', gap: space ? '4px' : '0', direction: 'ltr', unicodeBidi: 'isolate'}}>
          <span>{sym}</span>
          <span className={className}>{num}</span>
        </span>
      );
    } else {
      return (
        <span style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'baseline', gap: space ? '4px' : '0', direction: 'ltr', unicodeBidi: 'isolate'}}>
          <span className={className}>{num}</span>
          <span>{sym}</span>
        </span>
      );
    }
  };

  const formatPrice = (price) => {
    const currency = defaultCurrency;
    const sym = currency.symbol || '';
    const space = currency.symbol_space ? ' ' : '';
    const num = formatNumber(price);
    if (currency.symbol_position === 'left') return `${sym}${space}${num}`;
    return `${num}${space}${sym}`;
  };

  const mode = publicData?.subscription_mode || "plans_only";
  const showBothModes = mode === "both";
  const showPlansOnly = mode === "plans_only" || mode === "both";
  const showAppsOnly = mode === "pay_per_use_only" || mode === "both";

  const activePlans = (publicData.plans || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((plan) => ({ ...plan, popular: !!plan.is_popular }));

  const features = publicData.features || [];

  const getBilling = (planId) => billingMap[planId] || "monthly";
  const setBilling = (planId, val) => setBillingMap(prev => ({ ...prev, [planId]: val }));

  const getPrice = (plan) => getBilling(plan.id) === "monthly" ? plan.monthly_price : plan.yearly_price;

  const getPlanSaving = (plan) => {
    if (!plan.monthly_price || !plan.yearly_price) return null;
    const percent = Math.round((1 - plan.yearly_price / (plan.monthly_price * 12)) * 100);
    return percent > 0 ? percent : null;
  };

  const colorMap = {
    slate: { border: '#cbd5e1', badge: '#f1e8e8', text: '#475569', bg: '#f8fafc' },
    blue: { border: '#60a5fa', badge: '#dbeafe', text: '#1e40af', bg: '#f0f9ff' },
    purple: { border: '#d946ef', badge: '#f3e8ff', text: '#a21caf', bg: '#faf5ff' },
    indigo: { border: '#818cf8', badge: '#e0e7ff', text: '#3730a3', bg: '#f0f4ff' },
  };

  const getPlanColors = (plan) => {
    if (plan.custom_color) {
      return {
        border: plan.custom_color,
        badge: `${plan.custom_color}20`,
        text: plan.custom_color,
        bg: `${plan.custom_color}08`,
      };
    }
    return colorMap[plan.color] || colorMap.blue;
  };

  const handleStart = (app) => {
    base44.auth.redirectToLogin(`/app-store`);
  };

  const handleChoosePlan = (plan) => {
    const billing = getBilling(plan.id);
    const params = new URLSearchParams({ planId: plan.id, billing });
    base44.auth.redirectToLogin(`/payment/checkout?${params}`);
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-screen-2xl mx-auto px-2">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">الباقات والأسعار</h2>
          <p className="text-muted-foreground mb-6">اختر الباقة التي تناسب احتياجاتك</p>
        </motion.div>

        {/* Tabs for Both Modes */}
        {showBothModes && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-secondary rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  activeTab === "plans"
                    ? "bg-card shadow-md text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📦 الباقات
              </button>
              <button
                onClick={() => setActiveTab("apps")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  activeTab === "apps"
                    ? "bg-card shadow-md text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⏱️ الاشتراك حسب الاستخدام
              </button>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {showPlansOnly && (showBothModes ? activeTab === "plans" : true) ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {activePlans.map((plan, index) => (
            <div key={index} className="flex flex-col">
              <div className="h-8 flex justify-center items-center mb-1">
                {plan.popular && (
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow">
                    {plan.popular_label || "الأكثر شيوعاً"}
                  </span>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-xl p-5 border-2 transition-all flex flex-col flex-1"
                style={plan.popular ? {
                  backgroundColor: getPlanColors(plan).bg,
                  borderColor: getPlanColors(plan).border,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                } : {
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)'
                }}>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  {!plan.is_free && plan.yearly_price > 0 && (
                    <div className="inline-flex items-center bg-secondary rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setBilling(plan.id, "monthly")}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          getBilling(plan.id) === "monthly" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        شهري
                      </button>
                      <button
                        onClick={() => setBilling(plan.id, "yearly")}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                          getBilling(plan.id) === "yearly" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        سنوي
                        {getPlanSaving(plan) && (
                          <span className="text-[9px] px-1 py-0.5 rounded-full" style={{
                            backgroundColor: getPlanColors(plan).badge,
                            color: getPlanColors(plan).text
                          }}>
                            وفّر {getPlanSaving(plan)}%
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  {plan.is_free ? (
                    <span className="text-4xl font-bold text-green-500">مجاني</span>
                  ) : (
                    <div className="flex flex-row-reverse items-baseline gap-2 flex-wrap justify-end">
                      <span className="text-muted-foreground">/ {getBilling(plan.id) === "monthly" ? "شهري" : "سنوي"}</span>
                      {renderPrice(getPrice(plan) || 0, "text-4xl font-bold text-foreground")}
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>عدد المستخدمين</span>
                        <span className="font-semibold text-foreground">{plan.max_users > 0 ? plan.max_users : 'غير محدود'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>عدد مساحات العمل</span>
                        <span className="font-semibold text-foreground">{plan.max_workspaces > 0 ? plan.max_workspaces : 'غير محدود'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>مساحة التخزين</span>
                        <span className="font-semibold text-foreground">{plan.max_storage > 0 ? `${plan.max_storage} GB` : 'غير محدودة'}</span>
                      </div>
                    </div>
                  </div>

                  {(plan.features || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">الميزات:</p>
                      <div className="space-y-2">
                        {(plan.features || []).map((feature, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Check size={16} className="text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-current/10 pt-3 mt-3">
                    {expandedAppsId === plan.id ? (
                      <>
                        <button
                          onClick={() => setExpandedAppsId(null)}
                          className="w-full text-xs font-semibold bg-primary/15 hover:bg-primary/20 transition-all text-right px-4 py-3 rounded-lg mb-3 flex items-center justify-between border border-primary/20"
                        >
                          <span className="font-bold text-foreground">التطبيقات المضمنة ({plan.included_apps?.length || 0})</span>
                          <span className="text-primary">إغلاق التطبيقات ▲</span>
                        </button>

                        {plan.included_apps && plan.included_apps.length > 0 && (
                          <>
                            {/* Search and Filter */}
                            <div className="space-y-2 mb-3 pb-3 border-b border-border">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="ابحث عن تطبيق..."
                                  value={appSearchMap[plan.id] || ''}
                                  onChange={(e) => setAppSearchMap(prev => ({ ...prev, [plan.id]: e.target.value }))}
                                  className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button 
                                  onClick={() => setFilterOpenMap(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                                  className="p-2 rounded-lg transition-colors bg-primary/15 hover:bg-primary/25"
                                  title="التصنيفات"
                                >
                                  <Filter size={16} className="text-primary" />
                                </button>
                              </div>
                              {filterOpenMap[plan.id] && (
                                <select
                                  value={appCategoryFilterMap[plan.id] || 'all'}
                                  onChange={(e) => setAppCategoryFilterMap(prev => ({ ...prev, [plan.id]: e.target.value }))}
                                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  <option value="all">جميع التصنيفات</option>
                                  {(() => {
                                    const categories = new Set();
                                    plan.included_apps?.forEach(appId => {
                                      const app = apps.find(a => a.id === appId || a.name === appId);
                                      if (app?.categories && Array.isArray(app.categories)) {
                                        app.categories.forEach(cat => categories.add(cat));
                                      }
                                    });
                                    return Array.from(categories).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ));
                                  })()}
                                </select>
                              )}
                            </div>

                            <div className="space-y-2">
                              {plan.included_apps
                                .map((appIdOrName) => {
                                  let app = apps.find(a => a.id === appIdOrName);
                                  if (!app) {
                                    app = apps.find(a => a.name === appIdOrName);
                                  }
                                  return app;
                                })
                                .filter(app => {
                                  if (!app) return false;
                                  const searchTerm = (appSearchMap[plan.id] || '').toLowerCase();
                                  const categoryFilter = appCategoryFilterMap[plan.id];
                                  const matchesSearch = app.name.toLowerCase().includes(searchTerm);
                                  const matchesCategory = !categoryFilter || categoryFilter === 'all' || app.categories?.includes(categoryFilter);
                                  return matchesSearch && matchesCategory;
                                })
                                .map((app, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded">
                                    {app.icon_url && <img src={app.icon_url} alt="" className="w-4 h-4 rounded flex-shrink-0" />}
                                    <span className="text-primary font-bold">✓</span>
                                    <span className="text-foreground">{app.name}</span>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}

                        {(!plan.included_apps || plan.included_apps.length === 0) && (
                          <div className="text-xs text-muted-foreground text-center py-4">لا توجد تطبيقات مضمنة في هذه الباقة</div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => setExpandedAppsId(plan.id)}
                          className="w-full text-xs font-semibold bg-primary/8 hover:bg-primary/15 transition-all text-right px-4 py-3 rounded-lg flex items-center justify-between border border-primary/20"
                        >
                          <span className="font-bold text-foreground">التطبيقات المضمنة ({plan.included_apps?.length || 0})</span>
                          <span className="text-primary">عرض التطبيقات ▼</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => handleChoosePlan(plan)}
                    className="w-full py-2.5 rounded-lg font-semibold mb-3 transition-all bg-primary text-primary-foreground hover:opacity-90">
                    {plan.is_free ? "ابدأ مجاناً" : "اختر الباقة"}
                  </button>
                  {plan.has_trial && plan.trial_days > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      🎁 تجربة مجانية {plan.trial_days} يوم — بدون بطاقة ائتمان
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          ))}
          </div>
        ) : null}

        {/* Apps Tab - Pay Per Use */}
        {showAppsOnly && (showBothModes ? activeTab === "apps" : true) && (
          <div className="mt-4">
            <PayPerUseApps apps={apps.filter(a => !a.is_addon)} dbCategories={dbCategories} renderPrice={renderPrice} handleStart={handleStart} allApps={apps} />
          </div>
        )}

        {/* جدول المقارنة */}
        {showPlansOnly && (showBothModes ? activeTab === "plans" : true) && (
          <PlanComparisonTable
            plans={activePlans}
            features={features}
            defaultCurrency={selectedCurrency}
            getBilling={getBilling}
            convertPrice={convertPrice}
          />
        )}
      </div>
    </section>
  );
}