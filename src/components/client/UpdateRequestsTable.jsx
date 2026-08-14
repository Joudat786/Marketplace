import { useState } from "react";
import { ChevronUp, ChevronDown, Eye, ArrowRight } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";
import { formatDateRiyadh as formatDateTime } from "@/utils/dateUtils";

const STATUS_MAP = {
  pending:  { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  approved: { label: "مقبول",        cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  rejected: { label: "مرفوض",        cls: "bg-red-100 text-red-700 border border-red-200" },
  returned: { label: "مُرجَع",       cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
};

const COLS = [
  { key: "request_number", label: "رقم طلب التحديث" },
  { key: "created_date",   label: "تاريخ ووقت الطلب" },
  { key: "status",         label: "الحالة" },
  { key: "rejection_reason", label: "الإجالة / السبب" },
];

const SortIcon = ({ field, sortField, sortDir }) => (
  <span className="inline-flex flex-col mr-1 opacity-50">
    <ChevronUp size={10} className={sortField === field && sortDir === "asc" ? "opacity-100 text-primary" : ""} />
    <ChevronDown size={10} className={sortField === field && sortDir === "desc" ? "opacity-100 text-primary" : ""} />
  </span>
);

const TABS = [
  { key: "all",      label: "الكل",          cls: "bg-primary text-white" },
  { key: "pending",  label: "قيد المراجعة", cls: "bg-amber-500 text-white" },
  { key: "approved", label: "مقبول",         cls: "bg-emerald-500 text-white" },
  { key: "rejected", label: "مرفوض",         cls: "bg-red-500 text-white" },
  { key: "returned", label: "مُرجَع",        cls: "bg-yellow-500 text-white" },
];

// تسميات الحقول
const FIELD_LABELS = {
  company_name: "اسم الشركة / المؤسسة",
  phone: "رقم الجوال",
  "company_data.commercial_register_number": "رقم السجل التجاري",
  "company_data.commercial_register_issue_date": "تاريخ إصدار السجل التجاري",
  "company_data.commercial_register_expiry_date": "تاريخ انتهاء السجل التجاري",
  "company_data.tax_number": "الرقم الضريبي",
  "company_data.tax_registration_date": "تاريخ نفاذ التسجيل الضريبي",
  "owner_data.nationality": "جنسية المالك",
  "owner_data.identity_type": "نوع الهوية",
  "owner_data.identity_number": "رقم الهوية",
  "location_data.country": "الدولة",
  "location_data.city": "المدينة",
  "location_data.address_code": "رمز العنوان",
  "location_data.address_description": "شرح العنوان",
};

const identityTypeLabel = (v) => {
  if (v === "national_id") return "هوية وطنية";
  if (v === "resident_id") return "إقامة";
  if (v === "passport") return "جواز سفر";
  return v || "-";
};

// استخراج الحقول المسطحة من الكائن
function flattenData(data) {
  if (!data) return {};
  const result = {};
  const flat = (obj, prefix = "") => {
    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        flat(v, key);
      } else {
        result[key] = v;
      }
    });
  };
  flat(data);
  return result;
}

function formatFieldValue(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (key.includes("identity_type")) return identityTypeLabel(value);
  return String(value);
}

