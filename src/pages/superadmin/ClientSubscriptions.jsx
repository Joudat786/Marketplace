import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Download, RefreshCw, ChevronUp, ChevronDown, Search, Trash2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useOutletContext } from "react-router-dom";
import SlidePanel from "@/components/superadmin/SlidePanel";
import SubscriptionDetailPanel from "@/components/subscriptions/SubscriptionDetailPanel";
import { formatDateRiyadh } from "@/utils/dateUtils";

const formatDate = formatDateRiyadh;

// ─── حالة الاشتراك ───
const statusConfig = {
  active:          { label: "نشط",           bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  trial:           { label: "تجريبي",         bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  expired:         { label: "منتهي",          bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  suspended:       { label: "موقوف",          bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
  pending_payment: { label: "بانتظار الدفع",  bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500" },
  pending_setup:   { label: "بانتظار الإعداد",bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500" },
  uninstalled:     { label: "ملغى",           bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
};

const billingLabel = { monthly: "شهري", yearly: "سنوي" };

// ─── فلاتر الفترة الزمنية ───
const periodFilters = [
  { key: "all",       label: "الكل" },
  { key: "today",     label: "اليوم" },
  { key: "week",      label: "هذا الأسبوع" },
  { key: "month",     label: "هذا الشهر" },
  { key: "year",      label: "هذا العام" },
  { key: "custom",    label: "مخصص" },
  { key: "range",     label: "نطاق" },
];

function normalizeDate(val) {
  if (!val) return new Date(0);
  if (typeof val === "string" && !/Z|[+-]\d{2}:?\d{2}$/.test(val.trim())) return new Date(val.trim() + "Z");
  return new Date(val);
}

function filterByPeriod(items, period, customFrom, customTo) {
  const now = new Date();
  return items.filter(item => {
    const d = normalizeDate(item.installed_at || item.created_date);
    const dRiyadh = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    const nowRiyadh = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    if (period === "today") {
      return dRiyadh.toDateString() === nowRiyadh.toDateString();
    } else if (period === "week") {
      const weekAgo = new Date(nowRiyadh); weekAgo.setDate(nowRiyadh.getDate() - 7);
      return dRiyadh >= weekAgo;
    } else if (period === "month") {
      return dRiyadh.getMonth() === nowRiyadh.getMonth() && dRiyadh.getFullYear() === nowRiyadh.getFullYear();
    } else if (period === "year") {
      return dRiyadh.getFullYear() === nowRiyadh.getFullYear();
    } else if ((period === "custom" || period === "range") && customFrom && customTo) {
      return d >= new Date(customFrom) && d <= new Date(customTo + "T23:59:59");
    }
    return true;
  });
}

export default function ClientSubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { headerSearch, setToolbarActions, setSelectedCount } = useOutletContext() || {};

  // ─── State ───
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selected, setSelected] = useState([]);
  const [sortKey, setSortKey] = useState("installed_at");
  const [sortDir, setSortDir] = useState("desc");
  const [panel, setPanel] = useState({ open: false, id: null });

  // بحث لكل عمود
  const [searchClient, setSearchClient] = useState("");
  const [searchWorkspace, setSearchWorkspace] = useState("");
  const [searchApp, setSearchApp] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchBilling, setSearchBilling] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPaymentMethod, setSearchPaymentMethod] = useState("");

  // ─── بيانات ───
  const { data: installedApps = [], isLoading } = useQuery({
    queryKey: ["clientSubscriptions_all"],
    queryFn: () => base44.entities.InstalledApp.list("-installed_at", 500),
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ["allWorkspaces"],
    queryFn: () => base44.entities.Workspace.list(),
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["allApps"],
    queryFn: () => base44.entities.App.list(),
  });

  // ─── دمج البيانات ───
  const enriched = useMemo(() => {
    return installedApps.map(ia => {
      const ws = workspaces.find(w => w.id === ia.workspace_id);
      const app = apps.find(a => a.id === ia.app_id);
      return { ...ia, workspace: ws, app };
    });
  }, [installedApps, workspaces, apps]);

  // ─── فلترة بالفترة ───
  const periodFiltered = useMemo(() => filterByPeriod(enriched, period, customFrom, customTo), [enriched, period, customFrom, customTo]);

  // ─── إحصائيات ───
  const stats = useMemo(() => {
    const all = periodFiltered;
    const active = all.filter(i => i.status === "active").length;
    const expired = all.filter(i => i.status === "expired" || i.status === "uninstalled").length;
    const trial = all.filter(i => i.status === "trial").length;
    const newSubs = all.filter(i => {
      const d = new Date(i.installed_at || i.created_date);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;
    return { total: all.length, active, expired, trial, newSubs };
  }, [periodFiltered]);

  // ─── فلترة بالبحث ───
  const filtered = useMemo(() => {
    const globalQ = (headerSearch || "").toLowerCase();
    return periodFiltered.filter(i => {
      const clientName = i.workspace?.owner_name || "";
      const wsName = i.workspace?.name || i.workspace_id || "";
      const appName = i.app_name || i.app?.name || "";
      const statusLabel = statusConfig[i.status]?.label || i.status || "";
      const billing = billingLabel[i.billing_cycle] || i.billing_cycle || "";
      const email = i.workspace?.owner_email || "";
      const paymentMethod = i.payment_method || i.client_config?.payment_method || "";
      const globalMatch = !globalQ || [clientName, wsName, appName, statusLabel, billing, email, paymentMethod].some(v => v.toLowerCase().includes(globalQ));
      return (
        globalMatch &&
        clientName.includes(searchClient) &&
        wsName.includes(searchWorkspace) &&
        appName.includes(searchApp) &&
        statusLabel.includes(searchStatus) &&
        billing.includes(searchBilling) &&
        email.includes(searchEmail) &&
        paymentMethod.includes(searchPaymentMethod)
      );
    });
  }, [periodFiltered, searchClient, searchWorkspace, searchApp, searchStatus, searchBilling, searchEmail, searchPaymentMethod, headerSearch]);

  // ─── ترتيب ───
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va = a[sortKey] || "";
      let vb = b[sortKey] || "";
      if (sortKey === "workspace") { va = a.workspace?.name || ""; vb = b.workspace?.name || ""; }
      if (sortKey === "company_name") { va = a.workspace?.company_name || ""; vb = b.workspace?.company_name || ""; }
      if (sortKey === "app") { va = a.app_name || ""; vb = b.app_name || ""; }
      if (sortKey === "payment_method") { va = a.payment_method || ""; vb = b.payment_method || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={12} className="inline text-primary" /> : <ChevronDown size={12} className="inline text-primary" />)
    : <ChevronUp size={12} className="inline text-muted-foreground opacity-30" />;

  // ─── تحديد الكل ───
  const allIds = sorted.map(i => i.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ─── حذف جماعي ───
  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.InstalledApp.delete(id);
      }
    },
    onSuccess: () => {
      toast({ title: "تم الحذف", description: "تم حذف السجلات المحددة" });
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["clientSubscriptions_all"] });
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const handleBulkDelete = () => {
    if (!selected.length) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selected.length} سجل؟`)) return;
    deleteMutation.mutate(selected);
  };

  // ─── تصدير CSV ───
  const exportCSV = () => {
    const headers = ["مساحة العمل", "البريد الإلكتروني", "التطبيق", "الحالة", "دورة الفوترة", "المبلغ الشهري", "المبلغ السنوي", "تاريخ التثبيت", "تاريخ انتهاء الاشتراك", "ملاحظات"];
    const rows = sorted.map(i => [
      i.workspace?.name || i.workspace_id || "",
      i.workspace?.owner_email || "",
      i.app_name || "",
      statusConfig[i.status]?.label || i.status || "",
      billingLabel[i.billing_cycle] || "",
      i.app?.monthly_price || "",
      i.app?.yearly_price || "",
      formatDate(i.installed_at),
      formatDate(i.subscription_ends_at),
      i.notes || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `اشتراكات_العملاء_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const selectedItem = panel.id ? installedApps.find(i => i.id === panel.id) : null;

  // ─── تكامل شريط الأدوات ───
  useEffect(() => {
    setToolbarActions?.({
      delete: {
        onClick: handleBulkDelete,
        disabled: selected.length === 0,
      },
      download: { onClick: exportCSV },
      refresh: { onClick: () => queryClient.invalidateQueries({ queryKey: ["clientSubscriptions_all"] }) },
    });
  }, [selected, setToolbarActions]);

  useEffect(() => { setSelectedCount?.(selected.length); }, [selected]);

  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 space-y-6">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">اشتراكات عملاء المنصة</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة ومتابعة اشتراكات جميع العملاء في التطبيقات</p>
      </div>

      {/* ─── إحصائيات الصف الأول ─── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} className="text-primary" />} iconBg="bg-primary/10" label="إجمالي الاشتراكات" value={stats.total} sub="مشترك" color="blue" />
        <StatCard icon={<CheckCircle size={22} className="text-emerald-600" />} iconBg="bg-emerald-100" label="الاشتراكات النشطة" value={stats.active} sub="مشترك" color="green" />
        <StatCard icon={<XCircle size={22} className="text-red-500" />} iconBg="bg-red-100" label="الاشتراكات المنتهية" value={stats.expired} sub="مشترك" color="red" />
        <StatCard icon={<TrendingUp size={22} className="text-purple-600" />} iconBg="bg-purple-100" label="اشتراكات ستنتهي خلال 7 أيام" value={stats.newSubs} sub="مشترك" color="purple" />
      </div>

      {/* ─── تحليل بالفترة ─── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">تحليل الاشتراكات والباقات</h2>
            <p className="text-xs text-muted-foreground">تحليل تفصيلي حسب الفترة الزمنية</p>
          </div>
        </div>
        {/* أزرار الفترة */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {periodFilters.map(pf => (
            <button
              key={pf.key}
              onClick={() => setPeriod(pf.key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border", period === pf.key ? "bg-primary text-white border-primary" : "bg-secondary text-foreground border-border hover:bg-muted")}
            >
              {pf.label}
            </button>
          ))}
        </div>
        {(period === "custom" || period === "range") && (
          <div className="flex gap-3 mb-4 items-center">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background" />
            <span className="text-muted-foreground text-sm">—</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background" />
          </div>
        )}

        {/* إحصائيات الفترة الثانوية */}
        <div className="grid grid-cols-3 gap-4">
          <MiniStatCard label="الاشتراكات الجديدة" value={periodFiltered.filter(i => ["active","trial","pending_payment","pending_setup"].includes(i.status)).length} sub="جديد" color="green" />
          <MiniStatCard label="تجديدات الاشتراك" value={periodFiltered.filter(i => i.status === "active" && i.subscription_ends_at).length} sub="تجديد" color="blue" />
          <MiniStatCard label="إلغاءات الاشتراك" value={periodFiltered.filter(i => i.status === "uninstalled" || i.status === "expired").length} sub="إلغاء" color="red" />
        </div>
      </div>

      {/* ─── جدول الاشتراكات ─── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">جدول الاشتراكات</h2>
          <span className="text-xs text-muted-foreground">{sorted.length} سجل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr className="bg-tableHeaderBg text-tableHeaderText text-xs">
                <th className="px-3 py-3 border-b border-l border-border text-center w-10">
                  <div className="flex flex-col items-center gap-0.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                    {selected.length > 0 && <span className="text-[9px] text-primary font-bold">{selected.length}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("company_name")}>
                  اسم الشركة <SortIcon k="company_name" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("workspace")}>
                  مساحة العمل <SortIcon k="workspace" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("workspace")}>
                  البريد الإلكتروني <SortIcon k="email" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("app")}>
                  التطبيق <SortIcon k="app" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("status")}>
                  الحالة <SortIcon k="status" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("billing_cycle")}>
                  دورة الفوترة <SortIcon k="billing_cycle" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("installed_at")}>
                  تاريخ التثبيت <SortIcon k="installed_at" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("subscription_ends_at")}>
                  تاريخ الانتهاء <SortIcon k="subscription_ends_at" />
                </th>
                <th className="px-3 py-3 border-b border-l border-border cursor-pointer whitespace-nowrap" onClick={() => toggleSort("payment_method")}>
                  طريقة الدفع <SortIcon k="payment_method" />
                </th>
                <th className="px-3 py-3 border-b border-border whitespace-nowrap sticky left-0 bg-tableHeaderBg z-10">الإجراءات</th>
              </tr>
              {/* صف البحث */}
              <tr className="bg-secondary/30">
                <th className="px-2 py-2 border-b border-l border-border" />
                <th className="px-2 py-2 border-b border-l border-border">
                  <input value={searchClient} onChange={e => setSearchClient(e.target.value)} placeholder="بحث..." className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right" />
                </th>
                <th className="px-2 py-2 border-b border-l border-border">
                  <input value={searchWorkspace} onChange={e => setSearchWorkspace(e.target.value)} placeholder="بحث..." className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right" />
                </th>
                <th className="px-2 py-2 border-b border-l border-border">
                  <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="بحث..." className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right" />
                </th>
                <th className="px-2 py-2 border-b border-l border-border">
                  <input value={searchApp} onChange={e => setSearchApp(e.target.value)} placeholder="بحث..." className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right" />
                </th>
                <th className="px-2 py-2 border-b border-l border-border">
                  <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)} className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right">
                    <option value="">الكل</option>
                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={v.label}>{v.label}</option>)}
                  </select>
                </th>
                <th className="px-2 py-2 border-b border-l border-border">
                  <select value={searchBilling} onChange={e => setSearchBilling(e.target.value)} className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right">
                    <option value="">الكل</option>
                    <option value="شهري">شهري</option>
                    <option value="سنوي">سنوي</option>
                  </select>
                </th>
                <th className="px-2 py-2 border-b border-l border-border" />
                <th className="px-2 py-2 border-b border-l border-border">
                  <input value={searchPaymentMethod} onChange={e => setSearchPaymentMethod(e.target.value)} placeholder="بحث..." className="w-full border border-border rounded px-2 py-1 text-xs bg-background text-right" />
                </th>
                <th className="px-2 py-2 border-b border-border sticky left-0 bg-secondary/30 z-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-3 border-l border-border"><div className="h-4 bg-muted rounded mx-auto w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                    <p>لا توجد اشتراكات</p>
                  </td>
                </tr>
              ) : sorted.map((item, idx) => {
                const sc = statusConfig[item.status] || statusConfig.suspended;
                const ws = item.workspace;
                const app = item.app;
                const isChecked = selected.includes(item.id);
                return (
                  <tr key={item.id} className={cn("border-b border-border hover:bg-secondary/30 transition-colors", isChecked && "bg-primary/5")}>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleOne(item.id)} className="w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <span className="font-semibold text-foreground">{ws?.company_name || "—"}</span>
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ws?.logo_url && <img src={ws.logo_url} className="w-6 h-6 rounded-full object-cover" alt="" />}
                        <span className="font-semibold text-foreground">{ws?.name || item.workspace_id || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center text-muted-foreground text-xs">
                      {ws?.owner_email || "—"}
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <div className="flex items-center justify-center gap-2">
                        {app?.icon_url && <img src={app.icon_url} className="w-5 h-5 rounded object-contain" alt="" />}
                        <span>{item.app_name || app?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", sc.bg, sc.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold">
                        {billingLabel[item.billing_cycle] || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.installed_at)}
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.subscription_ends_at || item.trial_ends_at)}
                    </td>
                    <td className="px-3 py-3 border-l border-border text-center">
                      {item.payment_method || item.client_config?.payment_method
                        ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{item.payment_method || item.client_config?.payment_method}</span>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </td>
                    <td className="px-3 py-3 border-border text-center sticky left-0 bg-card z-10">
                      <button
                        onClick={() => setPanel({ open: true, id: item.id })}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Slide Panel للتفاصيل ─── */}
      <SlidePanel open={panel.open} onClose={() => setPanel({ open: false, id: null })}>
        {selectedItem && (
          <SubscriptionDetailPanel
            item={selectedItem}
            workspace={workspaces.find(w => w.id === selectedItem.workspace_id)}
            app={apps.find(a => a.id === selectedItem.app_id)}
            onClose={() => setPanel({ open: false, id: null })}
          />
        )}
      </SlidePanel>
    </div>
  );
}

