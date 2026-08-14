import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

const identityLabel = (v) => {
  if (v === "national_id") return "هوية وطنية";
  if (v === "resident_id") return "إقامة";
  if (v === "passport") return "جواز سفر";
  return v || "-";
};

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const h = String(dt.getHours() % 12 || 12).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const sec = String(dt.getSeconds()).padStart(2, "0");
  const ampm = dt.getHours() >= 12 ? "م" : "ص";
  return `${yyyy}/${mm}/${dd} - ${h}:${min}:${sec} ${ampm}`;
};

function CompareRow({ label, oldVal, newVal }) {
  const changed = (oldVal || "") !== (newVal || "") && !!(oldVal || newVal);
  return (
    <tr className={`border-b border-border ${changed ? "bg-amber-50/50" : ""}`}>
      <td className="px-3 py-2.5 text-sm text-right bg-secondary/10 border-l border-border font-medium text-foreground">
        {label}
        {changed && <span className="mr-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">تغيير</span>}
      </td>
      <td className={`px-3 py-2.5 text-sm text-center border-l border-border ${changed ? "text-red-500 line-through" : "text-muted-foreground"}`}>
        {oldVal || "-"}
      </td>
      <td className={`px-3 py-2.5 text-sm text-center ${changed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>
        {newVal || "-"}
      </td>
    </tr>
  );
}

export default function UpdateRequestDetails({ request, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null); // "approve" | "reject" | "return"
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [openSections, setOpenSections] = useState({ company: true, owners: true, attachments: true, location: true });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const old = request?.old_data || {};
  const neo = request?.new_data || {};

  const statusMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      const updateData = {
        status,
        reviewed_at: new Date().toISOString(),
      };
      if (reason) updateData.rejection_reason = reason;

      // إذا قُبل → حدّث PlatformClient بالبيانات الجديدة
      if (status === "approved") {
        await base44.entities.PlatformClient.update(request.client_id, neo);
      }
      return base44.entities.ClientUpdateRequest.update(request.id, updateData);
    },
    onSuccess: (_, vars) => {
      const labels = { approved: "قُبل الطلب", rejected: "رُفض الطلب", returned: "أُرجع الطلب للتعديل" };
      toast({ title: labels[vars.status] || "تم التحديث" });
      queryClient.invalidateQueries({ queryKey: ["clientUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["platformClients"] });
      onSaved?.();
      onClose?.();
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const handleAction = (status) => {
    if ((status === "rejected" || status === "returned") && !reason.trim()) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    statusMutation.mutate({ status, reason: reason.trim() });
  };

  const statusBadge = {
    pending: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "مقبول", cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700" },
    returned: { label: "مُرجع للتعديل", cls: "bg-blue-100 text-blue-700" },
  };
  const badge = statusBadge[request?.status] || statusBadge.pending;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowRight size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">تفاصيل طلب التعديل</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* معلومات الطلب */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-tableHeaderBg px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold" style={{ color: "var(--table-header-text)" }}>معلومات الطلب</h3>
          </div>
          <div className="flex divide-x divide-border" dir="rtl">
            <div className="flex-1 px-4 py-3 text-center border-l border-border">
              <p className="text-xs text-muted-foreground mb-1">رقم الطلب</p>
              <p className="text-sm font-mono font-semibold text-primary">{request?.request_number || "-"}</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center border-l border-border">
              <p className="text-xs text-muted-foreground mb-1">تاريخ ووقت الطلب</p>
              <p className="text-sm font-semibold">{formatDate(request?.created_date)}</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center border-l border-border">
              <p className="text-xs text-muted-foreground mb-1">من طلب التعديل</p>
              <p className="text-sm font-semibold">{request?.client_name || "-"}</p>
              <p className="text-xs text-muted-foreground">{request?.client_email}</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">حالة الطلب</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>
        </div>

        {/* مقارنة البيانات */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-tableHeaderBg px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: "var(--table-header-text)" }}>مقارنة البيانات</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ backgroundColor: "var(--table-header-bg)" }}>
                  <th className="px-3 py-2.5 text-right font-semibold border-l border-border w-1/4" style={{ color: "var(--table-header-text)" }}>الحقل</th>
                  <th className="px-3 py-2.5 text-center font-semibold border-l border-border w-3/8" style={{ color: "var(--table-header-text)" }}>البيانات القديمة</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-3/8" style={{ color: "var(--table-header-text)" }}>البيانات الجديدة</th>
                </tr>
              </thead>
              <tbody>
                {/* بيانات الشركة */}
                <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("company")}>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                    <div className="flex items-center justify-between">
                      <span>بيانات الشركة / المؤسسة</span>
                      {openSections.company ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </td>
                </tr>
                {openSections.company && <><CompareRow label="اسم الشركة / المؤسسة" oldVal={old.company_name} newVal={neo.company_name} />
                <CompareRow label="نوع الكيان القانوني" oldVal={old.activity_type} newVal={neo.activity_type} />
                <CompareRow label="الرقم الوطني الموحد" oldVal={old.unified_national_number} newVal={neo.unified_national_number} />
                <CompareRow label="رقم السجل التجاري" oldVal={old.commercial_register_number} newVal={neo.commercial_register_number} />
                <CompareRow label="تاريخ إصدار السجل التجاري" oldVal={old.commercial_register_issue_date} newVal={neo.commercial_register_issue_date} />
                <CompareRow label="تاريخ انتهاء السجل التجاري" oldVal={old.commercial_register_expiry_date} newVal={neo.commercial_register_expiry_date} />
                <CompareRow label="الرقم الضريبي" oldVal={old.tax_number} newVal={neo.tax_number} />
                <CompareRow label="تاريخ نفاذ التسجيل الضريبي" oldVal={old.tax_registration_expiry_date} newVal={neo.tax_registration_expiry_date} /></>}

                {/* بيانات الملاك */}
                <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("owners")}>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                    <div className="flex items-center justify-between">
                      <span>بيانات المالك / الملاك</span>
                      {openSections.owners ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </td>
                </tr>
                {openSections.owners && (() => {
                  const oldOwners = old.owners || [];
                  const newOwners = neo.owners || [];
                  const maxLen = Math.max(oldOwners.length, newOwners.length, 1);
                  const rows = [];
                  for (let i = 0; i < maxLen; i++) {
                    const o = oldOwners[i] || {};
                    const n = newOwners[i] || {};
                    rows.push(
                      <tr key={`owner-title-${i}`} className="bg-secondary/20">
                        <td colSpan={3} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">المالك {i + 1}</td>
                      </tr>,
                      <CompareRow key={`owner-name-${i}`} label="اسم المالك" oldVal={o.name} newVal={n.name} />,
                      <CompareRow key={`owner-email-${i}`} label="البريد الإلكتروني" oldVal={o.email} newVal={n.email} />,
                      <CompareRow key={`owner-mobile-${i}`} label="رقم الجوال" oldVal={o.mobile} newVal={n.mobile} />,
                      <CompareRow key={`owner-nat-${i}`} label="الجنسية" oldVal={o.nationality} newVal={n.nationality} />,
                      <CompareRow key={`owner-idtype-${i}`} label="نوع الهوية" oldVal={identityLabel(o.identity_type)} newVal={identityLabel(n.identity_type)} />,
                      <CompareRow key={`owner-idnum-${i}`} label="رقم الهوية" oldVal={o.identity_number} newVal={n.identity_number} />,
                      <CompareRow key={`owner-contract-${i}`} label="في عقد التأسيس" oldVal={o.in_founding_contract ? "نعم" : o.in_founding_contract === false ? "لا" : undefined} newVal={n.in_founding_contract ? "نعم" : n.in_founding_contract === false ? "لا" : undefined} />,
                    );
                  }
                  return rows;
                })()}

                {/* المستندات والمرفقات */}
                <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("attachments")}>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                    <div className="flex items-center justify-between">
                      <span>المستندات والمرفقات</span>
                      {openSections.attachments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </td>
                </tr>
                {openSections.attachments && <>
                <CompareRow label="السجل التجاري" oldVal={old.commercial_register_attachment ? "✓ مرفق" : undefined} newVal={neo.commercial_register_attachment ? "✓ مرفق" : undefined} />
                <CompareRow label="عقد التأسيس" oldVal={old.founding_contract_attachment ? "✓ مرفق" : undefined} newVal={neo.founding_contract_attachment ? "✓ مرفق" : undefined} />
                <CompareRow label="الشهادة الضريبية" oldVal={old.tax_certificate_attachment ? "✓ مرفق" : undefined} newVal={neo.tax_certificate_attachment ? "✓ مرفق" : undefined} />
                <CompareRow label="العنوان الوطني" oldVal={old.national_address_attachment ? "✓ مرفق" : undefined} newVal={neo.national_address_attachment ? "✓ مرفق" : undefined} />
                </>}

                {/* الموقع والعنوان */}
                <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("location")}>
                  <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                    <div className="flex items-center justify-between">
                      <span>الموقع والعنوان</span>
                      {openSections.location ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </td>
                </tr>
                {openSections.location && <>
                <CompareRow label="الدولة" oldVal={old.location_data?.country} newVal={neo.location_data?.country} />
                <CompareRow label="المنطقة" oldVal={old.location_data?.region} newVal={neo.location_data?.region} />
                <CompareRow label="المدينة" oldVal={old.location_data?.city} newVal={neo.location_data?.city} />
                <CompareRow label="الحي" oldVal={old.location_data?.neighborhood} newVal={neo.location_data?.neighborhood} />
                <CompareRow label="الشارع" oldVal={old.location_data?.street} newVal={neo.location_data?.street} />
                <CompareRow label="العنوان المختصر" oldVal={old.location_data?.national_address_code} newVal={neo.location_data?.national_address_code} />
                <CompareRow label="وصف العنوان الكامل" oldVal={old.location_data?.address_description} newVal={neo.location_data?.address_description} />
                </>}
              </tbody>
            </table>
          </div>
        </div>

        {/* سبب الرفض/الإرجاع إذا كان موجوداً */}
        {request?.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-700 mb-1">سبب الرفض / الإرجاع:</p>
            <p className="text-sm text-red-800">{request.rejection_reason}</p>
          </div>
        )}

        {/* إجراءات المراجعة - فقط إذا كان الطلب قيد المراجعة */}
        {request?.status === "pending" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">إجراءات المراجعة</h3>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setAction("approve"); setReason(""); setReasonError(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  action === "approve" ? "bg-emerald-600 text-white border-emerald-600" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <CheckCircle size={15} />
                قبول
              </button>
              <button
                onClick={() => { setAction("reject"); setReason(""); setReasonError(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  action === "reject" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 hover:bg-red-50"
                }`}
              >
                <XCircle size={15} />
                رفض
              </button>
              <button
                onClick={() => { setAction("return"); setReason(""); setReasonError(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  action === "return" ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}
              >
                <RotateCcw size={15} />
                إرجاع للتعديل
              </button>
            </div>

            {(action === "reject" || action === "return") && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1 text-right">
                  سبب {action === "reject" ? "الرفض" : "الإرجاع"} <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => { setReason(e.target.value); setReasonError(false); }}
                  placeholder={`أدخل سبب ${action === "reject" ? "الرفض" : "الإرجاع"} بشكل واضح...`}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 text-right resize-none ${
                    reasonError ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"
                  }`}
                />
                {reasonError && <p className="text-xs text-destructive mt-1 text-right">هذا الحقل إجباري</p>}
              </div>
            )}

            {action && (
              <button
                onClick={() => handleAction(action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned")}
                disabled={statusMutation.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {statusMutation.isPending ? "جاري التنفيذ..." : "تأكيد الإجراء"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}