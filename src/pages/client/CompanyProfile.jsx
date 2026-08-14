import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { motion } from "framer-motion";
import { Building2, User, MapPin, FileText, Edit3, ClipboardList, ChevronDown, ZoomIn, Download } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";
import UpdateRequestPanel from "@/components/client/UpdateRequestPanel";
import RequestsTable from "@/components/client/UpdateRequestsTable";
import LocationSection from "@/components/client/LocationSection";

const SECTIONS = [
  { id: "company", label: "بيانات الشركة / المؤسسة", icon: Building2 },
  { id: "owner", label: "بيانات المالك / الملاك", icon: User },
  { id: "attachments", label: "المستندات والمرفقات", icon: FileText },
  { id: "location", label: "الموقع والعنوان", icon: MapPin },
];

const identityTypeLabel = (v) => {
  if (v === "national_id") return "هوية وطنية";
  if (v === "resident_id") return "إقامة";
  if (v === "passport") return "جواز سفر";
  return v || "-";
};

const statusLabel = (v) => {
  if (v === "active") return { label: "نشط", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  if (v === "trial") return { label: "تجريبي", cls: "bg-orange-100 text-orange-700 border border-orange-200" };
  if (v === "suspended") return { label: "موقوف", cls: "bg-red-100 text-red-700 border border-red-200" };
  if (v === "cancelled") return { label: "ملغي", cls: "bg-slate-100 text-slate-600 border border-slate-200" };
  return { label: v || "-", cls: "bg-secondary text-foreground" };
};

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
};

const formatDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  const date = `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
  const h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, "0");
  const s = String(dt.getSeconds()).padStart(2, "0");
  const period = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${date} - ${String(h12).padStart(2, "0")}:${m}:${s} ${period}`;
};

