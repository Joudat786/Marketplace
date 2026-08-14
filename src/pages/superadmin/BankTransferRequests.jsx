import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Search, Check, X, Eye, Download,
  Clock, AlertTriangle, CheckCircle, XCircle,
  ArrowUpDown, ChevronUp, ChevronDown, User, Upload, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SlidePanel from "@/components/superadmin/SlidePanel";
import PlatformClientForm from "@/pages/superadmin/PlatformClientForm";
import { formatDateRiyadh } from "@/utils/dateUtils";

/* ─── ثوابت ─── */
const STATUS_OPTIONS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار المراجعة" },
  { key: "approved", label: "مُوافق عليه" },
  { key: "rejected", label: "مرفوض" },
];

const STATUS_DISPLAY = {
  pending:  { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700",   icon: Clock },
  approved: { label: "مُوافق عليه",       color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  rejected: { label: "مرفوض",             color: "bg-red-100 text-red-700",      icon: XCircle },
};

const formatDate = formatDateRiyadh;

/* ─── Header رأس العمود قابل للترتيب ─── */
function SortableTh({ label, field, sortField, sortDir, onSort, className = "" }) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-3 py-2.5 text-center font-bold border-l border-border cursor-pointer select-none whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        {active
          ? sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          : <ArrowUpDown size={10} className="opacity-40" />}
      </span>
    </th>
  );
}

