import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  Check, X, AlertTriangle, Clock, RotateCw, 
  ChevronDown, Search, Download, Filter, Eye, Upload, Loader2, Copy
} from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";
import { differenceInDays, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateRiyadh, normalizeToUTC } from "@/utils/dateUtils";



const subscriptionStatusOptions = [
{ key: 'all', label: 'كل الحالات', emoji: '📋', color: 'bg-gray-100 text-gray-700' },
{ key: 'active', label: 'نشط', emoji: '✅', color: 'bg-emerald-100 text-emerald-700' },
{ key: 'pending_payment', label: 'بانتظار التحقق', emoji: '⏳', color: 'bg-amber-100 text-amber-700' },
{ key: 'expiring_soon', label: 'قريب الانتهاء', emoji: '⏰', color: 'bg-amber-100 text-amber-700' },
{ key: 'expired', label: 'منتهي', emoji: '❌', color: 'bg-red-100 text-red-700' }
];

const typeOptions = [
  { key: 'all', label: 'كل الأنواع' },
  { key: 'plan', label: 'باقة' },
  { key: 'app', label: 'تطبيق' },
  { key: 'trial', label: 'تجربة مجانية' }
];

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedWorkspace } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailsPanel, setDetailsPanel] = useState({ open: false, subscription: null });
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch user's subscriptions from SubscriptionRecord only
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['userSubscriptions', selectedWorkspace?.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.SubscriptionRecord.filter({ 
        user_email: user.email,
        workspace_id: selectedWorkspace?.id
      });
      return subs || [];
    },
    enabled: !!selectedWorkspace?.id
  });

  // جلب طلبات التحويل البنكي للمساحة
  const { data: bankTransfers = [] } = useQuery({
    queryKey: ['bankTransfersForSubs', selectedWorkspace?.id],
    queryFn: () => base44.entities.BankTransferRequest.filter({ workspace_id: selectedWorkspace?.id }),
    enabled: !!selectedWorkspace?.id,
    refetchInterval: 5000
  });

  const [receiptPanel, setReceiptPanel] = useState({ open: false, url: null });
  const [uploadPanel, setUploadPanel] = useState({ open: false, bankTransfer: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadDone, setUploadDone] = useState(false);

  // mutation لرفع الإيصال
  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ bankTransferId, file }) => {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      if (!uploadRes?.file_url) throw new Error("فشل رفع الملف");
      await base44.entities.BankTransferRequest.update(bankTransferId, { receipt_url: uploadRes.file_url });
      return uploadRes.file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransfersForSubs', selectedWorkspace?.id] });
      setUploadDone(true);
      setUploadFile(null);
    },
    onError: (e) => setUploadError(e.message || "فشل رفع الإيصال"),
  });

  // ربط كل اشتراك بطلب التحويل البنكي المقابل عبر payment_id أو app_name
  const getBankTransfer = (sub) => {
    if (sub.payment_id) {
      const byId = bankTransfers.find(bt => bt.id === sub.payment_id);
      if (byId) return byId;
    }
    return bankTransfers.find(bt => bt.app_name === sub.name) || null;
  };

  // اشتراك غير محدود = لا يوجد end_date
  const isUnlimited = (endDate) => !endDate;

  // Calculate subscription status from SubscriptionRecord
  const getSubscriptionStatus = (subscription) => {
    if (subscription.status === 'cancelled') return 'expired';
    if (subscription.status === 'suspended') return 'suspended';
    if (isUnlimited(subscription.end_date)) return 'active'; // مجاني = دائماً نشط
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    if (isPast(endDate)) return 'expired';
    if (differenceInDays(endDate, now) <= 7) return 'expiring_soon';
    return 'active';
  };

  // Filter and sort
  const filtered = useMemo(() => {
    let result = subscriptions.filter(sub => {
      const status = getSubscriptionStatus(sub);
      const matchesStatus = statusFilter === 'all' || status === statusFilter
        || (statusFilter === 'pending_payment' && (status === 'pending_payment' || status === 'rejected' || status === 'suspended'));
      const matchesType = typeFilter === 'all' || sub.type === typeFilter;
      const matchesSearch = sub.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                           sub.description?.toLowerCase().includes(searchText.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'start_date') {
        aVal = new Date(a.start_date);
        bVal = new Date(b.start_date);
      } else if (sortBy === 'end_date') {
        aVal = new Date(a.end_date);
        bVal = new Date(b.end_date);
      } else if (sortBy === 'name') {
        aVal = a.name?.toLowerCase() || '';
        bVal = b.name?.toLowerCase() || '';
      } else {
        aVal = a.amount || 0;
        bVal = b.amount || 0;
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [subscriptions, statusFilter, typeFilter, searchText, sortBy, sortOrder]);



  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const handleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const exportData = () => {
    const csv = [
      ['رقم الاشتراك', 'الاسم', 'النوع', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية', 'السعر', 'العملة'].join(','),
      ...filtered.map(s => [
        s._installedApp?.id || s.id,
        s.name,
        s.type === 'plan' ? 'باقة' : 'تطبيق',
        getSubscriptionStatus(s),
        formatDateRiyadh(s.start_date),
        formatDateRiyadh(s.end_date),
        s.amount,
        s.currency
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'اشتراكاتي.csv';
    a.click();
  };

  const formatDate = formatDateRiyadh;

  const getRemainingDays = (endDate) => {
    if (isUnlimited(endDate)) return null; // غير محدود
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getStatusDisplay = (status) => {
    const options = {
      active: { label: 'نشط', emoji: '✅', color: 'bg-emerald-100 text-emerald-700' },
      expiring_soon: { label: 'قريب الانتهاء', emoji: '⏰', color: 'bg-amber-100 text-amber-700' },
      expired: { label: 'منتهي', emoji: '❌', color: 'bg-red-100 text-red-700' },
      pending_payment: { label: 'بانتظار التحقق', emoji: '⏳', color: 'bg-amber-100 text-amber-700' },
      suspended: { label: 'معطل', emoji: '⏸️', color: 'bg-gray-100 text-gray-600' },
      rejected: { label: 'مرفوض', emoji: '🚫', color: 'bg-red-100 text-red-700' },
    };
    return options[status] || options.active;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">اشتراكاتي</h1>
          <p className="text-xs text-muted-foreground">إدارة جميع الاشتراكات النشطة والمنتهية</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-card border border-border rounded-xl p-2 space-y-2">
        {/* Search and Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث في الاسم..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border border-border rounded-lg pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors"
          >
            <Download size={13} />
            تصدير
          </button>
        </div>

        {/* Status and Type Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {subscriptionStatusOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${
                statusFilter === opt.key
                  ? 'bg-primary text-white border-primary'
                  : opt.color + ' border-border hover:border-primary/30'
              }`}
            >
              <span>{opt.emoji}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {typeOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>



      {/* بانر تنبيه: اشتراكات تحتاج رفع إيصال */}
      {bankTransfers.filter(bt => !bt.receipt_url && bt.status === 'pending').length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">لديك {bankTransfers.filter(bt => !bt.receipt_url && bt.status === 'pending').length} طلب يحتاج رفع إيصال التحويل</p>
            <p className="text-xs text-amber-700 mt-0.5">اضغط على زر "رفع إيصال" بجوار الاشتراك لاستكمال الطلب وتسريع التفعيل</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">لا توجد اشتراكات</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ باشتراك في باقة أو تطبيق</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-2 py-1.5 text-right w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border w-28">رقم الاشتراك</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">الاسم</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">النوع</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">
                    <button
                      onClick={() => setSortBy('start_date')}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      البداية
                      {sortBy === 'start_date' && <ChevronDown size={12} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                    </button>
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">
                    <button
                      onClick={() => setSortBy('end_date')}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      النهاية
                      {sortBy === 'end_date' && <ChevronDown size={12} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                    </button>
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">المتبقي</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">السعر</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border">الحالة</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border w-52">طريقة الدفع</th>
                  <th className="px-2 py-1.5 text-center font-bold text-foreground border-r border-border sticky right-0 bg-secondary/30">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, idx) => {
                const status = getSubscriptionStatus(sub);
                const statusDisplay = getStatusDisplay(status);
                const remainingDays = getRemainingDays(sub.end_date);
                const bankTransfer = getBankTransfer(sub);

                  return (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-border transition-colors ${
                        bankTransfer && !bankTransfer.receipt_url && bankTransfer.status === 'pending'
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : 'hover:bg-secondary/30'
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sub.id)}
                          onChange={() => handleSelect(sub.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-border w-28">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono text-[10px] text-foreground" title={sub.id}>
                            {sub.id?.slice(0, 8)}...
                          </span>
                          <button
                            onClick={() => handleCopyId(sub.id)}
                            title="نسخ الرقم"
                            className="p-0.5 rounded hover:bg-secondary transition-colors flex-shrink-0"
                          >
                            {copiedId === sub.id
                              ? <Check size={10} className="text-emerald-600" />
                              : <Copy size={10} className="text-muted-foreground hover:text-primary" />
                            }
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center font-semibold text-foreground border-r border-border">{sub.name}</td>
                      <td className="px-2 py-1.5 text-center border-r border-border">
                        {sub.type === 'plan' ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">باقة</span>
                        ) : sub.type === 'trial' ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">تجربة مجانية</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">تطبيق</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center text-muted-foreground text-[10px] border-r border-border">
                        {formatDate(sub.start_date)}
                      </td>
                      <td className="px-2 py-1.5 text-center text-muted-foreground text-[10px] border-r border-border">
                        {isUnlimited(sub.end_date) ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">∞ غير محدود</span>
                        ) : formatDate(sub.end_date)}
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-border">
                        {remainingDays === null ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">∞ غير محدود</span>
                        ) : (
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            remainingDays === 0 ? 'bg-red-100 text-red-700' :
                            remainingDays <= 7 ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            <Clock size={10} />
                            {remainingDays} يوم
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center font-semibold text-foreground border-r border-border">
                        {sub.type === 'trial' ? (
                          <span className="text-amber-600 font-bold">تجريبي مجاني</span>
                        ) : sub.amount === 0 ? (
                          <span className="text-emerald-600 font-bold">مجاني</span>
                        ) : (
                          `${sub.amount} ${sub.currency}`
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-border">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusDisplay.color}`}>
                          <span>{statusDisplay.emoji}</span>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-border">
                        {bankTransfer ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">تحويل بنكي</span>
                            {bankTransfer.receipt_url ? (
                              <button
                                onClick={() => setReceiptPanel({ open: true, url: bankTransfer.receipt_url })}
                                title="عرض الإيصال"
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition-colors whitespace-nowrap"
                              >
                                <Eye size={10} /> عرض
                              </button>
                            ) : bankTransfer.status === 'pending' ? (
                              <button
                                onClick={() => { setUploadPanel({ open: true, bankTransfer }); setUploadFile(null); setUploadError(""); setUploadDone(false); }}
                                title="رفع إيصال التحويل"
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 text-amber-900 rounded-lg text-[9px] font-bold hover:bg-amber-500 transition-colors animate-pulse whitespace-nowrap"
                              >
                                <Upload size={10} /> رفع إيصال
                              </button>
                            ) : null}
                          </div>
                        ) : sub.amount === 0 || sub.type === 'trial' ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500">مجاني</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">إلكتروني</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-border sticky right-0 bg-card hover:bg-secondary/30">
                        <button
                          onClick={() => setDetailsPanel({ open: true, subscription: sub })}
                          title="عرض التفاصيل"
                          className="p-1 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Eye size={12} className="text-primary" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Slide Panel */}
      <SlidePanel open={receiptPanel.open} onClose={() => setReceiptPanel({ open: false, url: null })}>
        {receiptPanel.url && (
          <div className="h-full flex flex-col bg-background" dir="rtl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/40 flex-shrink-0">
              <button onClick={() => setReceiptPanel({ open: false, url: null })} className="p-1.5 hover:bg-primary/10 rounded-lg">
                <X size={18} className="text-muted-foreground" />
              </button>
              <h2 className="text-base font-bold text-foreground flex-1">إيصال التحويل البنكي</h2>
              <a
                href={receiptPanel.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90"
              >
                <Download size={13} /> تنزيل
              </a>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
              {receiptPanel.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img src={receiptPanel.url} alt="إيصال التحويل" className="max-w-full rounded-xl shadow-lg border border-border" />
              ) : receiptPanel.url.match(/\.pdf(\?|$)/i) ? (
                <iframe src={receiptPanel.url} className="w-full h-full rounded-xl border border-border" style={{ minHeight: "80vh" }} title="إيصال التحويل" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <Eye size={32} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">لا يمكن عرض هذا الملف مباشرةً</p>
                  <a
                    href={receiptPanel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    <Download size={14} /> فتح في تبويب جديد
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Upload Receipt Slide Panel */}
      <SlidePanel open={uploadPanel.open} onClose={() => setUploadPanel({ open: false, bankTransfer: null })}>
        {uploadPanel.bankTransfer && (
          <div className="h-full flex flex-col bg-background" dir="rtl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/40 flex-shrink-0">
              <button onClick={() => setUploadPanel({ open: false, bankTransfer: null })} className="p-1.5 hover:bg-primary/10 rounded-lg">
                <X size={18} className="text-muted-foreground" />
              </button>
              <h2 className="text-base font-bold text-foreground flex-1">رفع إيصال التحويل البنكي</h2>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              {/* معلومات الطلب */}
              <div className="bg-secondary/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التطبيق</span>
                  <span className="font-bold">{uploadPanel.bankTransfer.app_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-bold text-primary">{uploadPanel.bankTransfer.amount} {uploadPanel.bankTransfer.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">حالة الطلب</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">بانتظار المراجعة</span>
                </div>
              </div>

              {uploadDone ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check size={32} className="text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-foreground">تم رفع الإيصال بنجاح!</p>
                  <p className="text-sm text-muted-foreground">سيتم مراجعته من فريقنا وتفعيل الاشتراك قريباً</p>
                  <button
                    onClick={() => setUploadPanel({ open: false, bankTransfer: null })}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90"
                  >
                    إغلاق
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground">ارفع صورة إيصال التحويل</p>
                    <p className="text-xs text-muted-foreground">يدعم الصور (JPG, PNG) وملفات PDF</p>
                    <label className="flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-border rounded-xl p-8 hover:bg-secondary/30 transition-colors bg-secondary/10">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadError(""); }}
                      />
                      <Upload size={32} className="text-muted-foreground" />
                      {uploadFile ? (
                        <span className="text-sm font-semibold text-primary">✓ {uploadFile.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">اضغط لاختيار الملف</span>
                      )}
                    </label>
                    {uploadError && <p className="text-xs text-destructive font-semibold">⚠ {uploadError}</p>}
                  </div>

                  <button
                    onClick={() => uploadReceiptMutation.mutate({ bankTransferId: uploadPanel.bankTransfer.id, file: uploadFile })}
                    disabled={!uploadFile || uploadReceiptMutation.isPending}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
                  >
                    {uploadReceiptMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin" /> جاري الرفع...</>
                    ) : (
                      <><Upload size={16} /> رفع الإيصال</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Details Panel */}
      {detailsPanel.open && detailsPanel.subscription && (
        <SubscriptionDetails
          subscription={detailsPanel.subscription}
          bankTransfer={getBankTransfer(detailsPanel.subscription)}
          onClose={() => setDetailsPanel({ open: false, subscription: null })}
          formatDate={formatDate}
          getRemainingDays={getRemainingDays}
          getStatusDisplay={getStatusDisplay}
          getSubscriptionStatus={getSubscriptionStatus}
          onUploadReceipt={(bt) => { setUploadPanel({ open: true, bankTransfer: bt }); setUploadFile(null); setUploadError(""); setUploadDone(false); }}
          onViewReceipt={(url) => setReceiptPanel({ open: true, url })}
        />
      )}
    </motion.div>
  );
}

// بادج حالة التحويل البنكي
function BankTransferStatusBadge({ status }) {
  const map = {
    pending:  { label: 'بانتظار المراجعة', color: 'bg-amber-100 text-amber-700',   icon: '⏳' },
    approved: { label: 'مُوافق عليه',       color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
    rejected: { label: 'مرفوض',             color: 'bg-red-100 text-red-700',      icon: '❌' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

// Details Slide Panel
function SubscriptionDetails({ subscription, bankTransfer, onClose, formatDate, getRemainingDays, getStatusDisplay, getSubscriptionStatus, onUploadReceipt, onViewReceipt }) {
  const isUnlimited = (endDate) => !endDate;
  const status = getSubscriptionStatus(subscription);
  const statusDisplay = getStatusDisplay(status);
  const remainingDays = getRemainingDays(subscription.end_date);

  return (
    <SlidePanel open={true} onClose={onClose}>
      <div className="h-full flex flex-col bg-background" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/40 flex-shrink-0">
          <button onClick={onClose} className="p-1.5 hover:bg-primary/10 rounded-lg">
            <X size={18} className="text-muted-foreground" />
          </button>
          <h2 className="text-base font-bold text-foreground flex-1">تفاصيل الاشتراك</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusDisplay.color}`}>
            {statusDisplay.emoji} {statusDisplay.label}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* معلومات الاشتراك */}
          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-black">1</span>
              بيانات الاشتراك
            </h3>
            <div className="bg-secondary/30 rounded-xl p-4 space-y-2.5 text-sm">
              {[
                ['رقم الاشتراك', <span className="font-mono text-[10px]">{subscription.id}</span>],
                ['الاسم', <span className="font-bold">{subscription.name}</span>],
                ['النوع', subscription.type === 'plan' ? 'باقة' : subscription.type === 'trial' ? 'تجربة مجانية' : 'تطبيق'],
                ['دورة الفوترة', subscription.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'],
                ['تاريخ البداية', <span className="font-mono text-xs">{formatDate(subscription.start_date)}</span>],
                ['تاريخ النهاية', isUnlimited(subscription.end_date) ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">∞ غير محدود</span> : <span className="font-mono text-xs">{formatDate(subscription.end_date)}</span>],
                ['الأيام المتبقية', remainingDays === null ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">∞ غير محدود</span> : <span className={`font-bold ${remainingDays <= 7 ? 'text-red-600' : 'text-emerald-600'}`}>{remainingDays} يوم</span>],
                ['السعر', subscription.type === 'trial' ? <span className="text-amber-600 font-bold">تجريبي مجاني</span> : subscription.amount === 0 ? <span className="text-emerald-600 font-bold">مجاني</span> : <span className="font-bold text-primary">{subscription.amount} {subscription.currency}</span>],
              ].map(([label, value], i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* سجل التحويل البنكي */}
          {bankTransfer && (
            <section>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-black">2</span>
                سجل التحويل البنكي
              </h3>

              {/* شريط الحالة الرئيسي */}
              <div className={`rounded-xl p-4 mb-4 border-2 ${
                bankTransfer.status === 'approved' ? 'bg-emerald-50 border-emerald-300' :
                bankTransfer.status === 'rejected' ? 'bg-red-50 border-red-300' :
                'bg-amber-50 border-amber-300'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {bankTransfer.status === 'approved' ? '✅' : bankTransfer.status === 'rejected' ? '❌' : '⏳'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${
                      bankTransfer.status === 'approved' ? 'text-emerald-800' :
                      bankTransfer.status === 'rejected' ? 'text-red-800' :
                      'text-amber-800'
                    }`}>
                      {bankTransfer.status === 'approved' ? 'تم قبول التحويل وتفعيل الاشتراك' :
                       bankTransfer.status === 'rejected' ? 'تم رفض طلب التحويل البنكي' :
                       bankTransfer.receipt_url ? 'تم استلام الإيصال — بانتظار مراجعة الفريق' :
                       'في انتظار رفع إيصال التحويل'}
                    </p>
                    {bankTransfer.status === 'rejected' && (
                      <p className="text-xs text-red-600 mt-1">يمكنك التواصل مع الدعم لمعرفة سبب الرفض أو تقديم طلب جديد</p>
                    )}
                    {bankTransfer.status === 'pending' && !bankTransfer.receipt_url && (
                      <p className="text-xs text-amber-600 mt-1">يرجى رفع صورة إيصال التحويل لتسريع عملية التفعيل</p>
                    )}
                  </div>
                </div>
              </div>

              {/* تفاصيل الطلب */}
              <div className="bg-secondary/30 rounded-xl p-4 space-y-2.5 text-sm">
                {[
                  ['المبلغ', <span className="font-bold text-primary">{bankTransfer.amount} {bankTransfer.currency}</span>],
                  ['دورة الفوترة', bankTransfer.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'],
                  ['نوع الدفع', bankTransfer.transfer_mode === 'immediate' ? 'دفع فوري' : 'مع مهلة'],
                  ['البنك المُحوَّل إليه', bankTransfer.bank_name || '-'],
                  ['اسم صاحب الحساب', bankTransfer.bank_account_holder || '-'],
                  ['رقم الآيبان', <span className="font-mono text-xs" dir="ltr">{bankTransfer.bank_iban || '-'}</span>],
                  ['اسم المُحوِّل', bankTransfer.sender_name || '-'],
                  ['حالة الطلب', <BankTransferStatusBadge status={bankTransfer.status} />],
                  ['تاريخ الطلب', <span className="font-mono text-[10px]">{formatDate(bankTransfer.created_date)}</span>],
                  ...(bankTransfer.reviewed_at ? [['تاريخ المراجعة', <span className="font-mono text-[10px]">{formatDate(bankTransfer.reviewed_at)}</span>]] : []),
                  ...(bankTransfer.admin_notes ? [['ملاحظات المراجع', <span className="text-xs text-muted-foreground">{bankTransfer.admin_notes}</span>]] : []),
                ].map(([label, value], i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* قسم الإيصال */}
              <div className="mt-4 border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/40 px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-bold text-foreground">إيصال التحويل</p>
                </div>
                <div className="p-4">
                  {bankTransfer.receipt_url ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check size={18} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">تم رفع الإيصال</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">الإيصال متاح للمراجعة</p>
                      </div>
                      <button
                        onClick={() => onViewReceipt(bankTransfer.receipt_url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={12} /> عرض الإيصال
                      </button>
                    </div>
                  ) : bankTransfer.status === 'pending' ? (
                    <div className="flex flex-col items-center gap-3 py-2 text-center">
                      <p className="text-xs text-muted-foreground">لم يُرفع الإيصال بعد</p>
                      <button
                        onClick={() => onUploadReceipt(bankTransfer)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors animate-pulse"
                      >
                        <Upload size={13} /> رفع إيصال التحويل
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">لا يوجد إيصال مرفق</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* لا يوجد تحويل بنكي — عرض طريقة الدفع فقط */}
          {!bankTransfer && (
            <section>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-black">2</span>
                طريقة الدفع
              </h3>
              <div className="bg-secondary/30 rounded-xl p-4 text-sm">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {subscription.amount === 0 || subscription.type === 'trial' ? 'مجاني / تجريبي' : 'دفع إلكتروني'}
                </span>
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}