// مكون عرض المقارنة - Slide Panel (نفس تنسيق UpdateRequestDetails)
function ComparePanel({ req, open, onClose }) {
  const old = req?.old_data || {};
  const neo = req?.new_data || {};
  const [openSections, setOpenSections] = useState({ company: true, owners: true, attachments: true, location: true });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const st = STATUS_MAP[req?.status] || STATUS_MAP.pending;

  const oldOwners = old.owners || [];
  const newOwners = neo.owners || [];
  const maxOwnersLen = Math.max(oldOwners.length, newOwners.length, 1);

  return (
    <SlidePanel open={open} onClose={onClose}>
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
                <p className="text-sm font-mono font-semibold text-primary">{req?.request_number || "-"}</p>
              </div>
              <div className="flex-1 px-4 py-3 text-center border-l border-border">
                <p className="text-xs text-muted-foreground mb-1">تاريخ ووقت الطلب</p>
                <p className="text-sm font-semibold">{formatDateTime(req?.created_date)}</p>
              </div>
              <div className="flex-1 px-4 py-3 text-center border-l border-border">
                <p className="text-xs text-muted-foreground mb-1">من طلب التعديل</p>
                <p className="text-sm font-semibold">{req?.client_name || "-"}</p>
                <p className="text-xs text-muted-foreground">{req?.client_email}</p>
              </div>
              <div className="flex-1 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">حالة الطلب</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
              </div>
            </div>
          </div>

          {/* مقارنة البيانات */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-tableHeaderBg px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold" style={{ color: "var(--table-header-text)" }}>مقارنة البيانات</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr style={{ backgroundColor: "var(--table-header-bg)" }}>
                    <th className="px-3 py-2.5 text-right font-semibold border-l border-border w-1/4" style={{ color: "var(--table-header-text)" }}>الحقل</th>
                    <th className="px-3 py-2.5 text-center font-semibold border-l border-border" style={{ color: "var(--table-header-text)" }}>البيانات القديمة</th>
                    <th className="px-3 py-2.5 text-center font-semibold" style={{ color: "var(--table-header-text)" }}>البيانات الجديدة</th>
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
                  {openSections.company && [{
                    label: "اسم الشركة / المؤسسة", oldVal: old.company_name, newVal: neo.company_name },
                    { label: "نوع الكيان القانوني", oldVal: old.activity_type, newVal: neo.activity_type },
                    { label: "الرقم الوطني الموحد", oldVal: old.unified_national_number, newVal: neo.unified_national_number },
                    { label: "رقم السجل التجاري", oldVal: old.commercial_register_number, newVal: neo.commercial_register_number },
                    { label: "تاريخ إصدار السجل التجاري", oldVal: old.commercial_register_issue_date, newVal: neo.commercial_register_issue_date },
                    { label: "تاريخ انتهاء السجل التجاري", oldVal: old.commercial_register_expiry_date, newVal: neo.commercial_register_expiry_date },
                    { label: "الرقم الضريبي", oldVal: old.tax_number, newVal: neo.tax_number },
                    { label: "تاريخ نفاذ التسجيل الضريبي", oldVal: old.tax_registration_expiry_date, newVal: neo.tax_registration_expiry_date },
                  ].map((row, i) => {
                    const changed = (row.oldVal || "") !== (row.newVal || "") && !!(row.oldVal || row.newVal);
                    return (
                      <tr key={`company-${i}`} className={`border-b border-border ${changed ? "bg-amber-50/50" : ""}`}>
                        <td className="px-3 py-2.5 text-sm text-right bg-secondary/10 border-l border-border font-medium text-foreground">
                          {row.label}{changed && <span className="mr-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">تغيير</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-sm text-center border-l border-border ${changed ? "text-red-500 line-through" : "text-muted-foreground"}`}>{row.oldVal || "-"}</td>
                        <td className={`px-3 py-2.5 text-sm text-center ${changed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>{row.newVal || "-"}</td>
                      </tr>
                    );
                  })}

                  {/* بيانات الملاك */}
                  <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("owners")}>
                    <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                      <div className="flex items-center justify-between">
                        <span>بيانات المالك / الملاك</span>
                        {openSections.owners ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                  </tr>
                  {openSections.owners && Array.from({ length: maxOwnersLen }).map((_, idx) => {
                    const o = oldOwners[idx] || {};
                    const n = newOwners[idx] || {};
                    const ownerRows = [
                      { label: "اسم المالك", oldVal: o.name, newVal: n.name },
                      { label: "البريد الإلكتروني", oldVal: o.email, newVal: n.email },
                      { label: "رقم الجوال", oldVal: o.mobile, newVal: n.mobile },
                      { label: "الجنسية", oldVal: o.nationality, newVal: n.nationality },
                      { label: "نوع الهوية", oldVal: identityTypeLabel(o.identity_type), newVal: identityTypeLabel(n.identity_type) },
                      { label: "رقم الهوية", oldVal: o.identity_number, newVal: n.identity_number },
                      { label: "في عقد التأسيس", oldVal: o.in_founding_contract ? "نعم" : o.in_founding_contract === false ? "لا" : undefined, newVal: n.in_founding_contract ? "نعم" : n.in_founding_contract === false ? "لا" : undefined },
                    ];
                    return [
                      <tr key={`owner-title-${idx}`} className="bg-secondary/20">
                        <td colSpan={3} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">المالك {idx + 1}</td>
                      </tr>,
                      ...ownerRows.map((row, i) => {
                        const changed = (row.oldVal || "") !== (row.newVal || "") && !!(row.oldVal || row.newVal);
                        return (
                          <tr key={`owner-${idx}-${i}`} className={`border-b border-border ${changed ? "bg-amber-50/50" : ""}`}>
                            <td className="px-3 py-2.5 text-sm text-right bg-secondary/10 border-l border-border font-medium text-foreground">
                              {row.label}{changed && <span className="mr-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">تغيير</span>}
                            </td>
                            <td className={`px-3 py-2.5 text-sm text-center border-l border-border ${changed ? "text-red-500 line-through" : "text-muted-foreground"}`}>{row.oldVal || "-"}</td>
                            <td className={`px-3 py-2.5 text-sm text-center ${changed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>{row.newVal || "-"}</td>
                          </tr>
                        );
                      })
                    ];
                  })}

                  {/* المستندات والمرفقات */}
                  <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("attachments")}>
                    <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                      <div className="flex items-center justify-between">
                        <span>المستندات والمرفقات</span>
                        {openSections.attachments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                  </tr>
                  {openSections.attachments && [{
                    label: "السجل التجاري", oldVal: old.commercial_register_attachment ? "✓ مرفق" : undefined, newVal: neo.commercial_register_attachment ? "✓ مرفق" : undefined },
                    { label: "عقد التأسيس", oldVal: old.founding_contract_attachment ? "✓ مرفق" : undefined, newVal: neo.founding_contract_attachment ? "✓ مرفق" : undefined },
                    { label: "الشهادة الضريبية", oldVal: old.tax_certificate_attachment ? "✓ مرفق" : undefined, newVal: neo.tax_certificate_attachment ? "✓ مرفق" : undefined },
                    { label: "العنوان الوطني", oldVal: old.national_address_attachment ? "✓ مرفق" : undefined, newVal: neo.national_address_attachment ? "✓ مرفق" : undefined },
                  ].map((row, i) => {
                    const changed = (row.oldVal || "") !== (row.newVal || "") && !!(row.oldVal || row.newVal);
                    return (
                      <tr key={`attach-${i}`} className={`border-b border-border ${changed ? "bg-amber-50/50" : ""}`}>
                        <td className="px-3 py-2.5 text-sm text-right bg-secondary/10 border-l border-border font-medium text-foreground">
                          {row.label}{changed && <span className="mr-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">تغيير</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-sm text-center border-l border-border ${changed ? "text-red-500 line-through" : "text-muted-foreground"}`}>{row.oldVal || "-"}</td>
                        <td className={`px-3 py-2.5 text-sm text-center ${changed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>{row.newVal || "-"}</td>
                      </tr>
                    );
                  })}

                  {/* الموقع والعنوان */}
                  <tr className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => toggleSection("location")}>
                    <td colSpan={3} className="px-3 py-2 text-xs font-bold text-primary border-b border-border">
                      <div className="flex items-center justify-between">
                        <span>الموقع والعنوان</span>
                        {openSections.location ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                  </tr>
                  {openSections.location && [{
                    label: "الدولة", oldVal: old.location_data?.country, newVal: neo.location_data?.country },
                    { label: "المنطقة", oldVal: old.location_data?.region, newVal: neo.location_data?.region },
                    { label: "المدينة", oldVal: old.location_data?.city, newVal: neo.location_data?.city },
                    { label: "الحي", oldVal: old.location_data?.neighborhood, newVal: neo.location_data?.neighborhood },
                    { label: "الشارع", oldVal: old.location_data?.street, newVal: neo.location_data?.street },
                    { label: "العنوان المختصر", oldVal: old.location_data?.national_address_code, newVal: neo.location_data?.national_address_code },
                    { label: "وصف العنوان الكامل", oldVal: old.location_data?.address_description, newVal: neo.location_data?.address_description },
                  ].map((row, i) => {
                    const changed = (row.oldVal || "") !== (row.newVal || "") && !!(row.oldVal || row.newVal);
                    return (
                      <tr key={`loc-${i}`} className={`border-b border-border ${changed ? "bg-amber-50/50" : ""}`}>
                        <td className="px-3 py-2.5 text-sm text-right bg-secondary/10 border-l border-border font-medium text-foreground">
                          {row.label}{changed && <span className="mr-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">تغيير</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-sm text-center border-l border-border ${changed ? "text-red-500 line-through" : "text-muted-foreground"}`}>{row.oldVal || "-"}</td>
                        <td className={`px-3 py-2.5 text-sm text-center ${changed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>{row.newVal || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* سبب الرفض إن وجد */}
          {req?.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-bold text-red-700 mb-1">سبب الرفض / الإرجاع:</p>
              <p className="text-sm text-red-800">{req.rejection_reason}</p>
            </div>
          )}

        </div>
      </div>
    </SlidePanel>
  );
}

export default function RequestsTable({ updateRequests = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState("created_date");
  const [sortDir, setSortDir]     = useState("desc");
  const [colSearch, setColSearch] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewReq, setViewReq] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const getVal = (req, key) => {
    if (key === "created_date") return formatDateTime(req.created_date);
    if (key === "status") return STATUS_MAP[req.status]?.label || req.status || "";
    return String(req[key] || "");
  };

  const tabFiltered = activeTab === "all" ? updateRequests : updateRequests.filter(r => r.status === activeTab);

  const filtered = tabFiltered.filter(req =>
    COLS.every(col => {
      const sv = colSearch[col.key];
      if (!sv) return true;
      return getVal(req, col.key).toLowerCase().includes(sv.toLowerCase());
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = getVal(a, sortField);
    const vb = getVal(b, sortField);
    return sortDir === "asc"
      ? va.localeCompare(vb, "ar")
      : vb.localeCompare(va, "ar");
  });

  const allSelected = sorted.length > 0 && sorted.every(r => selectedIds.includes(r.id));
  const toggleAll = () => allSelected ? setSelectedIds([]) : setSelectedIds(sorted.map(r => r.id));
  const toggleOne = (id) => selectedIds.includes(id)
    ? setSelectedIds(selectedIds.filter(i => i !== id))
    : setSelectedIds([...selectedIds, id]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* تبويبات الفلترة */}
      <div className="flex flex-wrap gap-1 bg-muted/40 rounded-xl p-1 border border-border w-fit">
        {TABS.map(tab => {
          const count = tab.key === "all" ? updateRequests.length : updateRequests.filter(r => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds([]); setColSearch({}); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key ? tab.cls + " shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/25" : "bg-muted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
                <th className="px-3 py-3 text-center border-l border-border w-10">
                  <div className="flex items-center justify-center gap-1">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                    {selectedIds.length > 0 && (
                      <span className="text-xs font-bold text-primary">{selectedIds.length}</span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-center border-l border-border w-10">#</th>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-3 text-center border-l border-border cursor-pointer select-none whitespace-nowrap"
                  >
                    {col.label}
                    <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                  </th>
                ))}
                <th className="px-3 py-3 text-center sticky left-0" style={{ backgroundColor: "var(--table-header-bg)" }}>الإجراءات</th>
              </tr>
              {/* صف البحث */}
              <tr className="bg-secondary/30 border-b border-border">
                <td className="px-2 py-1.5 border-l border-border" />
                <td className="px-2 py-1.5 border-l border-border" />
                {COLS.map(col => (
                  <td key={col.key} className="px-2 py-1.5 border-l border-border">
                    <input
                      placeholder="بحث..."
                      value={colSearch[col.key] || ""}
                      onChange={e => setColSearch(p => ({ ...p, [col.key]: e.target.value }))}
                      className="w-full text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 text-center"
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5 sticky left-0 bg-secondary/30" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 3} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد طلبات تحديث
                  </td>
                </tr>
              ) : (
                sorted.map((req, i) => {
                  const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={req.id}
                      className={`border-b border-border hover:bg-secondary/20 transition-colors ${selectedIds.includes(req.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <input type="checkbox" checked={selectedIds.includes(req.id)} onChange={() => toggleOne(req.id)} className="w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground border-l border-border">{i + 1}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-primary border-l border-border">{req.request_number || "-"}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">{formatDateTime(req.created_date)}</td>
                      <td className="px-3 py-2.5 text-center border-l border-border">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs border-l border-border">
                        {req.rejection_reason
                          ? <span className="text-destructive">{req.rejection_reason}</span>
                          : <span className="text-muted-foreground">-</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-center sticky left-0 bg-card border-r border-border">
                        <button
                          onClick={() => { setViewReq(req); setPanelOpen(true); }}
                          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Eye size={13} />
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel المقارنة */}
      <ComparePanel
        req={viewReq}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setViewReq(null); }}
      />
    </div>
  );
}