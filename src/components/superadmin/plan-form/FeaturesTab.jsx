import { Plus, Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function FeaturesTab({ form, setForm, planFeatures }) {
  const [newFeature, setNewFeature] = useState("");

  const toggleFeature = (featureId) => {
    setForm(prev => {
      const included = prev.included_features || [];
      return {
        ...prev,
        included_features: included.includes(featureId)
          ? included.filter(id => id !== featureId)
          : [...included, featureId]
      };
    });
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm(prev => ({ ...prev, features: [...(prev.features || []), newFeature.trim()] }));
    setNewFeature("");
  };

  const removeFeature = (i) => setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">مميزات الباقة</h2>
      
      {/* Plan Features from Database */}
      {planFeatures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {(form.included_features || []).length} / {planFeatures.length} محدد
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {planFeatures.map(feature => {
              const isSelected = (form.included_features || []).includes(feature.id);
              return (
                <div
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={cn(
                    "p-3 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground bg-white"
                  )}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs font-semibold text-foreground">{feature.name}</p>
                    {feature.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{feature.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Manual Features */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-xs font-semibold text-foreground">ميزات إضافية يدويه</h3>
        <div className="flex gap-2">
          <input
            type="text" value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
            placeholder="أضف ميزة واضغط Enter..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="button" onClick={addFeature} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={16} />
          </button>
        </div>
        {(form.features || []).length > 0 && (
          <div className="space-y-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <button type="button" onClick={() => removeFeature(i)} className="text-destructive hover:opacity-70 text-sm font-bold">✕</button>
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}