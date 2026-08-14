import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIconByName } from "./IconPickerPopover";

const PANELS = [
  { id: "super_admin", label: "مساحة عمل السوبر أدمن" },
  { id: "partner", label: "مساحة عمل الشركاء" },
  { id: "client", label: "مساحة عمل العملاء" },
];

const TABS = [
  { id: "home", label: "الرئيسية" },
  { id: "archive", label: "الأرشيف" },
  { id: "settings", label: "الإعدادات" },
];

export default function CopySidebarModal({ items, activePanel, activeTab, onCopy, onClose }) {
  const [sourcePanel, setSourcePanel] = useState(null);
  const [sourceTab, setSourceTab] = useState("home");
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState({});

  // الحصول على العناصر من مساحة المصدر
  const getSourceItems = () => {
    if (!sourcePanel) return [];
    const panelData = items[sourcePanel];
    if (!panelData) return [];
    const tabItems = panelData[sourceTab];
    return Array.isArray(tabItems) ? tabItems : [];
  };

  const sourceItems = getSourceItems();

  const toggleItem = (itemId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === sourceItems.length) {
      setSelected(new Set());
    } else {
      const allIds = new Set(sourceItems.map(item => item.id));
      setSelected(allIds);
    }
  };

  const handleCopy = () => {
    if (selected.size === 0) return;

    // جمع العناصر المحددة
    const itemsToCopy = sourceItems.filter(item => selected.has(item.id));
    
    // إنشة نسخ بـ IDs جديدة
    const deepCopy = (item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      children: (item.children || []).map(deepCopy)
    });

    const copiedItems = itemsToCopy.map(deepCopy);

    onCopy({
      items: copiedItems,
      panel: activePanel,
      tab: activeTab
    });

    setSelected(new Set());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <h2 className="text-lg font-bold text-foreground">نسخ عناصر من مساحة عمل أخرى</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-primary/10 rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* اختيار المصدر */}
          <div className="p-6 border-b border-border space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">انسخ من مساحة عمل</label>
              <select
                value={sourcePanel || ""}
                onChange={e => {
                  setSourcePanel(e.target.value);
                  setSourceTab("home");
                  setSelected(new Set());
                }}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">اختر مساحة عمل...</option>
                {PANELS.map(panel => (
                  <option key={panel.id} value={panel.id}>
                    {panel.label}
                  </option>
                ))}
              </select>
            </div>

            {sourcePanel && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">من التبويب</label>
                <div className="flex gap-2">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSourceTab(tab.id);
                        setSelected(new Set());
                      }}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                        sourceTab === tab.id
                          ? "bg-primary text-white"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* عرض العناصر */}
          {sourcePanel && sourceItems.length > 0 && (
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.size === sourceItems.length && sourceItems.length > 0}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    تحديد الكل ({selected.size})
                  </span>
                </label>
                <span className="text-sm font-semibold text-foreground">
                  العناصر المتاحة ({sourceItems.length})
                </span>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {sourceItems.map((item, idx) => {
                  const Icon = getIconByName(item.icon);
                  const hasChildren = (item.children || []).length > 0;

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/40 transition-colors text-right"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="flex-shrink-0 cursor-pointer"
                        />

                        {hasChildren && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setExpanded(p => ({ ...p, [item.id]: !p[item.id] }));
                            }}
                            className="flex-shrink-0 text-muted-foreground"
                          >
                            {expanded[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}

                        {!hasChildren && <div className="w-5 flex-shrink-0" />}

                        <Icon size={16} className="text-primary flex-shrink-0" />

                        <span className="flex-1 text-sm font-medium text-foreground">
                          {item.label}
                        </span>

                        {item.type === "app" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                            تطبيق
                          </span>
                        )}
                      </button>

                      {/* الفرعيات */}
                      {expanded[item.id] && hasChildren && (
                        <div className="mr-6 space-y-1">
                          {item.children.map(child => {
                            const ChildIcon = getIconByName(child.icon);
                            return (
                              <button
                                key={child.id}
                                onClick={() => toggleItem(child.id)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors text-right text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(child.id)}
                                  onChange={() => toggleItem(child.id)}
                                  className="flex-shrink-0 cursor-pointer"
                                />
                                <ChildIcon size={14} className="text-primary/60 flex-shrink-0" />
                                <span className="flex-1 text-muted-foreground">{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sourcePanel && sourceItems.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">لا توجد عناصر في هذا التبويب</p>
            </div>
          )}

          {!sourcePanel && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              اختر مساحة عمل لعرض عناصرها
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-border text-sm font-semibold rounded-lg hover:bg-secondary transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleCopy}
            disabled={selected.size === 0 || !sourcePanel}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Copy size={16} />
            نسخ {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}