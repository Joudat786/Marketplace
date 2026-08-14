import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import IconPickerPopover from "@/components/superadmin/IconPickerPopover";
import SlidePanel from "@/components/superadmin/SlidePanel";
import {
  Save, Trash2, Upload, Calendar, Clock, Building2, Settings,
  Phone, X, Copy, ClipboardPaste, Plus, GripVertical, User, MapPin,
  ZoomIn, Download, UserCheck, FileText, Maximize2, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import SearchableSelect from "@/components/client/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import EntityTypeSelect from "@/components/ui/EntityTypeSelect";
import LocationSection from "@/components/client/LocationSection";
import { useRef } from "react";
import { useWorkspace } from "@/lib/WorkspaceContext";

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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Sections ───
const SECTIONS = [
  { id: "workspace", label: "بيانات مساحة العمل", icon: Building2 },
  { id: "owner", label: "بيانات الملاك", icon: User },
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
  { value: "twitter", label: "تويتر / X" },
  { value: "instagram", label: "إنستغرام" },
  { value: "facebook", label: "فيسبوك" },
  { value: "linkedin", label: "لينكدإن" },
  { value: "youtube", label: "يوتيوب" },
  { value: "tiktok", label: "تيك توك" },
  { value: "snapchat", label: "سناب شات" },
  { value: "whatsapp", label: "واتساب" },
  { value: "telegram", label: "تيليغرام" },
  { value: "threads", label: "ثريدز" },
  { value: "pinterest", label: "بينتيريست" },
  { value: "reddit", label: "ريديت" },
  { value: "discord", label: "ديسكورد" },
  { value: "behance", label: "بيهانس" },
  { value: "dribbble", label: "دريبل" },
  { value: "github", label: "جيت هاب" },
  { value: "vimeo", label: "فيميو" },
  { value: "twitch", label: "تويتش" },
  { value: "medium", label: "ميديوم" },
  { value: "soundcloud", label: "ساوند كلاود" },
  { value: "spotify", label: "سبوتيفاي" },
  { value: "other", label: "أخرى" },
];

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background";
const labelCls = "block text-sm font-semibold text-foreground mb-1.5";

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

function LogoUpload({ label, value, onChange, darkBg = false }) {
  const { toast } = useToast();
  const handleUpload = async (file) => {
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange(res.file_url);
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {value && (
        <div className={`relative w-full h-12 rounded-md border border-border overflow-hidden mb-1 ${darkBg ? "bg-slate-900" : "bg-secondary/30"}`}>
          <img src={value} alt={label} className="w-full h-full object-contain p-1" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
            <X size={12} />
          </button>
        </div>
      )}
      <label className="flex items-center justify-center gap-1 px-2 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
        <Upload size={11} /> رفع
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
      </label>
    </div>
  );
}

function AttachmentBox({ label, value, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) { onChange(res.file_url); toast({ title: "تم الرفع" }); }
    } catch (err) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 px-3 py-2 text-xs font-bold text-foreground border-b border-border">{label}</div>
      <div className="flex items-center divide-x divide-x-reverse divide-border">
        <label className="flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer hover:bg-muted/20 transition-colors border-l border-border">
          <Upload size={18} className={uploading ? "animate-pulse text-primary" : "text-muted-foreground"} />
          <span className="text-[10px] text-muted-foreground">{uploading ? "جارٍ الرفع..." : "رفع"}</span>
          <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
        </label>
        <button type="button" onClick={() => value && window.open(value, "_blank")} disabled={!value}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-muted/20 transition-colors disabled:opacity-30 border-l border-border">
          <ZoomIn size={18} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">تكبير</span>
        </button>
        <a href={value || "#"} download onClick={(e) => !value && e.preventDefault()}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-muted/20 transition-colors ${!value ? "opacity-30 pointer-events-none" : ""}`}>
          <Download size={18} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">تنزيل</span>
        </a>
      </div>
      {value && (
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-emerald-600 font-medium">✓ تم الرفع</span>
          <button type="button" onClick={() => onChange("")} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
            <Trash2 size={10} /> حذف
          </button>
        </div>
      )}
    </div>
  );
}

// ─── مربع مرفق الهوية للمالك ───────────────────────────────
function OwnerAttachmentBox({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const res = await base44.integrations.Core.UploadFile({ file }); onChange(res.file_url); } catch {}
    setUploading(false);
  };
  return (
    <div className="w-24 flex-shrink-0 border border-border rounded-md overflow-hidden bg-white">
      <div className="flex divide-x divide-x-reverse divide-border">
        <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 text-muted-foreground hover:text-primary relative">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {value && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button type="button" disabled={!value} onClick={() => value && setPreview(value)} className="flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 text-muted-foreground hover:text-primary disabled:opacity-30">
          <ZoomIn size={12} />
        </button>
        <a href={value || "#"} download target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center py-1.5 hover:bg-secondary/40 text-muted-foreground hover:text-primary ${!value ? "pointer-events-none opacity-30" : ""}`}>
          <Download size={12} />
        </a>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
      {preview && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setPreview(null)}><img src={preview} alt="" className="max-w-3xl max-h-[80vh] rounded-xl" /></div>}
    </div>
  );
}

