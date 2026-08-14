import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Package, Plus, Link2, Link2Off, Settings2,
  Search, X, ChevronDown, ChevronRight, Minus, Info, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const RELATION_TYPES = {
  required_child: { label: "ابن إجباري", color: "bg-red-100 text-red-700 border-red-200" },
  optional_child: { label: "ابن اختياري", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

const cleanRelatedApp = (r) => {
  if (!r || typeof r !== "object" || !r.app_id) return null;
  return {
    app_id: String(r.app_id),
    relation_type: r.relation_type || "optional_child",
    auto_install: Boolean(r.auto_install),
    ...(r.install_note ? { install_note: String(r.install_note) } : {}),
  };
};
const cleanRelatedApps = (arr) => (arr || []).map(cleanRelatedApp).filter(Boolean);
const buildSafeData = (data) => {
  const d = { ...data };
  if (d.related_apps !== undefined) d.related_apps = cleanRelatedApps(d.related_apps);
  return d;
};

// ── صف تطبيق ──
function AppRow({ app, children, relTypeMap, sidebarMap, installedIds, isExpanded, onToggle, onDetach, onEditRelation, draggableProps, dragHandleProps, innerRef, isDragging }) {
  const inSidebar = sidebarMap[app.id];
  const isInstalled = installedIds.has(app.id);

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={cn("border-b border-border/50 bg-card transition-all", isDragging && "shadow-xl opacity-90 z-50")}
    >
      <div className="flex items-center gap-2 px-3 py-3 hover:bg-secondary/20">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary flex-shrink-0">
          <GripVertical size={16} />
        </div>
        <button onClick={onToggle} className={cn("flex-shrink-0 w-4", children.length === 0 && "opacity-0 pointer-events-none")}>
          {isExpanded ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {app.icon_url ? <img src={app.icon_url} alt="" className="w-5 h-5 rounded object-contain" /> : <Package size={14} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{app.name}</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0",
              app.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}>
              {app.is_ready ? "✅ جاهز" : "🔜 قريباً"}
            </span>
            {children.length > 0 && (
              <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                🧩 {children.length}
              </span>
            )}
          </div>
          {app.short_description && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{app.short_description}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold",
            isInstalled ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200")}>
            {isInstalled ? "✓ مثبّت" : "غير مثبّت"}
          </span>
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold",
            inSidebar ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-gray-50 text-gray-400 border-gray-200")}>
            {inSidebar ? "👁 في القائمة" : "مخفي"}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-secondary/10 border-t border-border/30">
          {children.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2 italic opacity-60">لا توجد إضافات فرعية</p>
          ) : children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 py-2 border-b border-border/20 last:border-0 hover:bg-secondary/20"
              style={{ paddingRight: "44px", paddingLeft: "12px" }}>
              <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
                {child.icon_url ? <img src={child.icon_url} alt="" className="w-4 h-4 rounded object-contain" /> : <Package size={11} className="text-violet-600" />}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground truncate">{child.name}</span>
                {relTypeMap[child.id] && (
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold flex-shrink-0", RELATION_TYPES[relTypeMap[child.id]]?.color)}>
                    {RELATION_TYPES[relTypeMap[child.id]]?.label}
                  </span>
                )}
              </div>
              <button onClick={() => onEditRelation(child.id, app.id)} className="p-1 rounded hover:bg-violet-100 text-muted-foreground hover:text-violet-600"><Settings2 size={11} /></button>
              <button onClick={() => onDetach(child.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Link2Off size={11} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── لوحة تعديل العلاقة ──
function EditRelationPanel({ child, parent, currentRelation, onSave, onClose }) {
  const [relationType, setRelationType] = useState(currentRelation?.relation_type || "optional_child");
  const [autoInstall, setAutoInstall] = useState(currentRelation?.auto_install || false);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-96 p-6" dir="rtl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold mb-4">تعديل علاقة: <span className="text-violet-600">{child?.name}</span> ← <span className="text-primary">{parent?.name}</span></h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(RELATION_TYPES).map(([key, val]) => (
            <button key={key} onClick={() => setRelationType(key)}
              className={cn("p-3 border-2 rounded-lg text-right", relationType === key ? "border-primary bg-primary/5" : "border-border")}>
              <p className="text-sm font-bold">{val.label}</p>
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-secondary/20 mb-4" onClick={() => setAutoInstall(v => !v)}>
          <p className="text-sm font-semibold">تثبيت تلقائي مع الأب</p>
          <div className={cn("relative w-11 h-6 rounded-full transition-colors", autoInstall ? "bg-primary" : "bg-muted")}>
            <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", autoInstall ? "right-1" : "right-6")} />
          </div>
        </label>
        <div className="flex gap-2">
          <button onClick={() => onSave({ relation_type: relationType, auto_install: autoInstall })} className="flex-1 px-4 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90">حفظ</button>
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ── المكون الرئيسي ──
export default function AppsDesignerTab({ sidebarItems = [] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [expandedApps, setExpandedApps] = useState(new Set());
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [relationPanel, setRelationPanel] = useState({ open: false, childId: null, parentId: null });
  // ترتيب مخصص لكل تصنيف { catId: [appId,...] }
  const [catOrders, setCatOrders] = useState({});

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps-designer-tab"],
    queryFn: () => base44.entities.App.list(),
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["appCategories-designer-tab"],
    queryFn: () => base44.entities.AppCategory.list(),
    select: d => [...d].filter(c => c.is_active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  });

  // فتح كل التصنيفات عند التحميل
  useEffect(() => {
    if (dbCategories.length > 0) {
      setExpandedCats(new Set([...dbCategories.map(c => c.id), "__uncategorized__"]));
    }
  }, [dbCategories.length]);

  const allAppsMap = useMemo(() => Object.fromEntries(apps.map(a => [a.id, a])), [apps]);
  const mainApps = useMemo(() => apps.filter(a => !a.is_addon), [apps]);

  const relTypeMap = useMemo(() => {
    const m = {};
    apps.forEach(p => (p.related_apps || []).forEach(r => { if (r?.app_id) m[r.app_id] = r.relation_type; }));
    return m;
  }, [apps]);

  const childrenMap = useMemo(() => {
    const m = {};
    apps.forEach(parent => {
      if (parent.is_addon) return;
      const ids = (parent.related_apps || []).filter(r => r?.app_id).map(r => r.app_id);
      ids.forEach(cid => {
        const child = apps.find(a => a.id === cid);
        if (child) { if (!m[parent.id]) m[parent.id] = []; m[parent.id].push(child); }
      });
    });
    return m;
  }, [apps]);

  const sidebarMap = useMemo(() => {
    const m = {};
    const scan = (items) => items.forEach(item => {
      if (item.appId) m[item.appId] = true;
      if (item.children) scan(item.children);
    });
    scan(sidebarItems);
    return m;
  }, [sidebarItems]);

  const installedIds = useMemo(() => new Set(apps.filter(a => a.is_active && a.is_ready).map(a => a.id)), [apps]);

  // تصنيف التطبيقات
  const categorizedApps = useMemo(() => {
    const applyOrder = (catId, list) => {
      const order = catOrders[catId];
      if (!order) return list;
      return [...list].sort((a, b) => {
        const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    };

    const result = [];
    dbCategories.forEach(cat => {
      let list = mainApps.filter(a =>
        (a.categories || []).some(c => {
          const name = dbCategories.find(dc => dc.id === c)?.name || c;
          return name === cat.name || c === cat.id;
        })
      ).filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        (childrenMap[a.id] || []).some(ch => ch.name.toLowerCase().includes(search.toLowerCase())));
      list = applyOrder(cat.id, list);
      if (list.length > 0) result.push({ cat, apps: list });
    });

    let uncat = mainApps.filter(a => !a.categories || a.categories.length === 0)
      .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
    uncat = applyOrder("__uncategorized__", uncat);
    if (uncat.length > 0) result.push({ cat: { id: "__uncategorized__", name: "غير مصنفة", icon: "🗂️" }, apps: uncat });

    return result;
  }, [mainApps, dbCategories, search, childrenMap, catOrders]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.App.update(id, buildSafeData(data)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps-designer-tab"] }); },
  });

  const handleDragEnd = (catId) => (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const catEntry = categorizedApps.find(e => e.cat.id === catId);
    if (!catEntry) return;
    const ids = catEntry.apps.map(a => a.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setCatOrders(prev => ({ ...prev, [catId]: ids }));
    toast({ title: "✅ تم تغيير الترتيب" });
  };

  const handleDetach = async (childId) => {
    if (!confirm("هل تريد فصل هذا التطبيق؟")) return;
    const child = apps.find(a => a.id === childId);
    if (!child) return;
    const pids = child.parent_app_ids?.length > 0 ? child.parent_app_ids : (child.parent_app_id ? [child.parent_app_id] : []);
    for (const pid of pids) {
      const parent = apps.find(a => a.id === pid);
      if (parent) await updateMutation.mutateAsync({ id: pid, data: { related_apps: cleanRelatedApps((parent.related_apps || []).filter(r => r.app_id !== childId)) } });
    }
    await updateMutation.mutateAsync({ id: childId, data: { is_addon: false, parent_app_ids: [], parent_app_id: "" } });
    toast({ title: "✓", description: "تم الفصل بنجاح" });
  };

  const handleSaveRelation = async ({ relation_type, auto_install }) => {
    const { childId, parentId } = relationPanel;
    const parent = allAppsMap[parentId];
    if (!parent) return;
    const updated = cleanRelatedApps((parent.related_apps || []).map(r =>
      r.app_id === childId ? { ...r, relation_type, auto_install } : r
    ));
    await updateMutation.mutateAsync({ id: parentId, data: { related_apps: updated } });
    setRelationPanel({ open: false, childId: null, parentId: null });
    toast({ title: "✓", description: "تم التحديث" });
  };

  const toggleCat = (catId) => setExpandedCats(prev => {
    const n = new Set(prev);
    n.has(catId) ? n.delete(catId) : n.add(catId);
    return n;
  });

  const totalApps = mainApps.length;
  const inSidebarCount = mainApps.filter(a => sidebarMap[a.id]).length;
  const installedCount = mainApps.filter(a => installedIds.has(a.id)).length;

  return (
    <div dir="rtl" className="space-y-4">
      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "تطبيقات رئيسية", value: totalApps, color: "text-primary", bg: "bg-primary/5" },
          { label: "في القائمة الجانبية", value: inSidebarCount, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "جاهز ومثبّت", value: installedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-xl p-3 border border-border", s.bg)}>
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* شريط البحث */}
      <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="ابحث عن تطبيق..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
          <Info size={13} />
          <span>اسحب للترتيب داخل كل تصنيف</span>
        </div>
      </div>

      {/* التصنيفات */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
      ) : categorizedApps.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">لا توجد تطبيقات</div>
      ) : (
        <div className="space-y-3">
          {categorizedApps.map(({ cat, apps: catApps }) => {
            const isOpen = expandedCats.has(cat.id);
            return (
              <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* رأس التصنيف */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}
                >
                  <div className="flex items-center gap-2">
                    {cat.icon ? (
                      <span className="text-base">{cat.icon}</span>
                    ) : (
                      <FolderOpen size={15} />
                    )}
                    <span className="text-sm font-bold">{cat.name}</span>
                    <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full font-semibold">{catApps.length}</span>
                  </div>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {/* قائمة التطبيقات داخل التصنيف */}
                {isOpen && (
                  <DragDropContext onDragEnd={handleDragEnd(cat.id)}>
                    <Droppable droppableId={`cat-${cat.id}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {catApps.map((app, idx) => (
                            <Draggable key={app.id} draggableId={`adt-${app.id}`} index={idx}>
                              {(pd, snap) => (
                                <AppRow
                                  app={app}
                                  children={childrenMap[app.id] || []}
                                  relTypeMap={relTypeMap}
                                  sidebarMap={sidebarMap}
                                  installedIds={installedIds}
                                  isExpanded={expandedApps.has(app.id)}
                                  onToggle={() => setExpandedApps(prev => { const n = new Set(prev); n.has(app.id) ? n.delete(app.id) : n.add(app.id); return n; })}
                                  onDetach={handleDetach}
                                  onEditRelation={(cid, pid) => setRelationPanel({ open: true, childId: cid, parentId: pid })}
                                  draggableProps={pd.draggableProps}
                                  dragHandleProps={pd.dragHandleProps}
                                  innerRef={pd.innerRef}
                                  isDragging={snap.isDragging}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* لوحة تعديل العلاقة */}
      {relationPanel.open && (
        <EditRelationPanel
          child={allAppsMap[relationPanel.childId]}
          parent={allAppsMap[relationPanel.parentId]}
          currentRelation={(allAppsMap[relationPanel.parentId]?.related_apps || []).find(r => r.app_id === relationPanel.childId)}
          onSave={handleSaveRelation}
          onClose={() => setRelationPanel({ open: false, childId: null, parentId: null })}
        />
      )}
    </div>
  );
}