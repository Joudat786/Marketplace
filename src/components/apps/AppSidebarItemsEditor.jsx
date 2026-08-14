import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Minus } from "lucide-react";
import { getIconByName } from "@/components/superadmin/IconPickerPopover";
import IconPickerPopover from "@/components/superadmin/IconPickerPopover";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const PANELS = [
  { value: "super_admin", label: "مساحة السوبر أدمن" },
  { value: "client", label: "مساحة العملاء" },
  { value: "partner", label: "مساحة الشركاء" },
];

const TABS = [
  { value: "home", label: "الرئيسية" },
  { value: "archive", label: "الأرشيف" },
  { value: "settings", label: "الإعدادات" },
];

// ── تحويل الشجرة إلى قائمة مسطحة ──
const flattenTree = (nodes, parentId = null, depth = 0) => {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _parentId: parentId, _depth: depth });
    if (node._expanded && (node.children || []).length > 0) {
      result.push(...flattenTree(node.children, node.id, depth + 1));
    }
  }
  return result;
};

// ── تحويل القائمة المسطحة إلى شجرة ──
const unflattenList = (flatList) => {
  const map = {};
  const roots = [];
  for (const item of flatList) {
    map[item.id] = { ...item, children: item.children || [] };
  }
  for (const item of flatList) {
    if (item._parentId && map[item._parentId]) {
      map[item._parentId].children = [...(map[item._parentId].children || [])];
      // تجنب الازدواجية
      if (!map[item._parentId].children.find(c => c.id === item.id)) {
        map[item._parentId].children.push(map[item.id]);
      }
    } else if (!item._parentId) {
      roots.push(map[item.id]);
    }
  }
  const clean = (node) => {
    const { _parentId, _depth, _expanded, ...rest } = node;
    return { ...rest, children: (rest.children || []).map(clean) };
  };
  return roots.map(clean);
};

// ── تبديل حالة التوسع في الشجرة ──
const toggleExpandInTree = (nodes, targetId) =>
  nodes.map(node => {
    if (node.id === targetId) return { ...node, _expanded: !node._expanded };
    return { ...node, children: toggleExpandInTree(node.children || [], targetId) };
  });

// ── حذف عنصر من الشجرة ──
const removeFromTree = (nodes, targetId) =>
  nodes.reduce((acc, node) => {
    if (node.id === targetId) return acc;
    acc.push({ ...node, children: removeFromTree(node.children || [], targetId) });
    return acc;
  }, []);

// ── تحديث عنصر في الشجرة ──
const updateInTree = (nodes, targetId, updater) =>
  nodes.map(node => {
    if (node.id === targetId) return updater(node);
    return { ...node, children: updateInTree(node.children || [], targetId, updater) };
  });

