import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UserCheck, UserPlus, Trash2, Search, Shield,
  Users, Crown, ChevronUp, ChevronDown, AlertTriangle,
  CheckSquare, Square, Mail, ShoppingCart, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SlidePanel from "@/components/superadmin/SlidePanel";

const roleLabels = { owner: "مالك", admin: "مشرف", member: "عضو" };
const roleColors = {
  owner: "text-yellow-700 bg-yellow-50 border-yellow-200",
  admin: "text-blue-700 bg-blue-50 border-blue-200",
  member: "text-gray-700 bg-gray-50 border-gray-200"
};

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const HH = dt.getHours();
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  const ampm = HH >= 12 ? "م" : "ص";
  const hh = String(HH % 12 || 12).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} - ${hh}:${min}:${ss} ${ampm}`;
};

export default function UsersAndPermissions() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const [panel, setPanel] = useState({ open: false });
  const [additionalPanel, setAdditionalPanel] = useState({ open: false });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me()
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("join_date");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState([]);

  // جلب الأعضاء - الـ RLS يسمح الآن بـ created_by أيضاً
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["workspaceMembers", selectedWorkspace?.id],
    queryFn: () => base44.entities.WorkspaceMember.filter({ workspace_id: selectedWorkspace?.id }),
    enabled: !!selectedWorkspace?.id
  });

  // جلب باقة المساحة الحالية
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["workspaceSubscription", selectedWorkspace?.id],
    queryFn: () => base44.entities.SubscriptionRecord.filter({
      workspace_id: selectedWorkspace?.id,
      type: "plan",
      status: "active"
    }),
    enabled: !!selectedWorkspace?.id
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.Plan.list()
  });

  // حساب الحد الأقصى مع الأخذ بعين الاعتبار المستخدمين الإضافيين المدفوعين
  const activeSub = subscriptions[0];
  const activePlan = activeSub ? plans.find(p => p.id === activeSub.plan_id) : plans.find(p => p.is_free);
  const baseMaxUsers = activePlan?.max_users || 0; // 0 = غير محدود
  const additionalUsersPaid = selectedWorkspace?.additional_users_count || 0;
  const maxUsers = baseMaxUsers > 0 ? baseMaxUsers + additionalUsersPaid : 0;
  const currentCount = members.length;
  const isAtLimit = maxUsers > 0 && currentCount >= maxUsers;
  const allowAdditional = activePlan?.allow_additional_users === true;
  const additionalPriceMonthly = activePlan?.additional_user_price_monthly || 0;
  const additionalPriceYearly = activePlan?.additional_user_price_yearly || 0;

  // حذف عضو
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceMember.delete(id),
    onSuccess: () => {
      toast({ title: "تم", description: "تم حذف العضو" });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers", selectedWorkspace?.id] });
      setSelected([]);
    }
  });

  // تغيير الدور
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.WorkspaceMember.update(id, { role }),
    onSuccess: () => {
      toast({ title: "تم", description: "تم تحديث الدور" });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers", selectedWorkspace?.id] });
    }
  });

  // حذف جماعي
  const bulkDelete = () => {
    if (!window.confirm(`هل تريد حذف ${selected.length} عضو؟`)) return;
    Promise.all(selected.map(id => base44.entities.WorkspaceMember.delete(id))).then(() => {
      toast({ title: "تم", description: `تم حذف ${selected.length} عضو` });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers", selectedWorkspace?.id] });
      setSelected([]);
    });
  };

  // فلترة وترتيب
  const filtered = members
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.member_email?.toLowerCase().includes(q) || m.member_name?.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || m.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      let va = a[sortField] || "";
      let vb = b[sortField] || "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(m => m.id));

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  if (!selectedWorkspace) {
    return (
      <div dir="rtl" className="p-6 text-center text-muted-foreground">
        يرجى اختيار مساحة عمل أولاً
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <UserCheck size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">المستخدمون والصلاحيات</h1>
          <p className="text-sm text-muted-foreground">إدارة أعضاء مساحة العمل: {selectedWorkspace.name}</p>
        </div>
      </div>

      {/* بطاقة الحد */}
      <div className={`p-4 rounded-xl border-2 ${isAtLimit ? "border-red-300 bg-red-50" : "border-border bg-card"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isAtLimit ? "bg-red-100" : "bg-primary/10"}`}>
            <Users size={18} className={isAtLimit ? "text-red-600" : "text-primary"} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              {currentCount} / {maxUsers > 0 ? maxUsers : "∞"} مستخدم
              {additionalUsersPaid > 0 && (
                <span className="mr-2 text-xs text-primary font-normal">(الأساسي: {baseMaxUsers} + مدفوع: {additionalUsersPaid})</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              الباقة الحالية: <span className="font-semibold">{activePlan?.name || "مجانية"}</span>
              {maxUsers > 0 && isAtLimit && (
                <span className="text-red-600 font-semibold mr-2">— وصلت للحد الأقصى</span>
              )}
            </p>
          </div>
          {isAtLimit && !allowAdditional && (
            <div className="flex items-center gap-1 text-red-600 text-xs font-semibold">
              <AlertTriangle size={14} />
              ترقية الباقة مطلوبة
            </div>
          )}
        </div>

        {/* خيار شراء مستخدمين إضافيين */}
        {isAtLimit && allowAdditional && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-start gap-3 bg-white/70 rounded-lg p-3 border border-red-200">
              <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground mb-1">يمكنك إضافة مستخدمين إضافيين مدفوعين</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  {additionalPriceMonthly > 0 && (
                    <span>شهري: <span className="font-bold text-primary">{additionalPriceMonthly} ر.س</span> / مستخدم</span>
                  )}
                  {additionalPriceYearly > 0 && (
                    <span>سنوي: <span className="font-bold text-primary">{additionalPriceYearly} ر.س</span> / مستخدم</span>
                  )}
                </div>
                <button
                  onClick={() => setAdditionalPanel({ open: true })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <ShoppingCart size={12} />
                  شراء مستخدمين إضافيين
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* شريط الأدوات */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            if (isAtLimit && !allowAdditional) {
              toast({ title: "تنبيه", description: `وصلت للحد الأقصى (${maxUsers} مستخدم). يرجى ترقية الباقة.`, variant: "destructive" });
              return;
            }
            if (isAtLimit && allowAdditional) {
              setAdditionalPanel({ open: true });
              return;
            }
            setPanel({ open: true });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isAtLimit && !allowAdditional
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          <UserPlus size={15} />
          {isAtLimit && allowAdditional ? "شراء مستخدمين إضافيين" : "دعوة عضو جديد"}
        </button>

        {selected.length > 0 && (
          <button
            onClick={bulkDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-white hover:opacity-90"
          >
            <Trash2 size={15} />
            حذف المحدد ({selected.length})
          </button>
        )}

        {/* فلاتر */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="relative">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              className="border border-border rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            dir="rtl"
          >
            <option value="all">كل الأدوار</option>
            <option value="owner">مالك</option>
            <option value="admin">مشرف</option>
            <option value="member">عضو</option>
          </select>
        </div>
      </div>

      {/* الجدول */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Users size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">لا يوجد أعضاء</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                  <th className="text-center px-3 py-3 border-l border-border w-10">
                    <button onClick={toggleAll}>
                      {selected.length === filtered.length && filtered.length > 0
                        ? <CheckSquare size={16} className="text-primary mx-auto" />
                        : <Square size={16} className="text-muted-foreground mx-auto" />}
                    </button>
                    <span className="text-[10px] text-muted-foreground block">{selected.length > 0 ? selected.length : ""}</span>
                  </th>
                  <th className="text-center font-semibold px-3 py-3 border-l border-border">#</th>
                  <th className="text-center font-semibold px-3 py-3 border-l border-border cursor-pointer" onClick={() => toggleSort("member_name")}>
                    <div className="flex items-center justify-center gap-1">الاسم <SortIcon field="member_name" /></div>
                  </th>
                  <th className="text-center font-semibold px-3 py-3 border-l border-border cursor-pointer" onClick={() => toggleSort("member_email")}>
                    <div className="flex items-center justify-center gap-1">البريد الإلكتروني <SortIcon field="member_email" /></div>
                  </th>
                  <th className="text-center font-semibold px-3 py-3 border-l border-border cursor-pointer" onClick={() => toggleSort("role")}>
                    <div className="flex items-center justify-center gap-1">الدور <SortIcon field="role" /></div>
                  </th>
                  <th className="text-center font-semibold px-3 py-3 border-l border-border cursor-pointer" onClick={() => toggleSort("join_date")}>
                    <div className="flex items-center justify-center gap-1">تاريخ الانضمام <SortIcon field="join_date" /></div>
                  </th>
                  <th className="text-center font-semibold px-3 py-3 sticky left-0 bg-inherit">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((m, i) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-t border-border transition-colors ${selected.includes(m.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    >
                      <td className="text-center px-3 py-3 border-l border-border">
                        <button onClick={() => toggleSelect(m.id)}>
                          {selected.includes(m.id)
                            ? <CheckSquare size={16} className="text-primary mx-auto" />
                            : <Square size={16} className="text-muted-foreground mx-auto" />}
                        </button>
                      </td>
                      <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{i + 1}</td>
                      <td className="text-center px-3 py-3 border-l border-border">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            {m.role === "owner" ? <Crown size={13} className="text-yellow-600" /> : <UserCheck size={13} className="text-primary" />}
                          </div>
                          <span className="font-semibold text-foreground">{m.member_name || "-"}</span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{m.member_email || "-"}</td>
                      <td className="text-center px-3 py-3 border-l border-border">
                        {m.role === "owner" ? (
                          <Badge variant="outline" className={`text-[10px] ${roleColors[m.role]}`}>{roleLabels[m.role]}</Badge>
                        ) : (
                          <select
                            value={m.role}
                            onChange={e => updateRoleMutation.mutate({ id: m.id, role: e.target.value })}
                            className="border border-border rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                            dir="rtl"
                          >
                            <option value="admin">مشرف</option>
                            <option value="member">عضو</option>
                          </select>
                        )}
                      </td>
                      <td className="text-center px-3 py-3 border-l border-border text-xs text-muted-foreground">{formatDate(m.join_date || m.created_date)}</td>
                      <td className="text-center px-3 py-3 sticky left-0 bg-card border-t border-border">
                        {m.role !== "owner" && (
                          <button
                            onClick={() => deleteMutation.mutate(m.id)}
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SlidePanel - دعوة عضو */}
      <SlidePanel open={panel.open} onClose={() => setPanel({ open: false })}>
        <InviteMemberForm
          workspaceId={selectedWorkspace?.id}
          workspaceName={selectedWorkspace?.name}
          ownerEmail={selectedWorkspace?.owner_email || currentUser?.email}
          maxUsers={maxUsers}
          currentCount={currentCount}
          onClose={() => setPanel({ open: false })}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["workspaceMembers", selectedWorkspace?.id] });
            setPanel({ open: false });
          }}
        />
      </SlidePanel>

      {/* SlidePanel - شراء مستخدمين إضافيين */}
      <SlidePanel open={additionalPanel.open} onClose={() => setAdditionalPanel({ open: false })}>
        <AdditionalUsersPanel
          workspace={selectedWorkspace}
          activePlan={activePlan}
          additionalPriceMonthly={additionalPriceMonthly}
          additionalPriceYearly={additionalPriceYearly}
          currentAdditional={additionalUsersPaid}
          onClose={() => setAdditionalPanel({ open: false })}
          onPaid={() => {
            setAdditionalPanel({ open: false });
            setPanel({ open: true });
          }}
          navigate={navigate}
        />
      </SlidePanel>
    </div>
  );
}

// ─── لوحة شراء مستخدمين إضافيين ───
function AdditionalUsersPanel({ workspace, activePlan, additionalPriceMonthly, additionalPriceYearly, currentAdditional, onClose, navigate }) {
  const [qty, setQty] = useState(1);
  const [billing, setBilling] = useState("monthly");

  const pricePerUser = billing === "yearly" ? additionalPriceYearly : additionalPriceMonthly;
  const totalPrice = pricePerUser * qty;

  const handlePay = () => {
    const params = new URLSearchParams({
      type: "additional_users",
      qty: qty.toString(),
      billing,
      price: totalPrice.toString(),
      workspaceId: workspace?.id || "",
      workspaceName: workspace?.name || "",
      planName: activePlan?.name || ""
    });
    navigate(`/payment/checkout?${params}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 bg-card">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ShoppingCart size={18} className="text-primary" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">شراء مستخدمين إضافيين</h2>
          <p className="text-xs text-muted-foreground mt-0.5">مساحة العمل: {workspace?.name}</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* معلومات الباقة */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">الباقة الحالية</p>
          <p className="text-sm font-bold text-foreground">{activePlan?.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            المستخدمون الإضافيون المدفوعون حالياً: <span className="font-bold text-primary">{currentAdditional}</span>
          </p>
        </div>

        {/* اختيار دورة الفوترة */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">دورة الفوترة</p>
          <div className="grid grid-cols-2 gap-3">
            {additionalPriceMonthly > 0 && (
              <button
                onClick={() => setBilling("monthly")}
                className={`p-3 rounded-xl border-2 text-right transition-all ${billing === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <p className="text-sm font-bold text-foreground">شهري</p>
                <p className="text-xs text-muted-foreground mt-0.5">{additionalPriceMonthly} ر.س / مستخدم / شهر</p>
              </button>
            )}
            {additionalPriceYearly > 0 && (
              <button
                onClick={() => setBilling("yearly")}
                className={`p-3 rounded-xl border-2 text-right transition-all ${billing === "yearly" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-400"}`}
              >
                <p className="text-sm font-bold text-foreground">سنوي</p>
                <p className="text-xs text-muted-foreground mt-0.5">{additionalPriceYearly} ر.س / مستخدم / سنة</p>
              </button>
            )}
          </div>
        </div>

        {/* اختيار الكمية */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">عدد المستخدمين الإضافيين</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-lg font-bold"
            >−</button>
            <span className="text-2xl font-bold text-primary w-12 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-lg font-bold"
            >+</button>
          </div>
        </div>

        {/* ملخص السعر */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{qty} مستخدم × {pricePerUser} ر.س</span>
            <span className="font-semibold">{totalPrice} ر.س</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">دورة الفوترة</span>
            <span className="font-semibold">{billing === "yearly" ? "سنوي" : "شهري"}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-bold text-foreground">الإجمالي</span>
            <span className="text-xl font-bold text-primary">{totalPrice} ر.س</span>
          </div>
        </div>

        {/* زر الدفع */}
        <button
          onClick={handlePay}
          disabled={pricePerUser === 0}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          الدفع — {totalPrice} ر.س
        </button>

        <p className="text-xs text-muted-foreground text-center">
          بعد إتمام الدفع سيتم تحديث عدد المستخدمين المتاحين تلقائياً
        </p>
      </div>
    </motion.div>
  );
}

// ─── نموذج دعوة عضو ───
function InviteMemberForm({ workspaceId, workspaceName, ownerEmail, maxUsers, currentCount, onClose, onSaved }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);

  const remaining = maxUsers > 0 ? maxUsers - currentCount : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "خطأ", description: "البريد الإلكتروني مطلوب", variant: "destructive" });
      return;
    }
    if (maxUsers > 0 && currentCount >= maxUsers) {
      toast({ title: "تنبيه", description: `وصلت للحد الأقصى (${maxUsers} مستخدم). يرجى ترقية الباقة.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // فحص التكرار: هل العضو موجود مسبقاً في هذه المساحة؟
      const existing = await base44.entities.WorkspaceMember.filter({
        workspace_id: workspaceId,
        member_email: email.trim().toLowerCase()
      });
      if (existing && existing.length > 0) {
        toast({ title: "تنبيه", description: "هذا البريد الإلكتروني مضاف مسبقاً في مساحة العمل", variant: "destructive" });
        setSaving(false);
        return;
      }
      await base44.entities.WorkspaceMember.create({
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        owner_email: ownerEmail || "",
        member_email: email.trim().toLowerCase(),
        member_name: name.trim(),
        role,
        join_method: "invited",
        join_date: new Date().toISOString()
      });

      // إرسال إيميل الدعوة
      try {
        await base44.functions.invoke("sendMemberInvitation", {
          memberEmail: email.trim().toLowerCase(),
          memberName: name.trim(),
          workspaceName,
          ownerName: ownerEmail,
          role
        });
        toast({ title: "تم", description: "تمت إضافة العضو وإرسال دعوة إلكترونية إليه ✉️" });
      } catch {
        // الإضافة نجحت حتى لو فشل الإيميل
        toast({ title: "تم", description: "تمت إضافة العضو بنجاح (تعذر إرسال الإيميل)" });
      }

      onSaved?.();
    } catch (err) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 bg-card">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <UserPlus size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">دعوة عضو جديد</h2>
          <p className="text-xs text-muted-foreground mt-0.5">مساحة العمل: {workspaceName}</p>
        </div>
      </div>

      {/* تنبيه الحد */}
      {remaining !== null && (
        <div className={`mx-6 mt-4 p-3 rounded-lg border text-sm font-semibold flex items-center gap-2 ${remaining <= 2 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
          <Users size={15} />
          متبقي {remaining} مستخدم من أصل {maxUsers}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <Mail size={13} className="inline ml-1" />
            البريد الإلكتروني *
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@domain.com"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">الاسم</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="أدخل اسم العضو"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            <Shield size={13} className="inline ml-1" />
            الدور
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            dir="rtl"
          >
            <option value="admin">مشرف</option>
            <option value="member">عضو</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <UserPlus size={15} />
            {saving ? "جارٍ الحفظ..." : "دعوة العضو"}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}