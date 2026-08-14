import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategorySelectionPanel({ selectedAppIds, dbCategories, onConfirm, onClose, isLoading }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleConfirm = () => {
    if (selectedCategoryId) {
      onConfirm(selectedCategoryId);
    }
  };

  const activeCategories = dbCategories.filter(c => c.is_active);

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 sticky top-0 bg-card">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          title="رجوع"
        >
          <ArrowRight size={20} className="text-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">إضافة إلى تصنيف</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            اختر تصنيفاً لإضافة {selectedAppIds.length} تطبيق
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">لا توجد تصنيفات متاحة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-right",
                  selectedCategoryId === category.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30 hover:bg-secondary/40"
                )}
              >
                {category.icon && <span className="text-xl flex-shrink-0">{category.icon}</span>}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  )}
                </div>
                {selectedCategoryId === category.id && (
                  <span className="text-primary font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Action Buttons */}
      <div className="px-6 py-4 border-t border-border flex gap-2 sticky bottom-0 bg-card">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedCategoryId || isLoading}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
            selectedCategoryId && !isLoading
              ? "bg-primary text-white hover:opacity-90"
              : "bg-primary/30 text-primary/50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جارٍ الإضافة...
            </>
          ) : (
            "تأكيد"
          )}
        </button>
      </div>
    </div>
  );
}