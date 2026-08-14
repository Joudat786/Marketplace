import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const colorOptions = [
  { value: "slate", label: "رمادي" },
  { value: "blue", label: "أزرق" },
  { value: "purple", label: "بنفسجي" },
  { value: "indigo", label: "نيلي" }
];

const emptyPlan = {
  name: "",
  description: "",
  monthly_price: "",
  yearly_price: "",
  max_users: "",
  max_workspaces: "",
  max_apps: "",
  features: [],
  is_active: true,
  color: "blue",
  subscribers_count: 0
};

export default function PlanFormModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState(emptyPlan);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm({ ...emptyPlan, ...plan });
    } else {
      setForm(emptyPlan);
    }
  }, [plan]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm(prev => ({ ...prev, features: [...(prev.features || []), newFeature.trim()] }));
    setNewFeature("");
  };

  const removeFeature = (index) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-foreground">
            {plan ? "تعديل الباقة" : "إضافة باقة جديدة"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">اسم الباقة *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange("name", e.target.value)}
                required
                placeholder="مثال: احترافي"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">اللون</label>
              <select
                value={form.color}
                onChange={e => handleChange("color", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {colorOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">الوصف</label>
            <textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              rows={2}
              placeholder="وصف مختصر للباقة..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">السعر الشهري (ر.س) *</label>
              <input
                type="number"
                min="0"
                value={form.monthly_price}
                onChange={e => handleChange("monthly_price", Number(e.target.value))}
                required
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">السعر السنوي (ر.س)</label>
              <input
                type="number"
                min="0"
                value={form.yearly_price}
                onChange={e => handleChange("yearly_price", Number(e.target.value))}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">الحد الأقصى للمستخدمين</label>
              <input
                type="number"
                min="0"
                value={form.max_users}
                onChange={e => handleChange("max_users", Number(e.target.value))}
                placeholder="غير محدود"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">الحد الأقصى للمساحات</label>
              <input
                type="number"
                min="0"
                value={form.max_workspaces}
                onChange={e => handleChange("max_workspaces", Number(e.target.value))}
                placeholder="غير محدود"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">الحد الأقصى للتطبيقات</label>
              <input
                type="number"
                min="0"
                value={form.max_apps}
                onChange={e => handleChange("max_apps", Number(e.target.value))}
                placeholder="غير محدود"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">الميزات</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="أضف ميزة..."
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
              </button>
            </div>
            {(form.features || []).length > 0 && (
              <div className="space-y-1.5 mt-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                    <button type="button" onClick={() => removeFeature(i)} className="text-destructive hover:opacity-70">
                      <Trash2 size={14} />
                    </button>
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span className={cn("text-sm font-medium", form.is_active ? "text-green-600" : "text-muted-foreground")}>
              {form.is_active ? "مفعّلة" : "معطّلة"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-semibold">حالة الباقة</span>
              <button
                type="button"
                onClick={() => handleChange("is_active", !form.is_active)}
                className={cn("w-12 h-6 rounded-full transition-all relative", form.is_active ? "bg-green-500" : "bg-gray-300")}
              >
                <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_active ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : plan ? "حفظ التعديلات" : "إضافة الباقة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}