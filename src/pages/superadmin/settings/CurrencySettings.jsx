import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Plus, Download, Upload, Trash2, Edit2, Trash, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import CurrencySymbolSelector from "@/components/superadmin/CurrencySymbolSelector";
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

export default function CurrencySettings() {
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

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => base44.entities.Currency.list()
  });

  const [orderedCurrencies, setOrderedCurrencies] = useState([]);

  useEffect(() => {
    const sorted = [...currencies].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedCurrencies(sorted);
  }, [currencies]);

  const deleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Currency.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      setSelectedIds([]);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: (items) => Promise.all(items.map((c, idx) => base44.entities.Currency.update(c.id, { sort_order: idx }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currencies"] })
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedCurrencies);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedCurrencies(items);
    updateOrderMutation.mutate(items);
  };

  const filteredCurrencies = orderedCurrencies.filter(c => {
    const matchName = c.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchCode = c.code.toLowerCase().includes(filters.code.toLowerCase());
    const matchStatus = filters.status === "all" ||
      (filters.status === "active" && c.is_active) ||
      (filters.status === "inactive" && !c.is_active);
    return matchName && matchCode && matchStatus;
  });

  // تحديث أكشن شريط الأدوات
  useEffect(() => {
    setToolbarActions({
      add: {
        onClick: () => { setEditingId(null); setShowForm(true); }
      },
      delete: {
        onClick: () => {
          if (selectedIds.length > 0 && confirm(`هل أنت متأكد من حذف ${selectedIds.length} عملة؟`)) {
            deleteMutation.mutate(selectedIds);
          }
        },
        disabled: selectedIds.length === 0
      },
      download: {
        onClick: handleExport,
        disabled: filteredCurrencies.length === 0
      }
    });
  }, [selectedIds, filteredCurrencies.length, setToolbarActions]);

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? filteredCurrencies.map(c => c.id) : []);
    setSelectedCount(checked ? filteredCurrencies.length : 0);
  };

  const toggleSelect = (id, checked) => {
    const newIds = checked 
      ? [...selectedIds, id] 
      : selectedIds.filter(x => x !== id);
    setSelectedIds(newIds);
    setSelectedCount(newIds.length);
  };

  const handleExport = () => {
    const data = filteredCurrencies.map(c => ({
      "الرمز": c.code,
      "اسم العملة": c.name,
      "الرمز المعروض": c.symbol || "-",
      "معدل الصرف": c.exchange_rate,
      "عدد المنازل": c.decimal_places,
      "الحالة": c.is_active ? "مفعل" : "معطل",
      "افتراضية": c.is_default ? "نعم" : "لا",
      "التاريخ": formatDate(c.created_date)
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `العملات_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات العملات</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة العملات ومعدلات الصرف</p>
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
                    checked={selectedIds.length === filteredCurrencies.length && filteredCurrencies.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border w-12" style={{ color: 'var(--table-header-text)' }}>#</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الرمز</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>اسم العملة</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الرمز المعروض</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>معدل الصرف</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>المنازل</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>الحالة</th>
                <th className="px-4 py-3 text-center font-semibold border-l border-border" style={{ color: 'var(--table-header-text)' }}>التاريخ</th>
                <th className="px-4 py-3 text-center font-semibold sticky right-0" style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>الإجراءات</th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="currencies">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredCurrencies.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">لا توجد عملات</td>
                      </tr>
                    ) : filteredCurrencies.map((currency, idx) => (
                      <Draggable key={currency.id} draggableId={currency.id} index={idx}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn("border-b border-border transition-colors", snapshot.isDragging ? "bg-primary/5 shadow-lg" : "hover:bg-secondary/20")}
                          >
                            <td className="px-3 py-3 text-center border-l border-border" {...provided.dragHandleProps}>
                              <GripVertical size={16} className="text-muted-foreground mx-auto cursor-grab active:cursor-grabbing" />
                            </td>
                            <td className="px-4 py-3 text-center border-l border-border">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(currency.id)}
                                onChange={(e) => toggleSelect(currency.id, e.target.checked)}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                            <td className="px-4 py-3 text-center border-l border-border font-semibold">{currency.code}</td>
                            <td className="px-4 py-3 text-center border-l border-border">{currency.name}</td>
                            <td className="px-4 py-3 text-center border-l border-border">{currency.symbol || "-"}</td>
                            <td className="px-4 py-3 text-center border-l border-border">{currency.exchange_rate}</td>
                            <td className="px-4 py-3 text-center border-l border-border">{currency.decimal_places}</td>
                            <td className="px-4 py-3 text-center border-l border-border">
                              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                                currency.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                {currency.is_active ? "مفعل" : "معطل"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">
                              {formatDate(currency.created_date)}
                            </td>
                            <td className="px-4 py-3 sticky right-0 bg-card">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => { setEditingId(currency.id); setShowForm(true); }}
                                  className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                  title="تعديل">
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteMutation.mutate([currency.id])}
                                  className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                  title="حذف">
                                  <Trash size={16} />
                                </button>
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
        <CurrencyForm
          currencyId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSave={() => { 
            queryClient.invalidateQueries({ queryKey: ["currencies"] });
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}
    </motion.div>
  );
}

function CurrencyForm({ currencyId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    symbol: "",
    exchange_rate: "",
    decimal_places: 2,
    is_active: true,
    is_default: false,
    thousands_separator: ",",
    decimal_separator: ".",
    symbol_position: "right",
    symbol_space: false,
    sort_order: 0,
    notes: ""
  });
  const [previewAmount, setPreviewAmount] = useState(1234567.50);

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => base44.entities.Currency.list()
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Currency.create(data),
    onSuccess: onSave
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Currency.update(id, data),
    onSuccess: onSave
  });

  useEffect(() => {
    if (currencyId) {
      const currency = currencies.find(c => c.id === currencyId);
      if (currency) setForm(currency);
    }
  }, [currencyId, currencies]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code || form.exchange_rate === "") {
      alert("الحقول المطلوبة: الاسم والرمز ومعدل الصرف");
      return;
    }
    const data = { 
      ...form, 
      exchange_rate: Number(form.exchange_rate),
      symbol_space: form.symbol_space || false
    };
    if (currencyId) {
      updateMutation.mutate({ id: currencyId, data });
    } else {
      createMutation.mutate(data);
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
          {currencyId ? "تعديل العملة" : "إضافة عملة جديدة"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">اسم العملة *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: الريال السعودي"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">الرمز *</label>
            <input
              type="text"
              maxLength={3}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="مثال: SAR"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">الرمز المعروض</label>
            <CurrencySymbolSelector
              value={form.symbol}
              onChange={(symbol) => setForm({ ...form, symbol })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">معدل الصرف *</label>
            <input
              type="number"
              step="0.01"
              value={form.exchange_rate}
              onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
              placeholder="1.0"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">عدد المنازل العشرية</label>
            <input
              type="number"
              min="0"
              max="4"
              value={form.decimal_places}
              onChange={(e) => setForm({ ...form, decimal_places: Number(e.target.value) })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">فاصلة الألاف</label>
            <select
              value={form.thousands_separator}
              onChange={(e) => setForm({ ...form, thousands_separator: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value=",">,</option>
              <option value=".">.</option>
              <option value=" "> (مسافة)</option>
              <option value="">بدون فاصلة</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <label className="block text-sm font-semibold mb-2">الفاصلة العشرية</label>
            <select
              value={form.decimal_separator}
              onChange={(e) => setForm({ ...form, decimal_separator: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value=".">.</option>
              <option value=",">,</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">موضع الرمز</label>
            <select
              value={form.symbol_position}
              onChange={(e) => setForm({ ...form, symbol_position: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="right">يمين</option>
              <option value="left">يسار</option>
            </select>
          </div>
        </div>

        {/* معاينة العملة */}
        <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">معاينة العملة:</p>
          
          <div>
            <label className="block text-xs font-semibold mb-2">أدخل مبلغ للمعاينة</label>
            <input
              type="number"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
              step="any"
              placeholder="أدخل المبلغ"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="text-center py-3 bg-white border border-border rounded px-3">
            <p className="text-xl font-bold text-foreground">
              {(() => {
                const decimal_places = form.decimal_places || 2;
                const amount = Number(previewAmount);
                const parts = amount.toFixed(decimal_places).split('.');
                let integerPart = parts[0];
                const decimalPart = parts[1] || '';
                
                const thousands = form.thousands_separator || ',';
                if (thousands) {
                  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
                }
                
                const space = form.symbol_space ? ' ' : '';
                const decimal = form.decimal_separator || '.';
                const formatted = decimalPart 
                  ? `${integerPart}${decimal}${decimalPart}`
                  : integerPart;
                
                if (form.symbol_position === 'right') {
                  return `${form.symbol || ''}${space}${formatted}`;
                } else {
                  return `${formatted}${space}${form.symbol || ''}`;
                }
              })()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="symbol_space"
              checked={form.symbol_space}
              onChange={(e) => setForm({ ...form, symbol_space: e.target.checked })}
              className="cursor-pointer"
            />
            <label htmlFor="symbol_space" className="text-xs font-semibold cursor-pointer">وضع مسافة بعد الرمز</label>
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
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="أضف أي ملاحظات..."
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