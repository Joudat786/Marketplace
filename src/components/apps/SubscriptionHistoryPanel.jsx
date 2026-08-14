import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Download, ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SlidePanel from "@/components/superadmin/SlidePanel";

export default function SubscriptionHistoryPanel({ open, onClose, appId, workspace }) {
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // جلب سجلات الاشتراك من SubscriptionRecord فقط
  const { data: rawSubscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', appId, workspace?.id],
    queryFn: async () => {
      if (!appId) return [];
      const filterObj = { app_id: appId };
      if (workspace?.id) filterObj.workspace_id = workspace.id;
      const subRecords = await base44.entities.SubscriptionRecord.filter(filterObj);
      return subRecords || [];
    },
    enabled: open && !!appId
  });

  // ترتيب والبحث
  const subscriptions = useMemo(() => {
    let filtered = rawSubscriptions;

    // البحث
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        formatDate(sub.created_date).includes(searchTerm) ||
        getStatusLabel(sub.status).includes(searchTerm) ||
        (sub.billing_cycle === 'yearly' ? 'سنوي' : 'شهري').includes(searchTerm)
      );
    }

    // الترتيب
    return filtered.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'created_date':
          valA = new Date(a.created_date || 0);
          valB = new Date(b.created_date || 0);
          break;
        case 'status':
          valA = getStatusLabel(a.status);
          valB = getStatusLabel(b.status);
          break;
        case 'amount':
          valA = a.subscription_ends_at ? 1 : 0; // مدفوع أولاً
          valB = b.subscription_ends_at ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawSubscriptions, searchTerm, sortBy, sortOrder]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      
      const yyyy = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const HH = d.getHours();
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const ampm = HH >= 12 ? 'م' : 'ص';
      const hh = String(HH % 12 || 12).padStart(2, '0');
      return `${yyyy}/${MM}/${dd} - ${hh}:${mm}:${ss} ${ampm}`;
    } catch (e) {
      return "-";
    }
  };

  const getRemainDays = (endDate) => {
    if (!endDate) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">∞ غير محدود</span>;
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "منتهي";
    return `${diff} يوم`;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      active: "bg-green-100 text-green-700",
      trial: "bg-blue-100 text-blue-700",
      expired: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-700",
      suspended: "bg-yellow-100 text-yellow-700"
    };
    return statusMap[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      active: "نشط",
      trial: "تجريبي",
      expired: "منتهي",
      cancelled: "ملغى",
      suspended: "معطل"
    };
    return statusLabels[status] || status;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscriptions.map(sub => sub.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = () => {
    const toExport = selectedIds.size > 0 ? subscriptions.filter(s => selectedIds.has(s.id)) : subscriptions;
    if (toExport.length === 0) return;

    const headers = ['تاريخ البداية', 'تاريخ النهاية', 'الحالة', 'نوع الدورة', 'حالة الدفع'];
    const rows = toExport.map(sub => [
      formatDate(sub.created_date),
      sub.subscription_ends_at ? formatDate(sub.subscription_ends_at) : '-',
      getStatusLabel(sub.status),
      sub.billing_cycle === 'yearly' ? 'سنوي' : 'شهري',
      sub.payment_status || '-'
    ]);

    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription_${appId}_${new Date().getTime()}.csv`);
    link.click();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ChevronDown size={14} className="opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const { data: app } = useQuery({
    queryKey: ['appDetail', appId],
    queryFn: () => appId ? base44.entities.App.filter({ id: appId }).then(r => r[0]) : null,
    enabled: !!appId
  });

  return (
    <SlidePanel open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          title="رجوع"
        >
          <ArrowRight size={20} />
        </button>
        <div className="flex-1 text-right mr-4">
          <h2 className="text-xl font-bold text-foreground">سجل الاشتراك</h2>
          <p className="text-sm text-muted-foreground">{app?.name}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-6 border-b border-border bg-card">
        <input
          type="text"
          placeholder="بحث في السجلات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
        />

        <button
          onClick={handleExport}
          disabled={subscriptions.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Download size={16} />
          تصدير
        </button>
      </div>

      {/* Content - Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">جاري التحميل...</div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">لا توجد سجلات اشتراك</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-tableHeaderBg text-tableHeaderText border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    رقم الاشتراك
                  </th>
                  <th 
                    onClick={() => handleSort('created_date')}
                    className="px-4 py-3 text-center font-semibold cursor-pointer hover:bg-black/5 flex items-center justify-center gap-2 border-r border-border"
                  >
                    تاريخ البداية
                    <SortIcon column="created_date" />
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    تاريخ النهاية
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    المتبقي
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    السعر
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-center font-semibold cursor-pointer hover:bg-black/5 flex items-center justify-center gap-2 border-r border-border"
                  >
                    الحالة
                    <SortIcon column="status" />
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    طريقة الدفع
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    الرقم المرجعي
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    حالة الدفع
                  </th>
                  <th className="px-4 py-3 text-center font-semibold border-r border-border">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const statusColorMap = { active: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-gray-100 text-gray-700', expired: 'bg-red-100 text-red-700', suspended: 'bg-amber-100 text-amber-700' };
                  const statusLabelMap = { active: 'نشط', cancelled: 'ملغى', expired: 'منتهي', suspended: 'معطل' };
                  return (
                  <tr
                    key={sub.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-foreground border-r border-border font-mono text-[11px]">
                      {sub.id?.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-center text-foreground border-r border-border">
                      {formatDate(sub.start_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground border-r border-border">
                      {sub.end_date ? formatDate(sub.end_date) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          ∞ مجاني دائم
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground border-r border-border">
                      {getRemainDays(sub.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground border-r border-border">
                      {sub.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-border">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", statusColorMap[sub.status] || 'bg-gray-100 text-gray-700')}>
                        {statusLabelMap[sub.status] || sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-border">
                      <span className="text-xs font-semibold text-foreground">
                        {sub.amount === 0 ? 'مجاني' : '🏦 تحويل بنكي'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-border">
                      <span className="text-xs font-mono text-foreground">{sub.payment_id?.slice(0,8) || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-border">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold",
                        sub.amount === 0 ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {sub.amount === 0 ? '∞ مجاني' : '✓ مدفوع'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-border">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setDetailsOpen(true);
                        }}
                        className="text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                  );
                })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* تفاصيل الاشتراك - Dialog */}
      {detailsOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            {/* رأس الـ Dialog */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">تفاصيل الاشتراك</h2>
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedSub(null);
                }}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            {/* محتوى التفاصيل */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">رقم الاشتراك</span>
                <span className="font-mono text-foreground text-xs">{selectedSub.id}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">تاريخ البداية</span>
                <span className="font-semibold text-foreground">{formatDate(selectedSub.created_date)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">تاريخ النهاية</span>
                <span className="font-semibold text-foreground">
                  {selectedSub.subscription_ends_at ? formatDate(selectedSub.subscription_ends_at) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      ∞ مجاني دائم
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">المتبقي</span>
                <span className="font-semibold text-foreground">{getRemainDays(selectedSub.subscription_ends_at)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">نوع الدورة</span>
                <span className="font-semibold text-foreground">
                  {selectedSub.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">حالة الدفع</span>
                <span className="font-semibold text-foreground">{selectedSub.payment_status || '-'}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">الحالة</span>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", getStatusColor(selectedSub.status))}>
                  {getStatusLabel(selectedSub.status)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">طريقة الدفع</span>
                <span className="font-semibold text-foreground text-sm">
                  {selectedSub.payment?.payment_method ? (
                    <>
                      {selectedSub.payment.payment_method === 'tamara' && '🏦 Tamara'}
                      {selectedSub.payment.payment_method === 'tabby' && '💳 Tabby'}
                      {selectedSub.payment.payment_method === 'visa' && '💳 Visa'}
                      {selectedSub.payment.payment_method === 'mastercard' && '💳 Mastercard'}
                      {selectedSub.payment.payment_method === 'bank_transfer' && '🏦 تحويل بنكي'}
                      {!['tamara', 'tabby', 'visa', 'mastercard', 'bank_transfer'].includes(selectedSub.payment.payment_method) && selectedSub.payment.payment_method}
                    </>
                  ) : (
                    '-'
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">الرقم المرجعي</span>
                <span className="font-mono text-foreground text-xs">{selectedSub.payment?.gateway_transaction_id || '-'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">حالة الدفع</span>
                {selectedSub.payment ? (
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold",
                    selectedSub.payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    selectedSub.payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    selectedSub.payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                    selectedSub.payment.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {selectedSub.payment.status === 'paid' && '✓ مدفوع'}
                    {selectedSub.payment.status === 'pending' && '⏳ قيد الانتظار'}
                    {selectedSub.payment.status === 'failed' && '✗ فشل'}
                    {selectedSub.payment.status === 'refunded' && '↺ مسترجع'}
                    {selectedSub.payment.status === 'expired' && '❌ منتهي'}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* زر الإغلاق */}
            <button
              onClick={() => {
                setDetailsOpen(false);
                setSelectedSub(null);
              }}
              className="w-full mt-6 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}