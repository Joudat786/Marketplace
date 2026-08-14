import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Save, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const emptyFeature = { name: "", description: "", sort_order: 0, is_active: true };

export default function PlanFeatures() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyFeature);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["plan-features"],
    queryFn: () => base44.entities.PlanFeature.list(),
    select: (data) => [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlanFeature.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plan-features"] }); setForm(emptyFeature); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanFeature.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plan-features"] }); setEditingId(null); setForm(emptyFeature); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanFeature.delete(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["plan-features"] }); 
      setConfirmDelete(null); 
    },
    onError: (error) => {
      console.error("حدث خطأ أثناء الحذف:", error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, sort_order: Number(form.sort_order) || 0 };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (feature) => {
    setEditingId(feature.id);
    setForm({ name: feature.name, description: feature.description || "", sort_order: feature.sort_order ?? 0, is_active: feature.is_active !== false });
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyFeature); };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.index === destination.index)) return;

    const newOrder = Array.from(features);
    const [movedItem] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, movedItem);

    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].sort_order !== i) {
        await updateMutation.mutateAsync({ id: newOrder[i].id, data: { sort_order: i } });
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">إدارة مميزات الباقات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">تحديد المميزات التي تظهر في جدول مقارنة الباقات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">
            {editingId ? "تعديل الميزة" : "إضافة ميزة جديدة"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">اسم الميزة *</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="مثال: الدعم الفني"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">الوصف</label>
              <input
                type="text" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر اختياري..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
            <div className="flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={cn("w-12 h-6 rounded-full transition-all relative", form.is_active ? "bg-green-500" : "bg-gray-300")}
              >
                <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_active ? "right-0.5" : "left-0.5")} />
              </button>
              <span className={cn("text-sm font-semibold", form.is_active ? "text-green-600" : "text-muted-foreground")}>
                {form.is_active ? "مفعّلة" : "معطّلة"}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
               type="submit"
               disabled={createMutation.isPending || updateMutation.isPending}
               className="flex items-center gap-2 bg-buttonColor text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
               <Save size={15} />
               {editingId ? "حفظ التعديل" : "إضافة"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-5 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Features List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">قائمة المميزات</h2>
            <span className="text-xs text-muted-foreground">{features.length} ميزة</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : features.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">لا توجد مميزات بعد</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="features-list">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-border">
                    {features.map((feature, index) => (
                      <Draggable key={feature.id} draggableId={feature.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 transition-colors",
                              snapshot.isDragging ? "bg-primary/10 shadow-lg" : "hover:bg-secondary/20"
                            )}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-semibold text-foreground">{feature.name}</p>
                              {feature.description && <p className="text-xs text-muted-foreground">{feature.description}</p>}
                            </div>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0",
                              feature.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                              {feature.is_active !== false ? "مفعّل" : "معطّل"}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => startEdit(feature)} className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button onClick={() => setConfirmDelete(feature)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-foreground">هل أنت متأكد من حذف ميزة <span className="font-bold">"{confirmDelete.name}"</span>؟</span>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">إلغاء</button>
            <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending} className="px-4 py-1.5 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {deleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}