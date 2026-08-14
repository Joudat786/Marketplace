import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, ChevronDown, ChevronRight, Package, Plus,
  Link2, Link2Off, Eye, EyeOff, Search, X, Info, Settings2, Save, RotateCcw, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import SlidePanel from "@/components/superadmin/SlidePanel";
import AppForm from "./AppForm";

const RELATION_TYPES = {
  required_child: { label: "ابن إجباري", color: "bg-red-100 text-red-700 border-red-200", desc: "لا يمكن استخدام التطبيق الرئيسي بدونه" },
  optional_child:  { label: "ابن اختياري", color: "bg-blue-100 text-blue-700 border-blue-200", desc: "إضافة تكميلية اختيارية" },
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

/* ─── لوحة ربط إضافة بأب ─── */
function AttachPanel({ app, allApps, onAttach, onClose, preselectedParentId }) {
  const [selectedParentId, setSelectedParentId] = useState(preselectedParentId || "");
  const [relationType, setRelationType] = useState("optional_child");
  const [autoInstall, setAutoInstall] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = allApps
    .filter(a => a.id !== app.id && !a.is_addon)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div>
        <h3 className="text-lg font-bold text-foreground">ربط "{app.name}" بتطبيق رئيسي</h3>
        <p className="text-sm text-muted-foreground mt-1">اختر التطبيق الأب وحدد نوع العلاقة</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">اختر التطبيق الرئيسي</label>
        <input type="text" placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="max-h-52 overflow-y-auto border border-border rounded-lg">
          {filtered.map(a => (
            <button key={a.id} onClick={() => setSelectedParentId(a.id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-right border-b border-border/50 last:border-0 transition-colors",
                selectedParentId === a.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/40")}>
              {a.icon_url ? <img src={a.icon_url} alt="" className="w-6 h-6 rounded object-contain"/> : <Package size={16} className="text-primary"/>}
              <span className="text-sm font-semibold">{a.name}</span>
              {selectedParentId === a.id && <span className="mr-auto font-bold">✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">نوع العلاقة</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(RELATION_TYPES).map(([key, val]) => (
            <button key={key} onClick={() => setRelationType(key)}
              className={cn("p-3 border-2 rounded-lg text-right transition-all",
                relationType === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
              <p className="text-sm font-bold text-foreground">{val.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{val.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary/20">
        <div>
          <p className="text-sm font-semibold">تثبيت تلقائي مع الأب</p>
          <p className="text-xs text-muted-foreground">عند تثبيت التطبيق الرئيسي يُثبَّت هذا تلقائياً</p>
        </div>
        <button type="button" onClick={() => setAutoInstall(v => !v)}
          className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0", autoInstall ? "bg-primary" : "bg-muted")}>
          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", autoInstall ? "right-1" : "right-6")} />
        </button>
      </label>
      <div className="flex gap-2 pt-2 border-t border-border">
        <button onClick={() => selectedParentId && onAttach(app.id, selectedParentId, relationType, autoInstall)}
          disabled={!selectedParentId}
          className="flex-1 px-4 py-2.5 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40">
          ربط التطبيق
        </button>
        <button onClick={onClose} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">إلغاء</button>
      </div>
    </div>
  );
}

/* ─── لوحة تعديل العلاقة ─── */
function EditRelationPanel({ child, parent, currentRelation, onSave, onClose }) {
  const [relationType, setRelationType] = useState(currentRelation?.relation_type || "optional_child");
  const [autoInstall, setAutoInstall] = useState(currentRelation?.auto_install || false);
  const [installNote, setInstallNote] = useState(currentRelation?.install_note || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ relation_type: relationType, auto_install: autoInstall, install_note: installNote });
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <X size={16}/>
        </button>
        <div>
          <h3 className="text-lg font-bold text-foreground">تعديل علاقة الإضافة</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="text-violet-600 font-semibold">{child?.name}</span>
            <span className="mx-2">←</span>
            <span className="text-primary font-semibold">{parent?.name}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(RELATION_TYPES).map(([key, val]) => (
          <button key={key} onClick={() => setRelationType(key)}
            className={cn("p-4 border-2 rounded-xl text-right transition-all",
              relationType === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-card")}>
            <p className="text-sm font-bold text-foreground">{val.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{val.desc}</p>
          </button>
        ))}
      </div>
      <div className={cn("flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer", autoInstall ? "border-emerald-400 bg-emerald-50" : "border-border bg-card")}
        onClick={() => setAutoInstall(v => !v)}>
        <div>
          <p className="text-sm font-bold text-foreground">تثبيت تلقائي عند تثبيت الأب</p>
        </div>
        <div className={cn("relative w-12 h-7 rounded-full transition-colors flex-shrink-0", autoInstall ? "bg-emerald-500" : "bg-muted")}>
          <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", autoInstall ? "right-1" : "right-6")}/>
        </div>
      </div>
      <textarea value={installNote} onChange={e => setInstallNote(e.target.value)}
        placeholder="ملاحظة توضيحية للعميل (اختياري)..."
        rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      <div className="flex gap-2 pt-2 border-t border-border">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 px-4 py-2.5 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">إلغاء</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   الصفحة الرئيسية — نهج جديد كلياً
   ► البيانات تُخزَّن في useRef فقط (لا React Query للعرض)
   ► الـ UI يعتمد على state محلية مستقلة تماماً عن الكاش
   ══════════════════════════════════════════════════════════════════ */
export default function AppDesigner() {
  const { toast } = useToast();

  // ── State للعرض ──────────────────────────────────────────────────
  const [renderKey, setRenderKey] = useState(0); // يُزيد لإجبار إعادة الرسم عند الحاجة الصريحة
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showOrphans, setShowOrphans] = useState(true);
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [expandedApps, setExpandedApps] = useState(new Set());

  // ── Panels ───────────────────────────────────────────────────────
  const [editPanel, setEditPanel] = useState({ open: false, appId: null });
  const [attachPanel, setAttachPanel] = useState({ open: false, app: null, preselectedParentId: null });
  const [relationPanel, setRelationPanel] = useState({ open: false, childId: null, parentId: null });

  // ── البيانات الكاملة في refs (لا تُشغّل re-render) ──────────────
  const appsRef = useRef([]); // القائمة الكاملة للتطبيقات
  const catsRef = useRef([]); // قائمة التصنيفات

  // ── الترتيب المحلي: catId → [appId, ...] ───────────────────────
  const [catOrders, setCatOrders] = useState({}); // catId → appId[]
  const [childOrders, setChildOrders] = useState({}); // parentId → childId[]
  const childOrdersRef = useRef({}); // نسخة ref من childOrders للوصول المتزامن

  // تتبع هل الترتيب المحلي يختلف عما في الخادم
  const savedCatOrders = useRef({}); // آخر ترتيب محفوظ في الخادم

  // ── علم لمنع fetchAll من إعادة تعيين catOrders أثناء الحفظ ───────
  const isSavingRef = useRef(false);

  // ── جلب البيانات ─────────────────────────────────────────────────
  const fetchAll = useCallback(async (forceReset = false) => {
    setIsLoading(true);
    try {
      const [apps, cats] = await Promise.all([
        base44.entities.App.list(),
        base44.entities.AppCategory.list()
      ]);
      const activeCats = [...cats].filter(c => c.is_active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      appsRef.current = apps;
      catsRef.current = activeCats;

      // بناء الترتيب من بيانات الخادم
      const orders = buildOrdersFromData(apps, activeCats);
      savedCatOrders.current = orders;

      // فقط إذا لم نكن في منتصف الحفظ
      if (!isSavingRef.current || forceReset) {
        setCatOrders(orders);
        setChildOrders({});
        setExpandedCats(new Set(activeCats.map(c => c.id).concat(["__uncategorized__"])));
      }

      setRenderKey(k => k + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── دوال مساعدة ──────────────────────────────────────────────────
  function buildOrdersFromData(apps, cats) {
    const orders = {};
    cats.forEach(cat => {
      const inCat = apps.filter(a =>
        !a.is_addon &&
        (a.categories || []).some(c => {
          const name = cats.find(dc => dc.id === c)?.name || c;
          return name === cat.name;
        })
      ).sort((a, b) => {
        const ao = (a.category_sort_orders || {})[cat.name] ?? 9999;
        const bo = (b.category_sort_orders || {})[cat.name] ?? 9999;
        return ao - bo;
      });
      orders[cat.id] = inCat.map(a => a.id);
    });
    // غير مصنفة
    const uncat = apps.filter(a => !a.is_addon && (!a.categories || a.categories.length === 0));
    if (uncat.length > 0) orders["__uncategorized__"] = uncat.map(a => a.id);
    return orders;
  }

  function cleanRelatedApp(r) {
    if (!r || typeof r !== 'object' || !r.app_id) return null;
    return {
      app_id: String(r.app_id),
      relation_type: r.relation_type || "optional_child",
      auto_install: Boolean(r.auto_install),
      ...(r.install_note ? { install_note: String(r.install_note) } : {}),
    };
  }

  function cleanRelatedApps(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(cleanRelatedApp).filter(Boolean);
  }

  // تحديث تطبيق واحد في appsRef وحفظه في الخادم
  async function apiUpdate(id, data) {
    const safeData = { ...data };
    if (safeData.related_apps !== undefined) {
      safeData.related_apps = cleanRelatedApps(safeData.related_apps);
    }
    appsRef.current = appsRef.current.map(a => a.id === id ? { ...a, ...safeData } : a);
    await base44.entities.App.update(id, safeData);
  }

  // ── snapshot من appsRef عند كل render (renderKey يضمن تحديثه) ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const apps = useMemo(() => appsRef.current, [renderKey]);

  const childrenMap = useMemo(() => {
    const m = {};

    // جمع كل الأبناء لكل أب (من related_apps + من parent_app_ids)
    apps.forEach(parent => {
      if (parent.is_addon) return;
      (parent.related_apps || []).filter(r => r?.app_id).forEach(r => {
        const child = apps.find(a => a.id === r.app_id);
        if (child) { if (!m[parent.id]) m[parent.id] = []; if (!m[parent.id].find(c => c.id === child.id)) m[parent.id].push(child); }
      });
    });
    apps.forEach(app => {
      if (!app.is_addon) return;
      const pids = app.parent_app_ids?.length > 0 ? app.parent_app_ids : (app.parent_app_id ? [app.parent_app_id] : []);
      pids.forEach(pid => {
        if (!m[pid]) m[pid] = [];
        if (!m[pid].find(c => c.id === app.id)) m[pid].push(app);
      });
    });

    // ترتيب الأبناء: أولاً childOrders (بعد السحب)، ثم __child_of_ المحفوظ
    Object.keys(m).forEach(parentId => {
      const localOrder = childOrders[parentId];
      if (localOrder && localOrder.length > 0) {
        // استخدم الترتيب المحلي بعد السحب
        const cur = m[parentId];
        const ordered = localOrder.map(id => cur.find(c => c.id === id)).filter(Boolean);
        const rest = cur.filter(c => !localOrder.includes(c.id));
        m[parentId] = [...ordered, ...rest];
      } else {
        // استخدم الترتيب المحفوظ من category_sort_orders
        const key = `__child_of_${parentId}`;
        const hasSavedOrder = m[parentId].some(c => (c.category_sort_orders || {})[key] !== undefined);
        if (hasSavedOrder) {
          m[parentId] = [...m[parentId]].sort((a, b) => {
            const ao = (a.category_sort_orders || {})[key] ?? 9999;
            const bo = (b.category_sort_orders || {})[key] ?? 9999;
            return ao - bo;
          });
        }
      }
    });

    return m;
  }, [renderKey, childOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  const relTypeMap = useMemo(() => {
    const m = {};
    apps.forEach(p => (p.related_apps || []).forEach(r => { if (r?.app_id) m[r.app_id] = r.relation_type; }));
    return m;
  }, [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const orphans = useMemo(() => apps.filter(a => {
    if (!a.is_addon) return false;
    const pids = a.parent_app_ids?.length > 0 ? a.parent_app_ids : (a.parent_app_id ? [a.parent_app_id] : []);
    return pids.length === 0 || pids.every(pid => !apps.find(p => p.id === pid));
  }), [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const allAppsMap = useMemo(() => Object.fromEntries(apps.map(a => [a.id, a])), [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // التصنيفات مع الترتيب المحلي
  const categorizedApps = useMemo(() => {
    const cats = catsRef.current;
    const result = [];

    const applyOrder = (catId, list) => {
      const order = catOrders[catId];
      if (!order || order.length === 0) return list;
      return [...list].sort((a, b) => {
        const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    };

    cats.forEach(cat => {
      let list = apps.filter(a =>
        !a.is_addon &&
        (a.categories || []).some(c => {
          const name = cats.find(dc => dc.id === c)?.name || c;
          return name === cat.name;
        })
      ).filter(a =>
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (childrenMap[a.id] || []).some(ch => ch.name.toLowerCase().includes(search.toLowerCase()))
      );
      list = applyOrder(cat.id, list);
      if (list.length > 0) result.push({ cat, apps: list });
    });

    let uncat = apps.filter(a => !a.is_addon && (!a.categories || a.categories.length === 0))
      .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
    uncat = applyOrder("__uncategorized__", uncat);
    if (uncat.length > 0) result.push({ cat: { id: "__uncategorized__", name: "غير مصنفة", icon: "🗂️" }, apps: uncat });
    return result;
  }, [renderKey, catOrders, search, childrenMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasUnsavedChanges = useMemo(() => {
    if (Object.keys(childOrders).length > 0) return true;
    for (const [catId, ids] of Object.entries(catOrders)) {
      const saved = savedCatOrders.current[catId] || [];
      if (JSON.stringify(ids) !== JSON.stringify(saved)) return true;
    }
    return false;
  }, [catOrders, childOrders]);

  // ── إعادة الترتيب ────────────────────────────────────────────────
  const handleReorder = (catId, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const catEntry = categorizedApps.find(e => e.cat.id === catId);
    if (!catEntry) return;
    const ids = catEntry.apps.map(a => a.id);
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    setCatOrders(prev => ({ ...prev, [catId]: ids }));
  };

  const handleReorderChildren = (parentId, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const cur = childrenMap[parentId] || [];
    const reordered = [...cur];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const newOrder = reordered.map(c => c.id);
    childOrdersRef.current = { ...childOrdersRef.current, [parentId]: newOrder };
    setChildOrders(prev => ({ ...prev, [parentId]: newOrder }));
  };

  // ── حفظ التغييرات ────────────────────────────────────────────────
  const handleSave = async () => {
    // نسخ catOrders الحالي قبل أي تغيير (لأن العمليات async قد تُشغّل re-render)
    const catOrdersSnapshot = JSON.parse(JSON.stringify(catOrders));
    const childOrdersSnapshot = JSON.parse(JSON.stringify(childOrders));

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // 1. ترتيب التطبيقات في التصنيفات — حفظ متوازٍ بدل المتسلسل
      const catSavePromises = [];
      for (const [catId, ids] of Object.entries(catOrdersSnapshot)) {
        if (catId === "__uncategorized__") continue;
        const catName = catsRef.current.find(c => c.id === catId)?.name || catId;
        for (let i = 0; i < ids.length; i++) {
          const app = appsRef.current.find(a => a.id === ids[i]);
          if (!app) continue;
          const updatedSortOrders = { ...(app.category_sort_orders || {}), [catName]: i };
          // تحديث appsRef محلياً فوراً
          appsRef.current = appsRef.current.map(a => a.id === ids[i] ? { ...a, category_sort_orders: updatedSortOrders } : a);
          catSavePromises.push(base44.entities.App.update(ids[i], { category_sort_orders: updatedSortOrders }));
        }
      }

      // 2. ترتيب الأبناء — نحفظ الترتيب على كل ابن في category_sort_orders
      const childSavePromises = [];
      for (const [parentId, newOrderIds] of Object.entries(childOrdersSnapshot)) {
        for (let i = 0; i < newOrderIds.length; i++) {
          const childId = newOrderIds[i];
          const child = appsRef.current.find(a => a.id === childId);
          if (!child) continue;
          const key = `__child_of_${parentId}`;
          const updatedSortOrders = { ...(child.category_sort_orders || {}), [key]: i };
          appsRef.current = appsRef.current.map(a => a.id === childId ? { ...a, category_sort_orders: updatedSortOrders } : a);
          childSavePromises.push(base44.entities.App.update(childId, { category_sort_orders: updatedSortOrders }));
        }
      }

      // انتظر انتهاء جميع العمليات
      await Promise.all([...catSavePromises, ...childSavePromises]);

      // ✅ تحديث savedCatOrders من catOrders المحفوظ بدون أي تغيير على catOrders
      savedCatOrders.current = catOrdersSnapshot;
      childOrdersRef.current = {};
      // تحديث catOrders من الـ snapshot لضمان التزامن (لا تغيير فعلي)
      setCatOrders(catOrdersSnapshot);
      setChildOrders({});
      // أجبر إعادة بناء childrenMap من appsRef المحدَّثة
      setRenderKey(k => k + 1);
      toast({ title: "✅ تم الحفظ", description: "تم حفظ جميع التغييرات بنجاح" });
    } catch (e) {
      toast({ title: "❌ خطأ", description: "فشل الحفظ، حاول مرة أخرى", variant: "destructive" });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // ── إعادة تعيين ──────────────────────────────────────────────────
  const handleReset = () => {
    if (!confirm("هل تريد إلغاء جميع التغييرات غير المحفوظة؟")) return;
    setCatOrders({ ...savedCatOrders.current });
    setChildOrders({});
  };

  // ── ربط تطبيق ────────────────────────────────────────────────────
  const doAttach = async (childId, parentId, relationType, autoInstall) => {
    const child = appsRef.current.find(a => a.id === childId);
    const parent = appsRef.current.find(a => a.id === parentId);
    if (!child || !parent) return;

    const oldPids = child.parent_app_ids?.length > 0 ? child.parent_app_ids : (child.parent_app_id ? [child.parent_app_id] : []);
    for (const pid of oldPids) {
      const op = appsRef.current.find(a => a.id === pid);
      if (op) await apiUpdate(pid, { related_apps: cleanRelatedApps((op.related_apps || []).filter(r => r?.app_id !== childId)) });
    }
    await apiUpdate(childId, { is_addon: true, parent_app_ids: [parentId], parent_app_id: parentId });
    const existing = cleanRelatedApps((parent.related_apps || []).filter(r => r?.app_id !== childId));
    const newRelation = cleanRelatedApp({ app_id: childId, relation_type: relationType, auto_install: autoInstall });
    await apiUpdate(parentId, { related_apps: newRelation ? [...existing, newRelation] : existing });

    setExpandedApps(prev => new Set([...prev, parentId]));
    // إعادة بناء catOrders من البيانات الجديدة
    const newOrders = buildOrdersFromData(appsRef.current, catsRef.current);
    savedCatOrders.current = newOrders;
    setCatOrders(newOrders);
    setChildOrders({});
    setRenderKey(k => k + 1);
    toast({ title: "✓", description: `تم ربط "${child.name}" بـ "${parent.name}"` });
  };

  const handleAttach = async (childId, parentId, relationType, autoInstall) => {
    await doAttach(childId, parentId, relationType, autoInstall);
    setAttachPanel({ open: false, app: null, preselectedParentId: null });
  };

  // ── فصل تطبيق ────────────────────────────────────────────────────
  const handleDetach = async (appId) => {
    if (!window.confirm("هل تريد فصل هذا التطبيق عن تطبيقه الرئيسي؟")) return;
    const app = appsRef.current.find(a => a.id === appId);
    if (!app) return;
    const pids = app.parent_app_ids?.length > 0 ? app.parent_app_ids : (app.parent_app_id ? [app.parent_app_id] : []);
    for (const pid of pids) {
      const parent = appsRef.current.find(a => a.id === pid);
      if (parent) await apiUpdate(pid, { related_apps: cleanRelatedApps((parent.related_apps || []).filter(r => r?.app_id !== appId)) });
    }
    await apiUpdate(appId, { is_addon: false, parent_app_ids: [], parent_app_id: "" });
    const newOrders = buildOrdersFromData(appsRef.current, catsRef.current);
    savedCatOrders.current = newOrders;
    setCatOrders(newOrders);
    setChildOrders({});
    setRenderKey(k => k + 1);
    toast({ title: "✓", description: "تم الفصل بنجاح" });
  };

  // ── تعديل العلاقة ────────────────────────────────────────────────
  const handleSaveRelation = async ({ relation_type, auto_install, install_note }) => {
    const { childId, parentId } = relationPanel;
    const parent = allAppsMap[parentId];
    if (!parent) return;

    const existingRelations = parent.related_apps || [];
    const alreadyExists = existingRelations.some(r => r?.app_id === childId);

    let updatedRelated;
    if (alreadyExists) {
      // تحديث العلاقة الموجودة
      updatedRelated = cleanRelatedApps(existingRelations.map(r =>
        r?.app_id === childId ? { ...r, relation_type, auto_install, install_note } : r
      ));
    } else {
      // العلاقة غير موجودة في related_apps → أضفها
      updatedRelated = cleanRelatedApps([
        ...existingRelations,
        { app_id: childId, relation_type, auto_install, install_note }
      ]);
    }

    await apiUpdate(parentId, { related_apps: updatedRelated });
    setRelationPanel({ open: false, childId: null, parentId: null });
    setRenderKey(k => k + 1);
    toast({ title: "✓", description: "تم تحديث نوع العلاقة بنجاح" });
  };

  // ── إحصائيات ─────────────────────────────────────────────────────
  const standaloneCount = useMemo(() => apps.filter(a => !a.is_addon).length, [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const addonCount = useMemo(() => apps.filter(a => a.is_addon && (a.parent_app_ids?.length > 0 || a.parent_app_id)).length, [renderKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── الواجهة ───────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">

      {/* الرأس */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مصمم التطبيقات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {standaloneCount} تطبيق رئيسي · {addonCount} إضافة مرتبطة · {orphans.length} إضافة يتيمة
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setExpandedCats(new Set([...catsRef.current.map(c=>c.id),"__uncategorized__"])); setExpandedApps(new Set(apps.map(a=>a.id))); }}
            className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-secondary font-semibold">فتح الكل</button>
          <button onClick={() => { setExpandedCats(new Set()); setExpandedApps(new Set()); }}
            className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-secondary font-semibold">إغلاق الكل</button>
          <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
            <RefreshCw size={14}/> تحديث
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
            <RotateCcw size={15}/> إعادة تعيين
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            <Save size={15}/>
            {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <button onClick={() => setEditPanel({ open: true, appId: null })}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:opacity-90">
            <Plus size={16}/> تطبيق جديد
          </button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-700 font-semibold">
          ⚠️ يوجد تغييرات في الترتيب غير محفوظة — اضغط "حفظ التغييرات" لتثبيتها
        </div>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "تطبيقات رئيسية", value: standaloneCount, color: "text-primary", bg: "bg-primary/5" },
          { label: "إضافات مرتبطة", value: addonCount, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "إضافات يتيمة", value: orphans.length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "جاهز للنشر", value: apps.filter(a => a.is_ready).length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-xl p-4 border border-border", s.bg)}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* تعليمة */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <Info size={14} className="flex-shrink-0 mt-0.5"/>
        <div className="space-y-1">
          <p><GripVertical size={12} className="inline ml-1"/><strong>مقبض الترتيب (الرمادي):</strong> اسحبه لإعادة ترتيب التطبيقات داخل التصنيف.</p>
          <p>بعد إعادة الترتيب اضغط <strong>"حفظ التغييرات"</strong> لتثبيت الترتيب الجديد.</p>
        </div>
      </div>

      {/* بحث */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input type="text" placeholder="ابحث عن تطبيق..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14}/></button>}
        </div>
        <button onClick={() => setShowOrphans(v => !v)}
          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors",
            showOrphans ? "bg-amber-50 border-amber-300 text-amber-700" : "border-border hover:bg-secondary")}>
          {showOrphans ? <Eye size={15}/> : <EyeOff size={15}/>}
          اليتيمة ({orphans.length})
        </button>
      </div>

      {/* المحتوى */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-muted-foreground/50"/>
          جارٍ التحميل...
        </div>
      ) : (
        <div className={cn("grid gap-6", showOrphans && orphans.length > 0 ? "lg:grid-cols-3" : "grid-cols-1")}>
          {/* التصنيفات */}
          <div className={cn("space-y-4", showOrphans && orphans.length > 0 ? "lg:col-span-2" : "col-span-1")}>
            {categorizedApps.length === 0 ? (
              <div className="bg-card border border-border rounded-xl py-12 text-center text-sm text-muted-foreground">لا توجد تطبيقات</div>
            ) : categorizedApps.map(({ cat, apps: catApps }) => {
              const isCatOpen = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCats(prev => { const n = new Set(prev); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}
                    className="w-full flex items-center justify-between px-4 py-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                    <div className="flex items-center gap-2">
                      {cat.icon && <span className="text-base">{cat.icon}</span>}
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full font-semibold">{catApps.length}</span>
                    </div>
                    {isCatOpen ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                  </button>
                  {isCatOpen && (
                    <SortableAppList
                      apps={catApps}
                      childrenMap={childrenMap}
                      relTypeMap={relTypeMap}
                      onEdit={(id) => setEditPanel({ open: true, appId: id })}
                      onDetach={handleDetach}
                      onAttachChild={(app) => setAttachPanel({ open: true, app, preselectedParentId: null })}
                      expandedApps={expandedApps}
                      toggleApp={(id) => setExpandedApps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onReorder={(from, to) => handleReorder(cat.id, from, to)}
                      onEditRelation={(cid, pid) => setRelationPanel({ open: true, childId: cid, parentId: pid })}
                      onReorderChildren={handleReorderChildren}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* الإضافات اليتيمة */}
          {showOrphans && orphans.length > 0 && (
            <div>
              <div className="bg-card border border-amber-200 rounded-xl overflow-hidden sticky top-4">
                <div className="px-4 py-3 border-b border-amber-200 bg-amber-50">
                  <p className="text-sm font-bold text-amber-800">⚠️ إضافات بلا تطبيق رئيسي ({orphans.length})</p>
                  <p className="text-xs text-amber-600 mt-0.5">اضغط 🔗 للربط اليدوي</p>
                </div>
                <div className="divide-y divide-border">
                  {orphans.map(app => (
                    <div key={app.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        {app.icon_url ? <img src={app.icon_url} alt="" className="w-4 h-4 rounded object-contain"/> : <Package size={12} className="text-amber-600"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{app.name}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setAttachPanel({ open: true, app, preselectedParentId: null })} title="ربط"
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Link2 size={12}/>
                        </button>
                        <button onClick={() => setEditPanel({ open: true, appId: app.id })}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                          <EditIcon/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel open={editPanel.open} onClose={() => setEditPanel({ open: false, appId: null })}>
        <AppForm
          embeddedAppId={editPanel.appId}
          onClose={() => setEditPanel({ open: false, appId: null })}
          onSaved={async () => {
            // جلب فقط التطبيق المُعدَّل وتحديثه في appsRef بدون إعادة بناء الترتيب
            const newApps = await base44.entities.App.list();
            appsRef.current = newApps;
            // نُحدّث catOrders فقط للتطبيقات الجديدة (المُضافة) — لا نُغيّر ترتيب الموجودة
            const newOrders = buildOrdersFromData(newApps, catsRef.current);
            // أضف أي تطبيقات جديدة غير موجودة في catOrders الحالي
            setCatOrders(prev => {
              const merged = { ...prev };
              for (const [catId, ids] of Object.entries(newOrders)) {
                const existing = prev[catId] || [];
                const newIds = ids.filter(id => !existing.includes(id));
                merged[catId] = [...existing, ...newIds];
              }
              // احذف IDs للتطبيقات المحذوفة
              const allNewIds = new Set(newApps.map(a => a.id));
              for (const catId of Object.keys(merged)) {
                merged[catId] = merged[catId].filter(id => allNewIds.has(id));
              }
              savedCatOrders.current = JSON.parse(JSON.stringify(merged));
              return merged;
            });
            setRenderKey(k => k + 1);
          }}
        />
      </SlidePanel>

      <SlidePanel open={attachPanel.open} onClose={() => setAttachPanel({ open: false, app: null, preselectedParentId: null })}>
        {attachPanel.app && (
          <AttachPanel
            app={attachPanel.app}
            allApps={appsRef.current}
            onAttach={handleAttach}
            onClose={() => setAttachPanel({ open: false, app: null, preselectedParentId: null })}
            preselectedParentId={attachPanel.preselectedParentId}
          />
        )}
      </SlidePanel>

      <SlidePanel open={relationPanel.open} onClose={() => setRelationPanel({ open: false, childId: null, parentId: null })}>
        {relationPanel.childId && relationPanel.parentId && (() => {
          const child = allAppsMap[relationPanel.childId];
          const parent = allAppsMap[relationPanel.parentId];
          const currentRelation = (parent?.related_apps || []).find(r => r?.app_id === relationPanel.childId);
          return (
            <EditRelationPanel
              child={child}
              parent={parent}
              currentRelation={currentRelation}
              onSave={handleSaveRelation}
              onClose={() => setRelationPanel({ open: false, childId: null, parentId: null })}
            />
          );
        })()}
      </SlidePanel>
    </motion.div>
  );
}

/* ─── شارة السعر مع تبويبتين شهري/سنوي ─── */
function PriceBadge({ monthly, yearly, currency = "SAR" }) {
  const [tab, setTab] = useState("monthly");
  const price = tab === "monthly" ? (monthly ?? 0) : (yearly ?? 0);
  const hasYearly = yearly > 0;

  return (
    <div className="flex items-center gap-0 rounded-full border border-blue-200 bg-blue-50 overflow-hidden flex-shrink-0" style={{ fontSize: "10px" }}>
      {hasYearly && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setTab("monthly"); }}
            className={cn("px-2 py-0.5 font-semibold transition-colors", tab === "monthly" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-100")}
          >شهري</button>
          <button
            onClick={e => { e.stopPropagation(); setTab("yearly"); }}
            className={cn("px-2 py-0.5 font-semibold transition-colors", tab === "yearly" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-100")}
          >سنوي</button>
        </>
      )}
      <span className={cn("px-2 py-0.5 font-bold text-blue-800", hasYearly && "border-r border-blue-200")}>
        {price} {currency}
      </span>
    </div>
  );
}

/* ─── قائمة تطبيقات قابلة للترتيب ─── */
function SortableAppList({ apps, childrenMap, relTypeMap, onEdit, onDetach, onAttachChild, expandedApps, toggleApp, onReorder, onEditRelation, onReorderChildren }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index, to = result.destination.index;
    if (from !== to) onReorder(from, to);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`cat-${apps[0]?.id || 'list'}`} type="APP">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-border/50">
            {apps.map((app, idx) => {
              const children = childrenMap[app.id] || [];
              const isExpanded = expandedApps.has(app.id);
              return (
                <Draggable key={app.id} draggableId={`app-${app.id}`} index={idx}>
                  {(pd, snap) => (
                    <div ref={pd.innerRef} {...pd.draggableProps}
                      className={cn("bg-card transition-all", snap.isDragging && "shadow-xl opacity-90 z-50")}>
                      <div className="flex items-center gap-2 px-4 py-3 hover:bg-secondary/20">
                        <div {...pd.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary flex-shrink-0 p-0.5 rounded hover:bg-primary/10">
                          <GripVertical size={16}/>
                        </div>
                        <button onClick={() => toggleApp(app.id)}
                          className={cn("flex-shrink-0 w-4", children.length === 0 && "opacity-0 pointer-events-none")}>
                          {isExpanded ? <ChevronDown size={13} className="text-muted-foreground"/> : <ChevronRight size={13} className="text-muted-foreground"/>}
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {app.icon_url ? <img src={app.icon_url} alt="" className="w-5 h-5 rounded object-contain"/> : <Package size={14} className="text-primary"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground truncate">{app.name}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0",
                              app.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>
                              {app.is_ready ? "✅ جاهز" : "🔜 قريباً"}
                            </span>
                            {children.length > 0 && (
                              <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                🧩 {children.length}
                              </span>
                            )}
                            {app.is_free ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0 border border-emerald-200">✓ مجاني</span>
                            ) : (
                              <PriceBadge monthly={app.monthly_price} yearly={app.yearly_price} currency={app.currency} />
                            )}
                          </div>
                          {app.short_description && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{app.short_description}</p>}
                        </div>
                        <button onClick={() => onAttachChild(app)} title="إضافة إضافة فرعية"
                          className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-400 hover:text-violet-600 transition-colors flex-shrink-0">
                          <Link2 size={13}/>
                        </button>
                        <button onClick={() => onEdit(app.id)} title="تعديل"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                          <EditIcon/>
                        </button>
                      </div>
                      {isExpanded && children.length > 0 && (
                        <div className="bg-secondary/10 border-t border-border/30">
                          <SortableChildrenList
                            children={children}
                            relTypeMap={relTypeMap}
                            parentApp={app}
                            onEdit={onEdit}
                            onDetach={onDetach}
                            onEditRelation={onEditRelation}
                            onReorderChildren={onReorderChildren}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

/* ─── قائمة الأبناء القابلة للترتيب ─── */
function SortableChildrenList({ children, relTypeMap, parentApp, onEdit, onDetach, onEditRelation, onReorderChildren }) {
  if (children.length === 0) return null;

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index, to = result.destination.index;
    if (from !== to) onReorderChildren(parentApp.id, from, to);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`ch-${parentApp.id}`} type="CHILD">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {children.map((child, cidx) => (
              <Draggable key={child.id} draggableId={`ch-${child.id}`} index={cidx}>
                {(pd, snap) => (
                  <div ref={pd.innerRef} {...pd.draggableProps}
                    className={cn("flex items-center gap-2 py-2.5 border-b border-border/20 last:border-0 hover:bg-secondary/20",
                      snap.isDragging && "shadow-lg opacity-90 bg-white z-50")}
                    style={{ paddingRight: "52px", paddingLeft: "12px", ...pd.draggableProps.style }}>
                    <div {...pd.dragHandleProps} className="cursor-grab active:cursor-grabbing text-violet-300 hover:text-violet-600 flex-shrink-0 p-0.5 rounded hover:bg-violet-100">
                      <GripVertical size={13}/>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
                      {child.icon_url ? <img src={child.icon_url} alt="" className="w-4 h-4 rounded object-contain"/> : <Package size={11} className="text-violet-600"/>}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate">{child.name}</span>
                      {relTypeMap[child.id] && (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold flex-shrink-0", RELATION_TYPES[relTypeMap[child.id]]?.color)}>
                          {RELATION_TYPES[relTypeMap[child.id]]?.label}
                        </span>
                      )}
                      <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium flex-shrink-0",
                        child.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>
                        {child.is_ready ? "✅" : "🔜"}
                      </span>
                      {child.is_free ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 border border-emerald-200">✓ مجاني</span>
                      ) : (
                        <PriceBadge monthly={child.monthly_price} yearly={child.yearly_price} currency={child.currency} />
                      )}
                    </div>
                    <button onClick={() => onEditRelation(child.id, parentApp.id)} title="تعديل العلاقة"
                      className="p-1 rounded hover:bg-violet-100 text-muted-foreground hover:text-violet-600 flex-shrink-0">
                      <Settings2 size={12}/>
                    </button>
                    <button onClick={() => onEdit(child.id)} title="تعديل"
                      className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary flex-shrink-0">
                      <EditIcon/>
                    </button>
                    <button onClick={() => onDetach(child.id)} title="فصل عن الأب"
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <Link2Off size={11}/>
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}