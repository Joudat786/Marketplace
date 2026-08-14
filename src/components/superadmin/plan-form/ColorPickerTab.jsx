import { cn } from "@/lib/utils";

export default function ColorPickerTab({ form, setForm }) {
  const presetColors = [
    { name: "رمادي", value: "slate", hex: "#64748b" },
    { name: "أزرق", value: "blue", hex: "#3b82f6" },
    { name: "بنفسجي", value: "purple", hex: "#a855f7" },
    { name: "نيلي", value: "indigo", hex: "#6366f1" },
  ];

  const handleColorChange = (colorValue) => {
    setForm(p => ({ ...p, color: colorValue, custom_color: "" }));
  };

  const handleCustomColor = (e) => {
    const hex = e.target.value;
    setForm(p => ({ ...p, custom_color: hex, color: "custom" }));
  };

  const currentColor = form.custom_color || presetColors.find(c => c.value === form.color)?.hex || "#3b82f6";

  return (
    <div className="space-y-6">
      {/* Preset Colors */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">الألوان المحددة مسبقاً</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {presetColors.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleColorChange(color.value)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-right",
                form.color === color.value && !form.custom_color
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-border flex-shrink-0 shadow-md"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="text-right flex-1">
                  <p className="text-sm font-semibold text-foreground">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">لون مخصص</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={currentColor}
              onChange={handleCustomColor}
              className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border"
            />
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground">اختر اللون</label>
              <input
                type="text"
                value={form.custom_color || ""}
                onChange={e => handleCustomColor({ target: { value: e.target.value } })}
                placeholder="#FF5733"
                maxLength={7}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
              <p className="text-xs text-muted-foreground text-right">صيغة HEX: #RRGGBB</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground text-right">معاينة</p>
            <div className="space-y-2">
              <div
                className="p-4 rounded-lg text-white font-semibold text-center"
                style={{ backgroundColor: currentColor }}
              >
                معاينة البطاقة
              </div>
              <div
                className="p-4 rounded-lg border-2 font-semibold text-center"
                style={{ 
                  borderColor: currentColor,
                  color: currentColor,
                  backgroundColor: `${currentColor}15`
                }}
              >
                معاينة الحد
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}