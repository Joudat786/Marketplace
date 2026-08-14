import {
  Filter, Settings, FileText, X, BarChart3, MessageSquare,
  Bell, Bookmark, Zap, Edit3, Copy, Download, Upload, Plus, Trash2,
  LayoutGrid, List } from
"lucide-react";
import { cn } from "@/lib/utils";

const allToolbarItems = {
  filter: { icon: Filter, label: "تصفية" },
  settings: { icon: Settings, label: "إعدادات" },
  document: { icon: FileText, label: "مستند" },
  close: { icon: X, label: "إغلاق" },
  reports: { icon: BarChart3, label: "تقارير" },
  messages: { icon: MessageSquare, label: "رسائل" },
  notifications: { icon: Bell, label: "إشعارات" },
  bookmark: { icon: Bookmark, label: "حفظ" },
  quick: { icon: Zap, label: "إجراءات سريعة" },
  edit: { icon: Edit3, label: "تعديل" },
  copy: { icon: Copy, label: "نسخ" },
  download: { icon: Download, label: "تنزيل" },
  upload: { icon: Upload, label: "استيراد" },
  add: { icon: Plus, label: "إضافة" },
  delete: { icon: Trash2, label: "حذف" },
};

export default function PageToolbar({ items = [], actions = {}, selectedCount = 0, customItems = null, plansViewType = null, onPlansViewChange = null, appsViewType = null, onAppsViewChange = null }) {
  const toolbarItems = items.map(key => allToolbarItems[key]).filter(Boolean);

  if (toolbarItems.length === 0 && !customItems && !plansViewType && !appsViewType) return null;

  return (
    <div className="bg-card px-4 py-2 border-b border-border" dir="rtl">
      <div className="flex items-center gap-2">
        {/* الأزرار - تبدأ من اليمين */}
        {items.map((key, index) => {
          const item = allToolbarItems[key];
          if (!item) return null;
          
          const action = actions[key];
          const isDisabled = action?.disabled || false;
          
          return (
            <button
              key={index}
              onClick={action?.onClick}
              disabled={isDisabled}
              title={item.label}
              style={{ backgroundColor: 'hsl(var(--button-color))', color: 'white' }}
              className={cn(
                "p-2.5 rounded-lg flex items-center justify-center hover:opacity-90 transition-all flex-shrink-0",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}>
              <item.icon size={18} color="white" />
            </button>
          );
        })}

        {/* أيقونات تبديل طريقة العرض (جدول / بطاقات) */}
        {plansViewType && onPlansViewChange && (
          <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => onPlansViewChange("table")}
              title="عرض جدول"
              style={plansViewType === "table" ? { backgroundColor: 'hsl(var(--tabs-active))', color: 'white' } : {}}
              className={cn(
                "px-3 py-2.5 flex items-center justify-center transition-colors",
                plansViewType !== "table" && "bg-card text-muted-foreground hover:bg-secondary"
              )}>
              <List size={16} color={plansViewType === "table" ? "white" : undefined} />
            </button>
            <button
              onClick={() => onPlansViewChange("cards")}
              title="عرض بطاقات"
              style={plansViewType === "cards" ? { backgroundColor: 'hsl(var(--tabs-active))', color: 'white' } : {}}
              className={cn(
                "px-3 py-2.5 flex items-center justify-center transition-colors border-r border-border",
                plansViewType !== "cards" && "bg-card text-muted-foreground hover:bg-secondary"
              )}>
              <LayoutGrid size={16} color={plansViewType === "cards" ? "white" : undefined} />
            </button>
          </div>
        )}

        {/* أيقونات تبديل طريقة عرض التطبيقات (جدول / بطاقات) */}
        {appsViewType && onAppsViewChange && (
          <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => onAppsViewChange("table")}
              title="عرض جدول"
              style={appsViewType === "table" ? { backgroundColor: 'hsl(var(--tabs-active))', color: 'white' } : {}}
              className={cn(
                "px-3 py-2.5 flex items-center justify-center transition-colors",
                appsViewType !== "table" && "bg-card text-muted-foreground hover:bg-secondary"
              )}>
              <List size={16} color={appsViewType === "table" ? "white" : undefined} />
            </button>
            <button
              onClick={() => onAppsViewChange("cards")}
              title="عرض بطاقات"
              style={appsViewType === "cards" ? { backgroundColor: 'hsl(var(--tabs-active))', color: 'white' } : {}}
              className={cn(
                "px-3 py-2.5 flex items-center justify-center transition-colors border-r border-border",
                appsViewType !== "cards" && "bg-card text-muted-foreground hover:bg-secondary"
              )}>
              <LayoutGrid size={16} color={appsViewType === "cards" ? "white" : undefined} />
            </button>
          </div>
        )}

        {/* عناصر مخصصة إضافية */}
        {customItems && Array.isArray(customItems) && customItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            style={{ backgroundColor: 'hsl(var(--button-color))', color: 'white' }}
            className={cn(
              "px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0"
            )}>
            {item.label}
          </button>
        ))}

        {/* عداد العناصر المحددة */}
        {selectedCount > 0 && (
          <span className="text-sm font-semibold text-muted-foreground mr-2">
            {selectedCount} محدد
          </span>
        )}
      </div>
    </div>
  );
}