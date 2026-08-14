import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const colorMap = {
  slate: { badge: "bg-slate-100 text-slate-700 border border-slate-200" },
  blue: { badge: "bg-blue-100 text-blue-700 border border-blue-200" },
  purple: { badge: "bg-purple-100 text-purple-700 border border-purple-200" },
  indigo: { badge: "bg-indigo-100 text-indigo-700 border border-indigo-200" },
};

const formatDatePlan = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "yyyy/MM/dd - hh:mm a", { locale: ar });
  } catch {
    return dateString;
  }
};

export default function PlansContent({ statusFilter, viewType = "table", onEdit }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showMenu, setShowMenu] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.Plan.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Plan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setConfirmDelete(null);
    },
  });

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "active", label: "مفعّلة" },
    { value: "inactive", label: "معطّلة" },
    { value: "free", label: "مجانية" },
    { value: "paid", label: "مدفوعة" },
  ];

  const sortOptions = [
    { value: "default", label: "الترتيب الافتراضي" },
    { value: "cheapest", label: "الأقل سعراً" },
    { value: "expensive", label: "الأعلى سعراً" },
    { value: "subscribers", label: "الأكثر مشتركين" },
    { value: "newest", label: "الأحدث" },
  ];

  const activeLabel = filterBy !== "all"
    ? filterOptions.find(f => f.value === filterBy)?.label
    : sortBy !== "default"
      ? sortOptions.find(s => s.value === sortBy)?.label
      : null;

  let filtered = [...plans].filter(p => {
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    const matchFilter = filterBy === "all" ? true :
      filterBy === "active" ? p.is_active :
      filterBy === "inactive" ? !p.is_active :
      filterBy === "free" ? p.is_free :
      filterBy === "paid" ? !p.is_free : true;
    return matchStatus && matchFilter;
  });

  if (sortBy === "cheapest") filtered.sort((a, b) => (a.monthly_price ?? 0) - (b.monthly_price ?? 0));
  else if (sortBy === "expensive") filtered.sort((a, b) => (b.monthly_price ?? 0) - (a.monthly_price ?? 0));
  else if (sortBy === "subscribers") filtered.sort((a, b) => (b.subscribers_count ?? 0) - (a.subscribers_count ?? 0));
  else if (sortBy === "newest") filtered.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  else filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filter Bar */}
      {viewType !== "cards" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{filtered.length} باقة</p>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-semibold transition-colors",
                activeLabel ? "bg-primary/10 border-primary text-primary" : "bg-secondary border-border text-foreground hover:bg-secondary/80"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 12h8M12 18h4"/></svg>
              {activeLabel && <span className="max-w-[60px] truncate">{activeLabel}</span>}
            </button>

            {showMenu && (
              <div className="absolute z-50 left-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-xl flex flex-col" style={{ maxHeight: "220px" }}>
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/40 border-b border-border flex-shrink-0">
                  <span>تصفية</span>
                  <button onClick={() => { setFilterBy("all"); setSortBy("default"); setShowMenu(false); }} className="text-red-600 hover:text-red-700 text-xs">🗑️</button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filterOptions.map(opt => (
                    <button key={opt.value} onClick={() => { setFilterBy(opt.value); setShowMenu(false); }}
                      className={cn("w-full text-right px-4 py-2 text-xs flex items-center justify-between transition-colors border-b border-border/30",
                        filterBy === opt.value ? "bg-violet-50 text-primary font-semibold" : "hover:bg-secondary/40")}
                    >
                      {opt.label}
                      {filterBy === opt.value && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/40 border-b border-border">ترتيب</div>
                  {sortOptions.map(opt => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowMenu(false); }}
                      className={cn("w-full text-right px-4 py-2 text-xs flex items-center justify-between transition-colors border-b border-border/30 last:border-0",
                        sortBy === opt.value ? "bg-violet-50 text-primary font-semibold" : "hover:bg-secondary/40")}
                    >
                      {opt.label}
                      {sortBy === opt.value && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards View */}
      {!isLoading && viewType === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">لا توجد باقات</div>
          ) : filtered.map((plan) => {
            const colors = colorMap[plan.color] || colorMap.blue;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                {plan.is_popular && (
                  <div className="bg-tabsActive text-white text-center text-xs font-bold py-1.5">{plan.popular_label || "الأكثر شيوعاً"}</div>
                )}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", colors.badge)}>{plan.name}</span>
                    {plan.is_active
                      ? <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">مفعّل</span>
                      : <span className="text-red-500 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">معطّل</span>}
                  </div>
                  {plan.description && <p className="text-xs text-muted-foreground text-right">{plan.description}</p>}
                  <div className="border border-border rounded-lg p-3 space-y-2 bg-secondary/20">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-primary">{plan.monthly_price ?? 0} ر.س</span>
                      <span className="text-muted-foreground">شهري</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-border pt-2">
                      <span className="font-semibold text-primary">{plan.yearly_price ?? 0} ر.س</span>
                      <span className="text-muted-foreground">سنوي</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-secondary/40 rounded-lg p-2">
                      <div className="font-bold text-foreground">{plan.max_users || "∞"}</div>
                      <div className="text-muted-foreground">مستخدم</div>
                    </div>
                    <div className="bg-secondary/40 rounded-lg p-2">
                      <div className="font-bold text-foreground">{plan.subscribers_count || 0}</div>
                      <div className="text-muted-foreground">مشترك</div>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-border">
                  <button onClick={() => onEdit ? onEdit(plan.id) : navigate(`/plan-form?id=${plan.id}`)}
                    className="flex-1 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border-l border-border flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    تعديل
                  </button>
                  <button onClick={() => setConfirmDelete(plan)}
                    className="flex-1 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    حذف
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {isLoading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : viewType === "table" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">#</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">اسم الباقة</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">السعر الشهري</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">السعر السنوي</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">المستخدمون</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">المشتركون</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">الحالة</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">افتراضية</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground sticky left-0 bg-secondary/50">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">لا توجد باقات</td></tr>
                ) : filtered.map((plan, idx) => {
                  const colors = colorMap[plan.color] || colorMap.blue;
                  return (
                    <tr key={plan.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                      <td className="px-4 py-3 text-center border-l border-border">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", colors.badge)}>{plan.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center border-l border-border">{plan.is_free ? "مجاني" : `${plan.monthly_price ?? 0} ر.س`}</td>
                      <td className="px-4 py-3 text-center border-l border-border">{plan.is_free ? "مجاني" : `${plan.yearly_price ?? 0} ر.س`}</td>
                      <td className="px-4 py-3 text-center border-l border-border">{plan.max_users || "∞"}</td>
                      <td className="px-4 py-3 text-center border-l border-border">{plan.subscribers_count || 0}</td>
                      <td className="px-4 py-3 text-center border-l border-border">
                        {plan.is_active
                          ? <span className="text-green-600 text-xs font-semibold">✓ مفعّل</span>
                          : <span className="text-red-500 text-xs font-semibold">✗ معطّل</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-l border-border">
                        {plan.is_default
                          ? <span className="text-blue-600 text-xs font-semibold">✓ افتراضية</span>
                          : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">{formatDatePlan(plan.created_date)}</td>
                      <td className="px-4 py-3 sticky left-0 bg-card">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onEdit ? onEdit(plan.id) : navigate(`/plan-form?id=${plan.id}`)} className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="تعديل">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setConfirmDelete(plan)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="حذف">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center justify-between" dir="rtl">
          <span className="text-sm text-foreground">هل أنت متأكد من حذف باقة <span className="font-bold">"{confirmDelete.name}"</span>؟</span>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">إلغاء</button>
            <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending} className="px-4 py-1.5 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {deleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}