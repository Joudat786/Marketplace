import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, GripVertical, Save, AlertCircle } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

function SortableAppItem({ app, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border border-border rounded-lg transition-all",
        isDragging && "border-primary bg-primary/5 shadow-lg"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1.5 hover:bg-secondary rounded-lg cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} className="text-muted-foreground" />
      </div>
      
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground font-semibold text-xs">
        {index + 1}
      </span>

      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {app.icon_url ? (
          <img src={app.icon_url} alt={app.name} className="w-6 h-6 object-contain rounded" />
        ) : (
          <div className="w-6 h-6 rounded bg-primary/30" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">{app.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{app.short_description || "-"}</p>
      </div>

      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded flex-shrink-0">
        {app.is_free ? "مجاني" : `${app.monthly_price || 0} ${app.currency}`}
      </span>
    </div>
  );
}

export default function AppSortPanel({ 
  apps = [], 
  categoryName = "", 
  onClose, 
  onSaved,
  isLoading = false 
}) {
  const [sortedApps, setSortedApps] = useState(apps);
  const [isDirty, setIsDirty] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 })
  );

  useEffect(() => {
    setSortedApps(apps);
    setIsDirty(false);
  }, [apps]);

  const updateSortOrderMutation = useMutation({
    mutationFn: async () => {
      // تحديث ترتيب كل تطبيق بحفظ category_sort_orders
      return Promise.all(
        sortedApps.map((app, index) => {
          const currentOrders = app.category_sort_orders || {};
          const updatedOrders = {
            ...currentOrders,
            [categoryName]: index,
          };
          return base44.entities.App.update(app.id, { 
            category_sort_orders: updatedOrders 
          });
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast({ title: "✓", description: `تم حفظ ترتيب التطبيقات في "${categoryName}"` });
      setIsDirty(false);
      onSaved?.();
    },
    onError: (error) => {
      toast({ 
        title: "خطأ", 
        description: error.message || "فشل حفظ الترتيب", 
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedApps.findIndex(a => a.id === active.id);
    const newIndex = sortedApps.findIndex(a => a.id === over.id);

    setSortedApps(prev => arrayMove(prev, oldIndex, newIndex));
    setIsDirty(true);
  };

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
          <h2 className="text-lg font-bold text-foreground">ترتيب التطبيقات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            في التصنيف: <span className="font-semibold text-foreground">{categoryName}</span>
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          اسحب التطبيقات لإعادة ترتيبها بالطريقة التي تريدها، ثم انقر "حفظ الترتيب" لحفظ التغييرات
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد تطبيقات في هذا التصنيف</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedApps.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedApps.map((app, index) => (
                  <SortableAppItem key={app.id} app={app} index={index} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {/* Drag overlay للتطبيق الذي يتم سحبه */}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex gap-2 sticky bottom-0 bg-card">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          إلغاء
        </button>
        {isDirty && (
          <button
            onClick={() => setSortedApps(apps)}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            إعادة تعيين
          </button>
        )}
        <button
          onClick={() => updateSortOrderMutation.mutate()}
          disabled={!isDirty || updateSortOrderMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {updateSortOrderMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Save size={16} />
              حفظ الترتيب
            </>
          )}
        </button>
      </div>
    </div>
  );
}