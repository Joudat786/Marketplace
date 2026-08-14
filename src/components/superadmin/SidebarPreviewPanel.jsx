import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIconByName } from "./IconPickerPopover";

const TABS = [
  { id: "home", label: "الرئيسية" },
  { id: "archive", label: "الأرشيف" },
  { id: "settings", label: "الإعدادات" },
];

export default function SidebarPreviewPanel({ items, activeTab, panelLabel }) {
  const [expanded, setExpanded] = useState({});
  const tabItems = items[activeTab] || [];

  const visibleItems = tabItems.filter(i => i.visible);

  return (
    <div className="w-56 flex-shrink-0">
      <div className="bg-white border border-border rounded-xl overflow-hidden sticky top-4">
        <div className="px-3 py-2.5 border-b border-border" style={{ backgroundColor: 'var(--table-header-bg)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--table-header-text)' }}>معاينة — {panelLabel}</p>
        </div>
        <div className="flex border-b border-border bg-secondary/40">
          {TABS.map(tab => {
            const Icon = tab.id === "home" ? "Home" : tab.id === "archive" ? "Archive" : "Settings";
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id}
                className={cn("flex-1 flex items-center justify-center py-1.5 border-b-2 transition-colors", isActive ? "bg-white" : "border-transparent")}
                style={isActive ? { borderBottomColor: 'hsl(var(--primary))' } : {}}>
                {Icon === "Home" && <div size={13} className={isActive ? "text-primary" : "text-muted-foreground"}>🏠</div>}
                {Icon === "Archive" && <div size={13} className={isActive ? "text-primary" : "text-muted-foreground"}>📦</div>}
                {Icon === "Settings" && <div size={13} className={isActive ? "text-primary" : "text-muted-foreground"}>⚙️</div>}
              </div>
            );
          })}
        </div>
        <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-4">لا توجد عناصر مرئية</p>
          ) : visibleItems.map(item => {
            // عرض الفاصل كخط بسيط
            if (item.type === "separator") {
              const topMargin = item.separatorMargin || 4;
              const bottomMargin = item.separatorMargin || 4;
              return (
                <div key={item.id} className="h-px bg-border" style={{ marginTop: `${topMargin}px`, marginBottom: `${bottomMargin}px` }} />
              );
            }

            const Icon = getIconByName(item.icon);
            const hasChildren = item.children && item.children.filter(c => c.visible).length > 0;
            return (
              <div key={item.id}>
                <button
                  onClick={() => hasChildren && setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
                >
                  {item.icon ? (
                    <Icon size={14} className="text-primary flex-shrink-0" />
                  ) : item.type === "app" && item.iconUrl ? (
                    <img src={item.iconUrl} alt={item.label} className="w-4 h-4 rounded object-contain flex-shrink-0" />
                  ) : (
                    <Icon size={14} className="text-primary flex-shrink-0" />
                  )}
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.type === "app" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", item.appType === "embedded" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                        {item.appType === "embedded" ? "📦" : "🔗"}
                      </span>
                      <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", item.displayMode === "page" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700")}>
                        {item.displayMode === "page" ? "داخل" : "قائمة"}
                      </span>
                    </div>
                  )}
                  {item.type === "external" && <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex-shrink-0">خارجي</span>}
                  {item.type === "internal" && !item.children?.length && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">داخلي</span>}
                  {hasChildren && (expanded[item.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />)}
                </button>
                {expanded[item.id] && hasChildren && (
                  <div className="mr-5 space-y-0.5 mt-0.5">
                    {item.children.filter(c => c.visible).map(child => {
                      const CI = getIconByName(child.icon);
                      return (
                        <div key={child.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary/40">
                          <CI size={12} className="text-primary/60 flex-shrink-0" />
                          <span className="flex-1 text-right">{child.label}</span>
                          {child.type === "app" && (
                            <div className="flex gap-1 flex-shrink-0">
                              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", child.appType === "embedded" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                                {child.appType === "embedded" ? "📦" : "🔗"}
                              </span>
                              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", child.displayMode === "page" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700")}>
                                {child.displayMode === "page" ? "داخل" : "قائمة"}
                              </span>
                            </div>
                          )}
                          {child.type === "external" && <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex-shrink-0">خارجي</span>}
                          {child.type === "internal" && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">داخلي</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}