// ─── جدول المرفقات ─────────────────────────────────────────
function AttachmentsSectionEdit({ wsForm, setWsForm }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const FIXED_FIELDS = [
    { key: "commercial_register_attachment", label: "السجل التجاري" },
    { key: "founding_contract_attachment", label: "عقد التأسيس" },
    { key: "tax_certificate_attachment", label: "الشهادة الضريبية" },
    { key: "national_address_attachment", label: "العنوان الوطني" },
  ];

  const extraAttachments = wsForm.extra_attachments || [];

  const handleUploadExtra = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ url: res.file_url, name: file.name, size: file.size, type: file.type });
      }
      setWsForm(p => ({ ...p, extra_attachments: [...(p.extra_attachments || []), ...uploaded] }));
    } catch {}
    setUploading(false);
  };

  const handleUploadFixed = async (file, key) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setWsForm(p => ({ ...p, [key]: res.file_url, [key + "_meta"]: { name: file.name, size: file.size, type: file.type } }));
    } catch {}
    setUploading(false);
  };

  const formatSize = (size) => { if (!size) return "-"; if (size < 1024) return `${size} B`; if (size < 1048576) return `${(size/1024).toFixed(1)} KB`; return `${(size/1048576).toFixed(1)} MB`; };
  const getExt = (name, type) => { if (name) { const p = name.split("."); if (p.length > 1) return p[p.length-1].toUpperCase(); } if (type) return type.split("/")[1]?.toUpperCase() || "-"; return "-"; };
  const getTypeLabel = (type, name) => { if (!type && name) { const ext = name.split(".").pop()?.toLowerCase(); if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "صورة"; if (ext === "pdf") return "PDF"; return "ملف"; } if (type?.startsWith("image/")) return "صورة"; if (type?.includes("pdf")) return "PDF"; return "ملف"; };
  const isImage = (url, type) => type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url||"");
  const isPdf = (url, type) => type?.includes("pdf") || /\.pdf(\?.*)?$/i.test(url||"");

  const allRows = [
    ...FIXED_FIELDS.map(f => ({ label: f.label, url: wsForm[f.key]||"", key: f.key, meta: wsForm[f.key+"_meta"]||{}, isFixed: true })),
    ...extraAttachments.map((a, idx) => ({ label: a.name, url: a.url, name: a.name, size: a.size, type: a.type, isFixed: false, extraIdx: idx })),
  ];

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
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
          const name = row.isFixed ? (meta.name||row.label) : row.name;
          const size = row.isFixed ? meta.size : row.size;
          const type = row.isFixed ? meta.type : row.type;
          const url = row.url; const hasFile = !!url;
          return (
            <div key={i} className={`flex items-stretch ${i>0?"border-t border-gray-300":""}`} style={hasFile?{backgroundColor:"#dcfce7"}:{}}>
              <div className="w-[45px] flex-shrink-0 flex items-center justify-center py-3 border-l border-gray-300" style={hasFile?{backgroundColor:"#dcfce7"}:{backgroundColor:"#f9fafb"}}>
                <span className="text-sm text-gray-500">{i+1}</span>
              </div>
              <div className="flex-1 flex items-center px-3 py-3 border-l border-gray-300"><span className="text-sm truncate">{name||row.label}</span></div>
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300"><span className="text-xs text-muted-foreground">{hasFile?getTypeLabel(type,name):"-"}</span></div>
              <div className="w-[80px] flex-shrink-0 flex items-center justify-center border-l border-gray-300"><span className="text-xs font-mono text-muted-foreground">{hasFile?getExt(name,type):"-"}</span></div>
              <div className="w-[90px] flex-shrink-0 flex items-center justify-center border-l border-gray-300"><span className="text-xs text-muted-foreground">{hasFile?formatSize(size):"-"}</span></div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                {row.isFixed ? (
                  <label className="cursor-pointer flex items-center justify-center w-full h-full hover:bg-secondary/40 text-muted-foreground hover:text-primary">
                    <Upload size={15} /><input type="file" accept="*/*" className="hidden" onChange={(e)=>handleUploadFixed(e.target.files?.[0],row.key)} />
                  </label>
                ) : <span className="opacity-30 text-muted-foreground"><Upload size={15} /></span>}
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <button type="button" disabled={!hasFile} onClick={()=>setPreview(url)} className="flex items-center justify-center w-full h-full hover:bg-secondary/40 text-muted-foreground hover:text-primary disabled:opacity-30"><Maximize2 size={15} /></button>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-l border-gray-300">
                <a href={url||"#"} download target="_blank" rel="noreferrer" className={`flex items-center justify-center w-full h-full hover:bg-secondary/40 text-muted-foreground hover:text-primary ${!hasFile?"pointer-events-none opacity-30":""}`}><Download size={15} /></a>
              </div>
              <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
                {(hasFile||!row.isFixed)?(
                  <button type="button" onClick={()=>{if(!confirm("هل أنت متأكد من الحذف؟"))return; if(row.isFixed)setWsForm(p=>({...p,[row.key]:"",[row.key+"_meta"]:{}})); else setWsForm(p=>({...p,extra_attachments:(p.extra_attachments||[]).filter((_,i2)=>i2!==row.extraIdx)}));}} className="flex items-center justify-center w-full h-full hover:bg-red-50 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                ):<span className="opacity-0 w-7 h-7"/>}
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={()=>setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setPreview(null)} className="absolute -top-10 left-0 text-white text-sm flex items-center gap-1"><X size={16}/> إغلاق</button>
            {isImage(preview)&&<img src={preview} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto block"/>}
            {isPdf(preview)&&<iframe src={preview} className="w-full h-[85vh] rounded-xl" title="مستند"/>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inner content (same as WorkspaceSettings) ───
function WorkspaceSettingsContent({ wsId, onClose, onSaved }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateWorkspaceData } = useWorkspace();

  const [activeSection, setActiveSection] = useState("workspace");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const emptyOwner = { name: "", mobile: "", in_founding_contract: false };

  const [wsForm, setWsForm] = useState({
    name: "", slug: "", owner_email: "", owner_user_id: "",
    logo_url: "", status: "trial", plan: "free",
    currency: "SAR", timezone: "Asia/Riyadh", language: "ar",
    plan_expires_at: "", billing_cycle: "monthly",
    owners: [{ name: "", mobile: "", in_founding_contract: false }],
    owner_nationality: "",
    owner_identity_type: "", owner_identity_number: "",
    company_name: "", commercial_register_number: "",
    commercial_register_issue_date: "", commercial_register_expiry_date: "",
    tax_number: "", unified_national_number: "", tax_registration_expiry_date: "", activity_type: "",
    country: "SA", city: "",
    commercial_register_attachment: "", founding_contract_attachment: "",
    tax_certificate_attachment: "", identity_attachment: "", national_address_attachment: "",
    extra_attachments: [], location_data: {},
  });
  const [logoPreview, setLogoPreview] = useState(null);

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

  // جلب بيانات العميل من PlatformClient (بيانات الانضمام)
  const { data: platformClientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ["platformClient-me", wsId],
    queryFn: async () => {
      const me = await base44.auth.me();
      const clients = await base44.entities.PlatformClient.filter({ email: me.email });
      return clients?.[0] || null;
    },
    enabled: !!wsId
  });

  // استدعاء البيانات الأساسية فقط (بدون مرفقات وبدون ملاك وبدون موقع)
  const handleImportFromOnboarding = () => {
    if (!platformClientData) return;
    const pc = platformClientData;
    setWsForm(prev => ({
      ...prev,
      company_name: pc.company_name || prev.company_name,
      unified_national_number: pc.unified_national_number || prev.unified_national_number,
      commercial_register_number: pc.commercial_register_number || prev.commercial_register_number,
      commercial_register_issue_date: pc.commercial_register_issue_date || prev.commercial_register_issue_date,
      commercial_register_expiry_date: pc.commercial_register_expiry_date || prev.commercial_register_expiry_date,
      tax_number: pc.tax_number || prev.tax_number,
      tax_registration_expiry_date: pc.tax_registration_expiry_date || prev.tax_registration_expiry_date,
      activity_type: pc.activity_type || prev.activity_type,
    }));
    toast({ title: "تم استدعاء البيانات", description: "تم تعبئة الحقول ببيانات نموذج الانضمام، راجعها ثم احفظ." });
  };

  // استدعاء الملاك فقط
  const handleImportOwnersFromOnboarding = () => {
    if (!platformClientData?.owners?.length) return;
    // تطبيع الجنسية: قبول أي شكل (رمز أو نص) وتحويله للقيمة الصحيحة في NATIONALITY_OPTIONS
    const normalizeNationality = (val) => {
      if (!val) return "";
      // إذا كانت القيمة موجودة مباشرة في الـ options، أعدها كما هي
      if (NATIONALITY_OPTIONS.find(o => o.value === val)) return val;
      // إذا كانت نصاً، ابحث عنها في الـ labels
      const found = NATIONALITY_OPTIONS.find(o => o.label === val || o.label.includes(val) || val.includes(o.label));
      return found ? found.value : val;
    };
    const normalizeIdentityType = (val) => {
      if (!val) return "";
      if (IDENTITY_TYPE_OPTIONS.find(o => o.value === val)) return val;
      const map = { "هوية وطنية": "national_id", "هوية": "national_id", "إقامة": "resident_id", "مقيم": "resident_id", "جواز سفر": "passport", "جواز": "passport" };
      return map[val] || IDENTITY_TYPE_OPTIONS.find(o => o.label === val)?.value || val;
    };
    const importedOwners = platformClientData.owners.map(o => ({
      name: o.name || "",
      email: o.email || "",
      mobile: o.mobile || "",
      nationality: normalizeNationality(o.nationality),
      identity_type: normalizeIdentityType(o.identity_type),
      identity_number: o.identity_number || "",
      identity_attachment: o.identity_attachment || "",
      in_founding_contract: o.in_founding_contract || false,
    }));
    setWsForm(prev => ({ ...prev, owners: JSON.parse(JSON.stringify(importedOwners)) }));
    toast({ title: "تم استدعاء بيانات الملاك", description: "راجع البيانات ثم احفظ." });
  };

  // استدعاء الموقع فقط
  const handleImportLocationFromOnboarding = () => {
    if (!platformClientData?.location_data || Object.keys(platformClientData.location_data).length === 0) return;
    setWsForm(prev => ({ ...prev, location_data: platformClientData.location_data }));
    toast({ title: "تم استدعاء بيانات الموقع", description: "راجع البيانات ثم احفظ." });
  };

  // استدعاء المرفقات فقط
  const handleImportAttachmentsFromOnboarding = () => {
    if (!platformClientData) return;
    const pc = platformClientData;
    setWsForm(prev => ({
      ...prev,
      commercial_register_attachment: pc.commercial_register_attachment || prev.commercial_register_attachment,
      founding_contract_attachment: pc.founding_contract_attachment || prev.founding_contract_attachment,
      tax_certificate_attachment: pc.tax_certificate_attachment || prev.tax_certificate_attachment,
      identity_attachment: pc.identity_attachment || prev.identity_attachment,
      national_address_attachment: pc.national_address_attachment || prev.national_address_attachment,
    }));
    toast({ title: "تم استدعاء المرفقات", description: "راجع المرفقات ثم احفظ." });
  };

  const { data: workspaceRaw, isLoading } = useQuery({
    queryKey: ["workspace", wsId],
    queryFn: async () => {
      // استخدام getUserWorkspaces عبر service role لتجاوز قيود RLS
      const res = await base44.functions.invoke('getUserWorkspaces', {});
      const workspaces = res?.data?.workspaces || [];
      return workspaces.filter(w => w.id === wsId);
    },
    enabled: !!wsId
  });
  const workspaceData = workspaceRaw?.[0];

  const { data: savedBrand } = useQuery({
    queryKey: ["ws-brand-settings", wsId],
    queryFn: () => base44.entities.GeneralSettings.filter({ settings_type: "ws_brand", workspace_id: wsId }),
    enabled: !!wsId
  });
  const { data: savedSystem } = useQuery({
    queryKey: ["ws-system-settings", wsId],
    queryFn: () => base44.entities.GeneralSettings.filter({ settings_type: "ws_system", workspace_id: wsId }),
    enabled: !!wsId
  });
  const { data: savedContact, refetch: refetchContact } = useQuery({
    queryKey: ["ws-contact-settings", wsId],
    queryFn: () => base44.entities.GeneralSettings.filter({ settings_type: "ws_contact", workspace_id: wsId }),
    enabled: !!wsId
  });

  useEffect(() => {
    if (workspaceData) {
      // دعم البيانات القديمة: إذا لم يوجد owners نحوّل owner_name/owner_mobile
      const owners = workspaceData.owners?.length > 0 ? workspaceData.owners : [];
      setWsForm(prev => ({ ...prev, ...workspaceData, owners, location_data: workspaceData.location_data || {}, extra_attachments: workspaceData.extra_attachments || [] }));
      setLogoPreview(workspaceData.logo_url || null);
    }
  }, [workspaceData]);

  useEffect(() => {
    if (savedBrand?.[0]) {
      const s = savedBrand[0];
      setBrandData({
        lightLogo: s.light_logo_url || null, darkLogo: s.dark_logo_url || null,
        favicon: s.favicon_url || null, loadingIcon: s.loading_icon_url || null,
        footerLogo: s.footer_logo_url || null,
        brandName: s.brand_name || "", footerText: s.footer_text || "",
        primaryColor: s.primary_color || "#6566c1", buttonColor: s.button_color || "#245EFF",
        tabsActiveColor: s.tabs_active_color || "#245EFF", tabsInactiveColor: s.tabs_inactive_color || "#fbed24",
        tableHeaderBgColor: s.table_header_bg_color || "#E8EDFA", tableHeaderTextColor: s.table_header_text_color || "#1F1F1F"
      });
    }
  }, [savedBrand]);

  useEffect(() => {
    if (savedSystem?.[0]) {
      const s = savedSystem[0];
      setSystemData({
        dateFormat: s.date_format || "YYYY/MM/DD",
        timeFormat: s.time_format || "HH:mm:ss A",
        dateTimeFormat: s.date_time_format || "YYYY/MM/DD - HH:mm:ss A",
        timezone: s.timezone || "Asia/Riyadh"
      });
    }
  }, [savedSystem]);

  useEffect(() => {
    if (savedContact?.[0]) {
      const s = savedContact[0];
      setContactData({ contact_items: s.contact_items || [], social_links: s.social_links || [] });
    }
  }, [savedContact]);

  const saveToEntity = async (settingsType, payload) => {
    const existing = await base44.entities.GeneralSettings.filter({ settings_type: settingsType, workspace_id: wsId });
    const data = { ...payload, settings_type: settingsType, workspace_id: wsId, brand_name: payload.brand_name || settingsType };
    if (existing?.length > 0) return base44.entities.GeneralSettings.update(existing[0].id, data);
    return base44.entities.GeneralSettings.create(data);
  };

  const ALLOWED_WS_FIELDS = [
    'name', 'slug', 'owner_email', 'owner_user_id', 'logo_url',
    'status', 'plan', 'plan_expires_at', 'billing_cycle',
    'currency', 'timezone', 'language',
    'owner_name', 'owner_mobile', 'owner_nationality',
    'owner_identity_type', 'owner_identity_number',
    'owners',
    'company_name', 'unified_national_number',
    'commercial_register_number', 'commercial_register_issue_date', 'commercial_register_expiry_date',
    'tax_number', 'tax_registration_expiry_date',
    'activity_type',
    'country', 'city', 'location_data',
    'footer_text',
    'commercial_register_attachment', 'founding_contract_attachment',
    'tax_certificate_attachment', 'identity_attachment',
    'national_address_attachment',
    'settings',
  ];

  const wsMutation = useMutation({
    mutationFn: (data) => {
      // تصفية الحقول المسموح بها فقط قبل الإرسال
      const filteredData = {};
      for (const key of ALLOWED_WS_FIELDS) {
        if (key in data) filteredData[key] = data[key];
      }
      return base44.functions.invoke('updateWorkspace', { workspace_id: wsId, data: filteredData });
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات مساحة العمل" });
      queryClient.invalidateQueries({ queryKey: ["workspace", wsId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      onSaved?.();
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
  });

  const brandMutation = useMutation({
    mutationFn: async () => {
      const lightLogo = brandData.lightLogo && brandData.lightLogo.startsWith('http') ? brandData.lightLogo : null;
      await saveToEntity("ws_brand", {
        brand_name: brandData.brandName, footer_text: brandData.footerText,
        light_logo_url: lightLogo, dark_logo_url: brandData.darkLogo,
        favicon_url: brandData.favicon, loading_icon_url: brandData.loadingIcon,
        footer_logo_url: brandData.footerLogo,
        primary_color: brandData.primaryColor, button_color: brandData.buttonColor,
        tabs_active_color: brandData.tabsActiveColor, tabs_inactive_color: brandData.tabsInactiveColor,
        table_header_bg_color: brandData.tableHeaderBgColor, table_header_text_color: brandData.tableHeaderTextColor
      });
      return { lightLogo };
    },
    onSuccess: (result) => {
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات العلامة التجارية" });
      queryClient.invalidateQueries({ queryKey: ["ws-brand-settings", wsId] });
      // تحديث الشعار في القائمة الجانبية فوراً بدون أي API call
      if (wsId && result?.lightLogo) {
        updateWorkspaceData(wsId, { logo_url: result.lightLogo });
      }
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
  });

  const systemMutation = useMutation({
    mutationFn: () => saveToEntity("ws_system", {
      date_format: systemData.dateFormat, time_format: systemData.timeFormat,
      date_time_format: systemData.dateTimeFormat, timezone: systemData.timezone
    }),
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات النظام" });
      queryClient.invalidateQueries({ queryKey: ["ws-system-settings", wsId] });
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
  });

  const contactMutation = useMutation({
    mutationFn: () => saveToEntity("ws_contact", {
      contact_items: contactData.contact_items, social_links: contactData.social_links
    }),
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات التواصل" });
      refetchContact();
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Workspace.delete(wsId),
    onSuccess: () => { onClose?.(); navigate("/workspaces"); }
  });

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setLogoPreview(res.file_url);
      setWsForm(p => ({ ...p, logo_url: res.file_url }));
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الشعار", variant: "destructive" });
    }
  };

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

  const currentSection = SECTIONS.find(s => s.id === activeSection);
  const CurrentIcon = currentSection?.icon;

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    const HH = dt.getHours();
    const min = String(dt.getMinutes()).padStart(2, "0");
    const ss = String(dt.getSeconds()).padStart(2, "0");
    const ampm = HH >= 12 ? "م" : "ص";
    const hh = String(HH % 12 || 12).padStart(2, "0");
    return `${yyyy}/${mm}/${dd} - ${hh}:${min}:${ss} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 min-h-full" dir="rtl">
      {/* ─── Sidebar ─── */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-0">
          <div className="p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  : <Building2 size={18} className="text-primary" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{wsForm.name || "مساحة العمل"}</p>
                <Badge variant="outline" className={`text-[10px] mt-0.5 ${wsForm.status === "active" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : wsForm.status === "trial" ? "text-orange-600 bg-orange-50 border-orange-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                  {wsForm.status === "active" ? "نشط" : wsForm.status === "trial" ? "تجريبي" : wsForm.status === "suspended" ? "موقوف" : "ملغي"}
                </Badge>
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
                    activeSection === section.id ? "bg-tabsActive text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon size={15} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-border">
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={13} /> حذف مساحة العمل
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-xl p-8"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CurrentIcon size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{currentSection?.label}</h2>
              <p className="text-sm text-muted-foreground">{wsForm.name || "مساحة العمل"}</p>
            </div>
            {workspaceData && (
              <div className="mr-auto flex gap-4 text-xs text-muted-foreground">
                <span>إنشاء: {formatDate(workspaceData.created_date)}</span>
                <span>تحديث: {formatDate(workspaceData.updated_date)}</span>
              </div>
            )}
          </div>

          {/* ════════════ SECTION: workspace ════════════ */}
          {activeSection === "workspace" && (
            <div className="space-y-6">
              {/* بيانات الشركة */}
              <div className="bg-secondary/20 border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-sm font-bold text-foreground">بيانات مساحة العمل</h3>
                  {platformClientData && (
                    <button type="button" onClick={handleImportFromOnboarding} disabled={isLoadingClient}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                      <RefreshCw size={13} />
                      استدعاء بيانات نموذج الانضمام
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>نوع الكيان القانوني</label>
                    <EntityTypeSelect value={wsForm.activity_type || ""} onChange={(v) => setWsForm(p => ({ ...p, activity_type: v }))} />
                  </div>
                  <div>
                    <label className={labelCls}>اسم مساحة العمل *</label>
                    <div className="flex gap-1 items-center">
                      <input type="text" value={wsForm.name || ""} onChange={(e) => setWsForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم مساحة العمل" className={inputCls} />
                      <button type="button" disabled={!wsForm.name?.trim()} onClick={() => navigator.clipboard.writeText(wsForm.name || "")}
                        title="نسخ اسم مساحة العمل"
                        className="flex-shrink-0 p-2 text-xs bg-secondary text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-40 transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>اسم الشركة / المؤسسة</label>
                    <div className="flex gap-1 items-center">
                      <input type="text" value={wsForm.company_name || ""} onChange={(e) => setWsForm(p => ({ ...p, company_name: e.target.value }))} placeholder="اسم الشركة" className={inputCls} />
                      <button type="button" disabled={!wsForm.company_name?.trim()} onClick={() => navigator.clipboard.writeText(wsForm.company_name || "")}
                        title="نسخ اسم الشركة / المؤسسة"
                        className="flex-shrink-0 p-2 text-xs bg-secondary text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-40 transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>نص التذييل</label>
                    <input type="text" value={wsForm.footer_text || ""} onChange={(e) => setWsForm(p => ({ ...p, footer_text: e.target.value }))} placeholder="أدخل نص التذييل" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>الرقم الوطني الموحد</label>
                    <input type="text" value={wsForm.unified_national_number || ""} onChange={(e) => setWsForm(p => ({ ...p, unified_national_number: e.target.value }))} placeholder="الرقم الوطني الموحد" className={inputCls} dir="ltr" />
                  </div>
                  <div>
                    <label className={labelCls}>رقم السجل التجاري</label>
                    <input type="text" value={wsForm.commercial_register_number || ""} onChange={(e) => setWsForm(p => ({ ...p, commercial_register_number: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>تاريخ إصدار السجل التجاري</label>
                    <DateInput value={wsForm.commercial_register_issue_date || ""} onChange={(v) => setWsForm(p => ({ ...p, commercial_register_issue_date: v }))} className="w-full" />
                  </div>
                  <div>
                    <label className={labelCls}>تاريخ انتهاء السجل التجاري</label>
                    <DateInput value={wsForm.commercial_register_expiry_date || ""} onChange={(v) => setWsForm(p => ({ ...p, commercial_register_expiry_date: v }))} className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>الرقم الضريبي</label>
                    <input type="text" value={wsForm.tax_number || ""} onChange={(e) => setWsForm(p => ({ ...p, tax_number: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>تاريخ نفاذ التسجيل الضريبي</label>
                    <DateInput value={wsForm.tax_registration_expiry_date || ""} onChange={(v) => setWsForm(p => ({ ...p, tax_registration_expiry_date: v }))} className="w-full" />
                  </div>

                </div>
              </div>

              <button onClick={() => wsMutation.mutate(wsForm)} disabled={wsMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {wsMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: owner ════════════ */}
          {activeSection === "owner" && (
            <div className="space-y-4">
              {platformClientData?.owners?.length > 0 && (
                <div className="flex justify-end">
                  <button type="button" onClick={handleImportOwnersFromOnboarding} disabled={isLoadingClient}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <RefreshCw size={13} />
                    استدعاء بيانات الملاك من نموذج الانضمام
                  </button>
                </div>
              )}
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
                const items = Array.from(wsForm.owners || []);
                const [moved] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, moved);
                setWsForm(p => ({ ...p, owners: items }));
              }}>
                <Droppable droppableId="owners-edit-list">
                  {(provided) => (
                    <div className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
                      {(wsForm.owners || []).map((owner, idx) => (
                        <Draggable key={idx} draggableId={`owner-edit-${idx}`} index={idx}>
                          {(dp) => (
                            <div ref={dp.innerRef} {...dp.draggableProps} className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2">
                              <span {...dp.dragHandleProps}><GripVertical size={14} className="text-muted-foreground cursor-grab" /></span>
                              <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                              <input type="text" value={owner.name||""} onChange={e=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],name:e.target.value};setWsForm(p=>({...p,owners:u}));}} placeholder="الاسم" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <input type="email" value={owner.email||""} onChange={e=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],email:e.target.value};setWsForm(p=>({...p,owners:u}));}} placeholder="البريد الإلكتروني" dir="ltr" className="flex-1 min-w-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <input type="tel" value={owner.mobile||""} onChange={e=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],mobile:e.target.value};setWsForm(p=>({...p,owners:u}));}} placeholder="05XXXXXXXX" dir="ltr" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" />
                              <SearchableSelect value={owner.nationality||""} onChange={v=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],nationality:v};setWsForm(p=>({...p,owners:u}));}} options={NATIONALITY_OPTIONS} placeholder="الجنسية" className="w-24 flex-shrink-0" />
                              <SearchableSelect value={owner.identity_type||""} onChange={v=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],identity_type:v};setWsForm(p=>({...p,owners:u}));}} options={IDENTITY_TYPE_OPTIONS} placeholder="نوع الهوية" className="w-32 flex-shrink-0" />
                              <input type="text" value={owner.identity_number||""} onChange={e=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],identity_number:e.target.value};setWsForm(p=>({...p,owners:u}));}} placeholder="رقم الهوية" className="w-28 flex-shrink-0 border border-border rounded-md px-2 py-1.5 text-xs text-center focus:outline-none bg-white" dir="ltr" />
                              <OwnerAttachmentBox value={owner.identity_attachment||""} onChange={url=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],identity_attachment:url};setWsForm(p=>({...p,owners:u}));}} />
                              <div className="w-28 flex-shrink-0 flex items-center justify-center">
                                <div onClick={()=>{const u=[...(wsForm.owners||[])];u[idx]={...u[idx],in_founding_contract:!owner.in_founding_contract};setWsForm(p=>({...p,owners:u}));}} className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${owner.in_founding_contract?"bg-primary":"bg-border"}`}>
                                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${owner.in_founding_contract?"right-0.5":"left-0.5"}`} />
                                </div>
                              </div>
                              {(wsForm.owners||[]).length > 1 && (
                                <button type="button" onClick={()=>setWsForm(p=>({...p,owners:p.owners.filter((_,i)=>i!==idx)}))} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button type="button" onClick={() => setWsForm(p => ({ ...p, owners: [...(p.owners||[]), { name:"", email:"", mobile:"", nationality:"", identity_type:"", identity_number:"", identity_attachment:"", in_founding_contract:false }] }))}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                <Plus size={16} /> إضافة مالك
              </button>

              <button onClick={() => wsMutation.mutate(wsForm)} disabled={wsMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {wsMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: attachments ════════════ */}
          {activeSection === "attachments" && (
            <div className="space-y-4">
              {platformClientData && (platformClientData.commercial_register_attachment || platformClientData.founding_contract_attachment || platformClientData.tax_certificate_attachment || platformClientData.identity_attachment) && (
                <div className="flex justify-end">
                  <button type="button" onClick={handleImportAttachmentsFromOnboarding} disabled={isLoadingClient}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <RefreshCw size={13} />
                    استدعاء المرفقات من نموذج الانضمام
                  </button>
                </div>
              )}
              <AttachmentsSectionEdit wsForm={wsForm} setWsForm={setWsForm} />
              <button onClick={() => wsMutation.mutate(wsForm)} disabled={wsMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {wsMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: location ════════════ */}
          {activeSection === "location" && (
            <div className="space-y-4">
              {platformClientData?.location_data && Object.keys(platformClientData.location_data).length > 0 && (
                <div className="flex justify-end">
                  <button type="button" onClick={handleImportLocationFromOnboarding} disabled={isLoadingClient}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <RefreshCw size={13} />
                    استدعاء بيانات الموقع من نموذج الانضمام
                  </button>
                </div>
              )}
              <LocationSection
                form={wsForm}
                setForm={setWsForm}
              />
              <button onClick={() => wsMutation.mutate(wsForm)} disabled={wsMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {wsMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: brand ════════════ */}
          {activeSection === "brand" && (
            <div className="space-y-8">
              <div className="grid grid-cols-5 gap-3">
                <LogoUpload label="شعار الوضع الفاتح" value={brandData.lightLogo} onChange={(v) => setBrandData(p => ({ ...p, lightLogo: v }))} />
                <LogoUpload label="شعار التذييل" value={brandData.footerLogo} onChange={(v) => setBrandData(p => ({ ...p, footerLogo: v }))} />
                <LogoUpload label="شعار الوضع الداكن" value={brandData.darkLogo} onChange={(v) => setBrandData(p => ({ ...p, darkLogo: v }))} darkBg />
                <LogoUpload label="أيقونة المتصفح" value={brandData.favicon} onChange={(v) => setBrandData(p => ({ ...p, favicon: v }))} />
                <LogoUpload label="أيقونة التحميل" value={brandData.loadingIcon} onChange={(v) => setBrandData(p => ({ ...p, loadingIcon: v }))} />
              </div>
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">ألوان النظام</h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorInput label="لون الهوية" value={brandData.primaryColor} onChange={(v) => setBrandData(p => ({ ...p, primaryColor: v }))} />
                  <ColorInput label="لون الأزرار" value={brandData.buttonColor} onChange={(v) => setBrandData(p => ({ ...p, buttonColor: v }))} />
                  <ColorInput label="لون التبويبة المختارة" value={brandData.tabsActiveColor} onChange={(v) => setBrandData(p => ({ ...p, tabsActiveColor: v }))} />
                  <ColorInput label="لون التبويبات الغير مختارة" value={brandData.tabsInactiveColor} onChange={(v) => setBrandData(p => ({ ...p, tabsInactiveColor: v }))} />
                  <ColorInput label="خلفية رأس الجدول" value={brandData.tableHeaderBgColor} onChange={(v) => setBrandData(p => ({ ...p, tableHeaderBgColor: v }))} />
                  <ColorInput label="نص رأس الجدول" value={brandData.tableHeaderTextColor} onChange={(v) => setBrandData(p => ({ ...p, tableHeaderTextColor: v }))} />
                </div>
              </div>
              <button onClick={() => brandMutation.mutate()} disabled={brandMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {brandMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: system ════════════ */}
          {activeSection === "system" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Calendar size={16} className="text-primary" /> تنسيق التاريخ</label>
                <select value={systemData.dateFormat} onChange={(e) => setSystemData(p => ({ ...p, dateFormat: e.target.value }))} className={inputCls}>
                  <option value="YYYY/MM/DD">YYYY/MM/DD (2025/11/26)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (26/11/2025)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (11/26/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-11-26)</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY (26-11-2025)</option>
                  <option value="YYYY.MM.DD">YYYY.MM.DD (2025.11.26)</option>
                  <option value="DD.MM.YYYY">DD.MM.YYYY (26.11.2025)</option>
                  <option value="YYYY/M/D">YYYY/M/D (2025/11/26)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Clock size={16} className="text-primary" /> تنسيق الوقت</label>
                <select value={systemData.timeFormat} onChange={(e) => setSystemData(p => ({ ...p, timeFormat: e.target.value }))} className={inputCls}>
                  <option value="HH:mm:ss A">HH:mm:ss A (08:17:23 ص)</option>
                  <option value="HH:mm A">HH:mm A (08:17 ص)</option>
                  <option value="HH:mm:ss">HH:mm:ss (08:17:23)</option>
                  <option value="HH:mm">HH:mm (08:17)</option>
                  <option value="h:mm:ss A">h:mm:ss A (8:17:23 ص)</option>
                  <option value="h:mm A">h:mm A (8:17 ص)</option>
                  <option value="HH:mm:ss.SSS">HH:mm:ss.SSS (08:17:23.000)</option>
                  <option value="HH-mm-ss">HH-mm-ss (08-17-23)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">تنسيق التاريخ والوقت معاً</label>
                <select value={systemData.dateTimeFormat} onChange={(e) => setSystemData(p => ({ ...p, dateTimeFormat: e.target.value }))} className={inputCls}>
                  <option value="YYYY/MM/DD - HH:mm:ss A">YYYY/MM/DD - HH:mm:ss A (2025/11/26 - 08:17:23 ص)</option>
                  <option value="DD/MM/YYYY - HH:mm:ss A">DD/MM/YYYY - HH:mm:ss A (26/11/2025 - 08:17:23 ص)</option>
                  <option value="YYYY/MM/DD HH:mm:ss A">YYYY/MM/DD HH:mm:ss A (2025/11/26 08:17:23 ص)</option>
                  <option value="DD/MM/YYYY HH:mm:ss A">DD/MM/YYYY HH:mm:ss A (26/11/2025 08:17:23 ص)</option>
                  <option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss (2025-11-26 08:17:23)</option>
                  <option value="DD-MM-YYYY HH:mm:ss">DD-MM-YYYY HH:mm:ss (26-11-2025 08:17:23)</option>
                  <option value="YYYY/MM/DD - HH:mm A">YYYY/MM/DD - HH:mm A (2025/11/26 - 08:17 ص)</option>
                  <option value="DD/MM/YYYY - HH:mm A">DD/MM/YYYY - HH:mm A (26/11/2025 - 08:17 ص)</option>
                  <option value="YYYY.MM.DD HH:mm:ss">YYYY.MM.DD HH:mm:ss (2025.11.26 08:17:23)</option>
                  <option value="DD/MM/YYYY | HH:mm:ss A">DD/MM/YYYY | HH:mm:ss A (26/11/2025 | 08:17:23 ص)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">التوقيت الزمني</label>
                <select value={systemData.timezone} onChange={(e) => setSystemData(p => ({ ...p, timezone: e.target.value }))} className={inputCls}>
                  <option value="UTC">التوقيت العالمي (GMT/UTC)</option>
                  <option value="Africa/Cairo">أفريقيا/القاهرة (GMT+2)</option>
                  <option value="Asia/Amman">آسيا/عمّان (GMT+2/3)</option>
                  <option value="Asia/Baghdad">آسيا/بغداد (GMT+3)</option>
                  <option value="Asia/Bangkok">آسيا/بانكوك (GMT+7)</option>
                  <option value="Asia/Beirut">آسيا/بيروت (GMT+2/3)</option>
                  <option value="Asia/Dubai">آسيا/دبي (GMT+4)</option>
                  <option value="Asia/Hong_Kong">آسيا/هونغ كونغ (GMT+8)</option>
                  <option value="Asia/Jakarta">آسيا/جاكرتا (GMT+7)</option>
                  <option value="Asia/Kolkata">آسيا/كولكاتا (GMT+5:30)</option>
                  <option value="Asia/Kuwait">آسيا/الكويت (GMT+3)</option>
                  <option value="Asia/Riyadh">آسيا/الرياض (GMT+3)</option>
                  <option value="Asia/Tehran">آسيا/طهران (GMT+3:30)</option>
                  <option value="Asia/Tokyo">آسيا/طوكيو (GMT+9)</option>
                  <option value="Europe/Istanbul">أوروبا/اسطنبول (GMT+3)</option>
                  <option value="Europe/London">أوروبا/لندن (GMT+0/1)</option>
                  <option value="Europe/Moscow">أوروبا/موسكو (GMT+3)</option>
                  <option value="Europe/Paris">أوروبا/باريس (GMT+1/2)</option>
                  <option value="America/New_York">أمريكا/نيويورك (GMT-5/-4)</option>
                  <option value="America/Los_Angeles">أمريكا/لوس أنجلس (GMT-8/-7)</option>
                  <option value="Australia/Sydney">أستراليا/سيدني (GMT+10/11)</option>
                </select>
              </div>
              <button onClick={() => systemMutation.mutate()} disabled={systemMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {systemMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: contact ════════════ */}
          {activeSection === "contact" && (
            <div className="space-y-6">
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
                    <Droppable droppableId="contact-items-panel">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.contact_items.map((item, index) => {
                            const typeInfo = contactTypes.find(t => t.value === item.type) || contactTypes[0];
                            return (
                              <Draggable key={index} draggableId={`ci-p-${index}`} index={index}>
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
                    <Droppable droppableId="social-links-panel">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.social_links.map((link, index) => (
                            <Draggable key={index} draggableId={`sl-p-${index}`} index={index}>
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

              <button type="button" onClick={() => contactMutation.mutate()} disabled={contactMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {contactMutation.isPending ? "جارٍ الحفظ..." : "حفظ إعدادات التواصل"}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مساحة العمل</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من رغبتك في حذف مساحة العمل؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>
              حذف
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ─── Main export: wraps content in SlidePanel ───
export default function WorkspaceEditPanel({ wsId, open, onClose, onSaved }) {
  return (
    <SlidePanel open={open} onClose={onClose}>
      <div className="h-full flex flex-col" dir="rtl">
        {/* رأس الشاشة المنزلقة مع زر الرجوع */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ArrowRight size={18} />
          </button>
          <span className="text-sm font-semibold text-foreground">إعدادات مساحة العمل</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {open && wsId && (
            <WorkspaceSettingsContent wsId={wsId} onClose={onClose} onSaved={onSaved} />
          )}
        </div>
      </div>
    </SlidePanel>
  );
}