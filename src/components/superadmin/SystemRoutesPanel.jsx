import { useState, useMemo } from "react";
import { Search, Copy, Check, ChevronRight, X, Link2, BarChart3, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// جميع روابط النظام — قائمة مسطّحة
const ALL_ROUTES = [
  { path: "/", label: "الصفحة الرئيسية", access: "مشترك" },
  { path: "/workspaces", label: "مساحات العمل", access: "مشترك" },
  { path: "/app-store", label: "متجر التطبيقات", access: "مشترك" },
  { path: "/subscriptions", label: "الاشتراكات", access: "مشترك" },
  { path: "/settings/general", label: "الإعدادات العامة", access: "مشترك" },
  { path: "/settings/notifications", label: "إعدادات الإشعارات", access: "مشترك" },
  { path: "/settings/sms", label: "إعدادات الرسائل", access: "مشترك" },
  { path: "/settings/email", label: "إعدادات البريد", access: "مشترك" },
  { path: "/settings/payment", label: "إعدادات الدفع", access: "مشترك" },
  { path: "/settings/shipping", label: "إعدادات الشحن", access: "مشترك" },
  { path: "/settings/languages", label: "إعدادات اللغات", access: "مشترك" },
  { path: "/settings/currencies", label: "إعدادات العملات", access: "مشترك" },
  { path: "/settings/locations", label: "إعدادات المواقع", access: "مشترك" },
  { path: "/settings/required-fields", label: "الحقول المطلوبة", access: "مشترك" },
  { path: "/settings/form-designer", label: "مصمم النماذج", access: "مشترك" },
  { path: "/settings/archive", label: "إعدادات الأرشيف", access: "مشترك" },
  { path: "/settings/users", label: "المستخدمين والصلاحيات", access: "مشترك" },
  { path: "/settings/backup", label: "النسخ الاحتياطي", access: "مشترك" },
  { path: "/financial", label: "لوحة الموافقات المالية", access: "مشترك" },
  { path: "/financial/requests", label: "الطلبات المالية", access: "مشترك" },
  { path: "/financial/requests/new", label: "طلب مالي جديد", access: "مشترك" },
  { path: "/financial/requests/:id", label: "تفاصيل الطلب المالي", access: "مشترك" },
  { path: "/financial/settings", label: "إعدادات الموافقات المالية", access: "مشترك" },
  { path: "/clients/support", label: "تذاكر دعم العملاء", access: "سوبر أدمن" },
  { path: "/partners", label: "الشركاء", access: "سوبر أدمن" },
  { path: "/partners/support", label: "تذاكر دعم الشركاء", access: "سوبر أدمن" },
  { path: "/marketing", label: "التسويق", access: "سوبر أدمن" },
  { path: "/marketing/coupons", label: "قسائم التخفيض", access: "سوبر أدمن" },
  { path: "/marketing/offers", label: "العروض", access: "سوبر أدمن" },
  { path: "/app-manager", label: "مدير التطبيقات", access: "سوبر أدمن" },
  { path: "/plan-form", label: "نموذج الباقة", access: "سوبر أدمن" },
  { path: "/app-categories", label: "تصنيفات التطبيقات", access: "سوبر أدمن" },
  { path: "/plan-features", label: "مميزات الباقات", access: "سوبر أدمن" },
  { path: "/app-form", label: "نموذج التطبيق", access: "سوبر أدمن" },
  { path: "/platform-clients", label: "عملاء المنصة", access: "سوبر أدمن" },
  { path: "/settings/messaging", label: "إعدادات المراسلة", access: "سوبر أدمن" },
  { path: "/settings/tabby", label: "إعدادات Tabby", access: "سوبر أدمن" },
  { path: "/settings/tamara", label: "إعدادات Tamara", access: "سوبر أدمن" },
  { path: "/settings/subscription-mode", label: "نمط الاشتراك", access: "سوبر أدمن" },
  { path: "/settings/sidebar-designer", label: "مصمم القائمة الجانبية", access: "سوبر أدمن" },
  { path: "/settings/oursms", label: "إعدادات OurSMS", access: "سوبر أدمن" },
  { path: "/partner", label: "لوحة الشريك", access: "شريك" },
  { path: "/partner/clients", label: "عملاء الشريك", access: "شريك" },
  { path: "/partner/reports", label: "تقارير الشريك", access: "شريك" },
  { path: "/", label: "نظرة عامة", access: "عميل" },
  { path: "/workspaces", label: "مساحات العمل", access: "عميل" },
  { path: "/app-store", label: "متجر التطبيقات", access: "عميل" },
  { path: "/subscriptions", label: "الاشتراكات", access: "عميل" },
];

const CATEGORY_TABS = [
  { id: "all", label: "الكل", color: "bg-primary text-white" },
  { id: "shared", label: "المشتركة", access: "مشترك", color: "bg-blue-600 text-white" },
  { id: "admin", label: "السوبر أدمن", access: "سوبر أدمن", color: "bg-purple-600 text-white" },
  { id: "partner", label: "الشركاء", access: "شريك", color: "bg-orange-600 text-white" },
  { id: "client", label: "العملاء", access: "عميل", color: "bg-emerald-600 text-white" },
  { id: "apps", label: "روابط التطبيقات", color: "bg-amber-600 text-white" },
];

// بناء SYSTEM_ROUTES للتوافق مع extractUsageFromConfig
const SYSTEM_ROUTES = [
  { category: "الكل", routes: ALL_ROUTES },
];

const PANEL_LABELS = { super_admin: "السوبر أدمن", client: "العملاء", partner: "الشركاء" };
const TAB_LABELS = { home: "الرئيسية", archive: "الأرشيف", settings: "الإعدادات" };

// استخراج كل المسارات المستخدمة من config القائمة الجانبية
function extractUsageFromConfig(config) {
  const usage = {}; // path -> [{ panel, tab, label, parentLabel? }]

  const processItem = (item, panelId, tabId, parentLabel = null) => {
    // نتعامل مع "internal" و "app" — كلاهما له مسار أو appId يمكن تتبعه
    const itemPath = item.path || item.appId || null;
    if ((item.type === "internal" || item.type === "app") && itemPath) {
      const key = itemPath;
      if (!usage[key]) usage[key] = [];
      usage[key].push({
        panel: PANEL_LABELS[panelId] || panelId,
        tab: TAB_LABELS[tabId] || tabId,
        panelId,
        tabId,
        label: item.label,
        parentLabel,
      });
    }
    (item.children || []).forEach(child => processItem(child, panelId, tabId, item.label));
  };

  if (!config) return usage;

  for (const panelId of Object.keys(config)) {
    const panelData = config[panelId];
    if (!panelData || typeof panelData !== "object") continue;
    for (const tabId of Object.keys(panelData)) {
      const items = panelData[tabId];
      if (!Array.isArray(items)) continue;
      items.forEach(item => processItem(item, panelId, tabId));
    }
  }
  return usage;
}

export default function SystemRoutesPanel({ open, onClose, onNavigateToUsage }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [copiedPath, setCopiedPath] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all | used | unused
  const [expandedUsage, setExpandedUsage] = useState({});

  // جلب التطبيقات لتبويب "روابط التطبيقات"
  const { data: apps = [] } = useQuery({
    queryKey: ["apps-for-routes-panel"],
    queryFn: () => base44.entities.App.filter({ is_active: true }),
    enabled: open,
    staleTime: 60000,
  });

  // جلب إعدادات القائمة الجانبية لاستخراج إحصائيات الاستخدام
  const { data: sidebarConfig } = useQuery({
    queryKey: ["sidebarDesignerConfig-panel"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
      if (settings && settings.length > 0 && settings[0].sidebar_items_json) {
        try { return JSON.parse(settings[0].sidebar_items_json); } catch { return null; }
      }
      return null;
    },
    enabled: open,
    staleTime: 30000,
  });

  const usageMap = useMemo(() => extractUsageFromConfig(sidebarConfig), [sidebarConfig]);

  // بناء روابط التطبيقات ديناميكياً - يجب أن يكون قبل أي early return
  // كل تطبيق له مفتاحان محتملان في usageMap: app.route (مثل /financial) أو app.id (مثل 6a11b7...)
  const appRoutes = useMemo(() => apps.map(app => ({
    path: app.route || null,       // المسار الفعلي للتطبيق في الـ router (قد يكون null)
    appId: app.id,                 // معرّف التطبيق (يُستخدم كـ key في usageMap عند type:app)
    label: app.name,
    access: "تطبيق",
    iconUrl: app.icon_url,
    category: app.primary_category || "عام",
    appType: app.app_type,
  })), [apps]);

  if (!open) return null;

  const handleNavigateToUsage = (usage) => {
    // استدعاء callback مباشر لتغيير اللوحة والتبويب في SidebarDesigner
    if (onNavigateToUsage) {
      onNavigateToUsage({ panelId: usage.panelId, tabId: usage.tabId, itemLabel: usage.label });
    }
    onClose();
  };

  const handleCopy = (path) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    toast({ title: "تم النسخ", description: `تم نسخ "${path}" — الصقه في حقل المسار` });
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const q = search.trim().toLowerCase();

  const isAppsTab = activeTab === "apps";

  // دالة مساعدة: جلب قائمة الاستخدام لتطبيق (يبحث بـ route أولاً ثم appId)
  const getAppUsageList = (route) => {
    const byPath = route.path ? (usageMap[route.path] || []) : [];
    const byId = usageMap[route.appId] || [];
    // دمج بدون تكرار
    const combined = [...byPath];
    byId.forEach(u => { if (!combined.some(x => x.label === u.label && x.panelId === u.panelId)) combined.push(u); });
    return combined;
  };

  // فلترة الروابط
  const filteredRoutes = isAppsTab
    ? appRoutes.filter(r => {
        const matchSearch = !q || r.label.includes(q) || r.path?.toLowerCase().includes(q) || r.category?.includes(q);
        const usageCount = getAppUsageList(r).length;
        const matchStatus = statusFilter === "all" || (statusFilter === "used" && usageCount > 0) || (statusFilter === "unused" && usageCount === 0);
        return matchSearch && matchStatus;
      })
    : ALL_ROUTES.filter(r => {
        const matchSearch = !q || r.label.includes(q) || r.path.toLowerCase().includes(q);
        const matchTab = activeTab === "all" ||
          (activeTab === "shared" && r.access === "مشترك") ||
          (activeTab === "admin" && r.access === "سوبر أدمن") ||
          (activeTab === "partner" && r.access === "شريك") ||
          (activeTab === "client" && r.access === "عميل");
        const isUsed = (usageMap[r.path] || []).length > 0;
        const matchStatus = statusFilter === "all" || (statusFilter === "used" && isUsed) || (statusFilter === "unused" && !isUsed);
        return matchSearch && matchTab && matchStatus;
      });

  const totalRoutes = filteredRoutes.length;
  const totalUsed = Object.keys(usageMap).length;

  // حساب عدد الروابط لكل تبويب
  const tabCounts = {
    all: ALL_ROUTES.length,
    shared: ALL_ROUTES.filter(r => r.access === "مشترك").length,
    admin: ALL_ROUTES.filter(r => r.access === "سوبر أدمن").length,
    partner: ALL_ROUTES.filter(r => r.access === "شريك").length,
    client: ALL_ROUTES.filter(r => r.access === "عميل").length,
    apps: appRoutes.length,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        className="fixed left-0 top-0 h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-left"
        style={{ width: '40vw' }}
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">روابط النظام</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{totalRoutes} رابط</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-2 border-b border-border bg-indigo-50 flex-shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={13} className="text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">
              مُستخدم في القائمة: <span className="font-bold">{totalUsed}</span> مسار
            </span>
          </div>
          <div className="h-3 w-px bg-indigo-200" />
          <span className="text-xs text-indigo-600">
            غير مُستخدم: <span className="font-bold">{ALL_ROUTES.length - Object.keys(usageMap).filter(p => ALL_ROUTES.some(r => r.path === p)).length}</span>
          </span>
        </div>

        {/* Category Tabs */}
        <div className="px-3 py-2 border-b border-border bg-secondary/30 flex-shrink-0 flex gap-1.5 overflow-x-auto">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0",
                activeTab === tab.id
                  ? tab.color
                  : "bg-white border border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                activeTab === tab.id ? "bg-white/30" : "bg-secondary text-muted-foreground"
              )}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Status Filter */}
        <div className="px-4 py-2.5 border-b border-border flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو المسار..."
              className="flex-1 bg-transparent text-sm outline-none text-right"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold">الحالة:</span>
            <div className="flex gap-1">
              {[
                { id: "all", label: "الكل", count: isAppsTab ? appRoutes.length : ALL_ROUTES.length },
                { id: "used", label: "مستخدم", count: isAppsTab ? appRoutes.filter(r => getAppUsageList(r).length > 0).length : ALL_ROUTES.filter(r => (usageMap[r.path] || []).length > 0).length },
                { id: "unused", label: "غير مستخدم", count: isAppsTab ? appRoutes.filter(r => getAppUsageList(r).length === 0).length : ALL_ROUTES.filter(r => (usageMap[r.path] || []).length === 0).length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                    statusFilter === f.id
                        ? f.id === "used" ? "bg-emerald-600 text-white" : f.id === "unused" ? "bg-gray-500 text-white" : "bg-primary text-white"
                        : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                    )}
                    >
                    {f.label}
                    <span className={cn(
                      "mr-1 text-[9px] px-1 py-0.5 rounded-full font-bold",
                      statusFilter === f.id ? "bg-white/30" : "bg-white/60 text-foreground"
                    )}>{f.count}</span>
                    </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <p className="text-[11px] text-amber-700 font-medium text-center">
            👆 اضغط على أي رابط لنسخه — اضغط على <MapPin size={9} className="inline" /> لعرض تفاصيل الاستخدام
          </p>
        </div>

        {/* Routes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">لا توجد نتائج</div>
          ) : isAppsTab ? (
            /* ─── عرض تطبيقات ─── */
            filteredRoutes.map((route, idx) => {
              const key = (route.path || route.appId) + idx;
              const isCopied = copiedPath === key;
              const usageList = getAppUsageList(route);
              const usageCount = usageList.length;
              return (
                <div key={key} className={cn("flex items-center gap-3 px-4 py-3 transition-all group", isCopied && "bg-emerald-50")}>
                  {/* App icon */}
                  {route.iconUrl ? (
                    <img src={route.iconUrl} alt={route.label} className="w-8 h-8 rounded-lg object-contain flex-shrink-0 border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📦</span>
                    </div>
                  )}
                  {/* Info */}
                  <button
                    onClick={() => { if (route.path) { handleCopy(route.path); setCopiedPath(key); setTimeout(() => setCopiedPath(null), 2000); } }}
                    className="flex-1 min-w-0 text-right hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-semibold text-foreground">{route.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{route.category}</span>
                      {route.path ? (
                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">{route.path}</span>
                      ) : (
                        <span className="text-[10px] text-orange-500 font-medium">⚠️ لا يوجد route محدد</span>
                      )}
                      {route.appType === "service" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">خدمة خلفية</span>
                      )}
                    </div>
                  </button>
                  {/* Usage badge */}
                  <span className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0",
                    usageCount > 0 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"
                  )}>
                    <MapPin size={9} />
                    {usageCount > 0 ? `${usageCount}× مستخدم` : "غير مستخدم"}
                  </span>
                  {/* Copy */}
                  {route.path && (
                    <button onClick={() => { handleCopy(route.path); setCopiedPath(key); setTimeout(() => setCopiedPath(null), 2000); }} className="flex-shrink-0">
                      {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            /* ─── عرض روابط النظام ─── */
            filteredRoutes.map((route, idx) => {
            const isCopied = copiedPath === route.path + idx;
            const usageList = usageMap[route.path] || [];
            const usageCount = usageList.length;
            const isExpanded = !!expandedUsage[route.path + idx];

            return (
              <div key={route.path + route.access + idx}>
                <div className={cn(
                  "flex items-start gap-2 px-4 py-3 transition-all group",
                  copiedPath === route.path + idx && "bg-emerald-50",
                  isExpanded && "bg-indigo-50/50"
                )}>
                  {/* Copy button */}
                  <button
                    onClick={() => { handleCopy(route.path); setCopiedPath(route.path + idx); setTimeout(() => setCopiedPath(null), 2000); }}
                    className="flex-1 min-w-0 text-right hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{route.label}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{route.path}</p>
                    </div>
                  </button>

                  {/* Access badge — يظهر فقط في تبويب الكل */}
                  {activeTab === "all" && (
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5",
                      route.access === "سوبر أدمن" ? "bg-purple-100 text-purple-700" :
                      route.access === "شريك" ? "bg-orange-100 text-orange-700" :
                      route.access === "عميل" ? "bg-emerald-100 text-emerald-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {route.access}
                    </span>
                  )}

                  {/* Usage count badge */}
                  <button
                    onClick={() => setExpandedUsage(p => ({ ...p, [route.path + idx]: !p[route.path + idx] }))}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 transition-colors mt-0.5",
                      usageCount > 0
                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        : "bg-gray-100 text-gray-400"
                    )}
                    title={usageCount > 0 ? "عرض تفاصيل الاستخدام" : "غير مستخدم في القائمة"}
                  >
                    <MapPin size={9} />
                    {usageCount}×
                  </button>

                  {/* Copy icon */}
                  <button onClick={() => { handleCopy(route.path); setCopiedPath(route.path + idx); setTimeout(() => setCopiedPath(null), 2000); }} className="flex-shrink-0 mt-0.5">
                    {copiedPath === route.path + idx ? (
                      <Check size={15} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>

                {/* Usage details expanded */}
                {isExpanded && usageCount > 0 && (
                  <div className="mx-4 mb-3 bg-white border border-indigo-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-200 flex items-center gap-2">
                      <MapPin size={12} className="text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-700">
                        مستخدم في {usageCount} موضع في القائمة الجانبية
                      </span>
                    </div>
                    {usageList.map((u, i) => (
                      <button
                        key={i}
                        onClick={() => handleNavigateToUsage(u)}
                        className="w-full px-3 py-2 border-b border-indigo-100 last:border-0 text-xs text-right hover:bg-indigo-50 transition-colors group/usage"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">📋 {u.panel}</span>
                          <ChevronRight size={10} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{u.tab}</span>
                          {u.parentLabel && (
                            <>
                              <ChevronRight size={10} className="text-muted-foreground" />
                              <span className="text-muted-foreground">تحت: {u.parentLabel}</span>
                            </>
                          )}
                          <ExternalLink size={10} className="text-indigo-400 opacity-0 group-hover/usage:opacity-100 transition-opacity mr-auto" />
                        </div>
                        <p className="text-muted-foreground mt-1">
                          اسم العنصر: <span className="font-medium text-foreground">{u.label}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {isExpanded && usageCount === 0 && (
                  <div className="mx-4 mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 text-center">هذا المسار غير مستخدم في أي قائمة جانبية</p>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}