export default function BankTransferRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* ─── state ─── */
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [detailPanel, setDetailPanel]   = useState({ open: false, req: null });
  const [adminNotes, setAdminNotes]     = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [clientPanel, setClientPanel]   = useState({ open: false, req: null });
  const [receiptPanel, setReceiptPanel] = useState({ open: false, url: null });
  const [uploadingReceiptId, setUploadingReceiptId] = useState(null);

  /* بحث لكل عمود */
  const [colSearch, setColSearch] = useState({
    customer_name: "", customer_email: "", app_name: "",
    amount: "", transfer_mode: "", sender_name: "", status: "", created_date: ""
  });

  /* ترتيب */
  const [sortField, setSortField] = useState("created_date");
  const [sortDir,   setSortDir]   = useState("desc");

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ─── data ─── */
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["bankTransferRequests"],
    queryFn: () => base44.entities.BankTransferRequest.list("-created_date", 500),
  });

  const { data: platformClients = [] } = useQuery({
    queryKey: ["allPlatformClientsForBTR"],
    queryFn: () => base44.entities.PlatformClient.list(),
  });

  const clientCompanyMap = useMemo(() => {
    const map = {};
    platformClients.forEach(c => { if (c.email) map[c.email] = c.company_name || ""; });
    return map;
  }, [platformClients]);

  const getCompanyName = (req) =>
    (req.customer_email && clientCompanyMap[req.customer_email]) || req.customer_name || "-";

  const { data: platformClientId } = useQuery({
    queryKey: ["platformClientId", clientPanel.req?.customer_email],
    queryFn: async () => {
      const res = await base44.entities.PlatformClient.filter({ email: clientPanel.req.customer_email });
      return res?.[0]?.id || null;
    },
    enabled: clientPanel.open && !!clientPanel.req?.customer_email,
  });

  /* ─── mutations ─── */
  const approveMutation = useMutation({
    mutationFn: async ({ ids, notes }) => {
      const user = await base44.auth.me();
      for (const reqId of ids) {
        const req = requests.find(r => r.id === reqId);

        // حساب تواريخ الاشتراك
        const startDate = new Date().toISOString();
        const endDate = (() => {
          const d = new Date();
          if (req?.billing_cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
          else d.setMonth(d.getMonth() + 1);
          return d.toISOString();
        })();

        if (req?.workspace_id) {
          const allInstalled = await base44.entities.InstalledApp.filter({
            workspace_id: req.workspace_id,
          });
          const pendingApps = allInstalled.filter(ia => ia.status === "pending_payment");
          for (const ia of pendingApps) {
            await base44.entities.InstalledApp.update(ia.id, {
              status: "active",
              payment_status: "paid",
              subscription_ends_at: endDate.split("T")[0],
              billing_cycle: req.billing_cycle || "monthly",
            });
            // إنشاء سجل SubscriptionRecord
            await base44.entities.SubscriptionRecord.create({
              user_email: req.customer_email,
              workspace_id: req.workspace_id,
              workspace_name: req.workspace_name || "",
              name: ia.app_name || req.app_name,
              type: "app",
              app_id: ia.app_id,
              subscription_source: "addon",
              start_date: startDate,
              end_date: endDate,
              amount: req.amount || 0,
              currency: req.currency || "SAR",
              billing_cycle: req.billing_cycle || "monthly",
              status: "active",
              payment_id: reqId,
            });
          }
        } else if (req?.installed_app_id) {
          await base44.entities.InstalledApp.update(req.installed_app_id, {
            status: "active",
            payment_status: "paid",
            subscription_ends_at: endDate.split("T")[0],
            billing_cycle: req.billing_cycle || "monthly",
          });
          // إنشاء سجل SubscriptionRecord
          await base44.entities.SubscriptionRecord.create({
            user_email: req.customer_email,
            workspace_id: req.workspace_id || null,
            workspace_name: req.workspace_name || "",
            name: req.app_name,
            type: "app",
            subscription_source: "addon",
            start_date: startDate,
            end_date: endDate,
            amount: req.amount || 0,
            currency: req.currency || "SAR",
            billing_cycle: req.billing_cycle || "monthly",
            status: "active",
            payment_id: reqId,
          });
        }

        await base44.entities.BankTransferRequest.update(reqId, {
          status: "approved", admin_notes: notes || null,
          reviewed_by: user.email, reviewed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: (_, { ids }) => {
      toast({ title: "✓", description: `تمت الموافقة على ${ids.length} طلب وتفعيل التطبيق بنجاح` });
      queryClient.invalidateQueries({ queryKey: ["bankTransferRequests"] });
      setSelectedIds(new Set());
      setDetailPanel({ open: false, req: null });
      setConfirmAction(null);
      setAdminNotes("");
    },
    onError: (e) => toast({ title: "❌", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ ids, notes }) => {
      const user = await base44.auth.me();
      for (const reqId of ids) {
        const req = requests.find(r => r.id === reqId);
        if (req?.installed_app_id) {
          await base44.entities.InstalledApp.update(req.installed_app_id, { status: "suspended", payment_status: "unpaid" });
        }
        await base44.entities.BankTransferRequest.update(reqId, {
          status: "rejected", admin_notes: notes || null,
          reviewed_by: user.email, reviewed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: (_, { ids }) => {
      toast({ title: "✓", description: `تم رفض ${ids.length} طلب` });
      queryClient.invalidateQueries({ queryKey: ["bankTransferRequests"] });
      setSelectedIds(new Set());
      setDetailPanel({ open: false, req: null });
      setConfirmAction(null);
      setAdminNotes("");
    },
    onError: (e) => toast({ title: "❌", description: e.message, variant: "destructive" }),
  });

  const handleUploadReceiptOnBehalf = async (reqId, file) => {
    if (!file) return;
    setUploadingReceiptId(reqId);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const url = uploadRes?.file_url;
      if (!url) throw new Error("فشل رفع الملف");
      await base44.entities.BankTransferRequest.update(reqId, { receipt_url: url });
      queryClient.invalidateQueries({ queryKey: ["bankTransferRequests"] });
      toast({ title: "✓", description: "تم رفع الإيصال بنجاح، يمكنك الآن اتخاذ الإجراء" });
    } catch (e) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    } finally {
      setUploadingReceiptId(null);
    }
  };

  /* ─── فلترة وترتيب ─── */
  const filtered = useMemo(() => {
    let list = requests.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      for (const [col, val] of Object.entries(colSearch)) {
        if (!val.trim()) continue;
        const cell = String(r[col] ?? "").toLowerCase();
        if (!cell.includes(val.toLowerCase())) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let av = a[sortField] ?? ""; let bv = b[sortField] ?? "";
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [requests, statusFilter, colSearch, sortField, sortDir]);

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const allSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id));
  const handleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(r => r.id)));
  };

  const exportCSV = () => {
    const list = filtered.filter(r => selectedIds.size === 0 || selectedIds.has(r.id));
    const rows = [
      ["رقم الطلب","اسم الشركة","التطبيق","المبلغ","العملة","دورة الفوترة","نوع الدفع","المُحوِّل","الحالة","التاريخ"].join(","),
      ...list.map(r => [
        r.id, getCompanyName(r), r.app_name,
        r.amount, r.currency,
        r.billing_cycle === "yearly" ? "سنوي" : "شهري",
        r.transfer_mode === "immediate" ? "دفع فوري" : "مهلة",
        r.sender_name || "-",
        STATUS_DISPLAY[r.status]?.label || r.status,
        formatDate(r.created_date),
      ].join(","))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "طلبات-التحويل-البنكي.csv"; a.click();
  };

  const selectedPending = [...selectedIds].filter(id => {
    const r = requests.find(r => r.id === id);
    return r?.status === "pending" && r?.receipt_url;
  });

  return (
    <div className="space-y-4" dir="rtl">

      {/* ─── رأس الصفحة ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            إدارة طلبات التحويل البنكي
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} بانتظار
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">مراجعة وتفعيل طلبات الدفع بالتحويل البنكي</p>
        </div>

        {/* شريط الأدوات */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              {selectedIds.size} محدد
            </span>
          )}
          {selectedPending.length > 0 && (
            <>
              <Button
                size="sm"
                onClick={() => setConfirmAction({ type: "approve", ids: selectedPending, notes: "" })}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Check size={13} /> موافقة ({selectedPending.length})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmAction({ type: "reject", ids: selectedPending, notes: "" })}
                className="gap-1.5 text-xs"
              >
                <X size={13} /> رفض ({selectedPending.length})
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download size={13} /> تصدير {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </div>
      </div>

      {/* ─── شريط الفلترة بالحالة ─── */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setStatusFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              statusFilter === opt.key
                ? "bg-primary text-white border-primary"
                : "bg-background border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            {opt.label}
            {opt.key === "pending" && pendingCount > 0 && (
              <span className="mr-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── الجدول ─── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                  <th className="px-3 py-2.5 text-center w-8 border-l border-border">
                    <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="cursor-pointer" />
                    {selectedIds.size > 0 && <span className="block text-primary font-bold text-[10px]">({selectedIds.size})</span>}
                  </th>
                  <th className="px-3 py-2.5 text-center font-bold border-l border-border w-8">#</th>
                  <SortableTh label="اسم الشركة"  field="customer_name"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="التطبيق"     field="app_name"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="المبلغ"       field="amount"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="نوع الدفع"   field="transfer_mode"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="المُحوِّل"    field="sender_name"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="البنك المُحوَّل إليه" field="bank_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-3 py-2.5 text-center font-bold border-l border-border">الإيصال</th>
                  <SortableTh label="الحالة"       field="status"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="التاريخ"      field="created_date"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-3 py-2.5 text-center font-bold sticky left-0" style={{ backgroundColor: "var(--table-header-bg)" }}>الإجراءات</th>
                </tr>
                {/* صف البحث لكل عمود */}
                <tr className="border-b border-border bg-secondary/20">
                  <td className="px-2 py-1 border-l border-border" />
                  <td className="px-2 py-1 border-l border-border" />
                  {["customer_name","app_name","amount","transfer_mode","sender_name","bank_name"].map(col => (
                    <td key={col} className="px-2 py-1 border-l border-border">
                      <div className="relative">
                        <Search size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={colSearch[col] || ""}
                          onChange={e => setColSearch(p => ({ ...p, [col]: e.target.value }))}
                          placeholder="بحث..."
                          className="w-full border border-border rounded pr-6 pl-1 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-1 border-l border-border" />
                  <td className="px-2 py-1 border-l border-border">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full border border-border rounded px-1 py-1 text-[10px] focus:outline-none"
                      dir="rtl"
                    >
                      {STATUS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1 border-l border-border">
                    <div className="relative">
                      <Search size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={colSearch.created_date || ""}
                        onChange={e => setColSearch(p => ({ ...p, created_date: e.target.value }))}
                        placeholder="بحث..."
                        className="w-full border border-border rounded pr-6 pl-1 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </td>
                  <td className="sticky left-0 bg-secondary/20" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="py-12 text-center">
                    <AlertTriangle size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-foreground">لا توجد طلبات</p>
                  </td></tr>
                ) : filtered.map((req, idx) => {
                  const st = STATUS_DISPLAY[req.status] || STATUS_DISPLAY.pending;
                  const StIcon = st.icon;
                  return (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.015 }}
                      className={`border-b border-border transition-colors ${selectedIds.has(req.id) ? "bg-primary/5" : "hover:bg-secondary/20"}`}
                    >
                      <td className="px-3 py-2 text-center border-l border-border">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req.id)}
                          onChange={() => {
                            const s = new Set(selectedIds);
                            s.has(req.id) ? s.delete(req.id) : s.add(req.id);
                            setSelectedIds(s);
                          }}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                      <td className="px-3 py-2 text-center border-l border-border">
                        <button
                          onClick={() => setClientPanel({ open: true, req })}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {getCompanyName(req)}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-foreground border-l border-border">{req.app_name}</td>
                      <td className="px-3 py-2 text-center font-bold text-primary border-l border-border">
                        {req.amount} {req.currency}
                        <p className="text-[10px] text-muted-foreground font-normal">{req.billing_cycle === "yearly" ? "سنوي" : "شهري"}</p>
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.transfer_mode === "immediate" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {req.transfer_mode === "immediate" ? "فوري" : "مهلة"}
                        </span>
                        {req.transfer_mode === "deadline" && req.deadline_at && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">حتى: {formatDate(req.deadline_at)}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border text-foreground">
                        {req.sender_name || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border">
                        {req.bank_name ? (
                          <div>
                            <p className="font-semibold text-foreground text-[11px]">{req.bank_name}</p>
                            {req.bank_account_holder && <p className="text-[10px] text-muted-foreground">{req.bank_account_holder}</p>}
                            {req.bank_iban && <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{req.bank_iban}</p>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border">
                        {req.receipt_url ? (
                          <button
                            onClick={() => setReceiptPanel({ open: true, url: req.receipt_url })}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors">
                            <Eye size={10} /> عرض
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                          <StIcon size={10} /> {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center border-l border-border text-muted-foreground text-[10px] whitespace-nowrap">
                        {formatDate(req.created_date)}
                      </td>
                      <td className="px-3 py-2 text-center sticky left-0 bg-card">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setDetailPanel({ open: true, req }); setAdminNotes(""); }}
                            className="p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye size={12} className="text-foreground" />
                          </button>
                          {req.status === "pending" && !req.receipt_url && (
                            <label
                              className="p-1.5 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer"
                              title="رفع إيصال نيابةً عن العميل"
                            >
                              {uploadingReceiptId === req.id
                                ? <Loader2 size={12} className="text-amber-700 animate-spin" />
                                : <Upload size={12} className="text-amber-700" />}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadReceiptOnBehalf(req.id, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                          {req.status === "pending" && req.receipt_url && (
                            <>
                              <button
                                onClick={() => setConfirmAction({ type: "approve", ids: [req.id], notes: "" })}
                                className="p-1.5 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="موافقة وتفعيل"
                              >
                                <Check size={12} className="text-emerald-700" />
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "reject", ids: [req.id], notes: "" })}
                                className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                title="رفض"
                              >
                                <X size={12} className="text-red-700" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Slide Panel: تفاصيل الطلب ─── */}
      <SlidePanel open={detailPanel.open} onClose={() => setDetailPanel({ open: false, req: null })}>
        {detailPanel.req && (
          <div className="h-full flex flex-col bg-background p-6 overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">تفاصيل طلب التحويل البنكي</h2>
              <button onClick={() => setDetailPanel({ open: false, req: null })} className="p-2 hover:bg-secondary rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm flex-1">
              {[
                ["اسم الشركة",  getCompanyName(detailPanel.req)],
                ["البريد",      detailPanel.req.customer_email],
                ["التطبيق",     detailPanel.req.app_name],
                ["المبلغ",      `${detailPanel.req.amount} ${detailPanel.req.currency} — ${detailPanel.req.billing_cycle === "yearly" ? "سنوي" : "شهري"}`],
                ["نوع الدفع",   detailPanel.req.transfer_mode === "immediate" ? "دفع فوري" : `مهلة (حتى: ${formatDate(detailPanel.req.deadline_at)})`],
                ["اسم المُحوِّل", detailPanel.req.sender_name || "-"],
                ["البنك المُحوَّل إليه", detailPanel.req.bank_name || "-"],
                ["اسم صاحب الحساب", detailPanel.req.bank_account_holder || "-"],
                ["رقم الآيبان", detailPanel.req.bank_iban || "-"],
                ["الحالة",      STATUS_DISPLAY[detailPanel.req.status]?.label],
                ["تاريخ الطلب", formatDate(detailPanel.req.created_date)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border pb-2.5">
                  <span className="text-muted-foreground font-semibold">{label}</span>
                  <span className="font-bold text-foreground text-left max-w-xs text-right">{value}</span>
                </div>
              ))}

              {detailPanel.req.receipt_url && (
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span className="text-muted-foreground font-semibold">الإيصال</span>
                  <a href={detailPanel.req.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Eye size={12} /> عرض الإيصال
                  </a>
                </div>
              )}

              {detailPanel.req.admin_notes && (
                <div className="bg-secondary/30 rounded-lg p-3 mt-2">
                  <p className="font-semibold text-foreground mb-1 text-xs">ملاحظات المراجع:</p>
                  <p className="text-muted-foreground text-xs">{detailPanel.req.admin_notes}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    بواسطة: {detailPanel.req.reviewed_by} — {formatDate(detailPanel.req.reviewed_at)}
                  </p>
                </div>
              )}
            </div>

            {detailPanel.req.status === "pending" && !detailPanel.req.receipt_url && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">لم يرفع العميل إيصال التحويل بعد</p>
                    <p className="text-xs text-amber-600 mt-1">يمكنك رفع الإيصال نيابةً عنه إذا شاركه معك عبر وسيلة أخرى، وبعدها ستظهر أزرار القبول والرفض.</p>
                  </div>
                </div>
                <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer text-sm font-bold text-amber-700">
                  {uploadingReceiptId === detailPanel.req.id
                    ? <><Loader2 size={16} className="animate-spin" /> جاري الرفع...</>
                    : <><Upload size={16} /> رفع إيصال التحويل نيابةً عن العميل</>}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        await handleUploadReceiptOnBehalf(detailPanel.req.id, f);
                        setDetailPanel(p => p.req ? { ...p, req: { ...p.req, receipt_url: "uploaded" } } : p);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}

            {detailPanel.req.status === "pending" && detailPanel.req.receipt_url && (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <label className="block text-sm font-semibold text-foreground">ملاحظات المراجعة (اختياري)</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="أدخل ملاحظاتك هنا..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setDetailPanel({ open: false, req: null });
                      setConfirmAction({ type: "approve", ids: [detailPanel.req.id], notes: adminNotes });
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
                  >
                    <Check size={14} /> موافقة وتفعيل
                  </Button>
                  <Button
                    onClick={() => {
                      setDetailPanel({ open: false, req: null });
                      setConfirmAction({ type: "reject", ids: [detailPanel.req.id], notes: adminNotes });
                    }}
                    variant="destructive"
                    className="flex-1 gap-2 text-sm"
                  >
                    <X size={14} /> رفض
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>

      {/* ─── Slide Panel: بيانات العميل ─── */}
      <SlidePanel open={clientPanel.open} onClose={() => setClientPanel({ open: false, req: null })}>
        {clientPanel.open && (
          platformClientId !== undefined ? (
            platformClientId ? (
              <PlatformClientForm
                embeddedId={platformClientId}
                onClose={() => setClientPanel({ open: false, req: null })}
                onSaved={() => {}}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <User size={28} className="text-amber-600" />
                </div>
                <p className="text-base font-bold text-foreground">لم يتم العثور على العميل</p>
                <p className="text-sm text-muted-foreground">البريد: {clientPanel.req?.customer_email}</p>
                <button onClick={() => setClientPanel({ open: false, req: null })} className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold">إغلاق</button>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>
          )
        )}
      </SlidePanel>

      {/* ─── Slide Panel: عرض الإيصال ─── */}
      <SlidePanel open={receiptPanel.open} onClose={() => setReceiptPanel({ open: false, url: null })}>
        {receiptPanel.url && (
          <div className="h-full flex flex-col bg-background" dir="rtl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/40 flex-shrink-0">
              <button onClick={() => setReceiptPanel({ open: false, url: null })} className="p-1.5 hover:bg-primary/10 rounded-lg">
                <X size={18} className="text-muted-foreground" />
              </button>
              <h2 className="text-base font-bold text-foreground flex-1">إيصال التحويل</h2>
              <a
                href={receiptPanel.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90"
              >
                <Download size={13} /> تنزيل
              </a>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
              {receiptPanel.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={receiptPanel.url} alt="إيصال التحويل" className="max-w-full rounded-xl shadow-lg border border-border" />
              ) : receiptPanel.url.match(/\.pdf$/i) ? (
                <iframe src={receiptPanel.url} className="w-full h-full rounded-xl border border-border" style={{ minHeight: "80vh" }} title="إيصال التحويل" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <Eye size={32} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">لا يمكن عرض هذا الملف مباشرةً</p>
                  <a href={receiptPanel.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90">
                    <Download size={14} /> فتح في تبويب جديد
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* ─── مربع تأكيد الإجراء ─── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-base font-bold text-foreground">
              {confirmAction.type === "approve" ? "⚡ تأكيد الموافقة" : "⚠️ تأكيد الرفض"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {confirmAction.type === "approve"
                ? `هل تريد الموافقة على ${confirmAction.ids.length} طلب وتفعيل التطبيق للعميل؟`
                : `هل تريد رفض ${confirmAction.ids.length} طلب؟`}
            </p>
            <textarea
              value={confirmAction.notes}
              onChange={e => setConfirmAction(p => ({ ...p, notes: e.target.value }))}
              placeholder="ملاحظات (اختياري)..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-16 resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (confirmAction.type === "approve") {
                    approveMutation.mutate({ ids: confirmAction.ids, notes: confirmAction.notes });
                  } else {
                    rejectMutation.mutate({ ids: confirmAction.ids, notes: confirmAction.notes });
                  }
                }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={`flex-1 ${confirmAction.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive hover:bg-destructive/90 text-white"}`}
              >
                {(approveMutation.isPending || rejectMutation.isPending) ? "جاري التنفيذ..." : "تأكيد"}
              </Button>
              <Button variant="outline" onClick={() => setConfirmAction(null)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}