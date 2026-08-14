import { cn } from "@/lib/utils";

export default function ResourcesAndLimitsTab({ form, setForm }) {
  return (
    <div className="space-y-6">
      {/* Limits */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">الحدود القصوى</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "max_users", label: "الحد الأقصى للمستخدمين" },
            { key: "max_storage", label: "مساحة التخزين (GB)" }
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-sm font-semibold">{f.label} *</label>
              <input
                type="number" min="0" required value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Additional Pricing */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">أسعار الموارد الإضافية</h2>
        
        {/* Toggle Controls */}
        <div className="space-y-3 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.allow_additional_users ? "text-green-600" : "text-muted-foreground")}>
              السماح بإضافة مستخدمين إضافيين
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, allow_additional_users: !p.allow_additional_users }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.allow_additional_users ? "bg-green-500" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.allow_additional_users ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", form.allow_additional_storage ? "text-green-600" : "text-muted-foreground")}>
              السماح بإضافة تخزين إضافي
            </span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, allow_additional_storage: !p.allow_additional_storage }))}
              className={cn("w-12 h-6 rounded-full transition-all relative", form.allow_additional_storage ? "bg-green-500" : "bg-gray-300")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.allow_additional_storage ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-2 gap-4">
          {form.allow_additional_users && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold">سعر المستخدم الإضافي - شهري (ر.س)</label>
                <input
                  type="number" min="0" value={form.additional_user_price_monthly}
                  onChange={e => setForm(p => ({ ...p, additional_user_price_monthly: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">سعر المستخدم الإضافي - سنوي (ر.س)</label>
                <input
                  type="number" min="0" value={form.additional_user_price_yearly}
                  onChange={e => setForm(p => ({ ...p, additional_user_price_yearly: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </>
          )}
          {form.allow_additional_storage && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold">سعر التخزين الإضافي (GB) - شهري (ر.س)</label>
                <input
                  type="number" min="0" value={form.additional_storage_price_monthly}
                  onChange={e => setForm(p => ({ ...p, additional_storage_price_monthly: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">سعر التخزين الإضافي (GB) - سنوي (ر.س)</label>
                <input
                  type="number" min="0" value={form.additional_storage_price_yearly}
                  onChange={e => setForm(p => ({ ...p, additional_storage_price_yearly: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}