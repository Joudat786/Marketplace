import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Building2, User, FileText, MapPin, Save, LogOut, Upload, ZoomIn, Download, Plus, GripVertical, X, Loader2, Maximize2, Trash2 } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import LocationSection from "@/components/client/LocationSection";
import DateInput from "@/components/ui/DateInput";
import MultiLangInput from "@/components/ui/MultiLangInput";
import EntityTypeSelect from "@/components/ui/EntityTypeSelect";
import { cn } from "@/lib/utils";

const SIDE_SECTIONS = [
  { id: "company", label: "بيانات الشركة / المؤسسة", icon: Building2 },
  { id: "owner", label: "بيانات المالك / الملاك", icon: User },
  { id: "attachments", label: "المستندات والمرفقات", icon: FileText },
  { id: "location", label: "الموقع والعنوان", icon: MapPin },
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

// مكون مرفق مدمج داخل صف المالك
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

// قسم المرفقات الكامل
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
              <div className="flex-1 flex items-center px-3 py-3 border-l border-gray-300 gap-2">
                <span className="text-sm text-foreground truncate" title={name}>{name || row.label}</span>
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
                        const metaKey = row.key + "_meta";
                        setForm((f) => ({ ...f, [row.key]: "", [metaKey]: {} }));
                      } else {
                        removeExtra(row.extraIdx);
                      }
                    }}
                    className="flex items-center justify-center w-full h-full hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive">
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

