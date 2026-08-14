import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Settings, ExternalLink, History } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppVideoPlayer } from "@/components/apps/AppVideoSection";
import AddonsTab from "./AddonsTab";

// بطاقة تطبيق مطلوب — تطابق شكل AddonCard تماماً مع خلفية حمراء + تبويبة الإضافات
function RequirementCard({ app, installed, onInstallAddon, onUninstallAddon, onSetup, installedApps, allApps }) {
  const [pricingType, setPricingType] = useState('monthly');
  const [activeTab, setActiveTab] = useState(null);
  const isReady = app.is_ready === true;

  // إضافات هذا التطبيق المطلوب
  const subAddons = (allApps || []).filter(a => {
    if (!a.is_addon || !a.is_active) return false;
    if (a.parent_app_ids && a.parent_app_ids.length > 0) return a.parent_app_ids.includes(app.id);
    return a.parent_app_id === app.id;
  });

  const getSubAddonInstalled = (addonId) => (installedApps || []).find(ia => ia.app_id === addonId);

  return (
    <div className="bg-card border border-red-300 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-red-100">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          {app.icon_url ? <img src={app.icon_url} alt={app.name} className="w-7 h-7 object-contain" /> : <Package size={16} className="text-red-500" />}
        </div>
        <div className="flex-1 mx-2 text-right">
          <h3 className="text-sm font-bold text-foreground">{app.name}</h3>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0", isReady ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
          {isReady ? "جاهز" : "قريباً"}
        </span>
      </div>

      {/* Price */}
      <div className="px-3 py-2 border-b border-red-100">
        <div className="flex items-center justify-between">
          {!app.is_free && app.yearly_price > 0 &&
          <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
            <button onClick={() => setPricingType('monthly')} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all", pricingType === 'monthly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
            <button onClick={() => setPricingType('yearly')} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all", pricingType === 'yearly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
          </div>}
          <div className="text-sm font-bold text-primary">
            {app.is_free ? "مجاناً" : `${pricingType === 'yearly' ? app.yearly_price ?? 0 : app.monthly_price ?? 0} ${app.currency ?? ""}`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2">
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
          {['description', 'info', 'addons'].map((tab) =>
          <button key={tab} onClick={() => setActiveTab(activeTab === tab ? null : tab)} className={cn("flex-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all text-center", activeTab === tab ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab === 'description' ? 'الوصف' : tab === 'info' ? 'المعلومات' : (
              <span className="flex items-center justify-center gap-0.5">
                الإضافات
                {subAddons.length > 0 && (
                  <span className={cn("inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold",
                    activeTab === 'addons' ? "bg-white text-red-500" : "bg-violet-500 text-white")}>
                    {subAddons.length}
                  </span>
                )}
              </span>
            )}
          </button>)}
        </div>

        {activeTab === 'description' && (
          <div className="mt-2 space-y-2">
            <AppVideoPlayer videoUrl={app.video_url} videoType={app.video_type} />
            <p className="text-[10px] text-muted-foreground text-right leading-relaxed">{app.description || app.short_description || "لا توجد معلومات إضافية"}</p>
          </div>
        )}
        {activeTab === 'info' && (
          <div className="mt-2 text-[10px] text-muted-foreground text-right space-y-1.5">
            <div className="flex justify-between"><span>ID</span><span className="font-semibold text-foreground font-mono text-[9px]">{app.id}</span></div>
            {(app.categories || []).length > 0 && <div className="border-t border-border pt-1.5 flex justify-between"><span>التصنيفات</span><span className="font-semibold text-foreground">{(app.categories || []).join("، ")}</span></div>}
          </div>
        )}
        {activeTab === 'addons' && (
          <AddonsTab
            addons={subAddons}
            getAddonInstalled={getSubAddonInstalled}
            onInstallAddon={onInstallAddon}
            onUninstallAddon={onUninstallAddon}
            onSetup={onSetup}
          />
        )}
      </div>

      {/* Actions */}
      {activeTab !== 'addons' && (
        <div className="px-3 pb-3">
          {installed ? (
            <div className="flex gap-2">
              <button onClick={() => onUninstallAddon && onUninstallAddon(installed.id, app.name, app)} className="flex-1 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors">إلغاء التثبيت</button>
              {(app.integration_fields || []).length > 0 && onSetup && <button onClick={() => onSetup(app, installed)} className="flex items-center justify-center px-3 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors"><Settings size={15} /></button>}
            </div>
          ) : (
            <button onClick={() => onInstallAddon && onInstallAddon(app)} disabled={!isReady} className={cn("w-full text-xs px-3 py-2 rounded-lg font-semibold transition-all", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700")}>
              {!isReady ? "قريباً" : "تثبيت"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppCard({ app, index, installedApp, status, installMutation, handleTrialInstall, onInstall, onUninstall, onSetup, installPending, formatDate, expandedAppId, setExpandedAppId, allApps, installedApps, onInstallAddon, onUninstallAddon, onSetupAddon, getActualAppStatus, onShowSubscriptionHistory, buildInstallUrl }) {
  // استخدم useMemo لحساب الحالة الفعلية مرة واحدة فقط
  const actualStatus = useMemo(() => {
    return getActualAppStatus ? getActualAppStatus(app, installedApp) : status;
  }, [app.is_free, app.id, installedApp?.id, installedApp?.payment_status, status, getActualAppStatus]);
  
  const isInstalled = actualStatus !== 'not_installed' && actualStatus !== 'uninstalled';
  const isPendingPayment = actualStatus === 'pending_payment';
  const isTrial = actualStatus === 'trial';
  const isExpired = actualStatus === 'expired';
  const isReady = app.is_ready === true;
  const [pricingType, setPricingType] = useState('monthly');
  const [activeTab, setActiveTab] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // إذا كان للتطبيق أبناء إجباريون لا يدعمون التجربة المجانية → لا تعرض زر التجربة
  const requiredChildren = (app.related_apps || [])
    .filter(r => r.relation_type === "required_child")
    .map(r => (allApps || []).find(a => a.id === r.app_id))
    .filter(Boolean);
  const hasRequiredChildWithoutTrial = requiredChildren.some(c => !c.is_free && !c.has_trial);
  const canShowTrial = app.has_trial && !app.is_free && !hasRequiredChildWithoutTrial;

  const addons = (allApps || []).filter((a) => {
    if (!a.is_addon || !a.is_active) return false;
    if (a.parent_app_ids && a.parent_app_ids.length > 0) return a.parent_app_ids.includes(app.id);
    return a.parent_app_id === app.id;
  });
  const getAddonInstalled = (addonId) => (installedApps || []).find((ia) => ia.app_id === addonId);

  // هل هذا التطبيق ابن إجباري لأب ما؟
  const requiredParent = (allApps || []).find(a =>
    (a.related_apps || []).some(r => r.relation_type === "required_child" && r.app_id === app.id)
  );

  const hasRequirementsTab = requiredChildren.length > 0 || !!requiredParent;

  const toggleStatusMutation = useMutation({
    mutationFn: async (installedApp) => {
      // منع تفعيل التطبيق إذا كان بانتظار التحقق من التحويل البنكي
      if (installedApp.status === "pending_payment" || installedApp.payment_status === "unpaid") {
        throw new Error("لا يمكن تفعيل التطبيق قبل التحقق من التحويل البنكي");
      }
      const newStatus = installedApp.status === "active" ? "suspended" : "active";
      await base44.entities.InstalledApp.update(installedApp.id, { status: newStatus });
    },
    onSuccess: (_, installedApp) => {
      const newStatus = installedApp.status === "active" ? "suspended" : "active";
      toast({ title: "تم", description: newStatus === "active" ? "تم تفعيل التطبيق" : "تم إيقاف التطبيق مؤقتاً" });
      queryClient.invalidateQueries({ queryKey: ["installedApps"] });
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      
      <div className="p-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {app.icon_url ? <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain" /> : <Package size={20} className="text-primary" />}
          </div>
          <div className="flex-1 text-right">
            <h3 className="text-sm font-bold text-foreground mb-1">{app.name}</h3>
            {isInstalled && (
              <div>
                {isPendingPayment ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">⏳ بانتظار التحقق</span> :
                isTrial ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">🎁 فترة تجريبية</span> :
                isExpired ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">❌ منتهي</span> :
                installedApp?.status === 'suspended' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">⏸️ معطل</span> :
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">✓ نشط</span>}
              </div>
            )}
          </div>
          {actualStatus !== 'not_installed' && actualStatus !== 'uninstalled' &&
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPendingPayment ? (
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">بانتظار القبول</span>
            ) : (
              <button
                onClick={() => {
                  if (isExpired) {
                    toast({ title: "غير متاح", description: "يجب تجديد الاشتراك أولاً قبل تفعيل التطبيق", variant: "destructive" });
                    return;
                  }
                  toggleStatusMutation.mutate(installedApp);
                }}
                disabled={toggleStatusMutation.isPending || isExpired}
                className={cn("relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 cursor-pointer",
                  isExpired ? "bg-gray-300 opacity-50 cursor-not-allowed" : installedApp.status === "active" ? "bg-emerald-500" : "bg-gray-300"
                )}>
                <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-300",
                  installedApp.status === "active" ? "right-0.5" : "left-0.5")} />
              </button>
            )}
          </div>}
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          {!app.is_free && app.yearly_price > 0 &&
          <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
            <button onClick={() => setPricingType('monthly')} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === 'monthly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
            <button onClick={() => setPricingType('yearly')} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === 'yearly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
          </div>}
          <div className="text-left">
            <div className="text-base font-bold text-primary">{app.is_free ? "مجاناً" : `${pricingType === 'yearly' ? app.yearly_price : app.monthly_price} ${app.currency}`}</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <div className={cn("grid gap-1 bg-secondary/40 rounded-xl p-1", hasRequirementsTab ? "grid-cols-4" : "grid-cols-3")}>
          <button onClick={() => setActiveTab(activeTab === 'description' ? null : 'description')} className={cn("flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all text-center", activeTab === 'description' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>الوصف</button>
          <button onClick={() => setActiveTab(activeTab === 'info' ? null : 'info')} className={cn("flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all text-center", activeTab === 'info' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>المعلومات</button>
          <button onClick={() => setActiveTab(activeTab === 'addons' ? null : 'addons')} className={cn("flex-1 text-xs font-semibold px-1 py-1.5 rounded-lg transition-all text-center", activeTab === 'addons' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <span className="flex items-center justify-center gap-1.5">الإضافات {addons.length > 0 && <span className={cn("inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold", activeTab === 'addons' ? "bg-white text-primary" : "bg-violet-500 text-white")}>{addons.length}</span>}</span>
          </button>
          {hasRequirementsTab && (
            <button onClick={() => setActiveTab(activeTab === 'requirements' ? null : 'requirements')} className={cn("flex-1 text-xs font-semibold px-1 py-1.5 rounded-lg transition-all text-center", activeTab === 'requirements' ? "bg-red-500 text-white shadow-sm" : "text-red-600 hover:text-red-700 bg-red-50")}>
              <span className="flex items-center justify-center gap-1.5">
                متطلبات
                <span className={cn("inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold", activeTab === 'requirements' ? "bg-white text-red-500" : "bg-red-500 text-white")}>
                  {requiredChildren.length + (requiredParent ? 1 : 0)}
                </span>
              </span>
            </button>
          )}
        </div>

        {activeTab === 'description' && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2.5 space-y-2"><AppVideoPlayer videoUrl={app.video_url} videoType={app.video_type} /><p className="text-xs text-muted-foreground leading-relaxed text-justify">{app.description || "لا توجد معلومات إضافية"}</p></motion.div>}
        {activeTab === 'info' && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2.5 text-[10px] text-muted-foreground text-right space-y-2"><div className="flex justify-between"><span>ID</span><span className="font-semibold text-foreground font-mono">{app.id}</span></div><div className="border-t border-border pt-2 flex justify-between"><span>الإصدار</span><span className="font-semibold text-foreground">{app.version || "1.0.0"}</span></div>{(app.categories || []).length > 0 && <div className="border-t border-border pt-2 flex justify-between"><span>التصنيفات</span><span className="font-semibold text-foreground">{(app.categories || []).join("، ")}</span></div>}</motion.div>}
        {activeTab === 'addons' && <AddonsTab addons={addons} getAddonInstalled={getAddonInstalled} onInstallAddon={onInstallAddon} onUninstallAddon={onUninstallAddon} onSetup={onSetupAddon} />}
        {activeTab === 'requirements' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2.5 space-y-2">
            {requiredChildren.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-2 space-y-2">
                <p className="text-[10px] font-bold text-red-700">⚠️ هذا التطبيق لا يعمل بدون:</p>
                {requiredChildren.map(child => {
                  const childInstalled = (installedApps || []).find(ia => ia.app_id === child.id && ia.status !== 'uninstalled');
                  return <RequirementCard key={child.id} app={child} installed={childInstalled} onInstallAddon={onInstallAddon} onUninstallAddon={onUninstallAddon} onSetup={onSetupAddon} installedApps={installedApps} allApps={allApps} />;
                })}
              </div>
            )}
            {requiredParent && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-2 space-y-2">
                <p className="text-[10px] font-bold text-red-700">🔗 هذا التطبيق ابن إجباري لـ:</p>
                <RequirementCard
                  app={requiredParent}
                  installed={(installedApps||[]).find(ia=>ia.app_id===requiredParent.id&&ia.status!=='uninstalled')}
                  onInstallAddon={onInstallAddon}
                  onUninstallAddon={onUninstallAddon}
                  onSetup={onSetupAddon}
                  installedApps={installedApps}
                  allApps={allApps}
                />
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {(isInstalled || actualStatus === 'uninstalled') && activeTab !== 'addons' &&
        <div className="flex gap-2 flex-col">
          {/* حالة بانتظار التحقق من التحويل البنكي */}
          {isPendingPayment ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-base">⏳</span>
                <div className="flex-1 text-right">
                  <p className="text-[11px] font-bold text-amber-800">بانتظار التحقق من التحويل</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    يمكنك متابعة تفاصيل الطلب من{' '}
                    <a href="/subscriptions" className="underline font-bold hover:text-amber-800">سجل اشتراكاتي</a>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (window.confirm(`هل تريد إلغاء طلب اشتراك "${app.name}"؟`)) onUninstall(); }}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border text-red-500 hover:bg-red-50 border-red-200"
              >
                إلغاء الطلب
              </button>
            </div>
          ) :
          /* حالة ألغى التثبيت مع اشتراك نشط */
          installedApp?.status === 'uninstalled' ? (
            <div className="flex gap-2">
              <button
                onClick={onInstall}
                disabled={installPending}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                🔄 إعادة التثبيت
              </button>
              <div
                className="flex items-center justify-center px-2 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-600 cursor-default"
                title={`تم إلغاء التثبيت — اشتراكك لا يزال نشطاً حتى ${installedApp.subscription_ends_at || "نهاية الفترة"}`}
              >
                <span className="text-sm">⚠️</span>
              </div>
              {isInstalled && <button onClick={() => onShowSubscriptionHistory?.(app.id)} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors border text-blue-600 hover:bg-blue-50 border-blue-200"><History size={14} /></button>}
            </div>
          ) : (
          <div className="flex gap-2">
            {isExpired && !app.is_free &&
            <button onClick={() => {const billing = pricingType; const price = billing === 'yearly' ? app.yearly_price : app.monthly_price; navigate(`/payment/checkout?${new URLSearchParams({ appId: app.id, appName: app.name, billing, price, renew: true })}`);}} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-buttonColor text-white hover:opacity-90 transition-colors">🔄 تجديد الاشتراك</button>}
            {app.app_type === 'ui' && app.route && installedApp?.status === 'active' && <Link to={app.route} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:opacity-90 transition-opacity"><ExternalLink size={13} />فتح</Link>}
            {/* زر إلغاء التثبيت - ثانوي صغير */}
            <button
              onClick={() => {
                const deleteData = app.delete_data_on_uninstall === true;
                const msg = deleteData
                  ? `⚠️ تحذير: سيتم حذف جميع بيانات "${app.name}" نهائياً ولا يمكن التراجع.\n\nهل أنت متأكد؟`
                  : `هل تريد إلغاء تثبيت "${app.name}"؟\n\nستبقى بياناتك محفوظة ويمكنك إعادة التثبيت لاحقاً.`;
                if (window.confirm(msg)) onUninstall();
              }}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors border text-red-500 hover:bg-red-50 border-red-200"
              title="إلغاء التثبيت"
            >
              إلغاء التثبيت
            </button>
            {((app.integration_fields || []).length > 0 || app.settings_page) && <button onClick={() => { if (isExpired) { toast({ title: "غير متاح", description: "يجب تجديد الاشتراك أولاً قبل استخدام الإعدادات", variant: "destructive" }); return; } onSetup(); }} disabled={isExpired} className={cn("flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors border", isExpired ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "text-primary hover:bg-primary/10 border-primary/20")}><Settings size={14} /></button>}
            {isInstalled && <button onClick={() => onShowSubscriptionHistory?.(app.id)} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors border text-blue-600 hover:bg-blue-50 border-blue-200"><History size={14} /></button>}
          </div>
          )}
        </div>}


        {!isInstalled && actualStatus !== 'uninstalled' &&
        <>
          {canShowTrial && <div className="flex gap-2"><button onClick={() => handleTrialInstall(app)} disabled={installMutation.isPending || !isReady} className={cn("flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all border-2", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white text-primary border-primary hover:bg-primary/5 disabled:opacity-50")}>🎁 تجربة مجانية {app.trial_days} أيام</button><button onClick={() => { if (buildInstallUrl) { navigate(buildInstallUrl(app, pricingType)); } else { const billing = pricingType; const price = billing === 'yearly' ? app.yearly_price : app.monthly_price; navigate(`/payment/checkout?${new URLSearchParams({ appId: app.id, appName: app.name, billing, price })}`); } }} disabled={installPending || !isReady} className={cn("flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white hover:opacity-90 disabled:opacity-50")}>اشترك - {pricingType === 'yearly' ? app.yearly_price : app.monthly_price} {app.currency}</button></div>}
          {(!app.has_trial || !canShowTrial) && !app.is_free && <button onClick={() => { if (buildInstallUrl) { navigate(buildInstallUrl(app, pricingType)); } else { const billing = pricingType; const price = billing === 'yearly' ? app.yearly_price : app.monthly_price; navigate(`/payment/checkout?${new URLSearchParams({ appId: app.id, appName: app.name, billing, price })}`); } }} disabled={installPending || !isReady} className={cn("w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white hover:opacity-90 disabled:opacity-50")}>اشترك الآن - {pricingType === 'yearly' ? app.yearly_price : app.monthly_price} {app.currency}</button>}
          {app.is_free && <button onClick={onInstall} disabled={installPending || !isReady} className={cn("w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white hover:opacity-90 disabled:opacity-50")}>تثبيت الآن</button>}
        </>}
      </div>
    </motion.div>
  );
}