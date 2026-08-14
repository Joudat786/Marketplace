import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppsTab({ form, setForm, apps, dbCategories }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const toggleApp = (appId) => {
    setForm(prev => {
      const included = prev.included_apps || [];
      return {
        ...prev,
        included_apps: included.includes(appId) ? included.filter(id => id !== appId) : [...included, appId]
      };
    });
  };

  const activeDbCategories = dbCategories.filter(c => c.is_active);
  const categoryCounts = [
    { name: "all", label: "الكل", count: apps.length, icon: null },
    ...activeDbCategories.map(cat => ({
      name: cat.name,
      label: cat.name,
      count: apps.filter(a => a.category === cat.name).length,
      icon: cat.icon || null
    }))
  ];

  const filteredApps = apps.filter(app => {
    const matchCategory = selectedCategory === "all" || app.category === selectedCategory;
    const matchStatus = statusFilter === "all" || 
      (statusFilter === "active" && app.is_active) || 
      (statusFilter === "inactive" && !app.is_active);
    return matchCategory && matchStatus;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[500px]">
      {/* Status Filters */}
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

      {/* Content Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 h-full">
          {/* Right - Categories */}
          <div className="p-4 overflow-y-auto border-l border-border col-span-1">
            <h3 className="font-bold text-foreground mb-4 text-right text-sm">التصنيفات</h3>
            <div className="space-y-2">
              {categoryCounts.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-right text-xs",
                    selectedCategory === cat.name
                      ? "bg-primary/10 border border-primary text-primary font-semibold"
                      : "border border-transparent text-foreground hover:bg-secondary/50"
                  )}>
                  {cat.icon && <span className="text-base flex-shrink-0 ml-1">{cat.icon}</span>}
                  <span className="font-medium flex-1 text-right">{cat.label}</span>
                  <span className={cn(
                    "min-w-[28px] h-7 flex items-center justify-center rounded-md border text-xs font-semibold flex-shrink-0",
                    selectedCategory === cat.name
                      ? "border-primary/30 bg-white text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                  )}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Left - Apps */}
          <div className="p-4 overflow-y-auto col-span-2">
            <h4 className="font-bold text-foreground text-right text-xs mb-3">التطبيقات المضمنة</h4>
            <div className="grid grid-cols-3 gap-3">
              {filteredApps.map(app => {
                const isSelected = (form.included_apps || []).includes(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => toggleApp(app.id)}
                    className={cn(
                      "p-3 border-2 rounded-lg cursor-pointer transition-all text-center relative",
                      isSelected
                        ? "border-primary bg-primary/15 shadow-lg"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "absolute top-2 right-2 w-6 h-6 rounded-md border-2 flex items-center justify-center shadow-md transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground bg-white"
                    )}>
                      {isSelected && <Check size={16} className="text-white font-bold" />}
                    </div>
                    {app.icon_url && (
                      <div className="flex justify-center mb-2">
                        <img src={app.icon_url} alt={app.name} className="w-8 h-8" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-foreground mb-1">{app.name}</p>
                    <p className="text-[10px] text-muted-foreground">{app.category || "-"}</p>
                  </div>
                );
              })}
            </div>
            {filteredApps.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">لا توجد تطبيقات</p>}
          </div>
        </div>
      </div>
    </div>
  );
}