const requestStatusLabel = (v) => {
  if (v === "pending") return { label: "قيد المراجعة", cls: "bg-orange-100 text-orange-700 border border-orange-200" };
  if (v === "approved") return { label: "مقبول", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  if (v === "rejected") return { label: "مرفوض", cls: "bg-red-100 text-red-700 border border-red-200" };
  if (v === "returned") return { label: "مُرجَع", cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
  return { label: v || "-", cls: "bg-secondary text-foreground" };
};

const inputCls = "w-full border border-border bg-muted/40 rounded-lg px-3 py-2 text-sm text-right cursor-default select-none";
const labelCls = "block text-xs font-semibold text-foreground mb-1.5 text-right";

const ATTACHMENT_FIELDS = [
  { key: "commercial_register_attachment", label: "السجل التجاري" },
  { key: "founding_contract_attachment", label: "عقد التأسيس" },
  { key: "tax_certificate_attachment", label: "الشهادة الضريبية" },
  { key: "national_address_attachment", label: "العنوان الوطني" },
];

function AttachmentsReadOnly({ client }) {
  const [preview, setPreview] = useState(null);

  const getExt = (name, type) => {
    if (name) { const p = name.split("."); if (p.length > 1) return p[p.length - 1].toUpperCase(); }
    if (type) return type.split("/")[1]?.toUpperCase() || "-";
    return "-";
  };

  const getTypeLabel = (type, name) => {
    if (!type && name) {
      const ext = name.split(".").pop()?.toLowerCase();
      if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "صورة";
      if (ext === "pdf") return "PDF";
      return "ملف";
    }
    if (type?.startsWith("image/")) return "صورة";
    if (type?.includes("pdf")) return "PDF";
    return "ملف";
  };

  const formatSize = (size) => {
    if (!size) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url || "");
  const isPdf = (url) => /\.pdf(\?.*)?$/i.test(url || "");

  const fixedRows = ATTACHMENT_FIELDS.map((f) => ({
    label: f.label,
    url: client?.[f.key] || "",
    meta: client?.[f.key + "_meta"] || {},
    isFixed: true,
  }));
  const extraRows = (client?.extra_attachments || []).map((a) => ({
    label: a.name,
    url: a.url,
    name: a.name,
    size: a.size,
    type: a.type,
    isFixed: false,
  }));
  const allRows = [...fixedRows, ...extraRows];

  return (
    <div className="space-y-3" dir="rtl">
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <div className="flex items-center text-xs font-semibold border-b border-gray-300" style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
          <div className="w-[45px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">#</div>
          <div className="w-[160px] flex-shrink-0 px-3 py-2.5 border-l border-gray-300 text-center">نوع المستند</div>
          <div className="flex-1 px-4 py-2.5 border-l border-gray-300 text-center">اسم المستند</div>
          <div className="w-[80px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">النوع</div>
          <div className="w-[80px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">الصيغة</div>
          <div className="w-[90px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">الحجم</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">عرض</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 text-center">تنزيل</div>
        </div>
        {allRows.map((row, i) => {
          const name = row.isFixed ? (row.meta?.name || row.label) : row.name;
          const size = row.isFixed ? row.meta?.size : row.size;
          const type = row.isFixed ? row.meta?.type : row.type;
          const hasFile = !!row.url;
          return (
            <div key={i} className={`flex items-stretch ${i > 0 ? "border-t border-gray-300" : ""}`} style={hasFile ? { backgroundColor: "#dcfce7" } : {}}>
              <div className="w-[45px] flex-shrink-0 flex items-center justify-center py-3 border-l border-gray-300" style={hasFile ? { backgroundColor: "#dcfce7" } : { backgroundColor: "#f9fafb" }}>
                <span className="text-sm text-gray-500 font-medium">{i + 1}</span>
              </div>
              {/* نوع المستند - ثابت */}
              <div className="w-[160px] flex-shrink-0 flex items-center px-3 py-3 border-l border-gray-300">
                <span className="text-sm font-semibold text-primary truncate">{row.isFixed ? row.label : "-"}</span>
              </div>
              {/* اسم المستند - اسم الملف الفعلي */}
              <div className="flex-1 flex items-center px-3 py-3 border-l border-gray-300">
                <span className="text-sm text-foreground truncate">{row.isFixed ? (row.meta?.name || "-") : (name || "-")}</span>
              </div>
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs text-muted-foreground">{hasFile ? getTypeLabel(type, name) : "-"}</span>
              </div>
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs font-mono text-muted-foreground">{hasFile ? getExt(name, type) : "-"}</span>
              </div>
              <div className="w-[90px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs text-muted-foreground">{hasFile ? formatSize(size) : "-"}</span>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <button type="button" disabled={!hasFile} onClick={() => setPreview(row.url)}
                  className="flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary disabled:opacity-30">
                  <ZoomIn size={15} />
                </button>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
                <a href={row.url || "#"} download target="_blank" rel="noreferrer"
                  className={`flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary ${!hasFile ? "pointer-events-none opacity-30" : ""}`}>
                  <Download size={15} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-10 left-0 text-white text-sm flex items-center gap-1 hover:opacity-80">
              <span>✕</span> إغلاق
            </button>
            {isImage(preview) && <img src={preview} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl mx-auto block" />}
            {isPdf(preview) && <iframe src={preview} className="w-full h-[85vh] rounded-xl" title="مستند" />}
            {!isImage(preview) && !isPdf(preview) && (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
                <a href={preview} download className="text-primary underline text-sm">تنزيل الملف</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className={inputCls}>{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export default function CompanyProfile() {
  const { selectedWorkspace } = useWorkspace();
  const wsId = selectedWorkspace?.id;
  const [activeSection, setActiveSection] = useState("company");
  const [editPanel, setEditPanel] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: user } = useQuery({ 
    queryKey: ['me'], 
    queryFn: () => base44.auth.me(),
    staleTime: 0,
  });

  const { data: workspaceRaw, isLoading } = useQuery({
    queryKey: ["workspace", wsId],
    queryFn: () => base44.entities.Workspace.filter({ id: wsId }),
    enabled: !!wsId,
  });
  const ws = workspaceRaw?.[0];

  const { data: clientRaw, refetch: refetchClient } = useQuery({
    queryKey: ["platformClient", user?.email],
    queryFn: async () => {
      const [byEmail, byCreator] = await Promise.all([
        base44.entities.PlatformClient.filter({ email: user?.email }),
        base44.entities.PlatformClient.filter({ created_by: user?.email }),
      ]);
      const map = new Map();
      [...byEmail, ...byCreator].forEach(c => map.set(c.id, c));
      return Array.from(map.values());
    },
    enabled: !!user?.email,
    staleTime: 0,
  });
  const client = clientRaw?.[0];

  const { data: updateRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["clientUpdateRequests", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // نجلب بـ client_email مباشرة - RLS تسمح للمستخدم برؤية طلباته
      const results = await base44.entities.ClientUpdateRequest.filter({});
      return (results || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const statusInfo = statusLabel(ws?.status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 min-h-full p-6" dir="rtl">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-6">
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Building2 size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{client?.company_name || client?.owner_name || "الشركة"}</p>
                  <p className="text-xs text-muted-foreground truncate">{client?.email || user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                      activeSection === section.id
                        ? "bg-tabsActive text-white"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{client?.company_name || "الشركة"}</h1>
                <p className="text-sm text-muted-foreground">{client?.email || user?.email}</p>
              </div>
            </div>
            {/* زر طلب تعديل بيانات مع dropdown */}
            <div className="relative">
              <div className="flex items-stretch rounded-lg overflow-hidden border border-primary">
                <button
                  onClick={() => {
                    if (!client?.id) {
                      alert("لم يتم العثور على بيانات الشركة. يرجى إكمال نموذج التسجيل أولاً.");
                      return;
                    }
                    setEditPanel(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Edit3 size={15} />
                  طلب تعديل بيانات
                </button>
                <div className="w-px bg-primary-foreground/30" />
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ChevronDown size={15} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg min-w-[180px] overflow-hidden" dir="rtl">
                  <button
                    onClick={() => { setActiveSection("requests"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-right"
                  >
                    <ClipboardList size={15} className="text-primary" />
                    طلبات تحديث البيانات
                  </button>
                </div>
              )}
            </div>
          </div>

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "company" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بيانات الشركة / المؤسسة</h3>
                <div className="grid grid-cols-4 gap-4">
                  <ReadField label="نوع الكيان القانوني" value={client?.activity_type} />
                  <ReadField label="اسم الشركة / المؤسسة" value={client?.company_name} />
                  <div>
                    <label className={labelCls}>الحالة</label>
                    <div className={inputCls}>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  <ReadField label="تاريخ الانضمام" value={formatDate(client?.join_date || client?.created_date)} />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <ReadField label="الرقم الوطني الموحد" value={client?.unified_national_number} />
                  <ReadField label="رقم السجل التجاري" value={client?.commercial_register_number} />
                  <ReadField label="تاريخ إصدار السجل التجاري" value={formatDate(client?.commercial_register_issue_date)} />
                  <ReadField label="تاريخ انتهاء السجل التجاري" value={formatDate(client?.commercial_register_expiry_date)} />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <ReadField label="الرقم الضريبي" value={client?.tax_number} />
                  <ReadField label="تاريخ نفاذ التسجيل الضريبي" value={formatDate(client?.tax_registration_expiry_date)} />
                </div>
              </div>
            )}

            {activeSection === "owner" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بيانات المالك / الملاك</h3>
                {/* رأس الأعمدة */}
                <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-5 flex-shrink-0 text-center">#</span>
                  <span className="flex-1 min-w-0 text-center">اسم المالك</span>
                  <span className="flex-1 min-w-0 text-center">البريد الإلكتروني</span>
                  <span className="w-28 flex-shrink-0 text-center">رقم الجوال</span>
                  <span className="w-24 flex-shrink-0 text-center">الجنسية</span>
                  <span className="w-32 flex-shrink-0 text-center">نوع الهوية</span>
                  <span className="w-28 flex-shrink-0 text-center">رقم الهوية</span>
                  <span className="w-28 flex-shrink-0 text-center">مدير في عقد التأسيس</span>
                </div>
                {/* صفوف الملاك */}
                <div className="space-y-2">
                  {(client?.owners && client.owners.length > 0 ? client.owners : client?.owner_name ? [{ name: client.owner_name, mobile: client.phone, email: client.email, nationality: client.owner_data?.nationality, identity_type: client.owner_data?.identity_type, identity_number: client.owner_data?.identity_number }] : []).map((owner, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2.5">
                      <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                      <div className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40">{owner.name || "—"}</div>
                      <div className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40 truncate" dir="ltr">{owner.email || "—"}</div>
                      <div className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40" dir="ltr">{owner.mobile || "—"}</div>
                      <div className="w-24 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40">{owner.nationality || "—"}</div>
                      <div className="w-32 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40">{identityTypeLabel(owner.identity_type)}</div>
                      <div className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center bg-muted/40">{owner.identity_number || "—"}</div>
                      <div className="w-28 flex-shrink-0 flex items-center justify-center">
                        <div className={`relative w-9 h-5 rounded-full flex-shrink-0 ${owner.in_founding_contract ? "bg-primary" : "bg-border"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${owner.in_founding_contract ? "right-0.5" : "left-0.5"}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "attachments" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3">المستندات والمرفقات</h3>
                <AttachmentsReadOnly client={client} />
              </div>
            )}

            {activeSection === "location" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3">الموقع والعنوان</h3>
                <LocationSection
                  form={{ location_data: client?.location_data || {} }}
                  setForm={() => {}}
                />
              </div>
            )}

            {activeSection === "requests" && (
              <RequestsTable updateRequests={updateRequests} />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Slide Panel لطلب التعديل */}
      <SlidePanel open={editPanel} onClose={() => setEditPanel(false)}>
        <UpdateRequestPanel
          client={client}
          user={user}
          onClose={() => setEditPanel(false)}
          onSaved={() => { refetchClient(); refetchRequests(); }}
        />
      </SlidePanel>
    </>
  );
}