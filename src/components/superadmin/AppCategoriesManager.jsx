import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppCategoriesManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => base44.entities.AppCategory.list(),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppCategory.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setNewName(""); setNewDesc(""); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppCategory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setEditingId(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppCategory.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setConfirmDelete(null); }
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), description: newDesc.trim(), is_active: true });
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: { name: editName.trim(), description: editDesc.trim() } });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <h2 className="text-base font-bold text-foreground">إدارة تصنيفات التطبيقات</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Add new */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">إضافة تصنيف جديد</label>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || createMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0">
                <Plus size={16} />
              </button>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="اسم التصنيف..."
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="وصف التصنيف (اختياري)..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : categories.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">لا توجد تصنيفات بعد</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="border border-border rounded-xl overflow-hidden">
                  {editingId === cat.id ? (
                    <div className="p-3 space-y-2 bg-primary/5">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="الوصف..."
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 border border-border rounded-lg text-xs hover:bg-secondary transition-colors">إلغاء</button>
                        <button onClick={saveEdit} className="px-3 py-1 bg-primary text-white rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center gap-1">
                          <Check size={13} /> حفظ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Delete */}
                        {confirmDelete === cat.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground hover:text-foreground">إلغاء</button>
                            <button onClick={() => deleteMutation.mutate(cat.id)} className="text-xs text-destructive font-semibold hover:opacity-70">تأكيد</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(cat.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <X size={14} />
                          </button>
                        )}
                        {/* Edit */}
                        <button onClick={() => startEdit(cat)} className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                        {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}