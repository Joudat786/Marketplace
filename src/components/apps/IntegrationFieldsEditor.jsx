import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "نص" },
  { value: "password", label: "كلمة مرور / مفتاح سري" },
  { value: "url", label: "رابط URL" },
  { value: "number", label: "رقم" }
];

export default function IntegrationFieldsEditor({ fields = [], onChange }) {
  const addField = () => {
    onChange([...fields, { key: "", label: "", type: "text", placeholder: "", required: true, help_text: "" }]);
  };

  const updateField = (index, updates) => {
    const updated = fields.map((f, i) => i === index ? { ...f, ...updates } : f);
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-foreground">حقول الربط المطلوبة</h4>
          <p className="text-xs text-muted-foreground mt-0.5">هذه الحقول ستظهر للمستخدم عند تثبيت التطبيق لإدخال بيانات الربط</p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          إضافة حقل
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 bg-secondary/20 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">لا توجد حقول ربط بعد</p>
          <p className="text-xs text-muted-foreground mt-1">اضغط "إضافة حقل" لإضافة حقول مثل API Key أو Username...</p>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={index} className="border border-border rounded-xl p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-muted-foreground" />
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">حقل {index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeField(index)}
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">المفتاح (key) *</label>
              <input
                type="text"
                value={field.key}
                onChange={e => updateField(index, { key: e.target.value.replace(/\s/g, '_') })}
                placeholder="مثال: api_key"
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">الاسم المعروض *</label>
              <input
                type="text"
                value={field.label}
                onChange={e => updateField(index, { label: e.target.value })}
                placeholder="مثال: مفتاح API"
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">نوع الحقل</label>
              <select
                value={field.type}
                onChange={e => updateField(index, { type: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">نص توضيحي (placeholder)</label>
              <input
                type="text"
                value={field.placeholder}
                onChange={e => updateField(index, { placeholder: e.target.value })}
                placeholder="مثال: أدخل مفتاح API..."
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">نص المساعدة</label>
            <input
              type="text"
              value={field.help_text}
              onChange={e => updateField(index, { help_text: e.target.value })}
              placeholder="مثال: يمكنك الحصول على مفتاح API من لوحة تحكم الشركة"
              className="w-full border border-border rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => updateField(index, { required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-foreground">حقل إجباري</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}