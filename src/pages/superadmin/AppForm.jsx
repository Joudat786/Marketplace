import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Save, X, Upload, Trash2, GripVertical, Eye, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MultiLangInput from "@/components/ui/MultiLangInput";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import IntegrationFieldsEditor from "@/components/apps/IntegrationFieldsEditor";
import { AppVideoEditor } from "@/components/apps/AppVideoSection";
import AppSidebarItemsEditor from "@/components/apps/AppSidebarItemsEditor";
import RelatedAppsEditor from "@/components/apps/RelatedAppsEditor";

// ─── Dropdown لاختيار التصنيفات ───
function CategoriesDropdown({ categories, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));

  const toggleAll = () => {
    if (allSelected) {
      // إلغاء تحديد الكل من المفلترة فقط
      const filteredIds = filtered.map(c => c.id);
      onChange(selected.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filtered.map(c => c.id);
      const merged = [...new Set([...selected, ...filteredIds])];
      onChange(merged);
    }
  };

  const toggle = (id) => {
    const updated = selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id];
    onChange(updated);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="w-full flex items-center justify-between border border-border rounded-lg px-4 py-2.5 bg-white text-right focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-secondary/20 transition-colors"
      >
        <span className="text-sm text-foreground truncate">
          {selected.length === 0 ? "اختر التصنيفات..." : `${selected.length} تصنيف محدد`}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0 mr-2">
          {selected.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{selected.length}</span>
          )}
          <svg className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
          {/* بحث */}
          <div className="p-2 border-b border-border/50">
            <input
              type="text"
              placeholder="ابحث عن تصنيف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
            />
          </div>
          {/* تحديد الكل */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors text-right"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${allSelected ? "border-primary bg-primary" : "border-border"}`}>
              {allSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
            </div>
            <span className="text-sm font-bold text-foreground">تحديد الكل ({filtered.length})</span>
          </button>
          {/* القائمة */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج</p>
            ) : filtered.map(cat => {
              const isChecked = selected.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors border-b border-border/30 last:border-0 ${isChecked ? "bg-primary/5" : "hover:bg-secondary/40"}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? "border-primary bg-primary" : "border-border"}`}>
                    {isChecked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  <span className="text-sm text-foreground flex-1">{cat.name}</span>
                </button>
              );
            })}
          </div>
          {/* Footer */}
          <div className="border-t border-border px-4 py-2 bg-secondary/20 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{selected.length} محدد</span>
            <button type="button" onClick={() => setOpen(false)} className="text-xs bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">تم</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dropdown لاختيار التطبيقات الرئيسية ───
function ParentAppsDropdown({ allApps, appId, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = { current: null };

  const eligibleApps = allApps.filter(a => a.id !== appId);
  const filteredApps = eligibleApps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const selectedApps = eligibleApps.filter(a => selected.includes(a.id));

  return (
    <div className="relative" ref={r => dropRef.current = r}>
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="w-full flex items-center justify-between border border-border rounded-lg px-4 py-2.5 bg-white text-right focus:outline-none focus:ring-2 focus:ring-violet-400/30 hover:bg-secondary/20 transition-colors"
      >
        <span className="text-sm text-foreground truncate">
          {selectedApps.length === 0
            ? "اختر التطبيقات الرئيسية..."
            : selectedApps.map(a => a.name).join("، ")}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0 mr-2">
          {selectedApps.length > 0 && (
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{selectedApps.length}</span>
          )}
          <svg className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-xl overflow-hidden">
          {/* حقل البحث */}
          <div className="p-2 border-b border-border/50 flex-shrink-0">
            <input
              type="text"
              placeholder="ابحث عن تطبيق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-right"
            />
          </div>

          {/* القائمة */}
          <div className="max-h-48 overflow-y-auto">
            {filteredApps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">{search ? "لا توجد نتائج" : "لا توجد تطبيقات"}</p>
            ) : filteredApps.map(a => {
              const isChecked = selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const updated = isChecked ? selected.filter(id => id !== a.id) : [...selected, a.id];
                    onChange(updated);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors border-b border-border/50 last:border-0 ${isChecked ? "bg-violet-50" : "hover:bg-secondary/40"}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? "border-violet-500 bg-violet-500" : "border-border"}`}>
                    {isChecked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  {a.icon_url && <img src={a.icon_url} alt="" className="w-6 h-6 rounded object-contain flex-shrink-0" />}
                  <span className="text-sm font-semibold text-foreground flex-1 truncate">{a.name}</span>
                </button>
              );
            })}
          </div>

          {/* الفوتر */}
          <div className="border-t border-border px-4 py-2 bg-secondary/20 flex justify-between items-center flex-shrink-0">
            <span className="text-xs text-muted-foreground">{selected.length} محدد</span>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-primary font-semibold hover:underline">تم</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppForm({ embeddedAppId, onClose, onSaved } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appId = embeddedAppId !== undefined ? embeddedAppId : searchParams.get("id");
  const isEmbedded = onClose !== undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    icon_url: "",
    categories: [],
    primary_category: "",
    is_free: true,
    currency: "SAR",
    monthly_price: 0,
    yearly_price: 0,
    has_trial: false,
    trial_days: 14,
    super_admin_can_install: true,
    partners_can_install: false,
    clients_can_install: true,
    show_in_sidebar: false,
    is_active: true,
    is_ready: false,
    integration_fields: [],
    visibility_mode: "all",
    allowed_plan_ids: [],
    restriction_message: "هذا التطبيق متاح لباقات مخصصة فقط",
    allow_custom_name: false,
    allow_custom_icon: false,
    is_addon: false,
    parent_app_id: "",
    parent_app_ids: [],
    app_type: "service",
    video_url: "",
    video_type: "youtube",
    sidebar_items: [],
    related_apps: [],
    delete_data_on_uninstall: false,
  });

  const [previewIcon, setPreviewIcon] = useState(null);

  // جلب جميع التطبيقات للاختيار منها كأصل
  const { data: allApps = [] } = useQuery({
    queryKey: ["apps-for-parent"],
    queryFn: () => base44.entities.App.list()
  });

  // جلب العملات
  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => base44.entities.Currency.list()
  });

  // جلب الباقات
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.Plan.list()
  });

  // جلب التصنيفات
  const { data: categories = [] } = useQuery({
    queryKey: ["appCategories"],
    queryFn: () => base44.entities.AppCategory.list()
  });

  // جلب بيانات التطبيق عند التعديل
  const { data: appData } = useQuery({
    queryKey: ["app", appId],
    queryFn: () => appId ? base44.entities.App.list().then(apps => apps.find(a => a.id === appId)) : null,
    enabled: !!appId
  });

  useEffect(() => {
    if (appData && categories.length > 0) {
      // تحويل أسماء التصنيفات إلى معرّفات عند التحميل - تجاهل التصنيفات غير الموجودة
      const categoryIds = appData.categories?.reduce((acc, catName) => {
        const cat = categories.find(c => c.name === catName);
        if (cat) acc.push(cat.id);
        return acc;
      }, []) || [];
      // تحويل اسم primary_category إلى معرّف (يدعم الاسم والـ ID كليهما)
      const primaryCatId = appData.primary_category
        ? (categories.find(c => c.id === appData.primary_category)?.id 
           || categories.find(c => c.name === appData.primary_category)?.id 
           || "")
        : "";
      setFormData(prev => ({
        ...prev,
        ...appData,
        categories: categoryIds,
        primary_category: primaryCatId,
        short_description: appData.short_description ?? "",
        is_free: appData.is_free ?? true,
        currency: appData.currency ?? "SAR",
        visibility_mode: appData.visibility_mode ?? "all",
        allowed_plan_ids: appData.allowed_plan_ids ?? [],
        restriction_message: appData.restriction_message ?? "هذا التطبيق متاح لباقات مخصصة فقط",
        is_addon: appData.is_addon ?? false,
        parent_app_id: appData.parent_app_id ?? "",
        parent_app_ids: appData.parent_app_ids ?? (appData.parent_app_id ? [appData.parent_app_id] : []),
        app_type: appData.app_type ?? "service",
        video_url: appData.video_url ?? "",
        video_type: appData.video_type ?? "youtube",
        sidebar_items: appData.sidebar_items ?? [],
        related_apps: appData.related_apps ?? [],
        delete_data_on_uninstall: appData.delete_data_on_uninstall ?? false,
      }));
      setPreviewIcon(appData.icon_url);
    }
  }, [appData, categories]);

  // رفع الصورة
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  // حفظ التطبيق
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (appId) {
        return await base44.entities.App.update(appId, data);
      } else {
        return await base44.entities.App.create(data);
      }
    },
    onSuccess: () => {
      toast({ title: "نجح", description: appId ? "تم تحديث التطبيق بنجاح" : "تم إضافة التطبيق بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["sidebarApps"] });
      if (isEmbedded) { onSaved?.(); onClose?.(); } else navigate("/super-admin/app-manager");
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  // حذف التطبيق
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke("deleteAppCompletely", { appId });
    },
    onSuccess: () => {
      toast({ title: "نجح", description: "تم حذف التطبيق بالكامل من النظام" });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["sidebarApps"] });
      if (isEmbedded) { onSaved?.(); onClose?.(); } else navigate("/super-admin/app-manager");
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadMutation.mutateAsync(file);
      setFormData({ ...formData, icon_url: url });
      setPreviewIcon(url);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
    }
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => {
      const updated = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: updated };
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "خطأ", description: "اسم التطبيق مطلوب", variant: "destructive" });
      return;
    }
    if (formData.is_addon && (!formData.parent_app_ids || formData.parent_app_ids.length === 0)) {
      toast({ title: "خطأ", description: "يجب اختيار تطبيق رئيسي واحد على الأقل عند تفعيل خيار الإضافة (Add-on)", variant: "destructive" });
      return;
    }
    // تحويل معرّفات التصنيفات إلى أسماء + تحويل primary_category للاسم أيضاً
    const categoryNames = formData.categories.map(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.name || catId;
    });
    const primaryCatName = formData.primary_category 
      ? categories.find(c => c.id === formData.primary_category)?.name || formData.primary_category
      : "";
    
    // استخراج معرف اليوتيوب فقط إذا كان نوع الفيديو youtube
    let videoUrlToSave = formData.video_url;
    if (formData.video_type === "youtube" && formData.video_url) {
      const youtubeId = extractYoutubeId(formData.video_url);
      if (youtubeId) {
        videoUrlToSave = youtubeId;
      }
    }
    
    const dataToSave = { 
      ...formData, 
      video_url: videoUrlToSave,
      categories: categoryNames, 
      primary_category: primaryCatName,
      is_free: formData.is_free,
      currency: formData.currency
    };
    saveMutation.mutate(dataToSave);
  };

  // استخراج معرف اليوتيوب
  const extractYoutubeId = (url) => {
    if (!url) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /v=([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleDelete = () => {
    if (window.confirm("هل أنت متأكد من حذف هذا التطبيق؟")) {
      deleteMutation.mutate();
    }
  };



  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        <button
          onClick={isEmbedded ? onClose : () => navigate("/super-admin/app-manager")}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{appId ? "تعديل التطبيق" : "إضافة تطبيق جديد"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدير الباقات والتطبيقات / {appId ? "تعديل" : "إضافة"}</p>
        </div>
      </div>

      {/* حاوية رئيسية: النموذج */}
      <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="media">الوسائط</TabsTrigger>
              <TabsTrigger value="categories">التصنيفات والنوع</TabsTrigger>
              <TabsTrigger value="pricing">التسعير</TabsTrigger>
              <TabsTrigger value="visibility">الصلاحيات والظهور</TabsTrigger>
              <TabsTrigger value="integration">حقول الربط</TabsTrigger>
              <TabsTrigger value="related" className="relative">
                المتطلبات
                {formData.related_apps?.filter(r => r.relation_type === "required_child").length > 0 && (
                  <span className="absolute -top-1 -left-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
                    {formData.related_apps.filter(r => r.relation_type === "required_child").length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

          {/* التبويب الأول: المعلومات الأساسية + الصلاحيات */}
          <TabsContent value="basic" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-8">
            {/* اسم التطبيق */}
            <div>
              <MultiLangInput
                label="اسم التطبيق"
                required
                values={{ ar: formData.name || "", en: formData.name_en || "" }}
                onChange={(code, val) => {
                  if (code === "ar") setFormData(p => ({ ...p, name: val }));
                  else setFormData(p => ({ ...p, [`name_${code}`]: val }));
                }}
                placeholder={{ ar: "أدخل اسم التطبيق", en: "Enter app name" }}
              />
            </div>

            {/* الوصف المختصر */}
            <div>
              <MultiLangInput
                label="وصف مختصر"
                values={{ ar: formData.short_description || "", en: formData.short_description_en || "" }}
                onChange={(code, val) => {
                  if (code === "ar") setFormData(p => ({ ...p, short_description: val }));
                  else setFormData(p => ({ ...p, [`short_description_${code}`]: val }));
                }}
                placeholder={{ ar: "وصف قصير لا يتجاوز سطراً واحداً", en: "Short description" }}
              />
              <span className="text-xs text-muted-foreground">(يظهر في متجر التطبيقات وأعلى نافذة الإعداد)</span>
            </div>

            {/* وصف التطبيق التفصيلي */}
            <div>
              <MultiLangInput
                label="وصف التطبيق التفصيلي"
                multiline
                rows={4}
                values={{ ar: formData.description || "", en: formData.description_en || "" }}
                onChange={(code, val) => {
                  if (code === "ar") setFormData(p => ({ ...p, description: val }));
                  else setFormData(p => ({ ...p, [`description_${code}`]: val }));
                }}
                placeholder={{ ar: "أدخل وصف تفصيلي للتطبيق", en: "Enter detailed description" }}
              />
              <span className="text-xs text-muted-foreground">(يظهر في تبويبة الوصف والاستخدام)</span>
            </div>



            {/* ── النمط: تطبيق رئيسي أم إضافة ── */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-1">النمط</h3>
              <p className="text-xs text-muted-foreground mb-4">اختر ما إذا كان التطبيق مستقلاً أم إضافة لتطبيق آخر</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${!formData.is_addon ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="app_pattern" checked={!formData.is_addon} onChange={() => {
                    if (formData.is_addon) {
                      if (!window.confirm("تحذير: تحويل هذا التطبيق إلى مستقل.\n\nتأكد من إضافته لتصنيف حتى يظهر في المتجر.\n\nهل تريد المتابعة؟")) return;
                      setFormData({ ...formData, is_addon: false, parent_app_id: "", parent_app_ids: [] });
                    }
                  }} className="hidden" />
                  <span className="text-2xl">📦</span>
                  <span className="text-sm font-bold text-foreground">تطبيق رئيسي مستقل</span>
                  <span className="text-xs text-muted-foreground text-center">(يظهر في المتجر)</span>
                </label>
                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.is_addon ? 'border-violet-400 bg-violet-50' : 'border-border hover:border-violet-400'}`}>
                  <input type="radio" name="app_pattern" checked={formData.is_addon} onChange={() => setFormData({ ...formData, is_addon: true })} className="hidden" />
                  <span className="text-2xl">🧩</span>
                  <span className="text-sm font-bold text-foreground">إضافة اختيارية</span>
                  <span className="text-xs text-muted-foreground text-center">(تابعة لتطبيق آخر)</span>
                </label>
              </div>
              {formData.is_addon && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mt-4">
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    التطبيقات الرئيسية <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-muted-foreground mr-1">(يمكن اختيار أكثر من تطبيق)</span>
                  </label>
                  {formData.parent_app_ids.length === 0 && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                      <span>⚠️</span>
                      <span>يجب اختيار تطبيق رئيسي واحد على الأقل — بدونه لن يظهر هذا التطبيق في أي مكان!</span>
                    </div>
                  )}
                  <ParentAppsDropdown
                    allApps={allApps}
                    appId={appId}
                    selected={formData.parent_app_ids}
                    onChange={(updated) => setFormData({ ...formData, parent_app_ids: updated, parent_app_id: updated[0] || "" })}
                  />
                </div>
              )}
            </div>

            {/* الحالة */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">الحالة</h3>
              <label className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors mb-3">
                <span className="text-sm font-semibold text-foreground">مفعل</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.is_active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                    formData.is_active ? "right-1" : "right-7"
                  }`} />
                </button>
              </label>

              {/* جاهز للنشر */}
              <div className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.is_ready
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-dashed border-gray-300 bg-gray-50"
              }`}>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {formData.is_ready ? "✅ جاهز للنشر" : "🔜 قيد التطوير (قريباً)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formData.is_ready
                      ? "التطبيق مربوط فعلياً ويمكن للعملاء تثبيته واستخدامه"
                      : "التطبيق معروض فقط كـ placeholder ولا يمكن تثبيته بعد"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_ready: !formData.is_ready })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.is_ready ? "bg-emerald-500" : "bg-muted"
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                    formData.is_ready ? "right-1" : "right-7"
                  }`} />
                </button>
              </div>
            </div>
          </TabsContent>

          {/* تبويب الوسائط */}
          <TabsContent value="media" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-8">
            {/* أيقونة التطبيق */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">أيقونة التطبيق</h3>
              <p className="text-xs text-muted-foreground mb-4">الصورة التي تمثّل التطبيق في المتجر والقوائم</p>
              <div className="border-2 border-dashed border-border rounded-lg p-6 space-y-4">
                {previewIcon && (
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={previewIcon}
                      alt="معاينة"
                      className="w-full h-full object-contain rounded-lg border border-border p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, icon_url: "" });
                        setPreviewIcon(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-secondary/30 p-4 rounded-lg transition-colors">
                  <Upload size={32} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">اضغط لرفع صورة</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG (أقل من 2MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadMutation.isPending}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* الفيديو التوضيحي */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-1">الفيديو التوضيحي</h3>
              <p className="text-xs text-muted-foreground mb-4">فيديو يشرح التطبيق للمستخدمين قبل الاشتراك — يظهر في تبويبة الوصف أعلى النص</p>
              <AppVideoEditor
                videoUrl={formData.video_url}
                videoType={formData.video_type}
                onVideoUrlChange={(url) => setFormData(prev => ({ ...prev, video_url: url }))}
                onVideoTypeChange={(type) => setFormData(prev => ({ ...prev, video_type: type }))}
              />
            </div>
          </TabsContent>

          {/* التبويب الثاني: التصنيفات والنوع */}
          <TabsContent value="categories" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-8">
            {/* التصنيفات المتعددة - Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">التصنيفات التي يظهر فيها التطبيق</label>
              <CategoriesDropdown
                categories={[...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))}
                selected={formData.categories}
                onChange={(updated) => setFormData(prev => ({ ...prev, categories: updated }))}
              />
              {/* عرض التصنيفات المختارة */}
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.categories.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                        <button type="button" onClick={() => handleCategorySelect(catId)} className="text-primary hover:text-destructive transition-colors">×</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* التصنيف الرئيسي */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">التصنيف الرئيسي *</label>
              <select
                value={formData.primary_category}
                onChange={(e) => setFormData({ ...formData, primary_category: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">اختر من التصنيفات المختارة أعلاه</option>
                {categories
                  .filter(cat => formData.categories.includes(cat.id))
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                }
              </select>
            </div>

            {/* نوع التطبيق: واجهة أم خدمة */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-1">نوع التطبيق</h3>
              <p className="text-xs text-muted-foreground mb-4">هل يفتح المستخدم شاشة للتطبيق أم أنه يعمل في الخلفية فقط؟</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.app_type === 'ui' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="app_type" value="ui" checked={formData.app_type === 'ui'} onChange={() => setFormData({...formData, app_type: 'ui'})} className="hidden" />
                  <span className="text-2xl">🖥️</span>
                  <span className="text-sm font-bold text-foreground">تطبيق واجهة (UI)</span>
                  <span className="text-xs text-muted-foreground text-center">له شاشة يدخلها المستخدم — يظهر زر "فتح"</span>
                </label>
                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.app_type === 'service' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="app_type" value="service" checked={formData.app_type === 'service'} onChange={() => setFormData({...formData, app_type: 'service'})} className="hidden" />
                  <span className="text-2xl">⚙️</span>
                  <span className="text-sm font-bold text-foreground">خدمة خلفية (Service)</span>
                  <span className="text-xs text-muted-foreground text-center">يعمل في الخلفية — بدون شاشة، لا يظهر زر "فتح"</span>
                </label>
              </div>
              {formData.app_type === 'ui' && (
                <>
                  <p className="mt-3 text-xs text-primary bg-primary/5 px-3 py-2 rounded-lg">💡 تأكد من إضافة مسار الصفحة (Route) أدناه</p>
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-foreground mb-2">مسار الصفحة (Route) *</label>
                    <input
                      type="text"
                      value={formData.route || ""}
                      onChange={e => setFormData({ ...formData, route: e.target.value })}
                      placeholder="مثال: /platform-clients أو /apps/my-app"
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">المسار الذي سيُفتح عند الضغط على زر الفتح</p>
                  </div>
                </>
              )}
            </div>

          </TabsContent>

          {/* تبويب: الصلاحيات والظهور */}
          <TabsContent value="visibility" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-6">

            {/* ── الصلاحيات ── */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">الصلاحيات</h3>
              <div className="space-y-3">

                {/* السوبر أدمن */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">السوبر آدمن يمكنه تثبيت التطبيق</p>
                    <p className="text-xs text-muted-foreground mt-0.5">يظهر التطبيق في متجر السوبر آدمن</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, super_admin_can_install: !formData.super_admin_can_install })}
                    className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${formData.super_admin_can_install ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.super_admin_can_install ? "right-1" : "right-7"}`} />
                  </button>
                </div>

                {/* الشركاء */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">الشركاء يمكنهم تثبيت التطبيق</p>
                    <p className="text-xs text-muted-foreground mt-0.5">يظهر التطبيق في متجر الشركاء</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, partners_can_install: !formData.partners_can_install })}
                    className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${formData.partners_can_install ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.partners_can_install ? "right-1" : "right-7"}`} />
                  </button>
                </div>

                {/* العملاء */}
                <div className={`border-2 rounded-xl transition-all ${formData.clients_can_install ? "border-primary/30 bg-primary/3" : "border-border"}`}>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">العملاء يمكنهم تثبيت التطبيق</p>
                      <p className="text-xs text-muted-foreground mt-0.5">يظهر التطبيق في متجر العملاء</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, clients_can_install: !formData.clients_can_install })}
                      className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${formData.clients_can_install ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.clients_can_install ? "right-1" : "right-7"}`} />
                    </button>
                  </div>

                  {/* ── طريقة الظهور (تظهر فقط إذا العملاء مفعّل) ── */}
                  {formData.clients_can_install && (
                    <div className="border-t border-border mx-4 mb-4 pt-4 space-y-4">
                      <p className="text-sm font-bold text-foreground">طريقة ظهور التطبيق في متجر العملاء</p>
                      <div className="space-y-2">
                        {[
                          { value: "all", label: "ظاهر للجميع", desc: "يظهر لجميع العملاء بدون قيود", color: "border-emerald-400 bg-emerald-50" },
                          { value: "restricted", label: "ظاهر مع قيود", desc: "يظهر للجميع لكن التثبيت مقيّد بباقات محددة مع رسالة توضيحية", color: "border-amber-400 bg-amber-50" },
                          { value: "hidden", label: "مخفي / حصري", desc: "لا يظهر إلا لأصحاب الباقات المحددة أدناه فقط", color: "border-red-400 bg-red-50" }
                        ].map(opt => (
                          <label key={opt.value} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.visibility_mode === opt.value ? opt.color : "border-border bg-white hover:bg-secondary/20"}`}>
                            <input
                              type="radio"
                              name="visibility_mode"
                              value={opt.value}
                              checked={formData.visibility_mode === opt.value}
                              onChange={(e) => setFormData({ ...formData, visibility_mode: e.target.value })}
                              className="w-4 h-4 accent-primary flex-shrink-0"
                            />
                            <div>
                              <p className="text-sm font-bold text-foreground">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* اختيار الباقات */}
                      {(formData.visibility_mode === "restricted" || formData.visibility_mode === "hidden") && (
                        <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                          <p className="text-sm font-bold text-foreground">
                            {formData.visibility_mode === "hidden" ? "الباقات التي ترى التطبيق وتثبّته" : "الباقات المسموح لها بالتثبيت"}
                          </p>
                          {plans.length === 0 ? (
                            <p className="text-xs text-muted-foreground">لا توجد باقات مضافة بعد</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {plans.map(plan => (
                                <label key={plan.id} className={`flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer transition-all text-sm ${formData.allowed_plan_ids.includes(plan.id) ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-secondary/20"}`}>
                                  <input
                                    type="checkbox"
                                    checked={formData.allowed_plan_ids.includes(plan.id)}
                                    onChange={() => {
                                      const updated = formData.allowed_plan_ids.includes(plan.id)
                                        ? formData.allowed_plan_ids.filter(id => id !== plan.id)
                                        : [...formData.allowed_plan_ids, plan.id];
                                      setFormData({ ...formData, allowed_plan_ids: updated });
                                    }}
                                    className="w-4 h-4 accent-primary flex-shrink-0"
                                  />
                                  <div>
                                    <p className="font-semibold text-foreground text-xs">{plan.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{plan.is_free ? "مجاني" : `${plan.monthly_price} ر.س/شهر`}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* رسالة القيود */}
                      {formData.visibility_mode === "restricted" && (
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-1.5">رسالة القيود (تظهر للعميل)</label>
                          <input
                            type="text"
                            value={formData.restriction_message}
                            onChange={(e) => setFormData({ ...formData, restriction_message: e.target.value })}
                            placeholder="مثال: هذا التطبيق متاح في الباقة الاحترافية فقط"
                            className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                          />
                          <p className="text-xs text-muted-foreground mt-1">ستظهر هذه الرسالة للعملاء غير المؤهلين عند محاولة التثبيت</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── تخصيص العميل ── */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-1">تخصيص التطبيق من قِبَل العميل</h3>
              <p className="text-xs text-muted-foreground mb-4">عند التفعيل يتمكن العميل من تخصيص اسم وصورة التطبيق الظاهرة لعملائه فقط</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">السماح بتخصيص الاسم</p>
                    <p className="text-xs text-muted-foreground mt-0.5">يمكن للعميل تغيير اسم التطبيق الظاهر لعملائه</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_custom_name: !formData.allow_custom_name })}
                    className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${formData.allow_custom_name ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.allow_custom_name ? "right-1" : "right-7"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">السماح بتخصيص الصورة / الأيقونة</p>
                    <p className="text-xs text-muted-foreground mt-0.5">يمكن للعميل تغيير أيقونة التطبيق الظاهرة لعملائه</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_custom_icon: !formData.allow_custom_icon })}
                    className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${formData.allow_custom_icon ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.allow_custom_icon ? "right-1" : "right-7"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── سلوك إلغاء التثبيت ── */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-1">سلوك إلغاء التثبيت</h3>
              <p className="text-xs text-muted-foreground mb-4">حدد ماذا يحدث ببيانات التطبيق عندما يقوم المستخدم بإلغاء تثبيته</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${!formData.delete_data_on_uninstall ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:border-emerald-400'}`}>
                  <input type="radio" name="uninstall_behavior" checked={!formData.delete_data_on_uninstall}
                    onChange={() => setFormData({ ...formData, delete_data_on_uninstall: false })} className="hidden" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔒</span>
                    <span className="text-sm font-bold text-foreground">احتفظ بالبيانات</span>
                  </div>
                  <p className="text-xs text-muted-foreground">البيانات تبقى محفوظة — يمكن إعادة التثبيت واستكمال فترة الاشتراك</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">✅ مناسب للتطبيقات الحساسة (محاسبة، موافقات، عملاء...)</p>
                </label>
                <label className={`flex flex-col gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.delete_data_on_uninstall ? 'border-red-400 bg-red-50' : 'border-border hover:border-red-400'}`}>
                  <input type="radio" name="uninstall_behavior" checked={formData.delete_data_on_uninstall}
                    onChange={() => setFormData({ ...formData, delete_data_on_uninstall: true })} className="hidden" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗑️</span>
                    <span className="text-sm font-bold text-foreground">احذف البيانات نهائياً</span>
                  </div>
                  <p className="text-xs text-muted-foreground">تُحذف جميع بيانات التطبيق فور إلغاء التثبيت ولا يمكن التراجع</p>
                  <p className="text-[10px] text-red-600 font-semibold mt-1">⚠️ مناسب للتطبيقات البسيطة غير الحساسة</p>
                </label>
              </div>
              {!formData.delete_data_on_uninstall && (
                <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-700">
                  <span className="flex-shrink-0 mt-0.5">💡</span>
                  <span>عند إلغاء التثبيت: سيتغير status إلى <strong>uninstalled</strong> مع الاحتفاظ بالبيانات، وسيظهر زر <strong>"إعادة التثبيت"</strong> ما دام الاشتراك سارياً.</span>
                </div>
              )}
              {formData.delete_data_on_uninstall && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  <span>عند إلغاء التثبيت: سيُحذف سجل InstalledApp نهائياً وتُعرض رسالة تحذير واضحة للمستخدم قبل الحذف.</span>
                </div>
              )}
            </div>

          </TabsContent>

          {/* تبويبة المتطلبات - للقراءة فقط */}
          <TabsContent value="related" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">التطبيقات المتطلبة والمرتبطة</h3>
                <p className="text-xs text-muted-foreground">عرض العلاقات المحددة لهذا التطبيق</p>
              </div>
              <button
                type="button"
                onClick={() => isEmbedded ? (onClose?.(), navigate(`/app-designer?id=${appId}`)) : navigate(`/app-designer?id=${appId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                تعديل في مصمم التطبيقات
              </button>
            </div>

            {/* تنبيه للقراءة فقط */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg flex-shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold text-amber-800">هذه التبويبة للعرض فقط</p>
                <p className="text-xs text-amber-700 mt-0.5">لتعديل العلاقات بين التطبيقات، انتقل إلى <strong>مصمم التطبيقات</strong> من الزر أعلاه — وذلك لضمان توحيد إدارة العلاقات من مكان واحد.</p>
              </div>
            </div>

            {/* عرض العلاقات بشكل قراءة فقط */}
            {(!formData.related_apps || formData.related_apps.length === 0) ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <p className="text-sm">لا توجد تطبيقات مرتبطة</p>
                <p className="text-xs mt-1">يمكنك إضافتها من مصمم التطبيقات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.related_apps.map(rel => {
                  const relApp = allApps.find(a => a.id === rel.app_id);
                  const typeConfig = {
                    required_child: { label: "ابن إجباري", icon: "🔴", color: "border-red-200 bg-red-50", badge: "bg-red-100 text-red-700" },
                    optional_child: { label: "ابن اختياري", icon: "🔵", color: "border-blue-200 bg-blue-50", badge: "bg-blue-100 text-blue-700" },
                    requires_this: { label: "يشترط هذا التطبيق", icon: "🟡", color: "border-amber-200 bg-amber-50", badge: "bg-amber-100 text-amber-700" },
                  }[rel.relation_type] || { label: rel.relation_type, icon: "⚪", color: "border-border bg-secondary/20", badge: "bg-secondary text-foreground" };

                  return (
                    <div key={rel.app_id} className={`border-2 rounded-xl p-4 ${typeConfig.color}`}>
                      <div className="flex items-center gap-3">
                        {relApp?.icon_url
                          ? <img src={relApp.icon_url} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-white/60 border border-border flex items-center justify-center flex-shrink-0 text-lg">📦</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{relApp?.name || rel.app_id}</p>
                          {rel.install_note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rel.install_note}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${typeConfig.badge}`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                          {rel.auto_install && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">تثبيت تلقائي</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ملخص */}
            {formData.related_apps?.length > 0 && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                <p className="text-xs font-bold text-foreground mb-2">📋 ملخص العلاقات:</p>
                <div className="space-y-1">
                  {["required_child", "optional_child", "requires_this"].map(type => {
                    const count = formData.related_apps.filter(r => r.relation_type === type).length;
                    if (count === 0) return null;
                    const labels = { required_child: { label: "ابن إجباري", icon: "🔴", badge: "bg-red-100 text-red-700" }, optional_child: { label: "ابن اختياري", icon: "🔵", badge: "bg-blue-100 text-blue-700" }, requires_this: { label: "يشترط هذا التطبيق", icon: "🟡", badge: "bg-amber-100 text-amber-700" } };
                    const rt = labels[type];
                    return (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span>{rt.icon} {rt.label}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rt.badge}`}>{count} تطبيق</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* التبويب الرابع: حقول الربط */}
          <TabsContent value="integration" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
              <p className="text-sm text-blue-700 font-semibold">💡 حقول الربط</p>
              <p className="text-xs text-blue-600 mt-1">هذه الحقول ستظهر للمستخدم (سوبر أدمن أو عميل) بعد تثبيت التطبيق لإدخال بيانات الربط الخاصة به مع الخدمة. مثلاً: API Key، Username، Password...</p>
            </div>

            <IntegrationFieldsEditor
              fields={formData.integration_fields || []}
              onChange={(fields) => setFormData({ ...formData, integration_fields: fields })}
            />
          </TabsContent>



          {/* التبويب الثالث: التسعير */}
          <TabsContent value="pricing" className="mt-6 bg-card border border-border rounded-xl p-8 space-y-8">
            {/* سويتش التطبيق المجاني */}
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">تطبيق مجاني</h3>
                  <p className="text-xs text-muted-foreground mt-1">تفعيل هذا الخيار يجعل التطبيق مجاناً</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_free: !formData.is_free })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.is_free ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                    formData.is_free ? "right-1" : "right-7"
                  }`} />
                </button>
              </div>
            </div>

            {/* فترة التجربة */}
            <div className="border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">فترة تجريبية مجانية</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">يسمح للمستخدم بتجربة التطبيق قبل الدفع</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, has_trial: !formData.has_trial })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${formData.has_trial ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.has_trial ? "right-1" : "right-7"}`} />
                </button>
              </div>
              {formData.has_trial && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">عدد أيام التجربة</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.trial_days}
                    onChange={e => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 14 })}
                    className="w-40 border border-border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            {/* التسعير - يظهر فقط عند إيقاف السويتش */}
            {!formData.is_free && (
              <div className="border border-border rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-bold text-foreground">إعدادات التسعير</h3>

                {/* اختيار العملة */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">العملة</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    {currencies.map(curr => (
                      <option key={curr.id} value={curr.code}>{curr.name} - {curr.code}</option>
                    ))}
                  </select>
                </div>

                {/* الأسعار */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">السعر الشهري * ({formData.currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_price}
                      onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">السعر السنوي * ({formData.currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.yearly_price}
                      onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={18} />
            {saveMutation.isPending ? "جارٍ الحفظ..." : appId ? "حفظ التعديلات" : "إضافة التطبيق"}
          </button>
          <button
            type="button"
            onClick={isEmbedded ? onClose : () => navigate("/super-admin/app-manager")}
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
          >
            إلغاء
          </button>
          {appId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 bg-destructive text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Trash2 size={18} />
              {deleteMutation.isPending ? "جارٍ الحذف..." : "حذف"}
            </button>
          )}
          </div>
        </div>
    </motion.div>
  );
}