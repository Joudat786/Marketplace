import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import IconPickerPopover from "@/components/superadmin/IconPickerPopover";
import {
  ArrowLeft, Save, Trash2, Upload, Calendar, Clock, Building2, Settings,
  Phone, X, Copy, ClipboardPaste, Plus, GripVertical, User, MapPin,
  Paperclip, ZoomIn, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Sections ───
const SECTIONS = [
  { id: "workspace", label: "بيانات مساحة العمل", icon: Building2 },
  { id: "owner", label: "بيانات المالك", icon: User },
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

// ─── Helpers ───
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};
const hslFromRgb = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background";
const labelCls = "block text-sm font-semibold text-foreground mb-1.5";

// ─── ColorInput ───
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

// ─── LogoUpload ───
function LogoUpload({ label, value, onChange, darkBg = false }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        onChange(res.file_url);
        toast({ title: "تم رفع الصورة بنجاح" });
      } else {
        toast({ title: "خطأ", description: "لم يُرجع الخادم رابط الصورة", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ", description: "فشل رفع الصورة: " + err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  // تأكد أن القيمة رابط صحيح وليست null/undefined/""
  const hasValidValue = value && typeof value === 'string' && value.startsWith('http');

  return (
    <div className="flex flex-col gap-1">
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {hasValidValue ? (
        <div className={`relative w-full h-16 rounded-md border border-border overflow-hidden mb-1 ${darkBg ? "bg-slate-900" : "bg-secondary/30"}`}>
          <img
            src={value}
            alt={label}
            className="w-full h-full object-contain p-1"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className={`w-full h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center mb-1 ${darkBg ? "bg-slate-900" : "bg-secondary/20"}`}>
          <span className="text-[10px] text-muted-foreground">لا يوجد شعار</span>
        </div>
      )}
      <label className={`flex items-center justify-center gap-1 px-2 py-1.5 border rounded-md cursor-pointer transition-colors font-medium text-xs ${uploading ? "opacity-60 cursor-not-allowed border-border bg-muted" : "border-primary bg-primary/5 text-primary hover:bg-primary/10"}`}>
        <Upload size={11} /> {uploading ? "جارٍ الرفع..." : "رفع"}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
          className="hidden"
        />
      </label>
    </div>
  );
}

// ─── AttachmentBox ───
function AttachmentBox({ label, value, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        onChange(res.file_url);
        toast({ title: "تم الرفع" });
      }
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

export default function WorkspaceSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedWorkspace, refreshWorkspaces, updateWorkspaceData } = useWorkspace();
  // إذا لم يوجد id في URL، استخدم مساحة العمل المحددة حالياً
  const wsId = id || selectedWorkspace?.id;

  const [activeSection, setActiveSection] = useState("workspace");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ─── Workspace form state ───
  const [wsForm, setWsForm] = useState({
    name: "", slug: "", owner_email: "", owner_user_id: "",
    logo_url: "", status: "trial", plan: "free",
    currency: "SAR", timezone: "Asia/Riyadh", language: "ar",
    plan_expires_at: "", billing_cycle: "monthly",
    // بيانات المالك
    owner_name: "", owner_mobile: "", owner_nationality: "",
    owner_identity_type: "", owner_identity_number: "",
    owners: [],
    // الشركة
    company_name: "", commercial_register_number: "",
    commercial_register_issue_date: "", commercial_register_expiry_date: "",
    tax_number: "", tax_registration_expiry_date: "", activity_type: "",
    unified_national_number: "",
    // الموقع
    country: "SA", city: "",
    location_data: null,
    // المرفقات
    commercial_register_attachment: "", tax_certificate_attachment: "", identity_attachment: "",
    national_address_attachment: "", founding_contract_attachment: "",
    // التذييل
    footer_text: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);

  // ─── Brand settings state ───
  const [brandData, setBrandData] = useState({
    lightLogo: null, darkLogo: null, favicon: null, loadingIcon: null, footerLogo: null,
    brandName: "", footerText: "",
    primaryColor: "#6566c1", buttonColor: "#245EFF",
    tabsActiveColor: "#245EFF", tabsInactiveColor: "#fbed24",
    tableHeaderBgColor: "#E8EDFA", tableHeaderTextColor: "#1F1F1F"
  });

  // ─── System settings state ───
  const [systemData, setSystemData] = useState({
    dateFormat: "YYYY/MM/DD", timeFormat: "HH:mm:ss A",
    dateTimeFormat: "YYYY/MM/DD - HH:mm:ss A", timezone: "Asia/Riyadh"
  });

  // ─── Contact settings state ───
  const [contactData, setContactData] = useState({ contact_items: [], social_links: [] });

  // ─── Queries ───
  const { data: workspaceRaw, isLoading } = useQuery({
    queryKey: ["workspace", wsId],
    queryFn: () => base44.entities.Workspace.filter({ id: wsId }),
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

  // ─── Load data (فقط عند أول تحميل لكل wsId) ───
  const loadedWsIdRef = useRef(null);
  useEffect(() => {
    if (workspaceData && loadedWsIdRef.current !== workspaceData.id) {
      loadedWsIdRef.current = workspaceData.id;
      setWsForm({
        name: workspaceData.name || "",
        slug: workspaceData.slug || "",
        owner_email: workspaceData.owner_email || "",
        owner_user_id: workspaceData.owner_user_id || "",
        logo_url: workspaceData.logo_url || "",
        status: workspaceData.status || "trial",
        plan: workspaceData.plan || "free",
        currency: workspaceData.currency || "SAR",
        timezone: workspaceData.timezone || "Asia/Riyadh",
        language: workspaceData.language || "ar",
        plan_expires_at: workspaceData.plan_expires_at || "",
        billing_cycle: workspaceData.billing_cycle || "monthly",
        owner_name: workspaceData.owner_name || workspaceData.owners?.[0]?.name || "",
        owner_mobile: workspaceData.owner_mobile || workspaceData.owners?.[0]?.mobile || "",
        owner_nationality: workspaceData.owner_nationality || workspaceData.owners?.[0]?.nationality || "",
        owner_identity_type: workspaceData.owner_identity_type || workspaceData.owners?.[0]?.identity_type || "",
        owner_identity_number: workspaceData.owner_identity_number || workspaceData.owners?.[0]?.identity_number || "",
        owners: workspaceData.owners || [],
        company_name: workspaceData.company_name || "",
        unified_national_number: workspaceData.unified_national_number || "",
        commercial_register_number: workspaceData.commercial_register_number || "",
        commercial_register_issue_date: workspaceData.commercial_register_issue_date || "",
        commercial_register_expiry_date: workspaceData.commercial_register_expiry_date || "",
        tax_number: workspaceData.tax_number || "",
        tax_registration_expiry_date: workspaceData.tax_registration_expiry_date || "",
        activity_type: workspaceData.activity_type || "",
        country: workspaceData.country || workspaceData.location_data?.country || "SA",
        city: workspaceData.city || workspaceData.location_data?.city || "",
        location_data: workspaceData.location_data || null,
        commercial_register_attachment: workspaceData.commercial_register_attachment || "",
        founding_contract_attachment: workspaceData.founding_contract_attachment || "",
        tax_certificate_attachment: workspaceData.tax_certificate_attachment || "",
        identity_attachment: workspaceData.identity_attachment || "",
        national_address_attachment: workspaceData.national_address_attachment || workspaceData.owners?.[0]?.identity_attachment || "",
        footer_text: workspaceData.footer_text || "",
      });
      setLogoPreview(workspaceData.logo_url || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceData?.id]);

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

  // ─── Save workspace helper ───
  const saveToEntity = async (settingsType, payload) => {
    const existing = await base44.entities.GeneralSettings.filter({ settings_type: settingsType, workspace_id: wsId });
    const data = { ...payload, settings_type: settingsType, workspace_id: wsId, brand_name: payload.brand_name || settingsType };
    if (existing?.length > 0) return base44.entities.GeneralSettings.update(existing[0].id, data);
    return base44.entities.GeneralSettings.create(data);
  };

  // ─── Mutations ───
  // نحتفظ بمرجع للبيانات المُرسَلة
  const lastSentDataRef = useRef(null);

  const wsMutation = useMutation({
    mutationFn: (data) => {
      lastSentDataRef.current = data;
      return base44.functions.invoke('updateWorkspace', { workspace_id: wsId, data });
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات مساحة العمل" });
      // تحديث wsForm مباشرة من البيانات المُرسَلة - هذا يضمن ظهور البيانات بعد الحفظ
      if (lastSentDataRef.current) {
        setWsForm(prev => ({ ...prev, ...lastSentDataRef.current }));
      }
      // تحديث الكاش بدون إعادة تشغيل useEffect (loadedWsIdRef يبقى كما هو)
      queryClient.setQueryData(["workspace", wsId], (old) => {
        const oldArr = Array.isArray(old) ? old : [];
        const merged = { ...(oldArr[0] || {}), ...(lastSentDataRef.current || {}) };
        return [merged];
      });
    },
    onError: (e) => toast({ title: "خطأ", description: e.message, variant: "destructive" })
  });

  const brandMutation = useMutation({
    mutationFn: async () => {
      const lightLogo = brandData.lightLogo && brandData.lightLogo.startsWith('http') ? brandData.lightLogo : null;

      // حفظ إعدادات العلامة التجارية في GeneralSettings
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
      queryClient.invalidateQueries({ queryKey: ["workspace", wsId] });
      // تحديث WorkspaceContext فوراً ليظهر الشعار في القائمة الجانبية
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
    onSuccess: () => navigate("/workspaces")
  });

  // ─── Logo upload for workspace ───
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

  // ─── Contact helpers ───
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
          {/* Workspace Info */}
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

          {/* Nav Items */}
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

          {/* Delete Button */}
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
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          <ArrowLeft size={12} />
          <Link to="/workspaces" className="hover:text-foreground">مساحات العمل</Link>
          <ArrowLeft size={12} />
          <span className="text-foreground font-medium">{currentSection?.label}</span>
        </div>

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
            {/* Metadata */}
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
              {/* شعار مساحة العمل */}
              <div className="bg-secondary/20 border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-4 border-b border-border pb-2">شعار مساحة العمل</h3>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-lg bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {logoPreview ? <img src={logoPreview} alt="preview" className="w-full h-full object-cover" /> : <Upload size={28} className="text-muted-foreground" />}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="logo-upload" className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold cursor-pointer hover:bg-primary/20 transition-colors">
                      <Upload size={14} /> اختر الشعار
                    </label>
                    <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <p className="text-xs text-muted-foreground">PNG أو JPG</p>
                    {logoPreview && (
                      <button type="button" onClick={() => { setLogoPreview(null); setWsForm(p => ({ ...p, logo_url: "" })); }} className="flex items-center gap-1 text-destructive text-xs">
                        <Trash2 size={11} /> حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* بيانات مساحة العمل */}
              <div className="bg-secondary/20 border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">بيانات مساحة العمل</h3>
                <div>
                  <label className={labelCls}>اسم مساحة العمل *</label>
                  <input type="text" value={wsForm.name || ""} onChange={(e) => setWsForm(p => ({ ...p, name: e.target.value }))} placeholder="أدخل اسم مساحة العمل" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>اسم الشركة / المؤسسة</label>
                  <input type="text" value={wsForm.company_name || ""} onChange={(e) => setWsForm(p => ({ ...p, company_name: e.target.value }))} placeholder="أدخل اسم الشركة" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>نوع الكيان القانوني</label>
                  <input type="text" value={wsForm.activity_type || ""} onChange={(e) => setWsForm(p => ({ ...p, activity_type: e.target.value }))} placeholder="تجاري، طبي، تعليمي..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>نص التذييل</label>
                  <input type="text" value={wsForm.footer_text || ""} onChange={(e) => setWsForm(p => ({ ...p, footer_text: e.target.value }))} placeholder="أدخل نص التذييل" className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>الرقم الوطني الموحد</label>
                    <input type="text" value={wsForm.unified_national_number || ""} onChange={(e) => setWsForm(p => ({ ...p, unified_national_number: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>رقم السجل التجاري</label>
                    <input type="text" value={wsForm.commercial_register_number || ""} onChange={(e) => setWsForm(p => ({ ...p, commercial_register_number: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>الرقم الضريبي</label>
                    <input type="text" value={wsForm.tax_number || ""} onChange={(e) => setWsForm(p => ({ ...p, tax_number: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>تاريخ إصدار السجل التجاري</label>
                    <input type="date" value={wsForm.commercial_register_issue_date || ""} onChange={(e) => setWsForm(p => ({ ...p, commercial_register_issue_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>تاريخ انتهاء السجل التجاري</label>
                    <input type="date" value={wsForm.commercial_register_expiry_date || ""} onChange={(e) => setWsForm(p => ({ ...p, commercial_register_expiry_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>تاريخ نفاذ التسجيل الضريبي</label>
                    <input type="date" value={wsForm.tax_registration_expiry_date || ""} onChange={(e) => setWsForm(p => ({ ...p, tax_registration_expiry_date: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>



              {/* المرفقات */}
              <div className="bg-secondary/20 border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">المرفقات</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AttachmentBox label="السجل التجاري (مرفق)" value={wsForm.commercial_register_attachment} onChange={(v) => setWsForm(p => ({ ...p, commercial_register_attachment: v }))} />
                  <AttachmentBox label="عقد التأسيس (مرفق)" value={wsForm.founding_contract_attachment} onChange={(v) => setWsForm(p => ({ ...p, founding_contract_attachment: v }))} />
                  <AttachmentBox label="الشهادة الضريبية (مرفق)" value={wsForm.tax_certificate_attachment} onChange={(v) => setWsForm(p => ({ ...p, tax_certificate_attachment: v }))} />
                  <AttachmentBox label="الهوية (مرفق)" value={wsForm.identity_attachment} onChange={(v) => setWsForm(p => ({ ...p, identity_attachment: v }))} />
                  <AttachmentBox label="العنوان الوطني (مرفق)" value={wsForm.national_address_attachment} onChange={(v) => setWsForm(p => ({ ...p, national_address_attachment: v }))} />
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
            <div className="bg-secondary/20 border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">بيانات مالك الشركة / المؤسسة</h3>
              <div>
                <label className={labelCls}>اسم مالك الشركة / المؤسسة</label>
                <input type="text" value={wsForm.owner_name || ""} onChange={(e) => setWsForm(p => ({ ...p, owner_name: e.target.value }))} placeholder="أدخل الاسم الكامل للمالك" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>رقم جوال مالك الشركة / المؤسسة</label>
                <input type="tel" value={wsForm.owner_mobile || ""} onChange={(e) => setWsForm(p => ({ ...p, owner_mobile: e.target.value }))} placeholder="مثال: 0512345678" className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>جنسية مالك الشركة / المؤسسة</label>
                <select value={wsForm.owner_nationality || ""} onChange={(e) => setWsForm(p => ({ ...p, owner_nationality: e.target.value }))} className={inputCls} dir="rtl">
                  <option value="">-- اختر الجنسية --</option>
                  <option value="SA">سعودية</option>
                  <option value="AE">إماراتية</option>
                  <option value="KW">كويتية</option>
                  <option value="QA">قطرية</option>
                  <option value="EG">مصرية</option>
                  <option value="JO">أردنية</option>
                  <option value="SY">سورية</option>
                  <option value="YE">يمنية</option>
                  <option value="LB">لبنانية</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>نوع هوية مالك الشركة / المؤسسة</label>
                <select value={wsForm.owner_identity_type || ""} onChange={(e) => setWsForm(p => ({ ...p, owner_identity_type: e.target.value }))} className={inputCls} dir="rtl">
                  <option value="">-- اختر نوع الهوية --</option>
                  <option value="national_id">هوية وطنية</option>
                  <option value="resident_id">إقامة</option>
                  <option value="passport">جواز سفر</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>رقم هوية مالك الشركة / المؤسسة</label>
                <input type="text" value={wsForm.owner_identity_number || ""} onChange={(e) => setWsForm(p => ({ ...p, owner_identity_number: e.target.value }))} placeholder="أدخل رقم الهوية" className={inputCls} dir="ltr" />
              </div>

              <button onClick={() => wsMutation.mutate(wsForm)} disabled={wsMutation.isPending}
                className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Save size={15} /> {wsMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          )}

          {/* ════════════ SECTION: location ════════════ */}
          {activeSection === "location" && (
            <div className="bg-secondary/20 border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">الموقع والعنوان</h3>
              <div>
                <label className={labelCls}>الدولة</label>
                <select value={wsForm.country || "SA"} onChange={(e) => setWsForm(p => ({ ...p, country: e.target.value }))} className={inputCls} dir="rtl">
                  <option value="SA">المملكة العربية السعودية</option>
                  <option value="AE">الإمارات العربية المتحدة</option>
                  <option value="KW">الكويت</option>
                  <option value="QA">قطر</option>
                  <option value="BH">البحرين</option>
                  <option value="OM">عُمان</option>
                  <option value="EG">مصر</option>
                  <option value="JO">الأردن</option>
                  <option value="LB">لبنان</option>
                  <option value="SY">سوريا</option>
                  <option value="YE">اليمن</option>
                  <option value="IQ">العراق</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>المدينة</label>
                <input type="text" value={wsForm.city || ""} onChange={(e) => setWsForm(p => ({ ...p, city: e.target.value }))} placeholder="أدخل اسم المدينة" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>المنطقة الزمنية</label>
                <select value={wsForm.timezone || "Asia/Riyadh"} onChange={(e) => setWsForm(p => ({ ...p, timezone: e.target.value }))} className={inputCls} dir="rtl">
                  <option value="Asia/Riyadh">آسيا/الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">آسيا/دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">آسيا/الكويت (GMT+3)</option>
                  <option value="Asia/Baghdad">آسيا/بغداد (GMT+3)</option>
                  <option value="Asia/Beirut">آسيا/بيروت (GMT+2/3)</option>
                  <option value="Asia/Amman">آسيا/عمّان (GMT+2/3)</option>
                  <option value="Africa/Cairo">أفريقيا/القاهرة (GMT+2)</option>
                  <option value="Europe/Istanbul">أوروبا/اسطنبول (GMT+3)</option>
                  <option value="UTC">التوقيت العالمي (GMT/UTC)</option>
                </select>
              </div>

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

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>اسم العلامة التجارية</label>
                  <input type="text" value={brandData.brandName} onChange={(e) => setBrandData(p => ({ ...p, brandName: e.target.value }))} placeholder="أدخل اسم العلامة التجارية" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>نص التذييل</label>
                  <input type="text" value={brandData.footerText} onChange={(e) => setBrandData(p => ({ ...p, footerText: e.target.value }))} placeholder="أدخل نص التذييل" className={inputCls} />
                </div>
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
                  <option value="Africa/Johannesburg">أفريقيا/جوهانسبرج (GMT+2)</option>
                  <option value="Africa/Lagos">أفريقيا/لاغوس (GMT+1)</option>
                  <option value="Africa/Nairobi">أفريقيا/نيروبي (GMT+3)</option>
                  <option value="Asia/Amman">آسيا/عمّان (GMT+2/3)</option>
                  <option value="Asia/Baghdad">آسيا/بغداد (GMT+3)</option>
                  <option value="Asia/Bangkok">آسيا/بانكوك (GMT+7)</option>
                  <option value="Asia/Beirut">آسيا/بيروت (GMT+2/3)</option>
                  <option value="Asia/Dubai">آسيا/دبي (GMT+4)</option>
                  <option value="Asia/Hong_Kong">آسيا/هونغ كونغ (GMT+8)</option>
                  <option value="Asia/Jakarta">آسيا/جاكرتا (GMT+7)</option>
                  <option value="Asia/Kolkata">آسيا/كولكاتا (GMT+5:30)</option>
                  <option value="Asia/Kuwait">آسيا/الكويت (GMT+3)</option>
                  <option value="Asia/Manila">آسيا/مانيلا (GMT+8)</option>
                  <option value="Asia/Muscat">آسيا/مسقط (GMT+4)</option>
                  <option value="Asia/Riyadh">آسيا/الرياض (GMT+3)</option>
                  <option value="Asia/Seoul">آسيا/سيول (GMT+9)</option>
                  <option value="Asia/Shanghai">آسيا/شنغهاي (GMT+8)</option>
                  <option value="Asia/Singapore">آسيا/سنغافورة (GMT+8)</option>
                  <option value="Asia/Tehran">آسيا/طهران (GMT+3:30)</option>
                  <option value="Asia/Tokyo">آسيا/طوكيو (GMT+9)</option>
                  <option value="Europe/Amsterdam">أوروبا/أمستردام (GMT+1/2)</option>
                  <option value="Europe/Athens">أوروبا/أثينا (GMT+2/3)</option>
                  <option value="Europe/Berlin">أوروبا/برلين (GMT+1/2)</option>
                  <option value="Europe/Istanbul">أوروبا/اسطنبول (GMT+3)</option>
                  <option value="Europe/London">أوروبا/لندن (GMT+0/1)</option>
                  <option value="Europe/Moscow">أوروبا/موسكو (GMT+3)</option>
                  <option value="Europe/Paris">أوروبا/باريس (GMT+1/2)</option>
                  <option value="America/Chicago">أمريكا/شيكاغو (GMT-6/-5)</option>
                  <option value="America/Los_Angeles">أمريكا/لوس أنجلس (GMT-8/-7)</option>
                  <option value="America/New_York">أمريكا/نيويورك (GMT-5/-4)</option>
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
                    <Droppable droppableId="contact-items">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.contact_items.map((item, index) => {
                            const typeInfo = contactTypes.find(t => t.value === item.type) || contactTypes[0];
                            return (
                              <Draggable key={index} draggableId={`ci-${index}`} index={index}>
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
                    <Droppable droppableId="social-links">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.social_links.map((link, index) => (
                            <Draggable key={index} draggableId={`sl-${index}`} index={index}>
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