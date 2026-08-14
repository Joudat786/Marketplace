import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Download, Upload, Trash2, Edit2, Trash, GripVertical, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "م" : "ص";
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds} ${ampm}`;
};

export default function LanguageSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortColumn, setSortColumn] = useState("sort_order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filters, setFilters] = useState({
    name: "",
    code: "",
    status: "all"
  });
  const { setToolbarActions, setSelectedCount } = useOutletContext() || {};

  const { data: languages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: () => base44.entities.Language.list()
  });

  const [orderedLanguages, setOrderedLanguages] = useState([]);

  useEffect(() => {
    const sorted = [...languages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedLanguages(sorted);
  }, [languages]);

  const deleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Language.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      setSelectedIds([]);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: (items) => Promise.all(items.map((l, idx) => base44.entities.Language.update(l.id, { sort_order: idx }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] })
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedLanguages);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedLanguages(items);
    updateOrderMutation.mutate(items);
  };

  const filteredLanguages = orderedLanguages.filter(l => {
    const matchName = l.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchCode = l.code.toLowerCase().includes(filters.code.toLowerCase());
    const matchStatus = filters.status === "all" ||
      (filters.status === "active" && l.is_active) ||
      (filters.status === "inactive" && !l.is_active);
    return matchName && matchCode && matchStatus;
  });

  useEffect(() => {
    setToolbarActions({
      add: {
        onClick: () => { setEditingId(null); setShowForm(true); }
      },
      delete: {
        onClick: () => {
          const baseLanguage = selectedIds.find(id => orderedLanguages.find(l => l.id === id && l.is_base));
          if (baseLanguage) {
            alert("لا يمكن حذف اللغة الأساسية!");
            return;
          }
          if (selectedIds.length > 0 && confirm(`هل أنت متأكد من حذف ${selectedIds.length} لغة؟`)) {
            deleteMutation.mutate(selectedIds);
          }
        },
        disabled: selectedIds.length === 0
      },
      download: {
        onClick: handleExport,
        disabled: filteredLanguages.length === 0
      }
    });
  }, [selectedIds, filteredLanguages.length, setToolbarActions]);

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? filteredLanguages.map(l => l.id) : []);
    setSelectedCount(checked ? filteredLanguages.length : 0);
  };

  const toggleSelect = (id, checked) => {
    const newIds = checked 
      ? [...selectedIds, id] 
      : selectedIds.filter(x => x !== id);
    setSelectedIds(newIds);
    setSelectedCount(newIds.length);
  };

  const handleExport = () => {
    const data = filteredLanguages.map(l => ({
      "الاسم": l.name,
      "الرمز": l.code,
      "العلم": l.flag || "-",
      "الاتجاه": l.direction === "RTL" ? "من اليمين لليسار" : "من اليسار لليمين",
      "أساسية": l.is_base ? "نعم" : "لا",
      "افتراضية": l.is_default ? "نعم" : "لا",
      "الحالة": l.is_active ? "مفعلة" : "معطلة",
      "التاريخ": formatDate(l.created_date)
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `اللغات_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات اللغات</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة اللغات والترجمات</p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {updateOrderMutation.isPending && (
          <div className="px-4 py-2 bg-primary/10 text-primary text-xs text-center">جارٍ حفظ الترتيب...</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-border" style={{ backgroundColor: 'var(--table-header-bg)' }}>
                <th className="px-3 py-3 text-center font-semibold border-l border-border w-10" style={{ color: 'var(--table-header-text)' }}></th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border w-12" style={{ color: 'var(--table-header-text)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLanguages.length && filteredLanguages.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border w-12" style={{ color: 'var(--table-header-text)' }}>#</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الاسم</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الرمز</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>العلم</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الاتجاه</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>افتراضية</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الحالة</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>التاريخ</th>
                <th className="px-4 py-3 text-center font-semibold sticky right-0" style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>الإجراءات</th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="languages">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredLanguages.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">لا توجد لغات</td>
                      </tr>
                    ) : filteredLanguages.map((language, idx) => (
                      <Draggable key={language.id} draggableId={language.id} index={idx} isDragDisabled={language.is_base}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn("border-b border-border transition-colors", snapshot.isDragging ? "bg-primary/5 shadow-lg" : "hover:bg-secondary/20")}
                          >
                            <td className="px-3 py-3 text-center border-l border-border" {...provided.dragHandleProps}>
                              {language.code === 'en' ? (
                                <Lock size={16} className="text-muted-foreground mx-auto" />
                              ) : (
                                <GripVertical size={16} className="text-muted-foreground mx-auto cursor-grab active:cursor-grabbing" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center border-l border-border">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(language.id)}
                                onChange={(e) => toggleSelect(language.id, e.target.checked)}
                                disabled={language.code === 'en'}
                                className="cursor-pointer disabled:opacity-50"
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                            <td className="px-4 py-3 text-center border-l border-border font-semibold">{language.name}</td>
                            <td className="px-4 py-3 text-center border-l border-border">{language.code}</td>
                            <td className="px-4 py-3 text-center border-l border-border text-2xl">{language.flag || "-"}</td>
                            <td className="px-4 py-3 text-center border-l border-border text-xs">
                              {language.direction === "RTL" ? "RTL" : "LTR"}
                            </td>
                            <td className="px-4 py-3 text-center border-l border-border">
                              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                                language.is_default ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground")}>
                                {language.is_default ? "نعم" : "لا"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center border-l border-border">
                              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                                language.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                {language.is_active ? "مفعلة" : "معطلة"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">
                              {formatDate(language.created_date)}
                            </td>
                            <td className="px-4 py-3 sticky right-0 bg-card">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => { setEditingId(language.id); setShowForm(true); }}
                                  className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                  title="تعديل">
                                  <Edit2 size={16} />
                                </button>
                                {language.code !== 'en' && (
                                  <button
                                    onClick={() => {
                                      if (confirm("هل أنت متأكد من الحذف؟")) {
                                        deleteMutation.mutate([language.id]);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                    title="حذف">
                                    <Trash size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <LanguageForm
          languageId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSave={() => { 
            queryClient.invalidateQueries({ queryKey: ["languages"] });
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}
    </motion.div>
  );
}

function LanguageForm({ languageId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    flag: "",
    direction: "LTR",
    is_base: false,
    is_default: false,
    is_active: true,
    notes: ""
  });

  const { data: languages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: () => base44.entities.Language.list()
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Language.create(data),
    onSuccess: onSave
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Language.update(id, data),
    onSuccess: onSave
  });

  useEffect(() => {
    if (languageId) {
      const language = languages.find(l => l.id === languageId);
      if (language) setForm(language);
    }
  }, [languageId, languages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      alert("الحقول المطلوبة: الاسم والرمز");
      return;
    }
    
    const finalData = { ...form };
    if (languageId) {
      updateMutation.mutate({ id: languageId, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-border rounded-xl p-6 space-y-6"
      dir="rtl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-bold text-foreground">
          {languageId ? "تعديل اللغة" : "إضافة لغة جديدة"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">اسم اللغة *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: العربية"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">الرمز *</label>
            <input
              type="text"
              maxLength={2}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
              placeholder="مثال: ar"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">العلم (Emoji)</label>
            <input
              type="text"
              maxLength={2}
              value={form.flag}
              onChange={(e) => setForm({ ...form, flag: e.target.value })}
              placeholder="مثال: 🇸🇦"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">الاتجاه</label>
            <select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="rtl"
            >
              <option value="RTL">من اليمين لليسار (RTL)</option>
              <option value="LTR">من اليسار لليمين (LTR)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm font-semibold cursor-pointer">مفعلة</label>
          </div>
          {form.code === 'en' ? (
            <div className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-semibold">
              اللغة الأساسية (English)
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor="is_default" className="text-sm font-semibold cursor-pointer">افتراضية</label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="أضف ملاحظات..."
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {createMutation.isPending || updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}