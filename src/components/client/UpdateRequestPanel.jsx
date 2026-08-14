import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Send, Building2, User, FileText, MapPin, Upload, ZoomIn, Download, Plus, GripVertical, X, Loader2, Maximize2, Trash2 } from "lucide-react";
import DateInput from "@/components/ui/DateInput";
import LocationSection from "@/components/client/LocationSection";
import EntityTypeSelect from "@/components/ui/EntityTypeSelect";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

const SIDE_SECTIONS = [
  { id: "company", label: "بيانات الشركة / المؤسسة", icon: Building2 },
  { id: "owner", label: "بيانات المالك / الملاك", icon: User },
  { id: "attachments", label: "المستندات والمرفقات", icon: FileText },
  { id: "location", label: "الموقع والعنوان", icon: MapPin },
];

const emptyOwner = {
  name: "", email: "", mobile: "", nationality: "",
  identity_type: "", identity_number: "", in_founding_contract: false,
};

const getCompanyName = (val) => {
  if (!val) return "";
  if (typeof val === "object") return val.ar || Object.values(val)[0] || "";
  return val;
};

// مكون مرفق المالك
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
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
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

// قسم المرفقات
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

  const extraAttachments = form.extra_attachments || [];

  const handleUploadExtra = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ url: res.file_url, name: file.name, size: file.size, type: file.type });
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
      const metaKey = key + "_meta";
      setForm((f) => ({ ...f, [key]: res.file_url, [metaKey]: { name: file.name, size: file.size, type: file.type } }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const removeExtra = (idx) => setForm((f) => ({ ...f, extra_attachments: (f.extra_attachments || []).filter((_, i) => i !== idx) }));

  const formatSize = (size) => {
    if (!size) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExt = (name, type) => {
    if (name) { const parts = name.split("."); if (parts.length > 1) return parts[parts.length - 1].toUpperCase(); }
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

  const isImage = (url, type) => type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url || "");
  const isPdf = (url, type) => type?.includes("pdf") || /\.pdf(\?.*)?$/i.test(url || "");

  const allRows = [
    ...ATTACHMENT_FIELDS.map((f) => ({ label: f.label, url: form[f.key] || "", key: f.key, meta: form[f.key + "_meta"] || {}, isFixed: true })),
    ...extraAttachments.map((a, idx) => ({ label: a.name, url: a.url, name: a.name, size: a.size, type: a.type, isFixed: false, extraIdx: idx })),
  ];

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "جاري الرفع..." : "إضافة مرفق"}
        </button>
        <input ref={inputRef} type="file" multiple accept="*/*" className="hidden" onChange={(e) => handleUploadExtra(e.target.files)} />
      </div>

      <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-white">
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

        {allRows.map((row, i) => {
          const meta = row.isFixed ? row.meta : {};
          const name = row.isFixed ? (meta.name || row.label) : row.name;
          const size = row.isFixed ? meta.size : row.size;
          const type = row.isFixed ? meta.type : row.type;
          const url = row.url;
          const hasFile = !!url;

          return (
            <div key={i} className={`flex items-stretch ${i > 0 ? "border-t border-gray-300" : ""}`} style={hasFile ? { backgroundColor: "#dcfce7" } : {}}>
              <div className="w-[45px] flex-shrink-0 flex items-center justify-center py-3 border-l border-gray-300" style={hasFile ? { backgroundColor: "#dcfce7" } : { backgroundColor: "#f9fafb" }}>
                <span className="text-sm text-gray-500 font-medium">{i + 1}</span>
              </div>
              <div className="flex-1 flex items-center px-3 py-3 border-l border-gray-300">
                <span className="text-sm text-foreground truncate">{name || row.label}</span>
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
                {row.isFixed ? (
                  <label className="cursor-pointer flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary">
                    <Upload size={15} />
                    <input type="file" accept="*/*" className="hidden" onChange={(e) => handleUploadFixed(e.target.files?.[0], row.key)} />
                  </label>
                ) : (
                  <span className="text-muted-foreground opacity-30"><Upload size={15} /></span>
                )}
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <button type="button" disabled={!hasFile} onClick={() => setPreview(url)}
                  className="flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary disabled:opacity-30">
                  <Maximize2 size={15} />
                </button>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <a href={url || "#"} download target="_blank" rel="noreferrer"
                  className={`flex items-center justify-center w-full h-full hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary ${!hasFile ? "pointer-events-none opacity-30" : ""}`}>
                  <Download size={15} />
                </a>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
                {hasFile || !row.isFixed ? (
                  <button type="button"
                    onClick={() => {
                      if (!confirm("هل أنت متأكد من الحذف؟")) return;
                      if (row.isFixed) {
                        setForm((f) => ({ ...f, [row.key]: "", [row.key + "_meta"]: {} }));
                      } else {
                        removeExtra(row.extraIdx);
                      }
                    }}
                    className="flex items-center justify-center w-full h-full hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 size={15} />
                  </button>
                ) : <span className="opacity-0 w-7 h-7" />}
              </div>
            </div>
          );
        })}
      </div>

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
                <a href={preview} download className="text-primary underline text-sm">تنزيل الملف</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpdateRequestPanel({ client, user, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("company");

  const [formData, setFormData] = useState({
    company_name: getCompanyName(client?.company_name) || "",
    activity_type: client?.activity_type || "",
    unified_national_number: client?.unified_national_number || "",
    commercial_register_number: client?.commercial_register_number || "",
    commercial_register_issue_date: client?.commercial_register_issue_date || "",
    commercial_register_expiry_date: client?.commercial_register_expiry_date || "",
    tax_number: client?.tax_number || "",
    tax_registration_expiry_date: client?.tax_registration_expiry_date || "",
    commercial_register_attachment: client?.commercial_register_attachment || "",
    founding_contract_attachment: client?.founding_contract_attachment || "",
    tax_certificate_attachment: client?.tax_certificate_attachment || "",
    national_address_attachment: client?.national_address_attachment || "",
    extra_attachments: client?.extra_attachments || [],
    owners: (client?.owners && client.owners.length > 0) ? client.owners : [{ ...emptyOwner }],
    location_data: {
      lat: client?.location_data?.lat || null,
      lng: client?.location_data?.lng || null,
      national_address_code: client?.location_data?.national_address_code || "",
      country: client?.location_data?.country || "",
      region: client?.location_data?.region || "",
      city: client?.location_data?.city || "",
      governorate: client?.location_data?.governorate || "",
      neighborhood: client?.location_data?.neighborhood || "",
      street: client?.location_data?.street || "",
      address_description: client?.location_data?.address_description || "",
    },
  });

  const setForm = setFormData;

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!client?.id) throw new Error(`لم يتم العثور على بيانات الشركة (client_id مفقود). يرجى التأكد من إكمال نموذج الـ Onboarding أولاً`);
      const count = await base44.entities.ClientUpdateRequest.list();
      const reqNumber = `UPD-${String((count?.length || 0) + 1).padStart(5, "0")}`;
      const oldData = {
        company_name: getCompanyName(client?.company_name),
        activity_type: client?.activity_type,
        unified_national_number: client?.unified_national_number,
        commercial_register_number: client?.commercial_register_number,
        commercial_register_issue_date: client?.commercial_register_issue_date,
        commercial_register_expiry_date: client?.commercial_register_expiry_date,
        tax_number: client?.tax_number,
        tax_registration_expiry_date: client?.tax_registration_expiry_date,
        owners: client?.owners,
        location_data: client?.location_data,
      };
      return base44.entities.ClientUpdateRequest.create({
        request_number: reqNumber,
        client_id: client.id,
        client_email: user?.email,
        client_name: client?.owner_name || user?.full_name,
        old_data: oldData,
        new_data: data,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientUpdateRequests", user?.email] });
      toast({ title: "تم إرسال طلب التعديل بنجاح", description: "سيتم مراجعة طلبك من قبل الإدارة" });
      onSaved?.();
      onClose?.();
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const inputCls = "w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40";
  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 text-right";

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">طلب تعديل بيانات الشركة</h2>
          <p className="text-xs text-muted-foreground mt-0.5">أدخل البيانات الجديدة وأرسل الطلب للمراجعة</p>
        </div>
        <button
          onClick={() => mutation.mutate(formData)}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          <Send size={15} />
          {mutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
        </button>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6">

          {/* بيانات الشركة */}
          {activeSection === "company" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بيانات الشركة / المؤسسة</h3>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>نوع الكيان القانوني</label>
                  <EntityTypeSelect
                    value={formData.activity_type || ""}
                    onChange={(val) => setFormData((f) => ({ ...f, activity_type: val }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>اسم الشركة / المؤسسة</label>
                  <input className={inputCls} value={formData.company_name} onChange={e => setFormData(f => ({ ...f, company_name: e.target.value }))} placeholder="أدخل اسم الشركة" />
                </div>
                <div>
                  <label className={labelCls}>الحالة</label>
                  <input
                    className={inputCls + " bg-secondary/40 text-muted-foreground cursor-not-allowed"}
                    value={client?.status === "active" ? "نشط" : client?.status === "suspended" ? "موقوف" : client?.status === "cancelled" ? "ملغى" : (client?.status || "-")}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className={labelCls}>تاريخ الانضمام</label>
                  <input
                    className={inputCls + " bg-secondary/40 text-muted-foreground cursor-not-allowed"}
                    value={client?.join_date ? new Date(client.join_date).toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" }) : (client?.created_date ? new Date(client.created_date).toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-")}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>الرقم الوطني الموحد</label>
                  <input className={inputCls} value={formData.unified_national_number} onChange={e => setFormData(f => ({ ...f, unified_national_number: e.target.value }))} placeholder="أدخل الرقم الوطني الموحد" />
                </div>
                <div>
                  <label className={labelCls}>رقم السجل التجاري</label>
                  <input className={inputCls} value={formData.commercial_register_number} onChange={e => setFormData(f => ({ ...f, commercial_register_number: e.target.value }))} placeholder="أدخل رقم السجل التجاري" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ إصدار السجل التجاري</label>
                  <DateInput value={formData.commercial_register_issue_date} onChange={v => setFormData(f => ({ ...f, commercial_register_issue_date: v }))} className="w-full" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ انتهاء السجل التجاري</label>
                  <DateInput value={formData.commercial_register_expiry_date} onChange={v => setFormData(f => ({ ...f, commercial_register_expiry_date: v }))} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>الرقم الضريبي</label>
                  <input className={inputCls} value={formData.tax_number} onChange={e => setFormData(f => ({ ...f, tax_number: e.target.value }))} placeholder="أدخل الرقم الضريبي" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ نفاذ التسجيل الضريبي</label>
                  <DateInput value={formData.tax_registration_expiry_date} onChange={v => setFormData(f => ({ ...f, tax_registration_expiry_date: v }))} className="w-full" />
                </div>
              </div>
            </div>
          )}

          {/* بيانات الملاك */}
          {activeSection === "owner" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">ملاك الشركة / المؤسسة</h3>

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

              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const items = Array.from(formData.owners || []);
                const [moved] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, moved);
                setFormData((f) => ({ ...f, owners: items }));
              }}>
                <Droppable droppableId="owners-list-req">
                  {(provided) => (
                    <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                      {(formData.owners || [{ ...emptyOwner }]).map((owner, idx) => (
                        <Draggable key={idx} draggableId={`owner-req-${idx}`} index={idx}>
                          {(dragProvided) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2">
                              <span {...dragProvided.dragHandleProps}>
                                <GripVertical size={14} className="text-muted-foreground flex-shrink-0 cursor-grab" />
                              </span>
                              <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                              <input type="text" value={owner.name || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], name: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} placeholder="اسم المالك" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                              <input type="email" value={owner.email || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], email: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} placeholder="البريد الإلكتروني" dir="ltr" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                              <input type="tel" value={owner.mobile || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], mobile: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} placeholder="05XXXXXXXX" dir="ltr" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                              <input type="text" value={owner.nationality || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], nationality: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} placeholder="الجنسية" className="w-24 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                              <select value={owner.identity_type || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], identity_type: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} dir="rtl" className="w-32 flex-shrink-0 border border-border rounded-md px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white">
                                <option value="">نوع الهوية</option>
                                <option value="national_id">هوية وطنية</option>
                                <option value="passport">جواز سفر</option>
                                <option value="resident_id">إقامة</option>
                              </select>
                              <input type="text" value={owner.identity_number || ""} onChange={(e) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], identity_number: e.target.value }; setFormData((f) => ({ ...f, owners: u })); }} placeholder="رقم الهوية" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                              <OwnerAttachmentBox value={owner.identity_attachment || ""} onChange={(url) => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], identity_attachment: url }; setFormData((f) => ({ ...f, owners: u })); }} />
                              <div className="w-28 flex-shrink-0 flex items-center justify-center">
                                <div onClick={() => { const u = [...(formData.owners || [])]; u[idx] = { ...u[idx], in_founding_contract: !owner.in_founding_contract }; setFormData((f) => ({ ...f, owners: u })); }} className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${owner.in_founding_contract ? "bg-primary" : "bg-border"}`}>
                                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${owner.in_founding_contract ? "right-0.5" : "left-0.5"}`} />
                                </div>
                              </div>
                              <button type="button" onClick={() => { if ((formData.owners || []).length === 1) return; setFormData((f) => ({ ...f, owners: (f.owners || []).filter((_, i) => i !== idx) })); }} disabled={(formData.owners || []).length === 1} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
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

              <button type="button" onClick={() => setFormData((f) => ({ ...f, owners: [...(f.owners || []), { ...emptyOwner }] }))}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                <Plus size={16} />
                إضافة مالك
              </button>
            </div>
          )}

          {/* المرفقات */}
          {activeSection === "attachments" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">المستندات والمرفقات</h3>
              <AttachmentsSection form={formData} setForm={setForm} />
            </div>
          )}

          {/* الموقع والعنوان */}
          {activeSection === "location" && (
            <LocationSection form={formData} setForm={setForm} />
          )}
        </div>
      </div>
    </div>
  );
}