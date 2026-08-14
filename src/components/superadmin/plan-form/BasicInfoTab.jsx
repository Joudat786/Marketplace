import { cn } from "@/lib/utils";
import MultiLangInput from "@/components/ui/MultiLangInput";

export default function BasicInfoTab({ form, setForm }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">المعلومات الأساسية</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 col-span-1">
            <MultiLangInput
              label="اسم الباقة"
              required
              values={{ ar: form.name || "", en: form.name_en || "" }}
              onChange={(code, val) => {
                if (code === "ar") setForm(p => ({ ...p, name: val }));
                else setForm(p => ({ ...p, [`name_${code}`]: val }));
              }}
              placeholder={{ ar: "مثال: احترافي", en: "e.g. Professional" }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">اللون</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.custom_color || '#3b82f6'}
                onChange={e => setForm(p => ({ ...p, custom_color: e.target.value, color: 'custom' }))}
                className="w-12 h-10 rounded-lg cursor-pointer border border-border"
              />
              <input
                type="text"
                value={form.custom_color || ''}
                onChange={e => setForm(p => ({ ...p, custom_color: e.target.value, color: 'custom' }))}
                placeholder="#3b82f6"
                maxLength={7}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">الترتيب</label>
            <input
              type="number" min="0" value={form.sort_order}
              onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
              placeholder="0"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="space-y-1">
          <MultiLangInput
            label="الوصف"
            multiline
            rows={3}
            values={{ ar: form.description || "", en: form.description_en || "" }}
            onChange={(code, val) => {
              if (code === "ar") setForm(p => ({ ...p, description: val }));
              else setForm(p => ({ ...p, [`description_${code}`]: val }));
            }}
            placeholder={{ ar: "وصف مختصر للباقة...", en: "Short description..." }}
          />
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.is_active ? "text-green-600" : "text-muted-foreground")}>
              {form.is_active ? "مفعّلة" : "معطّلة"}
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.is_active ? "bg-green-500" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_active ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.is_popular ? "text-primary" : "text-muted-foreground")}>
              {form.is_popular ? "باقة مميزة" : "غير مميزة"}
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, is_popular: !p.is_popular }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.is_popular ? "bg-primary" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_popular ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
          {form.is_popular && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">نص الشارة</label>
              <input
                type="text"
                value={form.popular_label}
                onChange={e => setForm(p => ({ ...p, popular_label: e.target.value }))}
                placeholder="الأكثر شيوعاً"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.has_trial ? "text-orange-600" : "text-muted-foreground")}>
              {form.has_trial ? "تدعم فترة تجريبية" : "لا تدعم فترة تجريبية"}
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, has_trial: !p.has_trial }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.has_trial ? "bg-orange-500" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.has_trial ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
          {form.has_trial && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">عدد أيام التجربة</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.trial_days}
                  onChange={e => setForm(p => ({ ...p, trial_days: Number(e.target.value) }))}
                  placeholder="14"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">يوم</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.is_default ? "text-blue-600" : "text-muted-foreground")}>
              {form.is_default ? "باقة افتراضية" : "غير افتراضية"}
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, is_default: !p.is_default }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.is_default ? "bg-blue-500" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_default ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}