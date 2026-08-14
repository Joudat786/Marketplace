import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Save, Trash2, Building2, User, FileText, MapPin, Package, CreditCard, Briefcase, Upload, ZoomIn, Download, Plus, GripVertical, X, Crosshair, Loader2, Maximize2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDateRiyadh as formatDate } from "@/utils/dateUtils";
import MultiLangInput from "@/components/ui/MultiLangInput";
import LocationSection from "@/components/client/LocationSection";
import EntityTypeSelect from "@/components/ui/EntityTypeSelect";
import DateInput from "@/components/ui/DateInput";
import SimpleSelect from "@/components/ui/SimpleSelect";

// مكون مرفق مدمج داخل صف المالك (بدون label، أيقونات صغيرة)
function OwnerAttachmentBox({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange(res.file_url);
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  return (
    <div className="w-24 flex-shrink-0 border border-border rounded-md overflow-hidden bg-white">
      <div className="flex divide-x divide-x-reverse divide-border">
        <button type="button" onClick={() => inputRef.current?.click()}
          title="رفع مرفق الهوية"
          className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary relative">
          <Upload size={12} />
          {value && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button type="button" disabled={!value} onClick={() => value && setPreview(value)}
          title="عرض"
          className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary disabled:opacity-30">
          <ZoomIn size={12} />
        </button>
        <a href={value || "#"} download target="_blank" rel="noreferrer"
          title="تنزيل"
          className={`flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary ${!value ? "pointer-events-none opacity-30" : ""}`}>
          <Download size={12} />
        </a>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => handleUpload(e.target.files?.[0])} />
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <img src={preview} alt="" className="max-w-3xl max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// مكون قسم المرفقات الكامل بالتصميم الجديد
function AttachmentsSection({ form, setForm }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const ATTACHMENT_FIELDS = [
    { key: "commercial_register_attachment", label: "السجل التجاري" },
    { key: "founding_contract_attachment", label: "عقد التأسيس" },
    { key: "tax_certificate_attachment", label: "الشهادة الضريبية" },
    { key: "national_address_attachment", label: "العنوان الوطني" },
  ];

  // المرفقات المرفوعة (غير الثابتة) - مخزنة كمصفوفة
  const extraAttachments = form.extra_attachments || [];

  const handleUploadExtra = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({
          url: res.file_url,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
      setForm((f) => ({ ...f, extra_attachments: [...(f.extra_attachments || []), ...uploaded] }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const handleUploadFixed = async (file, key) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      // حفظ الاسم والحجم والنوع مع كل مرفق ثابت
      const metaKey = key + "_meta";
      setForm((f) => ({
        ...f,
        [key]: res.file_url,
        [metaKey]: { name: file.name, size: file.size, type: file.type },
      }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const removeExtra = (idx) => {
    setForm((f) => ({ ...f, extra_attachments: (f.extra_attachments || []).filter((_, i) => i !== idx) }));
  };

  const formatSize = (size) => {
    if (!size) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExt = (name, type) => {
    if (name) {
      const parts = name.split(".");
      if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
    }
    if (type) return type.split("/")[1]?.toUpperCase() || "-";
    return "-";
  };

  const getTypeLabel = (type, name) => {
    if (!type && name) {
      const ext = name.split(".").pop()?.toLowerCase();
      if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "صورة";
      if (["mp4","webm","mov","avi"].includes(ext)) return "فيديو";
      if (ext === "pdf") return "PDF";
      return "ملف";
    }
    if (type?.startsWith("image/")) return "صورة";
    if (type?.startsWith("video/")) return "فيديو";
    if (type?.includes("pdf")) return "PDF";
    return "ملف";
  };

  const openPreview = (url) => setPreview(url);

  const isImage = (url, type) => type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url || "");
  const isPdf = (url, type) => type?.includes("pdf") || /\.pdf(\?.*)?$/i.test(url || "");

  // دمج المرفقات الثابتة + الإضافية في قائمة واحدة
  const allRows = [
    ...ATTACHMENT_FIELDS.map((f) => ({
      label: f.label,
      url: form[f.key] || "",
      key: f.key,
      meta: form[f.key + "_meta"] || {},
      isFixed: true,
    })),
    ...extraAttachments.map((a, idx) => ({
      label: a.name,
      url: a.url,
      name: a.name,
      size: a.size,
      type: a.type,
      isFixed: false,
      extraIdx: idx,
    })),
  ];

  return (
    <div className="space-y-3" dir="rtl">
      {/* شريط الإجراءات */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "جاري الرفع..." : "إضافة مرفق"}
        </button>
        <input ref={inputRef} type="file" multiple accept="*/*" className="hidden"
          onChange={(e) => handleUploadExtra(e.target.files)} />
      </div>

      {/* الجدول */}
      <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-white">
        {/* رأس الجدول */}
        <div className="flex items-center text-xs font-semibold border-b border-gray-300" style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
          <div className="w-[45px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">#</div>
          <div className="flex-1 px-4 py-2.5 border-l border-gray-300 text-center">اسم المستند</div>
          <div className="w-[80px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">النوع</div>
          <div className="w-[80px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">الصيغة</div>
          <div className="w-[90px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">الحجم</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">رفع</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">تكبير</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 border-l border-gray-300 text-center">تنزيل</div>
          <div className="w-[50px] flex-shrink-0 py-2.5 text-center">حذف</div>
        </div>

        {/* الصفوف */}
        {allRows.map((row, i) => {
          const meta = row.isFixed ? row.meta : {};
          const name = row.isFixed ? (meta.name || row.label) : row.name;
          const size = row.isFixed ? meta.size : row.size;
          const type = row.isFixed ? meta.type : row.type;
          const url = row.url;
          const hasFile = !!url;

          return (
            <div key={i} className={`flex items-stretch ${i > 0 ? "border-t border-gray-300" : ""}`} style={hasFile ? { backgroundColor: "#dcfce7" } : {}}>
              {/* رقم */}
              <div className="w-[45px] flex-shrink-0 flex items-center justify-center py-3 border-l border-gray-300" style={hasFile ? { backgroundColor: "#dcfce7" } : { backgroundColor: "#f9fafb" }}>
                <span className="text-sm text-gray-500 font-medium">{i + 1}</span>
              </div>
              {/* الاسم */}
              <div className="flex-1 flex items-center px-3 py-3 border-l border-gray-300 gap-2">
                <span className="text-sm text-foreground truncate" title={name}>{name || row.label}</span>
              </div>
              {/* النوع */}
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs text-muted-foreground">{hasFile ? getTypeLabel(type, name) : "-"}</span>
              </div>
              {/* الصيغة */}
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs font-mono text-muted-foreground">{hasFile ? getExt(name, type) : "-"}</span>
              </div>
              {/* الحجم */}
              <div className="w-[90px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <span className="text-xs text-muted-foreground">{hasFile ? formatSize(size) : "-"}</span>
              </div>
              {/* زر رفع - للمرفقات الثابتة فقط */}
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                {row.isFixed ? (
                  <label className="cursor-pointer flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary">
                    <Upload size={15} />
                    <input type="file" accept="*/*" className="hidden"
                      onChange={(e) => handleUploadFixed(e.target.files?.[0], row.key)} />
                  </label>
                ) : (
                  <span className="text-muted-foreground opacity-30"><Upload size={15} /></span>
                )}
              </div>
              {/* زر تكبير */}
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <button
                  type="button"
                  disabled={!hasFile}
                  onClick={() => openPreview(url)}
                  className="flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary disabled:opacity-30"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              {/* زر تنزيل */}
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <a
                  href={url || "#"}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary ${!hasFile ? "pointer-events-none opacity-30" : ""}`}
                >
                  <Download size={15} />
                </a>
              </div>
              {/* زر حذف - للجميع */}
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
                {hasFile || !row.isFixed ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("هل أنت متأكد من الحذف؟")) return;
                      if (row.isFixed) {
                        const metaKey = row.key + "_meta";
                        setForm((f) => ({ ...f, [row.key]: "", [metaKey]: {} }));
                      } else {
                        removeExtra(row.extraIdx);
                      }
                    }}
                    className="flex items-center justify-center w-full h-full hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <span className="opacity-0 w-7 h-7" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة المعاينة */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-10 left-0 text-white text-sm flex items-center gap-1 hover:opacity-80">
              <X size={16} /> إغلاق
            </button>
            {isImage(preview) && <img src={preview} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl mx-auto block" />}
            {isPdf(preview) && <iframe src={preview} className="w-full h-[85vh] rounded-xl" title="مستند" />}
            {!isImage(preview) && !isPdf(preview) && (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">لا يمكن معاينة هذا النوع من الملفات</p>
                <a href={preview} download className="text-primary underline text-sm">تنزيل الملف</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MAIN_TABS = [
  { id: "main", label: "البيانات الرئيسية" },
  { id: "workspaces", label: "مساحات العمل" },
  { id: "subscriptions", label: "الاشتراكات والفواتير" },
];

const SIDE_SECTIONS = [
  { id: "company", label: "بيانات الشركة / المؤسسة", icon: Building2 },
  { id: "owner", label: "بيانات المالك / الملاك", icon: User },
  { id: "attachments", label: "المستندات والمرفقات", icon: FileText },
  { id: "location", label: "الموقع والعنوان", icon: MapPin },
];

const SUB_TABS = [
  { id: "plans", label: "الباقات", icon: Package },
  { id: "apps", label: "التطبيقات", icon: Briefcase },
  { id: "invoices", label: "الفواتير", icon: CreditCard },
];


const emptyOwner = {
  name: "",
  email: "",
  mobile: "",
  nationality: "",
  identity_type: "",
  identity_number: "",
  in_founding_contract: false,
};

const emptyForm = {
  company_name: "",
  owner_name: "",
  email: "",
  phone: "",
  workspaces_count: 0,
  status: "active",
  notes: "",
  activity_type: "",
  unified_national_number: "",
  commercial_register_number: "",
  commercial_register_issue_date: "",
  commercial_register_expiry_date: "",
  tax_number: "",
  tax_registration_expiry_date: "",
  commercial_register_attachment: "",
  founding_contract_attachment: "",
  tax_certificate_attachment: "",
  identity_attachment: "",
  national_address_attachment: "",
  owners: [{ ...emptyOwner }],
  owner_data: {
    nationality: "",
    identity_type: "",
    identity_number: "",
  },
  location_data: {
    lat: null,
    lng: null,
    national_address_code: "",
    country: "",
    region: "",
    city: "",
    governorate: "",
    neighborhood: "",
    address_description: "",
  },
};

const wsStatusConfig = {
  active: { label: "نشط", class: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  trial: { label: "تجريبي", class: "text-orange-600 bg-orange-50 border-orange-200" },
  suspended: { label: "موقوف", class: "text-red-600 bg-red-50 border-red-200" },
  cancelled: { label: "ملغي", class: "text-slate-600 bg-slate-50 border-slate-200" },
};

function WorkspacesTab({ clientEmail }) {
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["clientWorkspaces", clientEmail],
    queryFn: () => base44.entities.Workspace.filter({ owner_email: clientEmail }),
    enabled: !!clientEmail,
  });

  if (!clientEmail) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Building2 size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">لا يوجد بريد إلكتروني مرتبط بهذا العميل</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Building2 size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">لا توجد مساحات عمل لهذا العميل</p>
        <p className="text-xs mt-1">{clientEmail}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground">مساحات العمل</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">{workspaces.length} مساحة</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr style={{ backgroundColor: "var(--table-header-bg)", color: "var(--table-header-text)" }}>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">#</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">الشعار</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">اسم مساحة العمل</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">اسم الشركة / المؤسسة</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">نوع النشاط</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">الدولة</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">المدينة</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">الباقة</th>
              <th className="text-center font-semibold px-3 py-3 border-l border-border">الحالة</th>
              <th className="text-center font-semibold px-3 py-3">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws, i) => {
              const st = wsStatusConfig[ws.status] || wsStatusConfig.trial;
              return (
                <tr key={ws.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{i + 1}</td>
                  <td className="text-center px-3 py-3 border-l border-border">
                    <div className="flex justify-center">
                      {ws.logo_url ? (
                        <img src={ws.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 size={14} className="text-primary" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 border-l border-border font-semibold text-foreground">{ws.name || "-"}</td>
                  <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{ws.company_name || "-"}</td>
                  <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{ws.activity_type || "-"}</td>
                  <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{ws.country || "-"}</td>
                  <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{ws.city || "-"}</td>
                  <td className="text-center px-3 py-3 border-l border-border text-xs text-foreground">{ws.plan || "مجانية"}</td>
                  <td className="text-center px-3 py-3 border-l border-border">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${st.class}`}>{st.label}</span>
                  </td>
                  <td className="text-center px-3 py-3 text-xs text-muted-foreground">{formatDate(ws.created_date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlatformClientForm({ embeddedId, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!embeddedId;

  const [activeTab, setActiveTab] = useState("main");
  const [activeSection, setActiveSection] = useState("company");
  const [activeSubTab, setActiveSubTab] = useState("plans");
  const [form, setForm] = useState(emptyForm);

  const { data: clientData, isLoading } = useQuery({
    queryKey: ["platformClient", embeddedId],
    queryFn: () => base44.entities.PlatformClient.filter({ id: embeddedId }),
    enabled: !!embeddedId,
  });

  useEffect(() => {
    if (clientData && clientData.length > 0) {
      const c = clientData[0];
      setForm({
        ...emptyForm,
        ...c,
        owners: (c.owners && c.owners.length > 0) ? c.owners : [{ ...emptyOwner }],
        owner_data: { ...emptyForm.owner_data, ...(c.owner_data || {}) },
        location_data: { ...emptyForm.location_data, ...(c.location_data || {}) },
      });
    }
  }, [clientData]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        // عند التعديل: لا تغير join_date
        return base44.entities.PlatformClient.update(embeddedId, data);
      } else {
        // عند الإنشاء: أضف الوقت الحالي
        const now = new Date().toISOString();
        return base44.entities.PlatformClient.create({ ...data, join_date: now });
      }
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: isEdit ? "تم تحديث بيانات العميل" : "تم إضافة العميل بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["platformClients"] });
      onSaved?.();
      onClose?.();
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.PlatformClient.delete(embeddedId),
    onSuccess: () => {
      toast({ title: "تم الحذف" });
      onSaved?.();
      onClose?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const companyNameVal = typeof form.company_name === "object" ? (form.company_name.ar || Object.values(form.company_name)[0] || "") : form.company_name;
    if (!companyNameVal.trim()) { toast({ title: "خطأ", description: "اسم الشركة مطلوب", variant: "destructive" }); return; }
    if (!form.owner_name.trim()) { toast({ title: "خطأ", description: "اسم العميل مطلوب", variant: "destructive" }); return; }
    if (!form.email.trim()) { toast({ title: "خطأ", description: "البريد الإلكتروني مطلوب", variant: "destructive" }); return; }
    const validOwners = (form.owners || []).filter(o => o.name?.trim());
    if (validOwners.length === 0) { toast({ title: "خطأ", description: "يجب إضافة مالك واحد على الأقل مع تحديد اسمه", variant: "destructive" }); return; }
    const ownerWithMobile = (form.owners || []).find(o => o.name?.trim() && o.mobile?.trim());
    if (!ownerWithMobile) { toast({ title: "خطأ", description: "يجب إدخال رقم الجوال لمالك واحد على الأقل", variant: "destructive" }); return; }
    const ownerWithEmail = (form.owners || []).find(o => o.name?.trim() && o.email?.trim());
    if (!ownerWithEmail) { toast({ title: "خطأ", description: "يجب إدخال البريد الإلكتروني لمالك واحد على الأقل", variant: "destructive" }); return; }
    // تحويل company_name من object إلى string إذا كان object
    const dataToSave = {
      ...form,
      company_name: typeof form.company_name === "object"
        ? (form.company_name.ar || Object.values(form.company_name)[0] || "")
        : form.company_name,
    };
    saveMutation.mutate(dataToSave);
  };

  if (isLoading && isEdit) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {isEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">عملاء المنصة / {isEdit ? "تعديل" : "إضافة"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              <Trash2 size={15} />
              حذف
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Save size={15} />
            {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-border bg-secondary/40 flex-shrink-0">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-semibold transition-all border-b-2",
              activeTab === tab.id
                ? "bg-white text-primary border-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── تبويبة البيانات الرئيسية ── */}
        {activeTab === "main" && (
          <div className="flex h-full">
            {/* القائمة الجانبية */}
            <div className="w-56 flex-shrink-0 border-l border-border bg-secondary/20 p-3 space-y-1">
              {SIDE_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-right transition-all",
                      activeSection === sec.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-right">{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* محتوى القسم */}
            <div className="flex-1 p-6">
              {activeSection === "company" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بيانات الشركة / المؤسسة</h3>

                  {/* صف 1: نوع الكيان + اسم الشركة + الحالة + تاريخ الانضمام */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">نوع الكيان القانوني</label>
                      <EntityTypeSelect
                        value={form.activity_type || ""}
                        onChange={(val) => setForm((f) => ({ ...f, activity_type: val }))}
                      />
                    </div>
                    <MultiLangInput
                      label="اسم الشركة / المؤسسة *"
                      required
                      values={typeof form.company_name === "object" ? form.company_name : { ar: form.company_name || "" }}
                      onChange={(lang, val) => setForm((f) => ({
                        ...f,
                        company_name: typeof f.company_name === "object"
                          ? { ...f.company_name, [lang]: val }
                          : { ar: f.company_name || "", [lang]: val }
                      }))}
                      placeholder="أدخل اسم الشركة"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الحالة</label>
                      <SimpleSelect
                        value={form.status}
                        onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                        options={[
                          { value: "active", label: "نشط" },
                          { value: "suspended", label: "موقوف" },
                          { value: "cancelled", label: "ملغي" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ الانضمام</label>
                      <input type="text" value={clientData?.[0]?.created_date ? formatDate(clientData[0].created_date) : "-"}
                        readOnly className="w-full border border-border bg-muted rounded-lg px-3 py-2 text-sm text-right focus:outline-none cursor-default" />
                    </div>
                  </div>

                  {/* صف 2: الرقم الوطني + رقم السجل + تاريخ الإصدار + تاريخ الانتهاء */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الرقم الوطني الموحد</label>
                      <input type="text" value={form.unified_national_number || ""}
                        onChange={(e) => setForm((f) => ({ ...f, unified_national_number: e.target.value }))}
                        placeholder="أدخل الرقم الوطني الموحد"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">رقم السجل التجاري</label>
                      <input type="text" value={form.commercial_register_number || ""}
                        onChange={(e) => setForm((f) => ({ ...f, commercial_register_number: e.target.value }))}
                        placeholder="أدخل رقم السجل التجاري"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ إصدار السجل التجاري</label>
                      <DateInput value={form.commercial_register_issue_date || ""} onChange={(v) => setForm((f) => ({ ...f, commercial_register_issue_date: v }))} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ انتهاء السجل التجاري</label>
                      <DateInput value={form.commercial_register_expiry_date || ""} onChange={(v) => setForm((f) => ({ ...f, commercial_register_expiry_date: v }))} className="w-full" />
                    </div>
                  </div>

                  {/* صف 3: الرقم الضريبي + تاريخ نفاذ التسجيل الضريبي */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الرقم الضريبي</label>
                      <input type="text" value={form.tax_number || ""}
                        onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))}
                        placeholder="أدخل الرقم الضريبي"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ نفاذ التسجيل الضريبي</label>
                      <DateInput value={form.tax_registration_expiry_date || ""} onChange={(v) => setForm((f) => ({ ...f, tax_registration_expiry_date: v }))} className="w-full" />
                    </div>
                  </div>

                </div>
              )}

              {activeSection === "owner" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground border-b border-border pb-3">ملاك الشركة / المؤسسة</h3>

                  {/* رأس الأعمدة */}
                  <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground text-center">
                    <span className="w-6 flex-shrink-0"></span>
                    <span className="w-5 flex-shrink-0 text-center">#</span>
                    <span className="flex-1 min-w-0 text-center">اسم المالك</span>
                    <span className="flex-1 min-w-0 text-center">البريد الإلكتروني</span>
                    <span className="w-28 flex-shrink-0 text-center">رقم الجوال</span>
                    <span className="w-24 flex-shrink-0 text-center">الجنسية</span>
                    <span className="w-32 flex-shrink-0 text-center">نوع الهوية</span>
                    <span className="w-28 flex-shrink-0 text-center">رقم الهوية</span>
                    <span className="w-24 flex-shrink-0 text-center">مرفق الهوية</span>
                    <span className="w-28 flex-shrink-0 text-center">مدير في عقد التأسيس</span>
                    <span className="w-7 flex-shrink-0"></span>
                  </div>

                  {/* صفوف الملاك */}
                  <DragDropContext onDragEnd={(result) => {
                    if (!result.destination) return;
                    const items = Array.from(form.owners || []);
                    const [moved] = items.splice(result.source.index, 1);
                    items.splice(result.destination.index, 0, moved);
                    setForm((f) => ({ ...f, owners: items }));
                  }}>
                  <Droppable droppableId="owners-list">
                    {(provided) => (
                    <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                    {(form.owners || [{ ...emptyOwner }]).map((owner, idx) => (
                      <Draggable key={idx} draggableId={`owner-${idx}`} index={idx}>
                        {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2">
                        {/* مقبض السحب */}
                        <span {...dragProvided.dragHandleProps}>
                          <GripVertical size={14} className="text-muted-foreground flex-shrink-0 cursor-grab" />
                        </span>
                        {/* رقم */}
                        <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                        {/* اسم المالك */}
                        <input
                          type="text"
                          value={owner.name || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          placeholder="اسم المالك"
                          className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        />
                        {/* البريد الإلكتروني */}
                        <input
                          type="email"
                          value={owner.email || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], email: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          placeholder="البريد الإلكتروني"
                          dir="ltr"
                          className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        />
                        {/* رقم الجوال */}
                        <input
                          type="tel"
                          value={owner.mobile || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], mobile: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                          className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        />
                        {/* الجنسية */}
                        <input
                          type="text"
                          value={owner.nationality || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], nationality: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          placeholder="الجنسية"
                          className="w-24 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white text-center"
                        />
                        {/* نوع الهوية */}
                        <select
                          value={owner.identity_type || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], identity_type: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          dir="rtl"
                          className="w-32 flex-shrink-0 border border-border rounded-md px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        >
                          <option value="">نوع الهوية</option>
                          <option value="national_id">هوية وطنية</option>
                          <option value="passport">جواز سفر</option>
                          <option value="resident_id">إقامة</option>
                        </select>
                        {/* رقم الهوية */}
                        <input
                          type="text"
                          value={owner.identity_number || ""}
                          onChange={(e) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], identity_number: e.target.value };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          placeholder="رقم الهوية"
                          className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        />
                        {/* مرفق الهوية */}
                        <OwnerAttachmentBox
                          value={owner.identity_attachment || ""}
                          onChange={(url) => {
                            const updated = [...(form.owners || [])];
                            updated[idx] = { ...updated[idx], identity_attachment: url };
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                        />
                        {/* مدير في عقد التأسيس */}
                        <div className="w-28 flex-shrink-0 flex items-center justify-center">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <div
                              onClick={() => {
                                const updated = [...(form.owners || [])];
                                updated[idx] = { ...updated[idx], in_founding_contract: !owner.in_founding_contract };
                                setForm((f) => ({ ...f, owners: updated }));
                              }}
                              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${owner.in_founding_contract ? "bg-primary" : "bg-border"}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${owner.in_founding_contract ? "right-0.5" : "left-0.5"}`} />
                            </div>
                          </label>
                        </div>
                        {/* حذف */}
                        <button
                          type="button"
                          onClick={() => {
                            if ((form.owners || []).length === 1) return;
                            const updated = (form.owners || []).filter((_, i) => i !== idx);
                            setForm((f) => ({ ...f, owners: updated }));
                          }}
                          disabled={(form.owners || []).length === 1}
                          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    </div>
                    )}
                  </Droppable>
                  </DragDropContext>

                  {/* زر إضافة مالك */}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, owners: [...(f.owners || []), { ...emptyOwner }] }))}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={16} />
                    إضافة مالك
                  </button>
                </div>
              )}

              {activeSection === "attachments" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground border-b border-border pb-3">المستندات والمرفقات</h3>
                  <AttachmentsSection form={form} setForm={setForm} />
                </div>
              )}

              {activeSection === "location" && (
                <LocationSection form={form} setForm={setForm} />
              )}
            </div>
          </div>
        )}

        {/* ── تبويبة مساحات العمل ── */}
        {activeTab === "workspaces" && (
          <WorkspacesTab clientEmail={form.email} />
        )}

        {/* ── تبويبة الاشتراكات والفواتير ── */}
        {activeTab === "subscriptions" && (
          <div className="flex flex-col h-full">
            {/* Sub Tabs */}
            <div className="flex border-b border-border bg-secondary/20 flex-shrink-0">
              {SUB_TABS.map((sub) => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubTab(sub.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2",
                      activeSubTab === sub.id
                        ? "bg-white text-primary border-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60"
                    )}
                  >
                    <Icon size={15} />
                    {sub.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 p-6">
              {activeSubTab === "plans" && (
                <div className="p-8 bg-secondary/30 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">عرض للقراءة فقط — باقات العميل ستظهر هنا</p>
                </div>
              )}
              {activeSubTab === "apps" && (
                <div className="p-8 bg-secondary/30 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">عرض للقراءة فقط — تطبيقات العميل ستظهر هنا</p>
                </div>
              )}
              {activeSubTab === "invoices" && (
                <div className="p-8 bg-secondary/30 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">عرض للقراءة فقط — فواتير العميل ستظهر هنا</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}