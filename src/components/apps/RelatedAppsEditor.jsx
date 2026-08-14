import { useState } from "react";
import { Plus, Trash2, Search, Package, AlertCircle } from "lucide-react";

const RELATION_TYPES = [
  {
    value: "required_child",
    label: "ابن إجباري",
    desc: "يُثبَّت مع الأب ولا يعمل الأب بدونه",
    color: "border-red-300 bg-red-50",
    badge: "bg-red-100 text-red-700",
    icon: "🔴"
  },
  {
    value: "optional_child",
    label: "ابن اختياري",
    desc: "تابع للأب لكن تثبيته اختياري من المتجر",
    color: "border-blue-300 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: "🔵"
  },
  {
    value: "requires_this",
    label: "يشترط هذا التطبيق",
    desc: "هذا التطبيق لا يعمل إلا إذا كان التطبيق المرتبط مثبتاً",
    color: "border-amber-300 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: "🟡"
  }
];

// ── Dropdown لاختيار تطبيق ──
function AppSelector({ allApps, excludeIds, onSelect }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = allApps
    .filter(a => !excludeIds.includes(a.id))
    .filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={16} />
        إضافة تطبيق مرتبط
      </button>

      {open && (
        <div className="absolute z-50 mt-1 right-0 w-80 bg-white border border-border rounded-xl shadow-2xl overflow-hidden" dir="rtl">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن تطبيق..."
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none text-right"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد نتائج</p>
            ) : filtered.map(app => (
              <button
                key={app.id}
                type="button"
                onClick={() => { onSelect(app); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-secondary/40 transition-colors border-b border-border/30 last:border-0"
              >
                {app.icon_url
                  ? <img src={app.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-primary" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{app.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{app.short_description || app.description}</p>
                </div>
                {app.is_addon && <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Add-on</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-border px-4 py-2 bg-secondary/20">
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RelatedAppsEditor({ relatedApps = [], onChange, allApps = [], currentAppId }) {

  const excludeIds = [currentAppId, ...relatedApps.map(r => r.app_id)].filter(Boolean);

  const addApp = (app) => {
    onChange([...relatedApps, {
      app_id: app.id,
      relation_type: "optional_child",
      auto_install: false,
      install_note: ""
    }]);
  };

  const removeApp = (appId) => {
    if (!window.confirm("هل تريد إزالة هذا التطبيق من قائمة المرتبطين؟")) return;
    onChange(relatedApps.filter(r => r.app_id !== appId));
  };

  const updateRelation = (appId, key, value) => {
    onChange(relatedApps.map(r => r.app_id === appId ? { ...r, [key]: value } : r));
  };

  const getAppInfo = (appId) => allApps.find(a => a.id === appId);

  return (
    <div className="space-y-5" dir="rtl">
      {/* التوضيح */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-2">💡 كيف تعمل التطبيقات المرتبطة؟</p>
        <div className="space-y-1.5 text-xs text-blue-700">
          <p><span className="font-bold">🔴 ابن إجباري:</span> لا يعمل هذا التطبيق إلا بوجوده — يُثبَّت تلقائياً معه</p>
          <p><span className="font-bold">🔵 ابن اختياري:</span> تابع لهذا التطبيق — يظهر في المتجر كـ "مجاني" مرتبط به</p>
          <p><span className="font-bold">🟡 يشترط هذا التطبيق:</span> لا يظهر في المتجر إلا إذا كان هذا التطبيق مثبتاً</p>
        </div>
      </div>

      {/* زر الإضافة */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">التطبيقات المرتبطة ({relatedApps.length})</h4>
        <AppSelector allApps={allApps} excludeIds={excludeIds} onSelect={addApp} />
      </div>

      {/* القائمة */}
      {relatedApps.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          <Package size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد تطبيقات مرتبطة بعد</p>
          <p className="text-xs mt-1">اضغط "إضافة تطبيق مرتبط" للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relatedApps.map(rel => {
            const app = getAppInfo(rel.app_id);
            const relType = RELATION_TYPES.find(r => r.value === rel.relation_type) || RELATION_TYPES[1];

            return (
              <div key={rel.app_id} className={`border-2 rounded-xl overflow-hidden ${relType.color}`}>
                {/* رأس البطاقة */}
                <div className="flex items-center gap-3 p-3 bg-white/60">
                  {app?.icon_url
                    ? <img src={app.icon_url} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Package size={18} className="text-primary" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{app?.name || rel.app_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{app?.short_description || ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${relType.badge}`}>
                    {relType.icon} {relType.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeApp(rel.app_id)}
                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex-shrink-0 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* إعدادات العلاقة */}
                <div className="p-3 space-y-3">
                  {/* نوع العلاقة */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">نوع العلاقة</label>
                    <div className="grid grid-cols-3 gap-2">
                      {RELATION_TYPES.map(rt => (
                        <button
                          key={rt.value}
                          type="button"
                          onClick={() => updateRelation(rel.app_id, "relation_type", rt.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 border-2 rounded-lg text-center transition-all ${
                            rel.relation_type === rt.value
                              ? "border-primary bg-primary/10"
                              : "border-border bg-white hover:border-primary/40"
                          }`}
                        >
                          <span className="text-lg">{rt.icon}</span>
                          <span className="text-[10px] font-bold text-foreground leading-tight">{rt.label}</span>
                          <span className="text-[9px] text-muted-foreground leading-tight">{rt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* تثبيت تلقائي - فقط للأبناء */}
                  {(rel.relation_type === "required_child" || rel.relation_type === "optional_child") && (
                    <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2.5 border border-border">
                      <div>
                        <p className="text-xs font-bold text-foreground">تثبيت تلقائي مع الأب</p>
                        <p className="text-[10px] text-muted-foreground">
                          {rel.auto_install
                            ? "سيُثبَّت مع الأب مباشرة دون تدخل المستخدم"
                            : "يظهر في المتجر كـ تطبيق مجاني مرتبط"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateRelation(rel.app_id, "auto_install", !rel.auto_install)}
                        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${rel.auto_install ? "bg-primary" : "bg-muted"}`}
                      >
                        <div className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full transition-all shadow ${rel.auto_install ? "right-0.5" : "right-[calc(100%-1.625rem)]"}`}
                          style={{ width: "1.375rem", height: "1.375rem", top: "0.1875rem" }}
                        />
                      </button>
                    </div>
                  )}

                  {/* ملاحظة توضيحية */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">ملاحظة توضيحية (اختياري)</label>
                    <input
                      type="text"
                      value={rel.install_note || ""}
                      onChange={e => updateRelation(rel.app_id, "install_note", e.target.value)}
                      placeholder="مثال: مطلوب لعمل تقارير المبيعات"
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ملخص العلاقات */}
      {relatedApps.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-bold text-foreground mb-2">📋 ملخص العلاقات:</p>
          <div className="space-y-1">
            {["required_child", "optional_child", "requires_this"].map(type => {
              const count = relatedApps.filter(r => r.relation_type === type).length;
              if (count === 0) return null;
              const rt = RELATION_TYPES.find(r => r.value === type);
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span>{rt.icon} {rt.label}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${rt.badge}`}>{count} تطبيق</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}