// ─── مكون بطاقة إحصاء رئيسية ───
function StatCard({ icon, iconBg, label, value, sub, color }) {
  const borders = { blue: "border-blue-200", green: "border-emerald-200", red: "border-red-200", purple: "border-purple-200" };
  const bgs = { blue: "bg-blue-50", green: "bg-emerald-50", red: "bg-red-50", purple: "bg-purple-50" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-2xl border-2 p-4 flex items-center gap-4", bgs[color], borders[color])}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString("ar-SA")}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── مكون بطاقة إحصاء ثانوية ───
function MiniStatCard({ label, value, sub, color }) {
  const bgs = { green: "bg-emerald-50 border-emerald-200", blue: "bg-blue-50 border-blue-200", red: "bg-red-50 border-red-200" };
  const dots = { green: "bg-emerald-500", blue: "bg-blue-500", red: "bg-red-500" };
  const subs = { green: "text-emerald-600", blue: "text-blue-600", red: "text-red-600" };
  return (
    <div className={cn("rounded-xl border p-4 text-center", bgs[color])}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString("ar-SA")}</p>
      <span className={cn("inline-flex items-center gap-1 text-xs font-semibold mt-1", subs[color])}>
        <span className={cn("w-2 h-2 rounded-full", dots[color])} />
        {sub}
      </span>
    </div>
  );
}