import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import {
  ArrowRight, Save, Upload, Trash2, ZoomIn, Download, Building2, User,
  MapPin, Plus, GripVertical, X, Loader2, FileText, Maximize2, Copy,
  Settings, Phone, Calendar, Clock, ClipboardPaste
} from "lucide-react";
import SearchableSelect from "@/components/client/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import EntityTypeSelect from "@/components/ui/EntityTypeSelect";
import { motion } from "framer-motion";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import IconPickerPopover from "@/components/superadmin/IconPickerPopover";
import LocationSection from "@/components/client/LocationSection";

const NATIONALITY_OPTIONS = [
  { value: "SA", label: "سعودية" }, { value: "AE", label: "إماراتية" },
  { value: "KW", label: "كويتية" }, { value: "QA", label: "قطرية" },
  { value: "EG", label: "مصرية" }, { value: "JO", label: "أردنية" },
  { value: "SY", label: "سورية" }, { value: "YE", label: "يمنية" },
  { value: "LB", label: "لبنانية" }, { value: "other", label: "أخرى" },
];
const IDENTITY_TYPE_OPTIONS = [
  { value: "national_id", label: "هوية وطنية" },
  { value: "resident_id", label: "إقامة" },
  { value: "passport", label: "جواز سفر" },
];

const SECTIONS = [
  { id: "company", label: "بيانات الشركة / المؤسسة", icon: Building2 },
  { id: "owners", label: "بيانات الملاك", icon: User },
  { id: "attachments", label: "المستندات والمرفقات", icon: FileText },
  { id: "location", label: "الموقع والعنوان", icon: MapPin },
  { id: "brand", label: "إعدادات العلامة التجارية", icon: Building2 },
  { id: "system", label: "إعدادات النظام", icon: Settings },
  { id: "contact", label: "إعدادات التواصل", icon: Phone },
];

const contactTypes = [
  { value: "email", label: "البريد الإلكتروني", placeholder: "info@example.com" },
  { value: "unified_number", label: "الرقم الموحد", placeholder: "920XXXXXXX" },
  { value: "phone", label: "رقم الهاتف", placeholder: "+966XXXXXXXXX" },
  { value: "mobile", label: "رقم الجوال", placeholder: "+9665XXXXXXXX" },
  { value: "fax", label: "الفاكس", placeholder: "+966XXXXXXXXX" },
  { value: "other", label: "أخرى", placeholder: "أدخل القيمة" },
];

const socialPlatforms = [
  { value: "twitter", label: "تويتر / X" }, { value: "instagram", label: "إنستغرام" },
  { value: "facebook", label: "فيسبوك" }, { value: "linkedin", label: "لينكدإن" },
  { value: "youtube", label: "يوتيوب" }, { value: "tiktok", label: "تيك توك" },
  { value: "snapchat", label: "سناب شات" }, { value: "whatsapp", label: "واتساب" },
  { value: "telegram", label: "تيليغرام" }, { value: "threads", label: "ثريدز" },
  { value: "pinterest", label: "بينتيريست" }, { value: "reddit", label: "ريديت" },
  { value: "discord", label: "ديسكورد" }, { value: "behance", label: "بيهانس" },
  { value: "dribbble", label: "دريبل" }, { value: "github", label: "جيت هاب" },
  { value: "vimeo", label: "فيميو" }, { value: "twitch", label: "تويتش" },
  { value: "medium", label: "ميديوم" }, { value: "soundcloud", label: "ساوند كلاود" },
  { value: "spotify", label: "سبوتيفاي" }, { value: "other", label: "أخرى" },
];

function ColorInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="flex items-center gap-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
        <div className="flex-1 relative border border-border rounded-md bg-background">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            className="bg-white pt-2 pr-1 pb-2 pl-12 text-xs font-mono text-right rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <div className="absolute left-0 top-0 bottom-0 flex items-center gap-0.5 px-1">
            <button type="button" onClick={() => navigator.clipboard.writeText(value)}
              className="bg-slate-200 text-primary p-1 rounded hover:bg-primary/10 transition-colors" title="نسخ">
              <Copy size={14} />
            </button>
            <button type="button" onClick={async () => { const t = await navigator.clipboard.readText().catch(() => ''); if (/^#[0-9A-F]{6}$/i.test(t)) onChange(t); }}
              className="bg-slate-200 text-primary p-1 rounded hover:bg-primary/10 transition-colors" title="لصق">
              <ClipboardPaste size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoUploadSimple({ label, value, onChange, darkBg = false }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (file) => {
    setUploading(true);
    try { const res = await base44.integrations.Core.UploadFile({ file }); if (res?.file_url) onChange(res.file_url); } catch {}
    setUploading(false);
  };
  const hasValue = value && typeof value === 'string' && value.startsWith('http');
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {hasValue ? (
        <div className={`relative w-full h-16 rounded-md border border-border overflow-hidden mb-1 ${darkBg ? "bg-slate-900" : "bg-secondary/30"}`}>
          <img src={value} alt={label} className="w-full h-full object-contain p-1" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90"><X size={12} /></button>
        </div>
      ) : (
        <div className={`w-full h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center mb-1 ${darkBg ? "bg-slate-900" : "bg-secondary/20"}`}>
          <span className="text-[10px] text-muted-foreground">لا يوجد شعار</span>
        </div>
      )}
      <label className={`flex items-center justify-center gap-1 px-2 py-1.5 border rounded-md cursor-pointer transition-colors font-medium text-xs ${uploading ? "opacity-60 cursor-not-allowed border-border bg-muted" : "border-primary bg-primary/5 text-primary hover:bg-primary/10"}`}>
        <Upload size={11} /> {uploading ? "جارٍ الرفع..." : "رفع"}
        <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} className="hidden" />
      </label>
    </div>
  );
}

const emptyOwner = {
  name: "", email: "", mobile: "", nationality: "",
  identity_type: "", identity_number: "", identity_attachment: "", in_founding_contract: false,
};

const emptyForm = {
  name: "", slug: "", owner_user_id: "", owner_email: "", logo_url: "",
  status: "trial", plan: "free", currency: "SAR", timezone: "Asia/Riyadh", language: "ar",
  footer_text: "",
  owners: [{ ...emptyOwner }],
  company_name: "", activity_type: "",
  unified_national_number: "", commercial_register_number: "",
  commercial_register_issue_date: "", commercial_register_expiry_date: "",
  tax_number: "", tax_registration_expiry_date: "",
  commercial_register_attachment: "", founding_contract_attachment: "",
  tax_certificate_attachment: "", national_address_attachment: "", extra_attachments: [],
  location_data: {
    national_address_code: "", country: "SA", region: "", city: "",
    governorate: "", neighborhood: "", street: "", address_description: "",
  },
};

// ─── مربع رفع الهوية لكل مالك ─────────────────────────────
function OwnerAttachmentBox({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
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
        <button type="button" onClick={() => inputRef.current?.click()} title="رفع مرفق الهوية"
          className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary relative">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {value && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button type="button" disabled={!value} onClick={() => value && setPreview(value)} title="عرض"
          className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary disabled:opacity-30">
          <ZoomIn size={12} />
        </button>
        <a href={value || "#"} download target="_blank" rel="noreferrer" title="تنزيل"
          className={`flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-primary ${!value ? "pointer-events-none opacity-30" : ""}`}>
          <Download size={12} />
        </a>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <img src={preview} alt="" className="max-w-3xl max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── قسم المرفقات (جدول) ──────────────────────────────────
function AttachmentsSection({ form, setForm }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const FIXED_FIELDS = [
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
      setForm(f => ({ ...f, extra_attachments: [...(f.extra_attachments || []), ...uploaded] }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const handleUploadFixed = async (file, key) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, [key]: res.file_url, [key + "_meta"]: { name: file.name, size: file.size, type: file.type } }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const removeExtra = (idx) => setForm(f => ({ ...f, extra_attachments: (f.extra_attachments || []).filter((_, i) => i !== idx) }));

  const formatSize = (size) => {
    if (!size) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  const getExt = (name, type) => {
    if (name) { const p = name.split("."); if (p.length > 1) return p[p.length - 1].toUpperCase(); }
    if (type) return type.split("/")[1]?.toUpperCase() || "-";
    return "-";
  };
  const getTypeLabel = (type, name) => {
    if (!type && name) { const ext = name.split(".").pop()?.toLowerCase(); if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "صورة"; if (ext === "pdf") return "PDF"; return "ملف"; }
    if (type?.startsWith("image/")) return "صورة";
    if (type?.includes("pdf")) return "PDF";
    return "ملف";
  };
  const isImage = (url, type) => type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url || "");
  const isPdf = (url, type) => type?.includes("pdf") || /\.pdf(\?.*)?$/i.test(url || "");

  const allRows = [
    ...FIXED_FIELDS.map(f => ({ label: f.label, url: form[f.key] || "", key: f.key, meta: form[f.key + "_meta"] || {}, isFixed: true })),
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
                {(hasFile || !row.isFixed) ? (
                  <button type="button"
                    onClick={() => {
                      if (!confirm("هل أنت متأكد من الحذف؟")) return;
                      if (row.isFixed) setForm(f => ({ ...f, [row.key]: "", [row.key + "_meta"]: {} }));
                      else removeExtra(row.extraIdx);
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

export default function WorkspaceForm({ embeddedId, user, ownerEmail, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceCtx = useWorkspace();
  const { refreshWorkspaces } = workspaceCtx || {};
  const isEdit = !!embeddedId;
  const [form, setForm] = useState(emptyForm);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState("company");
  const skipNextFetchRef = useRef(false);

  // Brand/System/Contact state
  const [brandData, setBrandData] = useState({
    lightLogo: null, darkLogo: null, favicon: null, loadingIcon: null, footerLogo: null,
    brandName: "", footerText: "",
    primaryColor: "#6566c1", buttonColor: "#245EFF",
    tabsActiveColor: "#245EFF", tabsInactiveColor: "#fbed24",
    tableHeaderBgColor: "#E8EDFA", tableHeaderTextColor: "#1F1F1F"
  });
  const [systemData, setSystemData] = useState({
    dateFormat: "YYYY/MM/DD", timeFormat: "HH:mm:ss A",
    dateTimeFormat: "YYYY/MM/DD - HH:mm:ss A", timezone: "Asia/Riyadh"
  });
  const [contactData, setContactData] = useState({ contact_items: [], social_links: [] });

  useEffect(() => {
    if (skipNextFetchRef.current) { skipNextFetchRef.current = false; return; }
    if (isEdit) {
      // جلب البيانات مباشرة من API (تجاوز الكاش)
      base44.entities.Workspace.filter({ id: embeddedId }).then(results => {
        if (results?.[0]) {
          const ws = results[0];
          const owners = ws.owners?.length > 0 ? ws.owners : [];
          const location_data = ws.location_data || emptyForm.location_data;
          setForm({ ...emptyForm, ...ws, owners, location_data, extra_attachments: ws.extra_attachments || [] });
          setLogoPreview(ws.logo_url || null);
        }
      });
    } else {
      setForm(prev => ({ ...prev, owner_email: ownerEmail || user?.email || "", owners: [{ ...emptyOwner }] }));
    }
  }, [embeddedId]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setLocation = (field, value) => setForm(prev => ({ ...prev, location_data: { ...(prev.location_data || {}), [field]: value } }));

  // Contact helpers (مطابقة WorkspaceSettings)
  const addContactItem = () => setContactData(p => ({ ...p, contact_items: [...p.contact_items, { type: "email", value: "", icon: "" }] }));
  const removeContactItem = (i) => setContactData(p => ({ ...p, contact_items: p.contact_items.filter((_, idx) => idx !== i) }));
  const updateContactItem = (i, field, val) => setContactData(p => ({ ...p, contact_items: p.contact_items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));
  const handleContactDrag = (result) => {
    if (!result.destination) return;
    const items = Array.from(contactData.contact_items);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setContactData(p => ({ ...p, contact_items: items }));
  };
  const addSocialLink = () => setContactData(p => ({ ...p, social_links: [...p.social_links, { platform: "twitter", url: "", icon: "" }] }));
  const removeSocialLink = (i) => setContactData(p => ({ ...p, social_links: p.social_links.filter((_, idx) => idx !== i) }));
  const updateSocialLink = (i, field, val) => setContactData(p => ({ ...p, social_links: p.social_links.map((link, idx) => idx === i ? { ...link, [field]: val } : link) }));
  const handleSocialDrag = (result) => {
    if (!result.destination) return;
    const items = Array.from(contactData.social_links);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setContactData(p => ({ ...p, social_links: items }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) return await base44.entities.Workspace.update(embeddedId, data);
      return await base44.entities.Workspace.create(data);
    },
    onSuccess: async (savedRecord, sentData) => {
      toast({ title: "تم الحفظ", description: isEdit ? "تم تحديث مساحة العمل" : "تم إنشاء مساحة العمل" });
      // تحديث form state بالبيانات المحفوظة مباشرةً (لا نعتمد على API)
      if (isEdit) {
        // منع useEffect من إعادة تهيئة الـ form عند استدعاء refreshWorkspaces
        skipNextFetchRef.current = true;
        const owners = sentData.owners?.length > 0 ? sentData.owners : [];
        const location_data = sentData.location_data || emptyForm.location_data;
        setForm({ ...emptyForm, ...sentData, owners, location_data, extra_attachments: sentData.extra_attachments || [] });
        if (sentData.logo_url) setLogoPreview(sentData.logo_url);
      }
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      // لا نستدعي refreshWorkspaces عند التعديل لتجنب إعادة تحميل الـ form
      if (!isEdit) refreshWorkspaces?.();
      onSaved?.();
      if (!isEdit) setTimeout(() => onClose?.(), 300);
    },
    onError: (err) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!form.name?.trim()) {
      toast({ title: "خطأ", description: "اسم مساحة العمل مطلوب", variant: "destructive" });
      return;
    }
    const isSuperAdmin = user?.role === 'super_admin';
    const nextNumber = workspaceCtx?.getNextWorkspaceNumber?.() || (isSuperAdmin ? 2 : 100000001);
    const payload = {
      ...form,
      slug: form.name.toLowerCase().replace(/\s+/g, "-"),
      owner_user_id: user?.id || "",
      owner_email: user?.email || ownerEmail || "",
      ...(!isEdit && {
        workspace_number: nextNumber,
        workspace_owner_type: isSuperAdmin ? 'super_admin' : 'client',
        is_admin_workspace: false,
        is_protected: false,
      }),
    };
    saveMutation.mutate(payload);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result);
    reader.readAsDataURL(file);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) set("logo_url", res.file_url);
    } catch (err) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background";
  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 text-right";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full" dir="rtl">
      <DialogTitle className="sr-only">{isEdit ? "تعديل مساحة العمل" : "إنشاء مساحة عمل جديدة"}</DialogTitle>
      <DialogDescription className="sr-only">نموذج بيانات مساحة العمل</DialogDescription>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 bg-card">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {isEdit ? (form.name || "تعديل مساحة العمل") : "إنشاء مساحة عمل جديدة"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{isEdit ? "تعديل بيانات مساحة العمل" : "أدخل جميع البيانات المطلوبة"}</p>
        </div>
        <button onClick={handleSubmit} disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
          <Save size={15} />
          {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-l border-border bg-secondary/20 p-3 space-y-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-right transition-all",
                  activeSection === sec.id ? "bg-primary/10 text-primary border border-primary/20" : "text-foreground hover:bg-secondary/60"
                )}>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1 text-right">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ════ بيانات الشركة ════ */}
          {activeSection === "company" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بيانات الشركة / المؤسسة</h3>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>نوع الكيان</label>
                  <EntityTypeSelect value={form.activity_type || ""} onChange={(v) => set("activity_type", v)} />
                </div>
                <div>
                  <label className={labelCls}>اسم مساحة العمل *</label>
                  <div className="flex gap-1 items-center">
                    <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="اسم مساحة العمل" />
                    <button type="button" disabled={!form.name?.trim()} onClick={() => navigator.clipboard.writeText(form.name || "")}
                      title="نسخ اسم مساحة العمل"
                      className="flex-shrink-0 p-2 bg-secondary text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-40 transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>اسم الشركة / المؤسسة</label>
                  <div className="flex gap-1 items-center">
                    <input className={inputCls} value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="اسم الشركة" />
                    <button type="button" disabled={!form.company_name?.trim()} onClick={() => navigator.clipboard.writeText(form.company_name || "")}
                      title="نسخ اسم الشركة"
                      className="flex-shrink-0 p-2 bg-secondary text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-40 transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>نص التذييل</label>
                  <input className={inputCls} value={form.footer_text} onChange={e => set("footer_text", e.target.value)} placeholder="أدخل نص التذييل" />
                </div>
                {isEdit && (
                  <div>
                    <label className={labelCls}>الحالة</label>
                    <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls} dir="rtl">
                      <option value="trial">تجريبي</option>
                      <option value="active">نشط</option>
                      <option value="suspended">موقوف</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>الرقم الوطني الموحد</label>
                  <input className={inputCls} value={form.unified_national_number} onChange={e => set("unified_national_number", e.target.value)} placeholder="الرقم الوطني الموحد" dir="ltr" />
                </div>
                <div>
                  <label className={labelCls}>رقم السجل التجاري</label>
                  <input className={inputCls} value={form.commercial_register_number} onChange={e => set("commercial_register_number", e.target.value)} placeholder="رقم السجل التجاري" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ إصدار السجل التجاري</label>
                  <DateInput value={form.commercial_register_issue_date} onChange={v => set("commercial_register_issue_date", v)} className="w-full" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ انتهاء السجل التجاري</label>
                  <DateInput value={form.commercial_register_expiry_date} onChange={v => set("commercial_register_expiry_date", v)} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>الرقم الضريبي</label>
                  <input className={inputCls} value={form.tax_number} onChange={e => set("tax_number", e.target.value)} placeholder="الرقم الضريبي" />
                </div>
                <div>
                  <label className={labelCls}>تاريخ نفاذ التسجيل الضريبي</label>
                  <DateInput value={form.tax_registration_expiry_date} onChange={v => set("tax_registration_expiry_date", v)} className="w-full" />
                </div>
              </div>


            </div>
          )}

          {/* ════ بيانات الملاك ════ */}
          {activeSection === "owners" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">ملاك الشركة / المؤسسة</h3>

              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground text-center">
                <span className="w-6 flex-shrink-0"></span>
                <span className="w-5 flex-shrink-0 text-center">#</span>
                <span className="flex-1 min-w-0 text-center">الاسم</span>
                <span className="flex-1 min-w-0 text-center">البريد الإلكتروني</span>
                <span className="w-28 flex-shrink-0 text-center">الجوال</span>
                <span className="w-24 flex-shrink-0 text-center">الجنسية</span>
                <span className="w-32 flex-shrink-0 text-center">نوع الهوية</span>
                <span className="w-28 flex-shrink-0 text-center">رقم الهوية</span>
                <span className="w-24 flex-shrink-0 text-center">مرفق الهوية</span>
                <span className="w-28 flex-shrink-0 text-center">مدير في عقد التأسيس</span>
                <span className="w-7 flex-shrink-0"></span>
              </div>

              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const items = Array.from(form.owners || []);
                const [moved] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, moved);
                set("owners", items);
              }}>
                <Droppable droppableId="owners-ws-form">
                  {(provided) => (
                    <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                      {(form.owners || [emptyOwner]).map((owner, idx) => (
                        <Draggable key={idx} draggableId={`owner-ws-${idx}`} index={idx}>
                          {(dp) => (
                            <div ref={dp.innerRef} {...dp.draggableProps} className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2">
                              <span {...dp.dragHandleProps}><GripVertical size={14} className="text-muted-foreground cursor-grab" /></span>
                              <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                              <input type="text" value={owner.name || ""} onChange={e => { const u = [...(form.owners||[])]; u[idx]={...u[idx],name:e.target.value}; set("owners",u); }} placeholder="الاسم" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <input type="email" value={owner.email || ""} onChange={e => { const u=[...(form.owners||[])]; u[idx]={...u[idx],email:e.target.value}; set("owners",u); }} placeholder="البريد الإلكتروني" dir="ltr" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <input type="tel" value={owner.mobile || ""} onChange={e => { const u=[...(form.owners||[])]; u[idx]={...u[idx],mobile:e.target.value}; set("owners",u); }} placeholder="05XXXXXXXX" dir="ltr" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <SearchableSelect value={owner.nationality||""} onChange={v=>{const u=[...(form.owners||[])];u[idx]={...u[idx],nationality:v};set("owners",u);}} options={NATIONALITY_OPTIONS} placeholder="الجنسية" className="w-24 flex-shrink-0" />
                              <SearchableSelect value={owner.identity_type||""} onChange={v=>{const u=[...(form.owners||[])];u[idx]={...u[idx],identity_type:v};set("owners",u);}} options={IDENTITY_TYPE_OPTIONS} placeholder="نوع الهوية" className="w-32 flex-shrink-0" />
                              <input type="text" value={owner.identity_number || ""} onChange={e=>{const u=[...(form.owners||[])];u[idx]={...u[idx],identity_number:e.target.value};set("owners",u);}} placeholder="رقم الهوية" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" dir="ltr" />
                              <OwnerAttachmentBox value={owner.identity_attachment||""} onChange={url=>{const u=[...(form.owners||[])];u[idx]={...u[idx],identity_attachment:url};set("owners",u);}} />
                              <div className="w-28 flex-shrink-0 flex items-center justify-center">
                                <div onClick={()=>{const u=[...(form.owners||[])];u[idx]={...u[idx],in_founding_contract:!owner.in_founding_contract};set("owners",u);}} className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${owner.in_founding_contract?"bg-primary":"bg-border"}`}>
                                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${owner.in_founding_contract?"right-0.5":"left-0.5"}`} />
                                </div>
                              </div>
                              <button type="button" onClick={()=>{if((form.owners||[]).length===1)return;set("owners",(form.owners||[]).filter((_,i)=>i!==idx));}} disabled={(form.owners||[]).length===1} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-30 transition-colors">
                                <X size={14} />
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

              <button type="button" onClick={() => set("owners", [...(form.owners||[]), {...emptyOwner}])}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                <Plus size={16} /> إضافة مالك
              </button>
            </div>
          )}

          {/* ════ المرفقات ════ */}
          {activeSection === "attachments" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">المستندات والمرفقات</h3>
              <AttachmentsSection form={form} setForm={setForm} />
            </div>
          )}

          {/* ════ الموقع والعنوان ════ */}
          {activeSection === "location" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">الموقع والعنوان</h3>
              <LocationSection form={form} setForm={setForm} />
            </div>
          )}

          {/* ════ إعدادات العلامة التجارية ════ */}
          {activeSection === "brand" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">إعدادات العلامة التجارية</h3>
              <div className="grid grid-cols-5 gap-3">
                <LogoUploadSimple label="شعار الوضع الفاتح" value={brandData.lightLogo} onChange={(v) => setBrandData(p => ({ ...p, lightLogo: v }))} />
                <LogoUploadSimple label="شعار التذييل" value={brandData.footerLogo} onChange={(v) => setBrandData(p => ({ ...p, footerLogo: v }))} />
                <LogoUploadSimple label="شعار الوضع الداكن" value={brandData.darkLogo} onChange={(v) => setBrandData(p => ({ ...p, darkLogo: v }))} darkBg />
                <LogoUploadSimple label="أيقونة المتصفح" value={brandData.favicon} onChange={(v) => setBrandData(p => ({ ...p, favicon: v }))} />
                <LogoUploadSimple label="أيقونة التحميل" value={brandData.loadingIcon} onChange={(v) => setBrandData(p => ({ ...p, loadingIcon: v }))} />
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">ألوان النظام</h4>
                <div className="grid grid-cols-3 gap-4">
                  <ColorInput label="لون الهوية" value={brandData.primaryColor} onChange={(v) => setBrandData(p => ({ ...p, primaryColor: v }))} />
                  <ColorInput label="لون الأزرار" value={brandData.buttonColor} onChange={(v) => setBrandData(p => ({ ...p, buttonColor: v }))} />
                  <ColorInput label="لون التبويبة المختارة" value={brandData.tabsActiveColor} onChange={(v) => setBrandData(p => ({ ...p, tabsActiveColor: v }))} />
                  <ColorInput label="لون التبويبات الغير مختارة" value={brandData.tabsInactiveColor} onChange={(v) => setBrandData(p => ({ ...p, tabsInactiveColor: v }))} />
                  <ColorInput label="خلفية رأس الجدول" value={brandData.tableHeaderBgColor} onChange={(v) => setBrandData(p => ({ ...p, tableHeaderBgColor: v }))} />
                  <ColorInput label="نص رأس الجدول" value={brandData.tableHeaderTextColor} onChange={(v) => setBrandData(p => ({ ...p, tableHeaderTextColor: v }))} />
                </div>
              </div>
            </div>
          )}

          {/* ════ إعدادات النظام ════ */}
          {activeSection === "system" && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">إعدادات النظام</h3>
              <div>
                <label className={labelCls + " flex items-center gap-2"}><Calendar size={15} className="text-primary" /> تنسيق التاريخ</label>
                <select value={systemData.dateFormat} onChange={e => setSystemData(p => ({ ...p, dateFormat: e.target.value }))} className={inputCls}>
                  <option value="YYYY/MM/DD">YYYY/MM/DD (2025/11/26)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (26/11/2025)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (11/26/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-11-26)</option>
                </select>
              </div>
              <div>
                <label className={labelCls + " flex items-center gap-2"}><Clock size={15} className="text-primary" /> تنسيق الوقت</label>
                <select value={systemData.timeFormat} onChange={e => setSystemData(p => ({ ...p, timeFormat: e.target.value }))} className={inputCls}>
                  <option value="HH:mm:ss A">HH:mm:ss A (08:17:23 ص)</option>
                  <option value="HH:mm A">HH:mm A (08:17 ص)</option>
                  <option value="HH:mm:ss">HH:mm:ss (08:17:23)</option>
                  <option value="HH:mm">HH:mm (08:17)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>تنسيق التاريخ والوقت معاً</label>
                <select value={systemData.dateTimeFormat} onChange={e => setSystemData(p => ({ ...p, dateTimeFormat: e.target.value }))} className={inputCls}>
                  <option value="YYYY/MM/DD - HH:mm:ss A">YYYY/MM/DD - HH:mm:ss A (2025/11/26 - 08:17:23 ص)</option>
                  <option value="DD/MM/YYYY - HH:mm:ss A">DD/MM/YYYY - HH:mm:ss A (26/11/2025 - 08:17:23 ص)</option>
                  <option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss (2025-11-26 08:17:23)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>التوقيت الزمني</label>
                <select value={systemData.timezone} onChange={e => setSystemData(p => ({ ...p, timezone: e.target.value }))} className={inputCls}>
                  <option value="UTC">التوقيت العالمي (GMT/UTC)</option>
                  <option value="Asia/Riyadh">آسيا/الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">آسيا/دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">آسيا/الكويت (GMT+3)</option>
                  <option value="Asia/Baghdad">آسيا/بغداد (GMT+3)</option>
                  <option value="Africa/Cairo">أفريقيا/القاهرة (GMT+2)</option>
                  <option value="Europe/Istanbul">أوروبا/اسطنبول (GMT+3)</option>
                </select>
              </div>
            </div>
          )}

          {/* ════ إعدادات التواصل ════ */}
          {activeSection === "contact" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">إعدادات التواصل</h3>
              {/* وسائل التواصل */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">وسائل التواصل</h4>
                  <button type="button" onClick={addContactItem} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20">
                    <Plus size={14} /> إضافة وسيلة تواصل
                  </button>
                </div>
                {contactData.contact_items.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">لا توجد وسائل تواصل مضافة بعد — اضغط "إضافة وسيلة تواصل"</div>
                ) : (
                  <DragDropContext onDragEnd={handleContactDrag}>
                    <Droppable droppableId="contact-items-form">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.contact_items.map((item, index) => {
                            const typeInfo = contactTypes.find(t => t.value === item.type) || contactTypes[0];
                            return (
                              <Draggable key={index} draggableId={`ci-form-${index}`} index={index}>
                                {(dp, ds) => (
                                  <div ref={dp.innerRef} {...dp.draggableProps} className={`flex items-center gap-3 bg-secondary/30 border border-border rounded-lg p-3 ${ds.isDragging ? "shadow-lg" : ""}`}>
                                    <div {...dp.dragHandleProps} className="cursor-grab text-muted-foreground flex-shrink-0"><GripVertical size={16} /></div>
                                    <select value={item.type} onChange={(e) => updateContactItem(index, "type", e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white flex-shrink-0" dir="rtl">
                                      {contactTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    <input type="text" value={item.value} onChange={(e) => updateContactItem(index, "value", e.target.value)} placeholder={typeInfo.placeholder} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                                    <IconPickerPopover value={item.icon || ""} onChange={(v) => updateContactItem(index, "icon", v)} />
                                    <button type="button" onClick={() => removeContactItem(index)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 size={15} /></button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>

              {/* وسائل التواصل الاجتماعي */}
              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">وسائل التواصل الاجتماعي</h4>
                  <button type="button" onClick={addSocialLink} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20">
                    <Plus size={14} /> إضافة وسيلة تواصل
                  </button>
                </div>
                {contactData.social_links.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">لا توجد وسائل تواصل اجتماعي مضافة بعد</div>
                ) : (
                  <DragDropContext onDragEnd={handleSocialDrag}>
                    <Droppable droppableId="social-links-form">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.social_links.map((link, index) => (
                            <Draggable key={index} draggableId={`sl-form-${index}`} index={index}>
                              {(dp, ds) => (
                                <div ref={dp.innerRef} {...dp.draggableProps} className={`flex items-center gap-3 bg-secondary/30 border border-border rounded-lg p-3 ${ds.isDragging ? "shadow-lg" : ""}`}>
                                  <div {...dp.dragHandleProps} className="cursor-grab text-muted-foreground flex-shrink-0"><GripVertical size={16} /></div>
                                  <select value={link.platform} onChange={(e) => updateSocialLink(index, "platform", e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white flex-shrink-0" dir="rtl">
                                    {socialPlatforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                  </select>
                                  <input type="text" value={link.url} onChange={(e) => updateSocialLink(index, "url", e.target.value)} placeholder="https://..." className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                                  <IconPickerPopover value={link.icon || ""} onChange={(v) => updateSocialLink(index, "icon", v)} />
                                  <button type="button" onClick={() => removeSocialLink(index)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 size={15} /></button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}