export default function OnboardingModal({ user, platformClient }) {
  const [activeSection, setActiveSection] = useState("company");
  const [formData, setFormData] = useState({
    company_name: platformClient?.company_name || "",
    owner_name: platformClient?.owner_name || user?.full_name || "",
    phone: platformClient?.phone || "",
    unified_national_number: platformClient?.unified_national_number || "",
    commercial_register_number: platformClient?.commercial_register_number || "",
    commercial_register_issue_date: platformClient?.commercial_register_issue_date || "",
    commercial_register_expiry_date: platformClient?.commercial_register_expiry_date || "",
    tax_number: platformClient?.tax_number || "",
    tax_registration_expiry_date: platformClient?.tax_registration_expiry_date || "",
    activity_type: platformClient?.activity_type || "",
    commercial_register_attachment: platformClient?.commercial_register_attachment || "",
    founding_contract_attachment: platformClient?.founding_contract_attachment || "",
    tax_certificate_attachment: platformClient?.tax_certificate_attachment || "",
    identity_attachment: platformClient?.identity_attachment || "",
    national_address_attachment: platformClient?.national_address_attachment || "",
    extra_attachments: platformClient?.extra_attachments || [],
    owners: (platformClient?.owners && platformClient.owners.length > 0) ? platformClient.owners : [{ ...emptyOwner }],
    owner_data: platformClient?.owner_data || { nationality: "", identity_type: "", identity_number: "" },
    location_data: platformClient?.location_data || { lat: null, lng: null, national_address_code: "", country: "", region: "", city: "", governorate: "", neighborhood: "", street: "", address_description: "" },
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedWorkspace, refreshWorkspaces } = useWorkspace();

  const isSuperAdmin = user?.role === 'super_admin';
  const hasOwnerData = platformClient?.owner_name?.trim() || (platformClient?.owners && platformClient.owners.length > 0 && platformClient.owners[0]?.name?.trim());
  const hasCompletedOnboarding = !!platformClient?.data_completed_date;
  const needsOnboarding = !saved && !isSuperAdmin && !hasCompletedOnboarding && (!platformClient?.id || !platformClient?.company_name?.trim() || !hasOwnerData);

  const setForm = setFormData;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const [byEmail, byCreator] = await Promise.all([
        base44.entities.PlatformClient.filter({ email: user.email }),
        base44.entities.PlatformClient.filter({ created_by: user.email }),
      ]);
      const map = new Map();
      [...byEmail, ...byCreator].forEach(c => map.set(c.id, c));
      const existing = Array.from(map.values());

      if (existing.length > 0) {
        const sorted = existing.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        for (let i = 1; i < sorted.length; i++) {
          try { await base44.entities.PlatformClient.delete(sorted[i].id); } catch (_) {}
        }
        return await base44.entities.PlatformClient.update(sorted[0].id, { ...data, email: user.email });
      } else {
        return await base44.entities.PlatformClient.create({ ...data, email: user.email, status: 'active' });
      }
    },
    onSuccess: async (savedClient) => {
      toast({ title: "تم", description: "تم حفظ بيانات الشركة بنجاح ✅" });
      queryClient.invalidateQueries({ queryKey: ["platformClient", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["platformClient"] });
      setSaved(true);
      const updatedWorkspaces = await refreshWorkspaces();
      const clientWs = (updatedWorkspaces || []).find(w => !w.is_admin_workspace);
      const wsId = clientWs?.id || selectedWorkspace?.id;
      const companyNameStr = typeof formData.company_name === "object" ? (formData.company_name.ar || Object.values(formData.company_name)[0] || "") : formData.company_name;
      if (wsId && companyNameStr?.trim()) {
        try { await base44.entities.Workspace.update(wsId, { name: companyNameStr.trim() }); } catch (e) { console.error(e); }
      }
      setTimeout(() => navigate(wsId ? `/workspaces?edit=${wsId}` : "/workspaces"), 400);
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    const companyNameVal = typeof formData.company_name === "object" ? (formData.company_name.ar || Object.values(formData.company_name)[0] || "") : formData.company_name;
    if (!companyNameVal?.trim()) { toast({ title: "تنبيه", description: "اسم الشركة إجباري", variant: "destructive" }); return; }
    if (!formData.owner_name?.trim()) { toast({ title: "تنبيه", description: "اسم المالك/المدير إجباري", variant: "destructive" }); return; }

    // التحقق من وجود مالك واحد على الأقل مع الاسم والبريد ورقم الجوال
    const owners = formData.owners || [];
    const validOwners = owners.filter(o => o.name?.trim());
    if (validOwners.length === 0) {
      toast({ title: "تنبيه", description: "يجب إضافة مالك واحد على الأقل في قسم (بيانات المالك / الملاك)", variant: "destructive" });
      setActiveSection("owner");
      return;
    }
    const firstOwner = validOwners[0];
    if (!firstOwner.email?.trim()) {
      toast({ title: "تنبيه", description: "البريد الإلكتروني للمالك إجباري", variant: "destructive" });
      setActiveSection("owner");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(firstOwner.email.trim())) {
      toast({ title: "تنبيه", description: "البريد الإلكتروني للمالك غير صحيح", variant: "destructive" });
      setActiveSection("owner");
      return;
    }
    if (!firstOwner.mobile?.trim()) {
      toast({ title: "تنبيه", description: "رقم جوال المالك إجباري", variant: "destructive" });
      setActiveSection("owner");
      return;
    }

    const now = new Date().toISOString();
    const dataToSave = {
      ...formData,
      company_name: typeof formData.company_name === "object"
        ? (formData.company_name.ar || Object.values(formData.company_name)[0] || "")
        : formData.company_name,
      // سجّل تاريخ إكمال البيانات فقط إذا لم يكن مسجلاً من قبل
      data_completed_date: platformClient?.data_completed_date || now,
      // سجّل تاريخ الانضمام إذا لم يكن موجوداً
      join_date: platformClient?.join_date || platformClient?.created_date || now,
    };
    saveMutation.mutate(dataToSave);
  };

  if (!needsOnboarding) return null;

  return (
    <>
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader className="text-right items-end">
            <AlertDialogTitle className="text-right w-full">تأكيد تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription className="text-right w-full">هل أنت متأكد من تسجيل الخروج؟ ستحتاج إلى تسجيل الدخول مرة أخرى لاستكمال التسجيل.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-start">
            <AlertDialogAction onClick={() => base44.auth.logout()} className="bg-destructive hover:bg-destructive/90">تسجيل الخروج</AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SlidePanel open={needsOnboarding} onClose={() => queryClient.invalidateQueries({ queryKey: ["platformClient"] })}>
        <div className="flex flex-col h-full" dir="rtl">
          {/* الرأس */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">إكمال بيانات الشركة</h1>
              <p className="text-sm text-muted-foreground mt-0.5">يرجى إدخال البيانات المطلوبة لاستكمال التسجيل</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg text-sm font-semibold hover:bg-destructive/20 transition-colors"
              >
                <LogOut size={15} />
                خروج
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                <Save size={15} />
                {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
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
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">نوع الكيان</label>
                      <EntityTypeSelect
                        value={formData.activity_type || ""}
                        onChange={(val) => setFormData((f) => ({ ...f, activity_type: val }))}
                      />
                    </div>
                    <MultiLangInput
                      label="اسم الشركة / المؤسسة *"
                      required
                      values={typeof formData.company_name === "object" ? formData.company_name : { ar: formData.company_name || "" }}
                      onChange={(lang, val) => setFormData((f) => ({
                        ...f,
                        company_name: typeof f.company_name === "object"
                          ? { ...f.company_name, [lang]: val }
                          : { ar: f.company_name || "", [lang]: val }
                      }))}
                      placeholder="أدخل اسم الشركة"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الحالة</label>
                      <input type="text"
                        value={platformClient?.status === "active" ? "نشط" : platformClient?.status === "suspended" ? "موقوف" : platformClient?.status === "cancelled" ? "ملغي" : "نشط"}
                        readOnly
                        className="w-full border border-border bg-muted rounded-lg px-3 py-2 text-sm text-center cursor-default text-muted-foreground" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ الانضمام</label>
                      <input type="text" value={new Date().toLocaleDateString("ar-SA")} readOnly
                        className="w-full border border-border bg-muted rounded-lg px-3 py-2 text-sm text-right cursor-default" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الرقم الوطني الموحد</label>
                      <input type="text" value={formData.unified_national_number || ""}
                        onChange={(e) => setFormData((f) => ({ ...f, unified_national_number: e.target.value }))}
                        placeholder="أدخل الرقم الوطني الموحد"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">رقم السجل التجاري</label>
                      <input type="text" value={formData.commercial_register_number || ""}
                        onChange={(e) => setFormData((f) => ({ ...f, commercial_register_number: e.target.value }))}
                        placeholder="أدخل رقم السجل التجاري"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ إصدار السجل التجاري</label>
                      <DateInput value={formData.commercial_register_issue_date || ""} onChange={(v) => setFormData((f) => ({ ...f, commercial_register_issue_date: v }))} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ انتهاء السجل التجاري</label>
                      <DateInput value={formData.commercial_register_expiry_date || ""} onChange={(v) => setFormData((f) => ({ ...f, commercial_register_expiry_date: v }))} className="w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">الرقم الضريبي</label>
                      <input type="text" value={formData.tax_number || ""}
                        onChange={(e) => setFormData((f) => ({ ...f, tax_number: e.target.value }))}
                        placeholder="أدخل الرقم الضريبي"
                        className="w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 text-right">تاريخ نفاذ التسجيل الضريبي</label>
                      <DateInput value={formData.tax_registration_expiry_date || ""} onChange={(v) => setFormData((f) => ({ ...f, tax_registration_expiry_date: v }))} className="w-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* بيانات المالك */}
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
                    <Droppable droppableId="owners-list">
                      {(provided) => (
                        <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                          {(formData.owners || [{ ...emptyOwner }]).map((owner, idx) => (
                            <Draggable key={idx} draggableId={`owner-${idx}`} index={idx}>
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
                                  <button type="button" onClick={() => { if ((formData.owners || []).length === 1) return; setFormData((f) => ({ ...f, owners: (f.owners || []).filter((_, i) => i !== idx) })); }} disabled={(formData.owners || []).length === 1} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-30 transition-colors">
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
      </SlidePanel>
    </>
  );
}