export default function AppSidebarItemsEditor({ items = [], onChange, appRoute }) {

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      label: "عنصر جديد",
      icon: "Package",
      path: appRoute || "",
      type: "internal",
      visible: true,
      hide_if_empty: false,
      target_panel: "client",
      target_tab: "home",
      children: [],
      _expanded: false,
    };
    onChange([...items, newItem]);
  };

  const deleteItem = (id) => {
    if (!window.confirm("هل تريد حذف هذا العنصر؟")) return;
    onChange(removeFromTree(items, id));
  };

  const updateItem = (id, key, value) => {
    onChange(updateInTree(items, id, node => ({ ...node, [key]: value })));
  };

  const toggleExpand = (id) => {
    onChange(toggleExpandInTree(items, id));
  };

  const addChild = (parentId) => {
    const newChild = {
      id: `child-${Date.now()}`,
      label: "عنصر فرعي",
      icon: "ChevronRight",
      path: "",
      type: "internal",
      visible: true,
      children: [],
      _expanded: false,
    };
    onChange(updateInTree(items, parentId, node => ({
      ...node,
      _expanded: true,
      children: [...(node.children || []), newChild],
    })));
  };

  const handleDragEnd = (result) => {
    const { source, destination, combine, draggableId } = result;
    if (!destination && !combine) return;

    const flat = flattenTree(items);

    // ── COMBINE: إفلات فوق عنصر → يصبح ابناً له ──
    if (combine) {
      const srcIndex = flat.findIndex(i => i.id === draggableId);
      if (srcIndex === -1) return;
      const dragged = flat[srcIndex];
      const targetId = combine.draggableId;
      if (dragged.id === targetId) return;

      const newFlat = flat.filter((_, i) => i !== srcIndex);
      const targetIndex = newFlat.findIndex(i => i.id === targetId);
      if (targetIndex === -1) return;

      let insertAt = targetIndex + 1;
      const targetDepth = newFlat[targetIndex]._depth;
      while (insertAt < newFlat.length && newFlat[insertAt]._depth > targetDepth) insertAt++;

      const movedItem = { ...dragged, _parentId: targetId, _depth: targetDepth + 1 };
      newFlat.splice(insertAt, 0, movedItem);

      // تفعيل التوسع للأب
      const withExpand = newFlat.map(n => n.id === targetId ? { ...n, _expanded: true } : n);
      onChange(unflattenList(withExpand));
      return;
    }

    // ── REORDER: إعادة الترتيب ──
    if (source.index === destination.index) return;
    const newFlat = [...flat];
    const [moved] = newFlat.splice(source.index, 1);
    newFlat.splice(destination.index, 0, moved);
    onChange(unflattenList(newFlat));
  };

  const flat = flattenTree(items);

  return (
    <div className="space-y-4" dir="rtl">
      {/* التوضيح */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700 font-semibold">💡 عناصر القائمة الجانبية</p>
        <p className="text-xs text-blue-600 mt-1">
          هذه العناصر ستُضاف تلقائياً للقائمة الجانبية عند تثبيت التطبيق، وتُزال عند إلغاء التثبيت.
        </p>
        <p className="text-xs text-blue-600 mt-1.5 font-semibold">
          ✅ اسحب عنصراً <strong>فوق عنصر آخر</strong> ليصبح ابناً له. اسحب للأعلى/الأسفل لإعادة الترتيب.
          اضغط <span className="bg-blue-200 px-1 rounded">+</span> على أي عنصر لإضافة ابن له مباشرة.
        </p>
      </div>

      {/* رأس الجدول */}
      {flat.length > 0 && (
        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground font-semibold border-b border-border pb-2">
          <span className="w-5" />
          <span className="w-5" />
          <span className="flex-1">اسم العنصر</span>
          <span className="w-44">المسار</span>
          <span className="w-32">اللوحة</span>
          <span className="w-24">التبويب</span>
          <span className="w-8">أيقونة</span>
          <span className="w-14">الظهور</span>
          <span className="w-16" />
        </div>
      )}

      {/* القائمة مع سحب وإفلات */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sidebar-items-flat" isCombineEnabled={true}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {flat.map((item, idx) => {
                const depth = item._depth || 0;
                const indentPx = depth * 20;
                const hasChildren = (item.children || []).length > 0;
                const isExpanded = !!item._expanded;
                const Icon = getIconByName(item.icon || "Package");

                return (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(pd, snap) => (
                      <div
                        ref={pd.innerRef}
                        {...pd.draggableProps}
                        className={`border border-border rounded-xl overflow-hidden bg-card transition-all
                          ${snap.isDragging ? "shadow-xl opacity-90 z-50" : ""}
                          ${snap.combineTargetFor ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}
                        `}
                        style={{ ...pd.draggableProps.style, marginRight: `${indentPx}px` }}
                      >
                        <div className="flex items-center gap-2 p-2.5">
                          {/* مقبض السحب */}
                          <div {...pd.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
                            <GripVertical size={15} />
                          </div>

                          {/* زر التوسع */}
                          <button
                            type="button"
                            onClick={() => hasChildren && toggleExpand(item.id)}
                            className={`flex-shrink-0 ${hasChildren ? "text-muted-foreground hover:text-foreground" : "opacity-0 pointer-events-none"}`}
                          >
                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>

                          <Icon size={15} className={depth > 0 ? "text-primary/70 flex-shrink-0" : "text-primary flex-shrink-0"} />

                          {/* الاسم */}
                          <input
                            type="text"
                            value={item.label || ""}
                            onChange={(e) => updateItem(item.id, "label", e.target.value)}
                            placeholder="اسم العنصر"
                            className="flex-1 text-sm border border-border rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />

                          {/* المسار */}
                          <input
                            type="text"
                            value={item.path || ""}
                            onChange={(e) => updateItem(item.id, "path", e.target.value)}
                            placeholder={appRoute || "/مسار"}
                            dir="ltr"
                            className="w-44 text-xs border border-border rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />

                          {/* اللوحة — فقط للعناصر الرئيسية */}
                          {depth === 0 ? (
                            <select
                              value={item.target_panel || "client"}
                              onChange={(e) => updateItem(item.id, "target_panel", e.target.value)}
                              className="w-32 text-xs border border-border rounded-lg px-2 py-1 bg-white focus:outline-none"
                            >
                              {PANELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          ) : (
                            <span className="w-32 text-[10px] text-muted-foreground text-center">— ترث من الأب —</span>
                          )}

                          {/* التبويب — فقط للعناصر الرئيسية */}
                          {depth === 0 ? (
                            <select
                              value={item.target_tab || "home"}
                              onChange={(e) => updateItem(item.id, "target_tab", e.target.value)}
                              className="w-24 text-xs border border-border rounded-lg px-2 py-1 bg-white focus:outline-none"
                            >
                              {TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          ) : (
                            <span className="w-24 text-[10px] text-muted-foreground text-center">—</span>
                          )}

                          <IconPickerPopover value={item.icon || "Package"} onChange={(icon) => updateItem(item.id, "icon", icon)} />

                          <button
                            type="button"
                            onClick={() => updateItem(item.id, "visible", !item.visible)}
                            className={`text-xs px-2 py-1 rounded-lg font-semibold w-14 ${item.visible ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {item.visible ? "مرئي" : "مخفي"}
                          </button>

                          {/* إضافة ابن */}
                          <button
                            type="button"
                            onClick={() => addChild(item.id)}
                            title="إضافة عنصر فرعي"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                          >
                            <Plus size={12} />
                          </button>

                          {/* حذف */}
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
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

      {flat.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <p className="text-sm">لا توجد عناصر قائمة مضافة</p>
          <p className="text-xs mt-1">اضغط "إضافة عنصر" للبدء</p>
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={16} />
        إضافة عنصر قائمة
      </button>
    </div>
  );
}