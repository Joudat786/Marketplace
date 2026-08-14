import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { ChevronUp, ChevronDown, Edit, Trash2, Users, UserX, ClipboardList, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import SlidePanel from "@/components/superadmin/SlidePanel";
import PlatformClientForm from "./PlatformClientForm";
import UpdateRequestDetails from "@/components/superadmin/UpdateRequestDetails";

import { formatDateRiyadh as formatDate } from "@/utils/dateUtils";

const COLUMNS = [
  { key: "company_name", label: "اسم الشركة الرئيسي" },
  { key: "owner_name", label: "اسم العميل" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "phone", label: "رقم الجوال" },
  { key: "workspaces_count", label: "عدد مساحات العمل" },
  { key: "join_date", label: "تاريخ الانضمام" },
  { key: "data_completed_date", label: "تاريخ إكمال البيانات" },
];

const INCOMPLETE_COLUMNS = [
  { key: "owner_name", label: "الاسم" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "created_date", label: "تاريخ التسجيل" },
];

export default function PlatformClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { headerSearch, setToolbarActions, setSelectedCount } = useOutletContext() || {};

  const [activeTab, setActiveTab] = useState("completed");
  const [requestStatusTab, setRequestStatusTab] = useState("pending");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("created_date");
  const [sortDir, setSortDir] = useState("asc");
  const [columnSearch, setColumnSearch] = useState({});
  const [panel, setPanel] = useState({ open: false, id: null });
  const [requestPanel, setRequestPanel] = useState({ open: false, request: null });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["platformClients"],
    queryFn: () => base44.entities.PlatformClient.list(),
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.PlatformClient.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["platformClients"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: allWorkspaces = [] } = useQuery({
    queryKey: ["allWorkspaces"],
    queryFn: () => base44.entities.Workspace.list(),
  });

  const getWorkspacesCount = (clientEmail) =>
    allWorkspaces.filter((ws) => ws.owner_email === clientEmail).length;

  // جلب طلبات التحديث
  const { data: updateRequests = [] } = useQuery({
    queryKey: ["clientUpdateRequests"],
    queryFn: () => base44.entities.ClientUpdateRequest.list(),
  });

  // تقسيم العملاء — يعتمد على وجود رقم السجل التجاري كمعيار إكمال التسجيل
  // مع إزالة التكرار بناءً على البريد الإلكتروني (أحدث سجل يُبقى)
  const uniqueClients = Object.values(
    clients.reduce((acc, c) => {
      if (!acc[c.email] || new Date(c.created_date) > new Date(acc[c.email].created_date)) {
        acc[c.email] = c;
      }
      return acc;
    }, {})
  );
  const completedClients = uniqueClients.filter(c => c.commercial_register_number && String(c.commercial_register_number).trim() !== '');
  const incompleteClients = uniqueClients.filter(c => !c.commercial_register_number || String(c.commercial_register_number).trim() === '');
  const activeList = activeTab === "completed" ? completedClients : incompleteClients;
  const activeCols = activeTab === "completed" ? COLUMNS : INCOMPLETE_COLUMNS;
  const pendingRequestsCount = updateRequests.filter(r => r.status === "pending").length;

  const deleteMutation = useMutation({
    mutationFn: async (ids) =>
      Promise.all(ids.map((id) => base44.functions.invoke("deletePlatformClient", { clientId: id }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformClients"] });
      setSelectedIds([]);
      setSelectedCount?.(0);
      toast({ title: "تم الحذف بنجاح" });
    },
    onError: (error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const handleExport = () => {
    const cols = activeCols;
    const rows = [cols.map((c) => c.label)];
    activeList.forEach((c) => {
      rows.push(cols.map((col) => {
        if (col.key === "join_date") return formatDate(c.join_date || c.created_date);
        if (col.key === "data_completed_date") return c.data_completed_date ? formatDate(c.data_completed_date) : "";
        if (col.key === "workspaces_count") return getWorkspacesCount(c.email);
        return c[col.key] ?? "";
      }));
    });
    const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "platform_clients.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target.result.replace(/^\uFEFF/, "");
        const lines = text.trim().split("\n");
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(",");
          const obj = {};
          COLUMNS.forEach((col, i) => { obj[col.key] = vals[i]?.trim() || ""; });
          return obj;
        }).filter((r) => r.company_name);
        await Promise.all(rows.map((r) => base44.entities.PlatformClient.create(r)));
        queryClient.invalidateQueries(["platformClients"]);
        toast({ title: `تم استيراد ${rows.length} عميل` });
      };
      reader.readAsText(file, "UTF-8");
    };
    input.click();
  };

  useEffect(() => {
    setToolbarActions?.({
      add: { onClick: () => setPanel({ open: true, id: null }) },
      delete: {
        onClick: () => {
          if (selectedIds.length > 0 && confirm(`حذف ${selectedIds.length} عميل؟`))
            deleteMutation.mutate(selectedIds);
        },
        disabled: selectedIds.length === 0,
      },
      download: { onClick: handleExport },
      upload: { onClick: handleImport },
      filter: { onClick: () => {} },
      reports: { onClick: () => {} },
    });
  }, [selectedIds, setToolbarActions, activeTab]);

  useEffect(() => { setSelectedCount?.(selectedIds.length); }, [selectedIds]);

  const filtered = activeList.filter((c) => {
    const q = (headerSearch || "").toLowerCase();
    const getColVal = (col, c) => {
      if (col.key === "join_date") return formatDate(c.join_date || c.created_date);
      if (col.key === "data_completed_date") return c.data_completed_date ? formatDate(c.data_completed_date) : "";
      if (col.key === "workspaces_count") return String(getWorkspacesCount(c.email));
      return String(c[col.key] || "");
    };
    const globalMatch = !q || activeCols.some((col) => getColVal(col, c).toLowerCase().includes(q));
    const colMatch = activeCols.every((col) => {
      const sv = columnSearch[col.key];
      if (!sv) return true;
      return getColVal(col, c).toLowerCase().includes(sv.toLowerCase());
    });
    return globalMatch && colMatch;
  });

  const sorted = sortField
    ? [...filtered].sort((a, b) => {
        const va = a[sortField] ?? "";
        const vb = b[sortField] ?? "";
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb), "ar")
          : String(vb).localeCompare(String(va), "ar");
      })
    : filtered;

  const allSelected = sorted.length > 0 && sorted.every((c) => selectedIds.includes(c.id));
  const toggleAll = () => allSelected ? setSelectedIds([]) : setSelectedIds(sorted.map((c) => c.id));
  const toggleOne = (id) =>
    selectedIds.includes(id) ? setSelectedIds(selectedIds.filter((i) => i !== id)) : setSelectedIds([...selectedIds, id]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => (
    <span className="inline-flex flex-col mr-1 opacity-50">
      <ChevronUp size={10} className={sortField === field && sortDir === "asc" ? "opacity-100 text-primary" : ""} />
      <ChevronDown size={10} className={sortField === field && sortDir === "desc" ? "opacity-100 text-primary" : ""} />
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">عملاء المنصة</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة جميع عملاء المنصة</p>
      </div>

      {/* التبويبات */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit border border-border">
        <button
          onClick={() => { setActiveTab("completed"); setSelectedIds([]); setColumnSearch({}); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "completed" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={15} />
          عملاء المنصة
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "completed" ? "bg-white/20" : "bg-muted"}`}>
            {completedClients.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab("incomplete"); setSelectedIds([]); setColumnSearch({}); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "incomplete" ? "bg-amber-500 text-white shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserX size={15} />
          لم يكملوا التسجيل
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "incomplete" ? "bg-white/20" : "bg-muted"}`}>
            {incompleteClients.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab("requests"); setSelectedIds([]); setColumnSearch({}); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "requests" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={15} />
          طلبات تحديث البيانات
          {pendingRequestsCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "requests" ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* تبويب طلبات التحديث */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* تبويبات فرعية للفلترة حسب الحالة */}
          <div className="flex flex-wrap gap-1 bg-muted/40 rounded-xl p-1 w-fit border border-border">
            {[
              { key: "all",      label: "الكل",          color: "bg-primary" },
              { key: "pending",  label: "قيد المراجعة", color: "bg-amber-500" },
              { key: "approved", label: "مقبول",         color: "bg-emerald-500" },
              { key: "rejected", label: "مرفوض",         color: "bg-red-500" },
              { key: "returned", label: "مُرجَع",        color: "bg-blue-500" },
            ].map(tab => {
              const count = tab.key === "all" ? updateRequests.length : updateRequests.filter(r => r.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setRequestStatusTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    requestStatusTab === tab.key ? tab.color + " text-white shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${requestStatusTab === tab.key ? "bg-white/25" : "bg-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                  <th className="px-3 py-3 text-center border-l border-border w-10">#</th>
                  <th className="px-3 py-3 text-center border-l border-border">رقم طلب التحديث</th>
                  <th className="px-3 py-3 text-center border-l border-border">من طلب التعديل</th>
                  <th className="px-3 py-3 text-center border-l border-border">التاريخ والوقت</th>
                  <th className="px-3 py-3 text-center border-l border-border">الحالة</th>
                  <th className="px-3 py-3 text-center sticky left-0" style={{ backgroundColor: "var(--table-header-bg)" }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(requestStatusTab === "all" ? updateRequests : updateRequests.filter(r => r.status === requestStatusTab)).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">لا توجد طلبات تحديث</td>
                  </tr>
                ) : (
                  (requestStatusTab === "all" ? updateRequests : updateRequests.filter(r => r.status === requestStatusTab)).map((req, idx) => {
                    const statusMap = {
                      pending: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
                      approved: { label: "مقبول", cls: "bg-emerald-100 text-emerald-700" },
                      rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700" },
                      returned: { label: "مُرجع للتعديل", cls: "bg-blue-100 text-blue-700" },
                    };
                    const badge = statusMap[req.status] || statusMap.pending;
                    return (
                      <tr key={req.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-medium border-l border-border">{req.request_number || "-"}</td>
                        <td className="px-3 py-2.5 text-center border-l border-border">
                          <div>{req.client_name || "-"}</div>
                          <div className="text-xs text-muted-foreground">{req.client_email}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">{formatDate(req.created_date)}</td>
                        <td className="px-3 py-2.5 text-center border-l border-border">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-3 py-2.5 sticky left-0 bg-card border-r border-border">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setRequestPanel({ open: true, request: req })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                            >
                              <Eye size={13} />
                              عرض
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {activeTab !== "requests" && isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeTab !== "requests" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                  <th className="px-3 py-3 text-center border-l border-border w-10">
                    <div className="flex items-center justify-center gap-1">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                      {selectedIds.length > 0 && (
                        <span className="text-xs font-bold text-primary">{selectedIds.length}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center border-l border-border w-10">#</th>
                  {activeCols.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-3 text-center border-l border-border cursor-pointer select-none whitespace-nowrap"
                    >
                      {col.label}
                      <SortIcon field={col.key} />
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center sticky left-0" style={{ backgroundColor: "var(--table-header-bg)" }}>
                    الإجراءات
                  </th>
                </tr>
                {/* صف البحث */}
                <tr className="bg-secondary/30 border-b border-border">
                  <td className="px-2 py-1.5 border-l border-border" />
                  <td className="px-2 py-1.5 border-l border-border" />
                  {activeCols.map((col) => (
                    <td key={col.key} className="px-2 py-1.5 border-l border-border">
                      <input
                        placeholder="بحث..."
                        value={columnSearch[col.key] || ""}
                        onChange={(e) => setColumnSearch((p) => ({ ...p, [col.key]: e.target.value }))}
                        className="w-full text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 text-center"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 sticky left-0 bg-secondary/30" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={activeCols.length + 3} className="px-4 py-12 text-center text-muted-foreground">
                      {activeTab === "completed" ? "لا يوجد عملاء أكملوا التسجيل" : "لا يوجد عملاء في انتظار إكمال التسجيل"}
                    </td>
                  </tr>
                ) : (
                  sorted.map((client, idx) => (
                    <tr
                      key={client.id}
                      className={cn(
                        "border-b border-border hover:bg-secondary/20 transition-colors",
                        selectedIds.includes(client.id) && "bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <input type="checkbox" checked={selectedIds.includes(client.id)} onChange={() => toggleOne(client.id)} className="w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{idx + 1}</td>

                      {activeTab === "completed" ? (
                        <>
                          <td className="px-3 py-2.5 text-center font-medium text-foreground border-l border-border">{client.company_name}</td>
                          <td className="px-3 py-2.5 text-center border-l border-border">{client.owner_name}</td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{client.email}</td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{client.owners?.[0]?.mobile || client.phone || "-"}</td>
                          <td className="px-3 py-2.5 text-center border-l border-border">{getWorkspacesCount(client.email)}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">
                            {formatDate(client.join_date || client.created_date)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">
                            {client.data_completed_date ? formatDate(client.data_completed_date) : "-"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-center border-l border-border">{client.owner_name || "-"}</td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{client.email}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">
                            {formatDate(client.created_date)}
                          </td>
                        </>
                      )}

                      <td className="px-3 py-2.5 sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPanel({ open: true, id: client.id })}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title="تعديل"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate([client.id]); }}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide Panel - تعديل عميل */}
      <SlidePanel open={panel.open} onClose={() => setPanel({ open: false, id: null })}>
        <PlatformClientForm
          embeddedId={panel.id}
          onClose={() => setPanel({ open: false, id: null })}
          onSaved={() => queryClient.invalidateQueries(["platformClients"])}
        />
      </SlidePanel>

      {/* Slide Panel - تفاصيل طلب التعديل */}
      <SlidePanel open={requestPanel.open} onClose={() => setRequestPanel({ open: false, request: null })}>
        <UpdateRequestDetails
          request={requestPanel.request}
          onClose={() => setRequestPanel({ open: false, request: null })}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["clientUpdateRequests"] })}
        />
      </SlidePanel>
    </motion.div>
  );
}