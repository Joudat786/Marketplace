import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronDown, ChevronUp, Settings, Package, CheckCircle, AlertTriangle, Trash2, Search, SlidersHorizontal, ArrowUpDown, Save, X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import SlidePanel from "@/components/superadmin/SlidePanel";
import AppForm from "./AppForm";
import PlanForm from "./PlanForm";
import AppSortPanel from "@/components/superadmin/AppSortPanel";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/components/ui/use-toast";
import { AppVideoPlayer } from "@/components/apps/AppVideoSection";
import CategorySelectionPanel from "@/components/superadmin/CategorySelectionPanel";
import BulkActionsPanel from "@/components/superadmin/BulkActionsPanel";
import FilterPanel from "@/components/superadmin/FilterPanel";
import PlansContent from "@/components/superadmin/app-manager/PlansContent.jsx";


const categoryLabels = {
  "محاسبة": "محاسبة",
  "شؤون": "شؤون",
  "مبيعات": "مبيعات",
  "موارد بشرية": "موارد بشرية",
  "أخرى": "أخرى"
};

function FilterAccordion({ title, value, activeLabel, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{title}</span>
          {value !== "all" && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">{activeLabel}</span>
          )}
        </div>
        <svg className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="px-3 py-3 space-y-1.5 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

function AppFilterGroups({ filterValues, setFilterValues, dbCategories = [] }) {
  const readyLabels = { all: "الكل", ready: "✅ جاهز", not_ready: "🔜 قريباً" };
  const freeLabels = { all: "الكل", free: "مجاني", paid: "مدفوع" };
  const typeLabels = { all: "الكل", ui: "واجهة (UI)", service: "خدمة خلفية" };
  const categoryStatusLabels = { all: "الكل", uncategorized: "🗂️ غير مصنفة" };
  const isAddonLabels = { all: "الكل", yes: "✅ إضافة (Add-on)", no: "❌ تطبيق رئيسي" };
  const shortDescLabels = { all: "الكل", has: "✅ لها وصف مختصر", none: "❌ ليس لها وصف مختصر" };
  const descLabels = { all: "الكل", has: "✅ لها وصف تفصيلي", none: "❌ ليس لها وصف تفصيلي" };
  const videoLabels = { all: "الكل", has: "✅ لها فيديو توضيحي", none: "❌ ليس لها فيديو توضيحي" };
  const iconLabels = { all: "الكل", has: "✅ لها أيقونة", none: "❌ ليس لها أيقونة" };
  const trialLabels = { all: "الكل", yes: "✅ لها فترة تجربة", no: "❌ لا تملك فترة تجربة" };
  const superAdminLabels = { all: "الكل", yes: "✅ يمكنه التثبيت", no: "❌ لا يمكنه التثبيت" };
  const clientsInstallLabels = { all: "الكل", yes: "✅ يمكنهم التثبيت", no: "❌ لا يمكنهم التثبيت" };
  const visibilityLabels = { all: "الكل", all_vis: "🌐 ظاهر للجميع", restricted: "🔒 مع قيود", hidden: "🙈 مخفي" };
  const customNameLabels = { all: "الكل", yes: "✅ مسموح بتخصيص الاسم", no: "❌ غير مسموح" };
  const customIconLabels = { all: "الكل", yes: "✅ مسموح بتخصيص الأيقونة", no: "❌ غير مسموح" };

  const renderOptions = (field, labels) => Object.entries(labels).map(([val, label]) => (
    <button key={val} onClick={() => setFilterValues(p => ({ ...p, [field]: val }))}
      className={cn("w-full px-3 py-2 rounded-lg border text-sm font-semibold text-right transition-all",
        (filterValues[field] || "all") === val ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-foreground")}
    >{label}</button>
  ));

  const activeCats = dbCategories.filter(c => c.is_active);
  const selectedCatIds = filterValues.filter_categories || [];
  const selectedPrimaryIds = filterValues.filter_primary_categories || [];

  // مكوّن مساعد لتصنيفات متعددة الاختيار
  const MultiCatAccordion = ({ title, field, selectedIds }) => (
    <FilterAccordion
      title={title}
      value={selectedIds.length > 0 ? "active" : "all"}
      activeLabel={selectedIds.length > 0 ? `${selectedIds.length} تصنيف` : null}
    >
      <div className="space-y-1.5">
        <button onClick={() => setFilterValues(p => ({ ...p, [field]: [] }))}
          className={cn("w-full px-3 py-2 rounded-lg border text-sm font-semibold text-right transition-all",
            selectedIds.length === 0 ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-foreground")}
        >الكل</button>
        {activeCats.map(cat => (
          <button key={cat.id}
            onClick={() => {
              const updated = selectedIds.includes(cat.id)
                ? selectedIds.filter(id => id !== cat.id)
                : [...selectedIds, cat.id];
              setFilterValues(p => ({ ...p, [field]: updated }));
            }}
            className={cn("w-full px-3 py-2 rounded-lg border text-sm font-semibold text-right transition-all flex items-center justify-between",
              selectedIds.includes(cat.id) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-foreground")}
          >
            <span>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</span>
            {selectedIds.includes(cat.id) && <span>✓</span>}
          </button>
        ))}
      </div>
    </FilterAccordion>
  );

  // مكوّن مساعد لنطاق السعر
  const PriceRangeAccordion = ({ title, minField, maxField }) => {
    const minVal = filterValues[minField] || "";
    const maxVal = filterValues[maxField] || "";
    return (
      <FilterAccordion
        title={title}
        value={(minVal !== "" || maxVal !== "") ? "active" : "all"}
        activeLabel={(minVal !== "" || maxVal !== "") ? `${minVal || 0} — ${maxVal || "∞"}` : null}
      >
        <div className="flex gap-2 items-center">
          <input type="number" min="0" placeholder="من" value={minVal}
            onChange={e => setFilterValues(p => ({ ...p, [minField]: e.target.value }))}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input type="number" min="0" placeholder="إلى" value={maxVal}
            onChange={e => setFilterValues(p => ({ ...p, [maxField]: e.target.value }))}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
          />
        </div>
        <button onClick={() => setFilterValues(p => ({ ...p, [minField]: "", [maxField]: "" }))}
          className="w-full mt-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg hover:border-destructive transition-colors">
          مسح
        </button>
      </FilterAccordion>
    );
  };

  return (
    <div className="space-y-3">
      {/* ─── الترتيب يطابق تبويبات نموذج التطبيق ─── */}

      {/* 1. المعلومات الأساسية → الوصف المختصر */}
      <FilterAccordion title="الوصف المختصر" value={filterValues.short_desc || "all"} activeLabel={shortDescLabels[filterValues.short_desc || "all"]}>
        {renderOptions("short_desc", shortDescLabels)}
      </FilterAccordion>

      {/* 2. الوصف التفصيلي */}
      <FilterAccordion title="الوصف التفصيلي" value={filterValues.full_desc || "all"} activeLabel={descLabels[filterValues.full_desc || "all"]}>
        {renderOptions("full_desc", descLabels)}
      </FilterAccordion>

      {/* 3. الفيديو التوضيحي */}
      <FilterAccordion title="الفيديو التوضيحي" value={filterValues.has_video || "all"} activeLabel={videoLabels[filterValues.has_video || "all"]}>
        {renderOptions("has_video", videoLabels)}
      </FilterAccordion>

      {/* 4. أيقونة التطبيق */}
      <FilterAccordion title="أيقونة التطبيق" value={filterValues.has_icon || "all"} activeLabel={iconLabels[filterValues.has_icon || "all"]}>
        {renderOptions("has_icon", iconLabels)}
      </FilterAccordion>

      {/* 5. نوع التطبيق (UI / Service) */}
      <FilterAccordion title="نوع التطبيق" value={filterValues.app_type || "all"} activeLabel={typeLabels[filterValues.app_type || "all"]}>
        {renderOptions("app_type", typeLabels)}
      </FilterAccordion>

      {/* 6. هل هو إضافة (Add-on) */}
      <FilterAccordion title="هل هو إضافة (Add-on)؟" value={filterValues.is_addon_filter || "all"} activeLabel={isAddonLabels[filterValues.is_addon_filter || "all"]}>
        {renderOptions("is_addon_filter", isAddonLabels)}
      </FilterAccordion>

      {/* 7. حالة التطبيق */}
      <FilterAccordion title="حالة التطبيق" value={filterValues.is_ready || "all"} activeLabel={readyLabels[filterValues.is_ready || "all"]}>
        {renderOptions("is_ready", readyLabels)}
      </FilterAccordion>

      {/* 7.5. التطبيقات غير المصنفة */}
      <FilterAccordion title="حالة التصنيف" value={filterValues.category_status || "all"} activeLabel={categoryStatusLabels[filterValues.category_status || "all"]}>
        {renderOptions("category_status", categoryStatusLabels)}
      </FilterAccordion>

      {/* 8. التصنيفات */}
      <MultiCatAccordion title="التصنيفات" field="filter_categories" selectedIds={selectedCatIds} />

      {/* 9. التصنيف الرئيسي */}
      <MultiCatAccordion title="التصنيف الرئيسي" field="filter_primary_categories" selectedIds={selectedPrimaryIds} />

      {/* 10. نوع التسعير */}
      <FilterAccordion title="نوع التسعير" value={filterValues.is_free || "all"} activeLabel={freeLabels[filterValues.is_free || "all"]}>
        {renderOptions("is_free", freeLabels)}
      </FilterAccordion>

      {/* 11. السعر الشهري */}
      <PriceRangeAccordion title="السعر الشهري" minField="monthly_min" maxField="monthly_max" />

      {/* 12. السعر السنوي */}
      <PriceRangeAccordion title="السعر السنوي" minField="yearly_min" maxField="yearly_max" />

      {/* 13. فترة التجربة */}
      <FilterAccordion title="فترة التجربة" value={filterValues.has_trial || "all"} activeLabel={trialLabels[filterValues.has_trial || "all"]}>
        {renderOptions("has_trial", trialLabels)}
      </FilterAccordion>

      {/* 14. صلاحية: السوبر آدمن */}
      <FilterAccordion title="صلاحية: السوبر آدمن" value={filterValues.super_admin_install || "all"} activeLabel={superAdminLabels[filterValues.super_admin_install || "all"]}>
        {renderOptions("super_admin_install", superAdminLabels)}
      </FilterAccordion>

      {/* 15. صلاحية: العملاء (التثبيت) */}
      <FilterAccordion title="صلاحية: العملاء (التثبيت)" value={filterValues.clients_install || "all"} activeLabel={clientsInstallLabels[filterValues.clients_install || "all"]}>
        {renderOptions("clients_install", clientsInstallLabels)}
      </FilterAccordion>

      {/* 16. طريقة الظهور في المتجر */}
      <FilterAccordion title="طريقة الظهور في المتجر" value={filterValues.visibility_mode_filter || "all"} activeLabel={visibilityLabels[filterValues.visibility_mode_filter || "all"]}>
        {renderOptions("visibility_mode_filter", visibilityLabels)}
      </FilterAccordion>

      {/* 17. تخصيص: الاسم */}
      <FilterAccordion title="تخصيص: السماح بتغيير الاسم" value={filterValues.allow_custom_name_filter || "all"} activeLabel={customNameLabels[filterValues.allow_custom_name_filter || "all"]}>
        {renderOptions("allow_custom_name_filter", customNameLabels)}
      </FilterAccordion>

      {/* 18. تخصيص: الأيقونة */}
      <FilterAccordion title="تخصيص: السماح بتغيير الأيقونة" value={filterValues.allow_custom_icon_filter || "all"} activeLabel={customIconLabels[filterValues.allow_custom_icon_filter || "all"]}>
        {renderOptions("allow_custom_icon_filter", customIconLabels)}
      </FilterAccordion>
    </div>
  );
}

export default function AppManager() {
  const searchParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "plans" ? "plans" : "apps");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { headerSearch = "", plansViewType = "table", appsViewType = "cards", setPlansViewType, setAppsViewType, setToolbarActions, setSelectedCount, setToolbarCustomItems, setAppManagerActiveTab } = useOutletContext() || {};
  const navigate = useNavigate();
  const [appPanel, setAppPanel] = useState({ open: false, appId: null });
  const [planPanel, setPlanPanel] = useState({ open: false, planId: null });
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [categoryPanel, setCategoryPanel] = useState({ open: false });
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkActionPanel, setBulkActionPanel] = useState({ open: false, action: null });
  const [bulkActionData, setBulkActionData] = useState({});
  const [filterPanel, setFilterPanel] = useState(false);
  const [sortPanel, setSortPanel] = useState({ open: false, categoryName: null });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showAddonsInGrid, setShowAddonsInGrid] = useState(false);

  const defaultFilters = {
    is_active: "all", is_ready: "all", is_free: "all", app_type: "all",
    category_status: "all", is_addon_filter: "all", short_desc: "all", full_desc: "all", has_video: "all", has_icon: "all",
    filter_categories: [], filter_primary_categories: [],
    monthly_min: "", monthly_max: "", yearly_min: "", yearly_max: "",
    has_trial: "all", super_admin_install: "all", clients_install: "all",
    visibility_mode_filter: "all", allow_custom_name_filter: "all", allow_custom_icon_filter: "all"
  };
  const [filterValues, setFilterValues] = useState({ ...defaultFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...defaultFilters });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: () => base44.entities.App.list()
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => base44.entities.AppCategory.list(),
    enabled: activeTab === "apps",
    select: (data) => [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  });

  // تحديث الفئات المفتوحة عند تحميل dbCategories
  useEffect(() => {
    if (dbCategories.length > 0) {
      const activeIds = new Set(dbCategories.filter(c => c.is_active).map(c => c.id));
      setExpandedCategories(activeIds);
    }
  }, [dbCategories]);

  // دالة لتحويل ID إلى اسم - ترجع null إذا لم يوجد التصنيف
  const convertCategoryToName = (cat) => {
    if (!cat) return null;
    // إذا كان ID، حول إلى اسم
    const byId = dbCategories.find(c => c.id === cat);
    if (byId) return byId.name;
    // إذا كان اسماً موجوداً في قاعدة البيانات
    const byName = dbCategories.find(c => c.name === cat);
    if (byName) return byName.name;
    // التصنيف غير موجود - تجاهله
    return null;
  };

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.App.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apps"] })
  });



  const addToCategoryMutation = useMutation({
    mutationFn: ({ appIds, categoryId }) => {
      // تحويل ID إلى اسم
      const categoryName = dbCategories.find(c => c.id === categoryId)?.name || categoryId;
      return Promise.all(
        appIds.map(appId => {
          const app = apps.find(a => a.id === appId);
          if (!app) return Promise.resolve();
          const existingCats = Array.isArray(app.categories) ? app.categories : [];
          // تأكد أن القيم المخزنة هي أسماء وليست IDs
          const normalizedCats = existingCats.map(c => dbCategories.find(dc => dc.id === c)?.name || c);
          const updatedCategories = Array.from(new Set([...normalizedCats, categoryName]));
          return base44.entities.App.update(appId, { categories: updatedCategories });
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedApps(new Set());
      setCategoryPanel({ open: false });
      toast({ title: "✓", description: "تم إضافة التطبيقات إلى التصنيف بنجاح" });
    },
    onError: (error) => toast({ title: "خطأ", description: error.message, variant: "destructive" })
  });

  // إجراءات جماعية
  // تحديث جماعي شامل
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updateData) => {
      const updateFields = {};
      if (updateData.is_addon !== null) updateFields.is_addon = updateData.is_addon;
      if (updateData.parent_app_ids.length > 0) updateFields.parent_app_ids = updateData.parent_app_ids;
      if (updateData.is_active !== null) updateFields.is_active = updateData.is_active;
      if (updateData.is_ready !== null) updateFields.is_ready = updateData.is_ready;
      if (updateData.categories.length > 0) updateFields.categories = updateData.categories.map(id => dbCategories.find(c => c.id === id)?.name || id);
      if (updateData.primary_category) updateFields.primary_category = dbCategories.find(c => c.id === updateData.primary_category)?.name || updateData.primary_category;
      if (updateData.is_free !== null) updateFields.is_free = updateData.is_free;
      if (updateData.currency) updateFields.currency = updateData.currency;
      if (updateData.monthly_price !== null) updateFields.monthly_price = updateData.monthly_price;
      if (updateData.yearly_price !== null) updateFields.yearly_price = updateData.yearly_price;
      if (updateData.has_trial !== null) updateFields.has_trial = updateData.has_trial;
      if (updateData.trial_days) updateFields.trial_days = updateData.trial_days;
      if (updateData.super_admin_can_install !== null) updateFields.super_admin_can_install = updateData.super_admin_can_install;
      if (updateData.clients_can_install !== null) updateFields.clients_can_install = updateData.clients_can_install;
      if (updateData.visibility_mode !== null) updateFields.visibility_mode = updateData.visibility_mode;
      if (updateData.allow_custom_name !== null) updateFields.allow_custom_name = updateData.allow_custom_name;
      if (updateData.allow_custom_icon !== null) updateFields.allow_custom_icon = updateData.allow_custom_icon;

      return Promise.all(Array.from(selectedApps).map(appId => base44.entities.App.update(appId, updateFields)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedApps(new Set());
      setSelectionMode(false);
      setBulkActionPanel({ open: false, action: null });
      toast({ title: "✓", description: "تم تحديث التطبيقات بنجاح" });
    },
    onError: (error) => toast({ title: "خطأ", description: error.message, variant: "destructive" })
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (appIds) => Promise.all(appIds.map(id => base44.entities.App.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setSelectedApps(new Set());
      setSelectionMode(false);
      setBulkActionPanel({ open: false, action: null });
      toast({ title: "✓", description: "تم حذف التطبيقات بنجاح" });
    }
  });

  // بناء خريطة من جميع التطبيقات (رئيسية + إضافات) مع children
  const appsMap = new Map();
  
  // أولاً: أضف جميع التطبيقات للخريطة
  apps.forEach(app => {
    appsMap.set(app.id, { ...app, children: [] });
  });

  // ثانياً: ربط كل إضافة بآبائها
  apps.forEach(app => {
    if (app.is_addon) {
      const parentIds = (app.parent_app_ids && app.parent_app_ids.length > 0)
        ? app.parent_app_ids
        : (app.parent_app_id ? [app.parent_app_id] : []);
      parentIds.forEach(parentId => {
        if (appsMap.has(parentId)) {
          appsMap.get(parentId).children.push(appsMap.get(app.id));
        }
      });
    }
  });

  // الإضافات اليتيمة (is_addon=true لكن بدون أي أب موجود في النظام)
  const orphanAddons = apps.filter(app => {
    if (!app.is_addon) return false;
    const parentIds = (app.parent_app_ids && app.parent_app_ids.length > 0)
      ? app.parent_app_ids
      : (app.parent_app_id ? [app.parent_app_id] : []);
    if (parentIds.length === 0) return true;
    return parentIds.every(pid => !appsMap.has(pid));
  });

  // تطبيق الفلاتر + ترتيب حسب التصنيف
  // نُضمّن الإضافات في القائمة (يتم تصفيتها في AppsContent بناءً على showAddonsInGrid)
  let filteredApps = Array.from(appsMap.values()).map(app => ({
    ...app,
    children: appsMap.get(app.id)?.children || []
  })).filter(app => {
    const matchSearch = (app.name || "").toLowerCase().includes((headerSearch || "").toLowerCase()) ||
      (app.description || "").toLowerCase().includes((headerSearch || "").toLowerCase());
    const matchCategory = selectedCategory === "all" || 
      (app.categories && app.categories.length > 0 && app.categories.some(cat => {
        const selectedCatName = dbCategories.find(c => c.id === selectedCategory)?.name || selectedCategory;
        const catName = dbCategories.find(c => c.id === cat)?.name || cat;
        return catName === selectedCatName;
      }));
    const matchStatus = statusFilter === "all" || 
      (statusFilter === "active" && app.is_active) || 
      (statusFilter === "inactive" && !app.is_active);
    const matchReady = appliedFilters.is_ready === "all" || 
      (appliedFilters.is_ready === "ready" && app.is_ready) || 
      (appliedFilters.is_ready === "not_ready" && !app.is_ready);
    const matchFree = appliedFilters.is_free === "all" || 
      (appliedFilters.is_free === "free" && app.is_free) || 
      (appliedFilters.is_free === "paid" && !app.is_free);
    const matchType = appliedFilters.app_type === "all" || app.app_type === appliedFilters.app_type;
    const matchCategoryStatus = appliedFilters.category_status === "all" || 
      (appliedFilters.category_status === "uncategorized" && (!app.categories || app.categories.length === 0));
    const matchIsAddon = appliedFilters.is_addon_filter === "all" ||
      (appliedFilters.is_addon_filter === "yes" && app.is_addon) ||
      (appliedFilters.is_addon_filter === "no" && !app.is_addon);
    const matchShortDesc = appliedFilters.short_desc === "all" ||
      (appliedFilters.short_desc === "has" && !!app.short_description?.trim()) ||
      (appliedFilters.short_desc === "none" && !app.short_description?.trim());
    const matchFullDesc = appliedFilters.full_desc === "all" ||
      (appliedFilters.full_desc === "has" && !!app.description?.trim()) ||
      (appliedFilters.full_desc === "none" && !app.description?.trim());
    const matchVideo = appliedFilters.has_video === "all" ||
      (appliedFilters.has_video === "has" && !!app.video_url?.trim()) ||
      (appliedFilters.has_video === "none" && !app.video_url?.trim());
    const matchIcon = appliedFilters.has_icon === "all" ||
      (appliedFilters.has_icon === "has" && !!app.icon_url?.trim()) ||
      (appliedFilters.has_icon === "none" && !app.icon_url?.trim());

    // فلترة التصنيفات المتعددة
    const matchFilterCats = !appliedFilters.filter_categories?.length ||
      appliedFilters.filter_categories.some(catId => {
        const catName = dbCategories.find(c => c.id === catId)?.name;
        return (app.categories || []).some(appCat => {
          const appCatName = dbCategories.find(c => c.id === appCat)?.name || appCat;
          return appCatName === catName;
        });
      });

    // فلترة التصنيف الرئيسي
    const matchFilterPrimary = !appliedFilters.filter_primary_categories?.length ||
      appliedFilters.filter_primary_categories.some(catId => {
        const catName = dbCategories.find(c => c.id === catId)?.name;
        const appPrimary = dbCategories.find(c => c.id === app.primary_category)?.name || app.primary_category;
        return appPrimary === catName;
      });

    // فلترة السعر الشهري
    const monthlyPrice = app.is_free ? 0 : (app.monthly_price ?? 0);
    const matchMonthlyMin = appliedFilters.monthly_min === "" || monthlyPrice >= parseFloat(appliedFilters.monthly_min);
    const matchMonthlyMax = appliedFilters.monthly_max === "" || monthlyPrice <= parseFloat(appliedFilters.monthly_max);

    // فلترة السعر السنوي
    const yearlyPrice = app.is_free ? 0 : (app.yearly_price ?? 0);
    const matchYearlyMin = appliedFilters.yearly_min === "" || yearlyPrice >= parseFloat(appliedFilters.yearly_min);
    const matchYearlyMax = appliedFilters.yearly_max === "" || yearlyPrice <= parseFloat(appliedFilters.yearly_max);

    // فترة التجربة
    const matchTrial = appliedFilters.has_trial === "all" ||
      (appliedFilters.has_trial === "yes" && app.has_trial) ||
      (appliedFilters.has_trial === "no" && !app.has_trial);

    // صلاحيات السوبر آدمن
    const matchSuperAdmin = appliedFilters.super_admin_install === "all" ||
      (appliedFilters.super_admin_install === "yes" && app.super_admin_can_install !== false) ||
      (appliedFilters.super_admin_install === "no" && app.super_admin_can_install === false);

    // صلاحيات العملاء
    const matchClientsInstall = appliedFilters.clients_install === "all" ||
      (appliedFilters.clients_install === "yes" && app.clients_can_install !== false) ||
      (appliedFilters.clients_install === "no" && app.clients_can_install === false);

    // طريقة الظهور
    const matchVisibility = appliedFilters.visibility_mode_filter === "all" ||
      (appliedFilters.visibility_mode_filter === "all_vis" && (!app.visibility_mode || app.visibility_mode === "all")) ||
      (appliedFilters.visibility_mode_filter === "restricted" && app.visibility_mode === "restricted") ||
      (appliedFilters.visibility_mode_filter === "hidden" && app.visibility_mode === "hidden");

    // تخصيص الاسم
    const matchCustomName = appliedFilters.allow_custom_name_filter === "all" ||
      (appliedFilters.allow_custom_name_filter === "yes" && app.allow_custom_name) ||
      (appliedFilters.allow_custom_name_filter === "no" && !app.allow_custom_name);

    // تخصيص الأيقونة
    const matchCustomIcon = appliedFilters.allow_custom_icon_filter === "all" ||
      (appliedFilters.allow_custom_icon_filter === "yes" && app.allow_custom_icon) ||
      (appliedFilters.allow_custom_icon_filter === "no" && !app.allow_custom_icon);

    return matchSearch && matchCategory && matchStatus && matchReady && matchFree && matchType &&
      matchCategoryStatus && matchIsAddon && matchShortDesc && matchFullDesc && matchVideo && matchIcon &&
      matchFilterCats && matchFilterPrimary &&
      matchMonthlyMin && matchMonthlyMax && matchYearlyMin && matchYearlyMax &&
      matchTrial && matchSuperAdmin && matchClientsInstall && matchVisibility &&
      matchCustomName && matchCustomIcon;
  });

  // ترتيب التطبيقات حسب التصنيف المختار
  if (selectedCategory !== "all") {
    const selectedCatName = dbCategories.find(c => c.id === selectedCategory)?.name || selectedCategory;
    filteredApps = filteredApps.sort((a, b) => {
      // احصل على رقم الترتيب من كل تطبيق لكل تصنيف
      const aOrder = a.category_sort_orders?.[selectedCatName] ?? (a.sort_order ?? 999);
      const bOrder = b.category_sort_orders?.[selectedCatName] ?? (b.sort_order ?? 999);
      return aOrder - bOrder;
    });
  } else {
    // في "الكل"، رتب حسب أول تصنيف من التطبيق بناءً على ترتيب التصنيفات في sidebar
    filteredApps = filteredApps.sort((a, b) => {
      // جد أول تصنيف من تصنيفات التطبيق (بناءً على ترتيب sidebar)
      let aFirstCatName = null;
      let aFirstCatOrder = 999;
      
      for (const dbCat of dbCategories) {
        if (a.categories?.some(appCat => {
          const catName = dbCategories.find(c => c.id === appCat)?.name || appCat;
          return catName === dbCat.name;
        })) {
          aFirstCatName = dbCat.name;
          aFirstCatOrder = dbCat.sort_order ?? 999;
          break;
        }
      }

      let bFirstCatName = null;
      let bFirstCatOrder = 999;
      
      for (const dbCat of dbCategories) {
        if (b.categories?.some(appCat => {
          const catName = dbCategories.find(c => c.id === appCat)?.name || appCat;
          return catName === dbCat.name;
        })) {
          bFirstCatName = dbCat.name;
          bFirstCatOrder = dbCat.sort_order ?? 999;
          break;
        }
      }

      // إذا تساوت التصنيفات، رتب حسب ترتيب التطبيق داخل ذلك التصنيف
      if (aFirstCatOrder === bFirstCatOrder) {
        const aAppOrder = a.category_sort_orders?.[aFirstCatName] ?? 999;
        const bAppOrder = b.category_sort_orders?.[bFirstCatName] ?? 999;
        return aAppOrder - bAppOrder;
      }

      return aFirstCatOrder - bFirstCatOrder;
    });
  }

  const activeFiltersCount = Object.entries(appliedFilters).filter(([k, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "all" && v !== "";
  }).length;



  // ── بناء قائمة التصنيفات من قاعدة البيانات مع عدد التطبيقات لكل تصنيف ──
  const mainApps = apps.filter(a => !a.is_addon); // التطبيقات الرئيسية فقط للإحصاء
  const activeDbCategories = dbCategories.filter(c => c.is_active);
  const categoryCounts = [
    { name: "all", label: "الكل", count: apps.length, icon: null },
    ...activeDbCategories.map(cat => ({
      name: cat.id,
      label: cat.name,
      count: apps.filter(a => a.categories?.some(appCat => {
        // تعامل مع كلا الحالتين: ID أو اسم مخزن
        const catName = dbCategories.find(c => c.id === appCat)?.name || appCat;
        return catName === cat.name;
      })).length,
      icon: cat.icon || null
    })),
    { name: "__uncategorized__", label: "غير مصنفة", count: apps.filter(a => !a.is_addon && (!a.categories || a.categories.length === 0)).length, icon: "🗂️" },
    { name: "__orphan_addons__", label: "إضافات بدون تطبيق رئيسي", count: orphanAddons.length, icon: "⚠️" },
  ];

  const stats = {
    total: mainApps.length,
    active: mainApps.filter(a => a.is_active).length,
  };

  // إخبار DashboardLayout بالتبويب النشط لعرض أيقونات العرض الصحيحة
  useEffect(() => {
    setAppManagerActiveTab?.(activeTab);
  }, [activeTab]);

  // تحديث أيقونات شريط الأدوات حسب التبويب المختار
  useEffect(() => {
    if (!setToolbarActions) return;

    if (activeTab === "apps") {
      setToolbarActions({
        add: { onClick: () => setAppPanel({ open: true, appId: null }) },
        filter: { onClick: () => {} },
        reports: { onClick: () => {} },
        download: { onClick: () => {} },
        upload: { onClick: () => {} },
        delete: { onClick: () => {}, disabled: true },
      });
      
      // إضافة زر التحديد المخصص
      if (setToolbarCustomItems) {
        const mainApps = apps.filter(a => !a.is_addon);
        setToolbarCustomItems([
          {
            id: 'toggle-selection',
            label: selectionMode ? `تم اختيار ${selectedApps.size}` : 'تحديد',
            onClick: () => {
              if (!selectionMode) {
                setSelectionMode(true);
                setSelectedApps(new Set());
              } else {
                setSelectionMode(false);
                setSelectedApps(new Set());
              }
            },
            variant: 'primary'
          }
        ]);
      }
      
      if (setSelectedCount) {
        setSelectedCount(selectedApps.size);
      }
      
      if (setToolbarCustomItems) {
        const mainApps = apps.filter(a => !a.is_addon);
        const items = [
          {
            id: 'toggle-selection',
            label: selectionMode ? `تم اختيار ${selectedApps.size}` : 'تحديد',
            onClick: () => {
              if (!selectionMode) {
                setSelectionMode(true);
                setSelectedApps(new Set());
              } else {
                setSelectionMode(false);
                setSelectedApps(new Set());
              }
            },
            variant: 'primary'
          }
        ];
        
        if (selectedApps.size > 0 && selectionMode) {
          items.push(
            {
              id: 'edit-bulk',
              label: `تعديل جماعي (${selectedApps.size})`,
              onClick: () => setBulkActionPanel({ open: true, action: 'edit' }),
              variant: 'secondary'
            },
            {
              id: 'export-csv',
              label: 'تصدير CSV',
              onClick: () => {
                const selectedAppList = apps.filter(a => selectedApps.has(a.id));
                const headers = ['الاسم', 'النوع', 'السعر الشهري', 'السعر السنوي', 'العملة', 'مجاني', 'مفعل', 'التصنيفات'];
                const rows = selectedAppList.map(app => [
                  app.name,
                  app.is_addon ? 'إضافة' : 'رئيسي',
                  app.monthly_price || '-',
                  app.yearly_price || '-',
                  app.currency || '-',
                  app.is_free ? 'نعم' : 'لا',
                  app.is_active ? 'نعم' : 'لا',
                  (app.categories || []).join(', ')
                ]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `التطبيقات_${new Date().toLocaleDateString('ar')}.csv`;
                link.click();
                toast({ title: "✓", description: `تم تصدير ${selectedAppList.length} تطبيق` });
              },
              variant: 'secondary'
            },
            {
              id: 'delete',
              label: 'حذف جماعي',
              onClick: () => setBulkActionPanel({ open: true, action: 'delete' }),
              variant: 'destructive'
            }
          );
        }
        
        setToolbarCustomItems(items);
      }
    } else {
      // تبويب الباقات
      setToolbarActions({
        add: { onClick: () => setPlanPanel({ open: true, planId: null }) },
        filter: { onClick: () => {} },
        reports: { onClick: () => {} },
        download: { onClick: () => {} },
        upload: { onClick: () => {} },
        delete: { onClick: () => {}, disabled: true },
      });
      if (setToolbarCustomItems) {
        setToolbarCustomItems([]);
      }
    }
  }, [activeTab, selectedApps.size, selectionMode]);

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]" dir="rtl">
      {/* Sidebar - Tabs and Categories */}
      <div className="w-[290px] bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-shrink-0 sticky top-6 max-h-[calc(100vh-140px)]">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("apps")}
            className={cn(
              "flex-1 px-3 py-3 font-semibold text-xs transition-all border-b-2",
              activeTab === "apps"
                ? "text-white border-tabsActive bg-tabsActive"
                : "text-tabsInactive border-transparent hover:text-foreground"
            )}>
            مدير التطبيقات
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={cn(
              "flex-1 px-3 py-3 font-semibold text-xs transition-all border-b-2",
              activeTab === "plans"
                ? "text-white border-tabsActive bg-tabsActive"
                : "text-tabsInactive border-transparent hover:text-foreground"
            )}>
            مدير الباقات
          </button>

        </div>

        {/* Status Filters as Tabs */}
        <div className="border-b border-border px-3 py-2.5">
          <div className="flex bg-secondary/60 rounded-xl p-1 gap-1">
            {[
              { key: "all", label: "الكل", count: apps.length },
              { key: "active", label: "مفعل", count: apps.filter(a => a.is_active).length },
              { key: "inactive", label: "غير مفعل", count: apps.filter(a => !a.is_active).length },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-semibold rounded-lg transition-all text-center",
                  statusFilter === item.key
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </div>

        {/* Categories List - only for apps tab */}
        {activeTab === "apps" && (
          <div className="p-4 overflow-y-auto flex-1">
            <h3 className="font-bold text-foreground mb-4 text-right text-sm">التصنيفات</h3>
            <div className="space-y-2">
              {categoryCounts.map((cat) => {
                const isSpecial = cat.name === "__uncategorized__" || cat.name === "__orphan_addons__";
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    style={isSpecial && !isActive ? { backgroundColor: "#fffbeb" } : undefined}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-right text-xs",
                      isActive
                        ? "bg-primary/10 border border-primary text-primary font-semibold"
                        : isSpecial
                          ? "border border-yellow-200 text-foreground hover:opacity-80"
                          : "border border-transparent text-foreground hover:bg-secondary/50"
                    )}>
                    {cat.icon && <span className="text-base flex-shrink-0 ml-1">{cat.icon}</span>}
                    <span className="font-medium flex-1 text-right">{cat.label}</span>
                    <span className={cn(
                      "min-w-[28px] h-7 flex items-center justify-center rounded-md border text-xs font-semibold flex-shrink-0",
                      isActive
                        ? "border-primary/30 bg-white text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    )}>{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-y-auto pb-10">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background pb-4 pt-1">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدير الباقات والتطبيقات</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة التطبيقات والباقات المتاحة</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "apps" && (
              <>
                <button
                  onClick={() => setFilterPanel(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border relative",
                    activeFiltersCount > 0
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                  )}
                >
                  <SlidersHorizontal size={16} />
                  تصفية
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {/* زر عرض الإضافات */}
                <button
                  onClick={() => setShowAddonsInGrid(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                    showAddonsInGrid
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                  }`}
                  title={showAddonsInGrid ? "إخفاء الإضافات المستقلة" : "عرض الإضافات كتطبيقات مستقلة"}
                >
                  🧩 {showAddonsInGrid ? "إخفاء الإضافات" : "عرض الإضافات"}
                </button>
                <button
                  onClick={() => {
                    const allCatIds = new Set(dbCategories.filter(c => c.is_active).map(c => c.id));
                    if (expandedCategories.size === allCatIds.size) {
                      setExpandedCategories(new Set());
                    } else {
                      setExpandedCategories(allCatIds);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  title="فتح/إغلاق جميع الفئات"
                >
                  <svg className={cn("w-4 h-4 transition-transform", expandedCategories.size === dbCategories.filter(c => c.is_active).length && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  {expandedCategories.size === dbCategories.filter(c => c.is_active).length ? 'إغلاق الكل' : 'فتح الكل'}
                </button>
                <button
                  onClick={() => navigate("/app-categories")}
                  className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  title="إعدادات التصنيفات">
                  <Settings size={16} />
                  التصنيفات
                </button>
                <button
                  onClick={() => {
                    if (selectedCategory === "all") {
                      toast({ title: "تنبيه", description: "اختر تصنيفاً محدداً لترتيب التطبيقات فيه", variant: "destructive" });
                    } else {
                      const selectedCatName = dbCategories.find(c => c.id === selectedCategory)?.name || selectedCategory;
                      setSortPanel({ open: true, categoryName: selectedCatName });
                    }
                  }}
                  className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  title="ترتيب التطبيقات بالسحب والإفلات">
                  <ArrowUpDown size={16} />
                  ترتيب
                </button>
                <button
                  onClick={() => setAppPanel({ open: true, appId: null })}
                  className="flex items-center gap-2 bg-buttonColor text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Plus size={16} />
                  إضافة تطبيق
                </button>
              </>
            )}
            {activeTab === "plans" && (
              <>
                <button
                  onClick={() => navigate("/super-admin/plan-features")}
                  className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
                >
                  <Settings size={16} />
                  إدارة المميزات
                </button>
                <button onClick={() => setPlanPanel({ open: true, planId: null })} className="flex items-center gap-2 bg-buttonColor text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Plus size={16} />
                  إضافة باقة
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "apps" && selectedCategory === "__uncategorized__" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-2xl">🗂️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">تطبيقات غير مصنفة</p>
                <p className="text-xs text-amber-600 mt-0.5">هذه التطبيقات لم يُحدَّد لها أي تصنيف — يُنصح بتصنيفها لتظهر بشكل صحيح في المتجر.</p>
              </div>
            </div>
            {apps.filter(a => !a.is_addon && (!a.categories || a.categories.length === 0)).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">✅ جميع التطبيقات مصنفة</p>
              </div>
            ) : (
              <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                 {apps.filter(a => !a.is_addon && (!a.categories || a.categories.length === 0)).map((app, index) => (
                  <AdminAppCard key={app.id} app={app} index={index} updateAppMutation={updateAppMutation} onEdit={(id) => setAppPanel({ open: true, appId: id })} convertCategoryToName={convertCategoryToName} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} allApps={apps} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "apps" && selectedCategory === "__orphan_addons__" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">إضافات بدون تطبيق رئيسي</p>
                <p className="text-xs text-amber-600 mt-0.5">هذه الإضافات مُعرَّفة كـ Add-on لكن لم يُحدَّد لها تطبيق رئيسي — لن تظهر في أي مكان حتى يتم ربطها.</p>
              </div>
            </div>
            {orphanAddons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">✅ لا توجد إضافات يتيمة</p>
              </div>
            ) : (
              <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                 {orphanAddons.map((app, index) => (
                  <AdminAppCard key={app.id} app={app} index={index} updateAppMutation={updateAppMutation} onEdit={(id) => setAppPanel({ open: true, appId: id })} convertCategoryToName={convertCategoryToName} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} allApps={apps} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "apps" && (
           <AppsContent apps={filteredApps} updateAppMutation={updateAppMutation} navigate={navigate} convertCategoryToName={convertCategoryToName} viewType={appsViewType} onEdit={(id) => setAppPanel({ open: true, appId: id })} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} selectedCategory={selectedCategory} dbCategories={dbCategories} filteredApps={filteredApps} expandedCategories={expandedCategories} setExpandedCategories={setExpandedCategories} showAddonsInGrid={showAddonsInGrid} />
        )}
        {activeTab === "plans" && (
          <PlansContent statusFilter={statusFilter} viewType={plansViewType} onEdit={(id) => setPlanPanel({ open: true, planId: id })} />
        )}

      </div>

      {/* Slide Panel - تطبيق */}
      <SlidePanel open={appPanel.open} onClose={() => setAppPanel({ open: false, appId: null })}>
        <AppForm
          embeddedAppId={appPanel.appId}
          onClose={() => setAppPanel({ open: false, appId: null })}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["apps"] })}
        />
      </SlidePanel>

      {/* Slide Panel - باقة */}
      <SlidePanel open={planPanel.open} onClose={() => setPlanPanel({ open: false, planId: null })}>
        <PlanForm
          embeddedPlanId={planPanel.planId}
          onClose={() => setPlanPanel({ open: false, planId: null })}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["plans"] })}
        />
      </SlidePanel>

      {/* Slide Panel - إضافة إلى تصنيف */}
      <SlidePanel open={categoryPanel.open} onClose={() => setCategoryPanel({ open: false })}>
        <CategorySelectionPanel
          selectedAppIds={Array.from(selectedApps)}
          dbCategories={dbCategories}
          onConfirm={(categoryId) => {
            addToCategoryMutation.mutate({ appIds: Array.from(selectedApps), categoryId });
          }}
          onClose={() => setCategoryPanel({ open: false })}
          isLoading={addToCategoryMutation.isPending}
        />
      </SlidePanel>

      {/* Filter Panel */}
      <FilterPanel
        open={filterPanel}
        onClose={() => setFilterPanel(false)}
        title="تصفية التطبيقات"
        onApply={() => { setAppliedFilters({ ...filterValues }); setFilterPanel(false); }}
        onReset={() => { setFilterValues({ ...defaultFilters }); setAppliedFilters({ ...defaultFilters }); setFilterPanel(false); }}
      >
        <AppFilterGroups filterValues={filterValues} setFilterValues={setFilterValues} dbCategories={dbCategories} />
      </FilterPanel>

      {/* Slide Panel - ترتيب التطبيقات */}
      <SlidePanel open={sortPanel.open} onClose={() => setSortPanel({ open: false, categoryName: null })}>
        {sortPanel.categoryName && (
          <AppSortPanel
            apps={filteredApps}
            categoryName={sortPanel.categoryName}
            onClose={() => setSortPanel({ open: false, categoryName: null })}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["apps"] })}
          />
        )}
      </SlidePanel>

      {/* Slide Panel - الإجراءات الجماعية */}
      <SlidePanel open={bulkActionPanel.open} onClose={() => setBulkActionPanel({ open: false, action: null })}>
        {bulkActionPanel.action === 'edit' && (
          <BulkActionsPanel
            selectedAppIds={Array.from(selectedApps)}
            onConfirm={(data) => {
              bulkUpdateMutation.mutate(data);
            }}
            onClose={() => setBulkActionPanel({ open: false, action: null })}
            isLoading={bulkUpdateMutation.isPending}
          />
        )}
        {bulkActionPanel.action === 'delete' && (
          <div className="h-full flex flex-col bg-background p-6" dir="rtl">
            <div className="text-center flex-1 flex items-center justify-center">
              <div>
                <p className="text-lg font-bold text-destructive">تحذير</p>
                <p className="text-muted-foreground mt-2">سيتم حذف {selectedApps.size} تطبيق نهائياً</p>
                <p className="text-sm text-muted-foreground mt-3">هذه العملية لا يمكن التراجع عنها</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBulkActionPanel({ open: false, action: null })} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">إلغاء</button>
              <button onClick={() => bulkDeleteMutation.mutate(Array.from(selectedApps))} disabled={bulkDeleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {bulkDeleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        )}
      </SlidePanel>

    </div>
  );
}

function AppsContent({ apps, updateAppMutation, navigate, convertCategoryToName, viewType = "cards", onEdit, selectedApps, setSelectedApps, selectionMode, selectedCategory = "all", dbCategories = [], filteredApps = [], expandedCategories = new Set(), setExpandedCategories = () => {}, showAddonsInGrid = false }) {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd / MM / yyyy - hh:mm a", { locale: ar });
    } catch {
      return dateString;
    }
  };

  const toggleAppSelection = (appId) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const toggleSelectAllFiltered = () => {
    if (selectedApps.size === apps.length && apps.length > 0) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(apps.map(a => a.id)));
    }
  };

  return (
    <div className="space-y-6">



      {/* ── عرض الجدول ── */}
      {viewType === "table" && (() => {
        const tableApps = apps.filter(a => showAddonsInGrid || !a.is_addon);
        return (
        <div className="bg-card border border-border rounded-xl overflow-hidden" key="table-view">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                  <th className="px-3 py-3 text-center border-l border-border w-10">
                    <input
                      type="checkbox"
                      checked={selectedApps.size === tableApps.length && tableApps.length > 0}
                      onChange={() => {
                        if (selectedApps.size === tableApps.length && tableApps.length > 0) {
                          setSelectedApps(new Set());
                        } else {
                          setSelectedApps(new Set(tableApps.map(a => a.id)));
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 text-center border-l border-border text-xs text-muted-foreground font-normal">
                    {selectedApps.size > 0 && `✓ ${selectedApps.size} محدد`}
                  </th>
                  <th className="px-3 py-3 text-center border-l border-border text-xs font-semibold">الاسم والأيقونة</th>
                  <th className="px-3 py-3 text-center border-l border-border">التصنيفات</th>
                  <th className="px-3 py-3 text-center border-l border-border">السعر الشهري</th>
                  <th className="px-3 py-3 text-center border-l border-border">السعر السنوي</th>
                  <th className="px-3 py-3 text-center border-l border-border">مجاني</th>
                  <th className="px-3 py-3 text-center border-l border-border">الإضافات</th>
                  <th className="px-3 py-3 text-center border-l border-border">الحالة</th>
                  <th className="px-3 py-3 text-center border-l border-border">تاريخ الإنشاء</th>
                  <th className="px-3 py-3 text-center sticky left-0" style={{ backgroundColor: "var(--table-header-bg)" }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tableApps.length === 0 ? (
                   <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">لا توجد تطبيقات</td></tr>
                 ) : tableApps.map((app, idx) => {
                    const validCats = (app.categories || []).map(c => convertCategoryToName(c)).filter(Boolean);
                    return (
                      <tr key={app.id} className={cn("border-b border-border transition-colors", selectedApps.has(app.id) ? "bg-primary/10" : "hover:bg-secondary/20")}>
                        <td className="px-3 py-2.5 text-center border-l border-border">
                          <input
                            type="checkbox"
                            checked={selectedApps.has(app.id)}
                            onChange={() => toggleAppSelection(app.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <div className="flex items-center justify-center gap-2">
                          {app.icon_url && <img src={app.icon_url} alt={app.name} className="w-6 h-6 rounded object-contain flex-shrink-0" />}
                          <span className="font-medium text-foreground">{app.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {validCats.length > 0
                            ? validCats.map((n, i) => <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{n}</span>)
                            : <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center border-l border-border">{app.is_free ? "-" : `${app.monthly_price ?? 0} ${app.currency}`}</td>
                      <td className="px-3 py-2.5 text-center border-l border-border">{app.is_free ? "-" : `${app.yearly_price ?? 0} ${app.currency}`}</td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        {app.is_free
                          ? <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-medium">مجاني</span>
                          : <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">مدفوع</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        {app.children?.length > 0
                          ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-semibold">🧩 {app.children.length}</span>
                          : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateAppMutation.mutate({ id: app.id, data: { is_active: !app.is_active } })}
                            className={cn("relative w-10 h-5 rounded-full transition-colors duration-300 flex items-center px-0.5", app.is_active ? "bg-primary" : "bg-gray-300")}
                          >
                            <span className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300", app.is_active ? "ml-0" : "mr-auto")} />
                          </button>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            app.is_ready
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}>
                            {app.is_ready ? "✅ جاهز" : "🔜 قريباً"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">{formatDate(app.created_date)}</td>
                      <td className="px-3 py-2.5 sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onEdit ? onEdit(app.id) : navigate(`/super-admin/app-form?id=${app.id}`)} title="تعديل" className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
        );
      })()}

      {/* ── عرض البطاقات مع تقسيم حسب التصنيف (عند اختيار "الكل") ── */}
      {viewType !== "table" && selectedCategory === "all" && (
        <div className="space-y-8">
           {dbCategories.filter(c => c.is_active).map(cat => {
             const appsInCat = apps.filter(a =>
               (showAddonsInGrid || !a.is_addon) &&
               a.categories?.some(appCat => {
                 const catName = dbCategories.find(dc => dc.id === appCat)?.name || appCat;
                 return catName === cat.name;
               })
             );
             if (appsInCat.length === 0) return null;
             const activeCount = appsInCat.filter(a => a.is_active).length;
             const isExpanded = expandedCategories.has(cat.id);
             return (
               <div key={cat.id}>
                 <button 
                   onClick={() => {
                     const updated = new Set(expandedCategories);
                     if (updated.has(cat.id)) {
                       updated.delete(cat.id);
                     } else {
                       updated.add(cat.id);
                     }
                     setExpandedCategories(updated);
                   }}
                   className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 rounded-xl mb-4 border border-border hover:bg-secondary/50 transition-colors"
                 >
                   <div className="flex items-center gap-2">
                     {cat.icon && <span className="text-xl">{cat.icon}</span>}
                     <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
                   </div>
                   <div className="flex items-center gap-3 text-sm font-semibold">
                     <span className="text-emerald-600">{activeCount} مفعّل</span>
                     <span className="text-muted-foreground">{appsInCat.length} تطبيق</span>
                     <svg className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                   </div>
                 </button>
                {isExpanded && (
                <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {appsInCat.map((app, index) => (
                      <AdminAppCard key={app.id} app={app} index={index} updateAppMutation={updateAppMutation} onEdit={onEdit} convertCategoryToName={convertCategoryToName} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} allApps={apps} />
                    ))}
                </div>
                )}
                </div>
                );
                })}
                </div>
                )}

      {/* ── عرض البطاقات (عند اختيار تصنيف محدد) ── */}
      {viewType !== "table" && selectedCategory !== "all" && (() => {
        const visibleApps = apps.filter(a => showAddonsInGrid || !a.is_addon);
        return (
          <>
            {selectionMode && visibleApps.length > 0 && (
              <div className="bg-secondary/40 border border-border rounded-lg p-3 flex items-center justify-between">
                <button onClick={() => {
                  if (selectedApps.size === visibleApps.length && visibleApps.length > 0) {
                    setSelectedApps(new Set());
                  } else {
                    setSelectedApps(new Set(visibleApps.map(a => a.id)));
                  }
                }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-secondary/60">
                  <input type="checkbox" checked={selectedApps.size === visibleApps.length && visibleApps.length > 0} onChange={() => {}} className="w-4 h-4 cursor-pointer" readOnly />
                  <span>{selectedApps.size === visibleApps.length && visibleApps.length > 0 ? `إلغاء تحديد الكل (${visibleApps.length})` : `تحديد الكل (${visibleApps.length})`}</span>
                </button>
                {selectedApps.size > 0 && <span className="text-xs text-primary font-semibold">✓ تم اختيار {selectedApps.size} عنصر</span>}
              </div>
            )}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {visibleApps.map((app, index) => (
                 <AdminAppCard key={app.id} app={app} index={index} updateAppMutation={updateAppMutation} onEdit={onEdit} convertCategoryToName={convertCategoryToName} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} allApps={apps} />
               ))}
            </div>
          </>
        );
      })()}

          {viewType !== "table" && apps.filter(a => showAddonsInGrid || !a.is_addon).length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد تطبيقات</p>
        </div>
      )}
    </div>
  );
}

// ── دالة استخراج معرف يوتيوب من أي رابط أو معرف مباشر ──
function extractYoutubeId(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /v=([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── مشغل فيديو ذكي يكتشف النوع تلقائياً ──
function AdminVideoPlayer({ videoUrl, videoType }) {
  if (!videoUrl) return null;

  // محاولة استخراج معرف يوتيوب بغض النظر عن video_type المخزّن
  const youtubeId = extractYoutubeId(videoUrl);

  if (youtubeId) {
    return (
      <div className="space-y-1.5">
        <div className="rounded-lg overflow-hidden border border-border aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&fs=1&controls=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title="فيديو شرح التطبيق"
          />
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-red-600 hover:underline"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
          مشاهدة الفيديو على يوتيوب مباشرة
        </a>
      </div>
    );
  }

  // فيديو مباشر أو مرفوع
  if (videoUrl) {
    return (
      <div className="rounded-lg overflow-hidden border border-border bg-black">
        <video src={videoUrl} controls className="w-full max-h-48" />
      </div>
    );
  }

  return null;
}

// ── بطاقة تطبيق بشكل متجر التطبيقات ──
function AdminAppCard({ app, index, updateAppMutation, onEdit, convertCategoryToName, selectedApps, setSelectedApps, selectionMode, allApps = [] }) {
  const [pricingType, setPricingType] = useState("monthly");
  const [activeTab, setActiveTab] = useState(null);

  const addons = app.children || [];
  const validCats = (app.categories || []).map(c => convertCategoryToName(c)).filter(Boolean);
  const isSelected = selectedApps?.has(app.id);

  // الأبناء الإجباريون لهذا التطبيق
  const requiredChildren = (app.related_apps || [])
    .filter(r => r.relation_type === "required_child")
    .map(r => allApps.find(a => a.id === r.app_id))
    .filter(Boolean);

  // هل هذا التطبيق ابن إجباري لأب ما؟
  const requiredParent = allApps.find(a =>
    (a.related_apps || []).some(r => r.relation_type === "required_child" && r.app_id === app.id)
  );

  const hasRequirementsTab = requiredChildren.length > 0 || !!requiredParent;
  const requirementsCount = requiredChildren.length + (requiredParent ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn("bg-card border border-border rounded-2xl overflow-hidden flex flex-col transition-all relative h-full", isSelected && "border-primary bg-primary/5")}
    >
      {/* Checkbox - يظهر فقط في وضع التحديد */}
      {selectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {
              const newSelected = new Set(selectedApps);
              if (isSelected) {
                newSelected.delete(app.id);
              } else {
                newSelected.add(app.id);
              }
              setSelectedApps(newSelected);
            }}
            className="w-5 h-5 cursor-pointer accent-primary"
          />
        </div>
      )}

      {/* Header: Icon + Name */}
      <div className="p-3 flex items-center gap-2 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {app.icon_url
            ? <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain rounded-lg" />
            : <Package size={20} className="text-primary" />}
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-sm font-bold text-foreground">{app.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {app.is_ready ? "✓ نشط" : "قريباً"}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          {!app.is_free && app.yearly_price > 0 && (
            <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
              <button onClick={() => setPricingType("monthly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "monthly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
              <button onClick={() => setPricingType("yearly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "yearly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
            </div>
          )}
          <div className="text-base font-bold text-primary">
            {app.is_free ? <span className="text-emerald-600">مجاناً</span> : `${pricingType === "yearly" ? (app.yearly_price ?? 0) : (app.monthly_price ?? 0)} ${app.currency ?? ""}`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2.5">
        <div className={cn("grid gap-1 bg-secondary/40 rounded-xl p-1", hasRequirementsTab ? "grid-cols-4" : "grid-cols-3")}>
          {["description", "info", "addons", ...(hasRequirementsTab ? ["requirements"] : [])].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              className={cn(
                "flex-1 text-[11px] font-semibold px-1 py-2 rounded-lg transition-all text-center relative whitespace-nowrap",
                tab === "requirements"
                  ? activeTab === tab ? "bg-red-500 text-white shadow-sm" : "text-red-600 bg-red-50 hover:text-red-700"
                  : activeTab === tab ? "bg-tabsActive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "description" ? "الوصف" : tab === "info" ? "المعلومات" : tab === "requirements" ? (
                <span className="flex items-center justify-center gap-0.5">
                  متطلبات
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold",
                    activeTab === "requirements" ? "bg-white text-red-500" : "bg-red-500 text-white"
                  )}>
                    {requirementsCount}
                  </span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-0.5">
                  الإضافات
                  {addons.length > 0 && (
                    <span className={cn(
                      "mr-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold",
                      activeTab === "addons" ? "bg-white text-tabsActive" : "bg-violet-500 text-white"
                    )}>
                      {addons.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Description Tab */}
        {activeTab === "description" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
            <AdminVideoPlayer videoUrl={app.video_url} videoType={app.video_type} />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">
              {app.description || app.short_description || "لا يوجد وصف"}
            </p>
          </motion.div>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-[11px] text-muted-foreground space-y-2" dir="rtl">
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">ID</span>
              <span className="font-mono text-[10px] truncate text-left">{app.id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="flex-shrink-0">الإصدار</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
            {validCats.length > 0 && (
              <div className="flex justify-between">
                <span className="flex-shrink-0">التصنيفات</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {validCats.map((c, i) => <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c}</span>)}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Addons Tab */}
        {activeTab === "addons" && (
          <AdminAddonsTab addons={addons} updateAppMutation={updateAppMutation} onEdit={onEdit} selectedApps={selectedApps} setSelectedApps={setSelectedApps} selectionMode={selectionMode} />
        )}

        {/* Requirements Tab */}
        {activeTab === "requirements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
            {requiredChildren.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-2 space-y-2">
                <p className="text-[10px] font-bold text-red-700">⚠️ هذا التطبيق لا يعمل بدون:</p>
                {requiredChildren.map(child => (
                  <RequirementAppCard key={child.id} app={child} onEdit={onEdit} updateAppMutation={updateAppMutation} allApps={allApps} />
                ))}
              </div>
            )}
            {requiredParent && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-2 space-y-2">
                <p className="text-[10px] font-bold text-red-700">🔗 هذا التطبيق ابن إجباري لـ:</p>
                <RequirementAppCard app={requiredParent} onEdit={onEdit} updateAppMutation={updateAppMutation} allApps={allApps} />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Action Button - Hidden when viewing addons or requirements */}
      {activeTab !== "addons" && activeTab !== "requirements" && (
        <div className="px-3 pb-3 mt-auto flex items-center gap-2">
          <button
            onClick={() => onEdit?.(app.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <Settings size={14} />
            تعديل
          </button>
          <button
            onClick={() => updateAppMutation.mutate({ id: app.id, data: { is_active: !app.is_active } })}
            title={app.is_active ? "تعطيل" : "تفعيل"}
            className={cn(
              "relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5",
              app.is_active ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300",
              app.is_active ? "ml-0" : "mr-auto"
            )} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── بطاقة تطبيق مطلوب (في تبويبة المتطلبات) — مطابقة لـ AdminAddonCard ──
function RequirementAppCard({ app, onEdit, updateAppMutation, allApps }) {
  const [pricingType, setPricingType] = useState("monthly");
  const [activeTab, setActiveTab] = useState(null);
  const isReady = app.is_ready === true;

  // الإضافات التابعة لهذا التطبيق
  const subAddons = (allApps || []).filter(a => {
    if (!a.is_addon || !a.is_active) return false;
    if (a.parent_app_ids && a.parent_app_ids.length > 0) return a.parent_app_ids.includes(app.id);
    return a.parent_app_id === app.id;
  });

  const tabs = ["description", "info", "addons"];

  return (
    <div className="bg-card border border-red-300 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center gap-2 border-b border-red-200">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          {app.icon_url
            ? <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain rounded-lg" />
            : <Package size={20} className="text-red-500" />}
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-sm font-bold text-foreground">{app.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isReady ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {isReady ? "جاهز" : "قريباً"}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="px-3 py-2.5 border-b border-red-100">
        <div className="flex items-center justify-between">
          {!app.is_free && app.yearly_price > 0 && (
            <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
              <button onClick={() => setPricingType("monthly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "monthly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
              <button onClick={() => setPricingType("yearly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "yearly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
            </div>
          )}
          <div className="text-base font-bold text-primary">
            {app.is_free ? <span className="text-emerald-600">مجاناً</span> : `${pricingType === "yearly" ? (app.yearly_price ?? 0) : (app.monthly_price ?? 0)} ${app.currency ?? ""}`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2.5">
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              className={cn(
                "flex-1 text-[11px] font-semibold px-1 py-1.5 rounded-lg transition-all text-center",
                activeTab === tab ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "description" ? "الوصف" : tab === "info" ? "المعلومات" : (
                <span className="flex items-center justify-center gap-0.5">
                  الإضافات
                  {subAddons.length > 0 && (
                    <span className={cn("inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold",
                      activeTab === "addons" ? "bg-white text-red-500" : "bg-violet-500 text-white")}>
                      {subAddons.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
            <AdminVideoPlayer videoUrl={app.video_url} videoType={app.video_type} />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">{app.description || app.short_description || "لا يوجد وصف"}</p>
          </motion.div>
        )}
        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-[11px] text-muted-foreground space-y-2" dir="rtl">
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">ID</span>
              <span className="font-mono text-[10px] truncate text-left">{app.id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span>الإصدار</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
          </motion.div>
        )}
        {activeTab === "addons" && (
          <AdminAddonsTab addons={subAddons} updateAppMutation={updateAppMutation} onEdit={onEdit} />
        )}
      </div>

      {/* Action */}
      {activeTab !== "addons" && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={() => onEdit?.(app.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <Settings size={14} />
            تعديل
          </button>
          {updateAppMutation && (
            <button
              onClick={() => updateAppMutation.mutate({ id: app.id, data: { is_active: !app.is_active } })}
              title={app.is_active ? "تعطيل" : "تفعيل"}
              className={cn("relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5",
                app.is_active ? "bg-primary" : "bg-gray-300")}
            >
              <span className={cn("w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300", app.is_active ? "ml-0" : "mr-auto")} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── تبويب الإضافات مع بحث وتصفية وترتيب ──
function AdminAddonsTab({ addons, updateAppMutation, onEdit, selectedApps, setSelectedApps, selectionMode }) {
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showMenu, setShowMenu] = useState(false);

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "free", label: "المجانية فقط" },
  ];

  const sortOptions = [
    { value: "default", label: "الترتيب الافتراضي" },
    { value: "cheapest", label: "الأقل سعراً" },
    { value: "expensive", label: "الأعلى سعراً" },
    { value: "newest", label: "الأحدث" },
    { value: "popular", label: "الأكثر استخداماً" },
  ];

  const activeLabel = filterBy !== "all"
    ? filterOptions.find(f => f.value === filterBy)?.label
    : sortBy !== "default"
      ? sortOptions.find(s => s.value === sortBy)?.label
      : null;

  const getPrice = (a) => a.is_free ? 0 : (a.monthly_price || 0);

  const filtered = [...addons]
    .filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterBy === "all" ? true : filterBy === "free" ? a.is_free : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "cheapest") return getPrice(a) - getPrice(b);
      if (sortBy === "expensive") return getPrice(b) - getPrice(a);
      if (sortBy === "newest") return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      if (sortBy === "popular") return (b.subscribers_count || 0) - (a.subscribers_count || 0);
      return 0;
    });

  const toggleAddonSelection = (addonId) => {
    if (!setSelectedApps) return;
    const newSelected = new Set(selectedApps);
    if (newSelected.has(addonId)) newSelected.delete(addonId);
    else newSelected.add(addonId);
    setSelectedApps(newSelected);
  };

  const toggleSelectAll = () => {
    if (!setSelectedApps) return;
    const allIds = filtered.map(a => a.id);
    const allSelected = allIds.every(id => selectedApps?.has(id));
    if (allSelected) {
      const newSelected = new Set(selectedApps);
      allIds.forEach(id => newSelected.delete(id));
      setSelectedApps(newSelected);
    } else {
      const newSelected = new Set(selectedApps);
      allIds.forEach(id => newSelected.add(id));
      setSelectedApps(newSelected);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-3">
      {/* بحث وفلتر */}
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="ابحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-0 flex-1 min-w-0 px-2 py-1 text-[10px] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 border rounded-lg transition-colors text-[10px] font-semibold",
              activeLabel ? "bg-violet-100 border-violet-300 text-violet-700" : "bg-secondary border-border text-foreground hover:bg-secondary/80"
            )}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 12h8M12 18h4"/></svg>
            {activeLabel && <span className="max-w-[50px] truncate">{activeLabel}</span>}
          </button>

          {showMenu && (
            <div className="absolute z-50 left-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-xl flex flex-col" style={{ maxHeight: "220px" }}>
              <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/40 border-b border-border flex-shrink-0">
                <span>تصفية</span>
                <button onClick={() => { setFilterBy("all"); setSortBy("default"); setShowMenu(false); }} className="text-red-600 text-xs">🗑️</button>
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

      {/* تحديد الكل للإضافات */}
      {selectionMode && filtered.length > 0 && (
        <div className="flex items-center justify-between bg-secondary/40 rounded-lg px-2 py-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={filtered.every(a => selectedApps?.has(a.id))}
              onChange={toggleSelectAll}
              className="w-3.5 h-3.5 cursor-pointer accent-primary"
            />
            تحديد الكل ({filtered.length})
          </label>
          {filtered.filter(a => selectedApps?.has(a.id)).length > 0 && (
            <span className="text-[10px] text-primary font-semibold">✓ {filtered.filter(a => selectedApps?.has(a.id)).length} محدد</span>
          )}
        </div>
      )}

      {/* قائمة الإضافات */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {search ? "لا توجد نتائج" : "لا توجد إضافات متاحة"}
        </p>
      ) : filtered.map(addon => (
        <AdminAddonCard key={addon.id} addon={addon} updateAppMutation={updateAppMutation} onEdit={onEdit} isSelected={selectedApps?.has(addon.id)} selectionMode={selectionMode} onToggleSelect={() => toggleAddonSelection(addon.id)} />
      ))}
    </motion.div>
  );
}

// ── بطاقة إضافة بشكل متجر التطبيقات (تدعم إضافات فرعية) ──
function AdminAddonCard({ addon, updateAppMutation, onEdit, isSelected, selectionMode, onToggleSelect }) {
  const [pricingType, setPricingType] = useState("monthly");
  const [activeTab, setActiveTab] = useState(null);
  const isReady = addon.is_ready === true;
  const subAddons = addon.children || [];

  const tabs = ["description", "info", "addons"];

  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative transition-all", isSelected && "border-primary bg-primary/5")}>
      {/* Checkbox - يظهر فقط في وضع التحديد */}
      {selectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 cursor-pointer accent-primary"
          />
        </div>
      )}
      {/* Header: Icon + Name */}
      <div className="p-3 flex items-center gap-2 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          {addon.icon_url
            ? <img src={addon.icon_url} alt={addon.name} className="w-8 h-8 object-contain rounded-lg" />
            : <Package size={20} className="text-violet-600" />}
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-sm font-bold text-foreground">{addon.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isReady ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {isReady ? "جاهز" : "قريباً"}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          {!addon.is_free && addon.yearly_price > 0 && (
            <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
              <button onClick={() => setPricingType("monthly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "monthly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
              <button onClick={() => setPricingType("yearly")} className={cn("px-3 py-1 rounded-full text-xs font-semibold transition-all", pricingType === "yearly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
            </div>
          )}
          <div className="text-base font-bold text-primary">
            {addon.is_free ? <span className="text-emerald-600">مجاناً</span> : `${pricingType === "yearly" ? (addon.yearly_price ?? 0) : (addon.monthly_price ?? 0)} ${addon.currency ?? ""}`}
          </div>
        </div>
      </div>

      {/* Tabs: الوصف / المعلومات / الإضافات */}
      <div className="px-3 py-2.5">
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              className={cn(
                "flex-1 text-[11px] font-semibold px-1 py-1.5 rounded-lg transition-all text-center",
                activeTab === tab ? "bg-tabsActive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "description" ? "الوصف" : tab === "info" ? "المعلومات" : (
                <span className="flex items-center justify-center gap-0.5">
                  الإضافات
                  {subAddons.length > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold",
                      activeTab === "addons" ? "bg-white text-tabsActive" : "bg-violet-500 text-white"
                    )}>
                      {subAddons.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
            <AdminVideoPlayer videoUrl={addon.video_url} videoType={addon.video_type} />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">
              {addon.description || addon.short_description || "لا يوجد وصف"}
            </p>
          </motion.div>
        )}

        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-[11px] text-muted-foreground space-y-2" dir="rtl">
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">ID</span>
              <span className="font-mono text-[10px] truncate text-left">{addon.id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span>الإصدار</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
          </motion.div>
        )}

        {activeTab === "addons" && (
          <AdminAddonsTab addons={subAddons} updateAppMutation={updateAppMutation} onEdit={onEdit} />
        )}
      </div>

      {/* Action Button - مخفي عند عرض الإضافات */}
      {activeTab !== "addons" && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={() => onEdit?.(addon.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <Settings size={14} />
            تعديل
          </button>
          <button
            onClick={() => updateAppMutation.mutate({ id: addon.id, data: { is_active: !addon.is_active } })}
            title={addon.is_active ? "تعطيل" : "تفعيل"}
            className={cn(
              "relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5",
              addon.is_active ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300",
              addon.is_active ? "ml-0" : "mr-auto"
            )} />
          </button>
        </div>
      )}
    </div>
  );
}

// PlansContent moved to components/superadmin/app-manager/PlansContent.jsx