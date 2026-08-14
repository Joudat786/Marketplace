import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Settings, Cookie, HardDrive, Upload, X, Clock, Calendar, Copy, ClipboardPaste, Phone, Mail, Plus, Trash2, GripVertical, Hash, Smartphone, Printer, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import IconPickerPopover from "@/components/superadmin/IconPickerPopover";

const contactTypeIconMap = {
  email: Mail,
  unified_number: Hash,
  phone: Phone,
  mobile: Smartphone,
  fax: Printer,
  other: Globe,
};

const sections = [
{ id: "brand", label: "إعدادات العلامة التجارية", icon: Building2 },
{ id: "system", label: "إعدادات النظام", icon: Settings },
{ id: "contact", label: "إعدادات التواصل", icon: Phone },
{ id: "cookie", label: "إعدادات ملف تعريف الإرتباط", icon: Cookie },
{ id: "storage", label: "إعدادات التخزين", icon: HardDrive }];


export default function GeneralSettings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("brand");
  const [brandData, setBrandData] = useState({
    lightLogo: null,
    darkLogo: null,
    favicon: null,
    loadingIcon: null,
    footerLogo: null,
    brandName: "",
    footerText: "",
    primaryColor: "#6566c1",
    buttonColor: "#245EFF",
    tabsActiveColor: "#245EFF",
    tabsInactiveColor: "#fbed24",
    tableHeaderBgColor: "#E8EDFA",
    tableHeaderTextColor: "#1F1F1F"
  });

  const [systemData, setSystemData] = useState({
    dateFormat: "YYYY/MM/DD",
    timeFormat: "HH:mm:ss A",
    dateTimeFormat: "YYYY/MM/DD - HH:mm:ss A",
    timezone: "Asia/Riyadh",
    landingPageEnabled: true,
    maintenanceModeEnabled: false,
    maintenanceText: ""
  });

  const [contactData, setContactData] = useState({
    contact_items: [],
    social_links: []
  });

  // Fetch saved settings
  const { data: savedSettings } = useQuery({
    queryKey: ["generalSettings"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "brand" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const { data: savedSystemSettings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "system" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const { data: savedContactSettings, refetch: refetchContactSettings } = useQuery({
    queryKey: ["contactSettings"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "contact" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  // Load saved settings when component mounts or settings change
  useEffect(() => {
    if (savedSettings) {
      const newBrandData = {
        lightLogo: savedSettings.light_logo_url ?? null,
        darkLogo: savedSettings.dark_logo_url ?? null,
        favicon: savedSettings.favicon_url ?? null,
        loadingIcon: savedSettings.loading_icon_url ?? null,
        footerLogo: savedSettings.footer_logo_url ?? null,
        brandName: savedSettings.brand_name ?? "",
        footerText: savedSettings.footer_text ?? "",
        primaryColor: savedSettings.primary_color ?? "#6566c1",
        buttonColor: savedSettings.button_color ?? "#245EFF",
        tabsActiveColor: savedSettings.tabs_active_color ?? "#245EFF",
        tabsInactiveColor: savedSettings.tabs_inactive_color ?? "#fbed24",
        tableHeaderBgColor: savedSettings.table_header_bg_color ?? "#E8EDFA",
        tableHeaderTextColor: savedSettings.table_header_text_color ?? "#1F1F1F"
      };
      setBrandData(newBrandData);
      
      // تطبيق الألوان المحفوظة على CSS variables
      const root = document.documentElement;
      if (newBrandData.primaryColor) {
        const [r, g, b] = hexToRgb(newBrandData.primaryColor);
        root.style.setProperty('--primary', `${hslFromRgb(r, g, b)}`);
      }
      if (newBrandData.buttonColor) {
        const [r, g, b] = hexToRgb(newBrandData.buttonColor);
        root.style.setProperty('--button-color', hslFromRgb(r, g, b));
      }
      if (newBrandData.tabsActiveColor) {
        const [r, g, b] = hexToRgb(newBrandData.tabsActiveColor);
        root.style.setProperty('--tabs-active', `${hslFromRgb(r, g, b)}`);
      }
      if (newBrandData.tabsInactiveColor) {
        root.style.setProperty('--tabs-inactive', newBrandData.tabsInactiveColor);
      }
      if (newBrandData.tableHeaderBgColor) {
        root.style.setProperty('--table-header-bg', newBrandData.tableHeaderBgColor);
      }
      if (newBrandData.tableHeaderTextColor) {
        root.style.setProperty('--table-header-text', newBrandData.tableHeaderTextColor);
      }
    }
  }, [savedSettings]);

  useEffect(() => {
    if (savedSystemSettings) {
      setSystemData({
        dateFormat: savedSystemSettings.date_format || "YYYY/MM/DD",
        timeFormat: savedSystemSettings.time_format || "HH:mm:ss A",
        dateTimeFormat: savedSystemSettings.date_time_format || "YYYY/MM/DD - HH:mm:ss A",
        timezone: savedSystemSettings.timezone || "Asia/Riyadh",
        landingPageEnabled: savedSystemSettings.landing_page_enabled !== false,
        maintenanceModeEnabled: savedSystemSettings.maintenance_mode_enabled === true,
        maintenanceText: savedSystemSettings.maintenance_text || ""
      });
    }
  }, [savedSystemSettings]);

  useEffect(() => {
    if (savedContactSettings) {
      console.log("تحميل البيانات من قاعدة البيانات:", savedContactSettings);
      setContactData({
        contact_items: (savedContactSettings.contact_items || []),
        social_links: (savedContactSettings.social_links || [])
      });
    }
  }, [savedContactSettings]);

  const currentSection = sections.find((s) => s.id === activeSection);
  const CurrentIcon = currentSection?.icon;

  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('saveGeneralSettings', data);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "نجح", description: "تم حفظ إعدادات العلامة التجارية بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["generalSettings"] });
      queryClient.refetchQueries({ queryKey: ["generalSettings"] });
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء حفظ البيانات", variant: "destructive" });
    }
  });

  const saveSystemMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('saveSystemSettings', data);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "نجح", description: "تم حفظ إعدادات النظام بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء حفظ البيانات", variant: "destructive" });
    }
  });

  const saveContactMutation = useMutation({
    mutationFn: async (data) => {
      console.log("===== INPUT DATA =====");
      console.log("contact_items:", data.contact_items);
      console.log("social_links:", data.social_links);
      
      const existing = await base44.entities.GeneralSettings.filter({ settings_type: "contact" });
      const payload = {
        brand_name: "contact",
        settings_type: "contact",
        contact_items: data.contact_items || [],
        social_links: data.social_links || []
      };
      
      console.log("===== الـ payload المُرسل =====");
      console.log(JSON.stringify(payload, null, 2));
      console.log("عدد contact_items:", payload.contact_items?.length);
      console.log("عدد social_links:", payload.social_links?.length);
      
      let result;
      if (existing && existing.length > 0) {
        result = await base44.entities.GeneralSettings.update(existing[0].id, payload);
      } else {
        result = await base44.entities.GeneralSettings.create(payload);
      }
      
      console.log("بعد الحفظ - النتيجة من قاعدة البيانات:", JSON.stringify(result, null, 2));
      return result;
    },
    onSuccess: (result) => {
      console.log("تم الحفظ بنجاح، البيانات المُرجعة:", result);
      refetchContactSettings().then(() => {
        console.log("تم جلب البيانات الجديدة من قاعدة البيانات");
      });
      toast({ title: "نجح", description: "تم حفظ إعدادات التواصل بنجاح" });
    },
    onError: (error) => {
      console.error("خطأ في الحفظ:", error);
      toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء حفظ البيانات", variant: "destructive" });
    }
  });

  const contactTypes = [
    { value: "email", label: "البريد الإلكتروني", placeholder: "info@example.com", icon: "Mail" },
    { value: "unified_number", label: "الرقم الموحد", placeholder: "920XXXXXXX", icon: "Phone" },
    { value: "phone", label: "رقم الهاتف", placeholder: "+966XXXXXXXXX", icon: "Phone" },
    { value: "mobile", label: "رقم الجوال", placeholder: "+9665XXXXXXXX", icon: "Smartphone" },
    { value: "fax", label: "الفاكس", placeholder: "+966XXXXXXXXX", icon: "Printer" },
    { value: "other", label: "أخرى", placeholder: "أدخل القيمة", icon: "Globe" },
  ];

  const addContactItem = () => {
    setContactData(prev => ({
      ...prev,
      contact_items: [...prev.contact_items, { type: "email", value: "", icon: "" }]
    }));
  };

  const removeContactItem = (index) => {
    setContactData(prev => ({
      ...prev,
      contact_items: prev.contact_items.filter((_, i) => i !== index)
    }));
  };

  const updateContactItem = (index, field, val) => {
    console.log(`تحديث العنصر ${index} - الحقل: ${field} - القيمة:`, val);
    setContactData(prev => {
      const updated = {
        ...prev,
        contact_items: prev.contact_items.map((item, i) => i === index ? { ...item, [field]: val } : item)
      };
      console.log("البيانات بعد التحديث:", updated);
      return updated;
    });
  };

  const handleContactDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(contactData.contact_items);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setContactData(prev => ({ ...prev, contact_items: items }));
  };

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
    { value: "clubhouse", label: "كلوب هاوس" },
    { value: "quora", label: "كورا" },
    { value: "tumblr", label: "تمبلر" },
    { value: "flickr", label: "فليكر" },
    { value: "other", label: "أخرى" },
  ];

  const addSocialLink = () => {
    setContactData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: "twitter", url: "", icon: "" }]
    }));
  };

  const removeSocialLink = (index) => {
    setContactData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index, field, value) => {
    setContactData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) => i === index ? { ...link, [field]: value } : link)
    }));
  };

  const handleSocialDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(contactData.social_links);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setContactData(prev => ({ ...prev, social_links: items }));
  };

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    try {
      const url = await uploadImageMutation.mutateAsync(file);
      setBrandData({ ...brandData, [field]: url });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحميل الصورة", variant: "destructive" });
    }
  };

  const handleSave = () => {
    if (!brandData.brandName) {
      toast({ title: "تحذير", description: "يرجى إدخال اسم العلامة التجارية", variant: "destructive" });
      return;
    }
    
    // تطبيق الألوان مباشرة على CSS variables
    const root = document.documentElement;
    if (brandData.primaryColor) {
      const [r, g, b] = hexToRgb(brandData.primaryColor);
      root.style.setProperty('--primary', `${hslFromRgb(r, g, b)}`);
    }
    if (brandData.buttonColor) {
      const [r, g, b] = hexToRgb(brandData.buttonColor);
      root.style.setProperty('--button-color', hslFromRgb(r, g, b));
    }
    if (brandData.tabsActiveColor) {
      const [r, g, b] = hexToRgb(brandData.tabsActiveColor);
      root.style.setProperty('--tabs-active', `${hslFromRgb(r, g, b)}`);
    }
    if (brandData.tabsInactiveColor) {
      root.style.setProperty('--tabs-inactive', brandData.tabsInactiveColor);
    }
    if (brandData.tableHeaderBgColor) {
      root.style.setProperty('--table-header-bg', brandData.tableHeaderBgColor);
    }
    if (brandData.tableHeaderTextColor) {
      root.style.setProperty('--table-header-text', brandData.tableHeaderTextColor);
    }
    if (brandData.tableHeaderBgColor) {
      root.style.setProperty('--table-header-bg', brandData.tableHeaderBgColor);
    }
    
    saveMutation.mutate({
      brandName: brandData.brandName,
      footerText: brandData.footerText,
      lightLogo: brandData.lightLogo,
      darkLogo: brandData.darkLogo,
      favicon: brandData.favicon,
      loadingIcon: brandData.loadingIcon,
      footerLogo: brandData.footerLogo,
      primaryColor: brandData.primaryColor,
      buttonColor: brandData.buttonColor,
      tabsActiveColor: brandData.tabsActiveColor,
      tabsInactiveColor: brandData.tabsInactiveColor,
      tableHeaderBgColor: brandData.tableHeaderBgColor,
      tableHeaderTextColor: brandData.tableHeaderTextColor
    });
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const hslFromRgb = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 min-h-full" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 sticky top-0">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-right ${
                activeSection === section.id ?
                "bg-tabsActive text-white" :
                "bg-secondary/50 text-tabsInactive hover:bg-secondary"}`
                }>
                
                <Icon size={16} />
                <span>{section.label}</span>
              </button>);

          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-xl p-8">
          
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CurrentIcon size={24} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{currentSection?.label}</h2>
          </div>

          {activeSection === "brand" &&
          <div className="space-y-8">
              {/* الشعارات والأيقونات */}
              <div className="grid grid-cols-5 gap-2">
                {/* شعار الوضع الفاتح */}
                <div className="flex flex-col">
                <label className="block text-xs font-semibold text-foreground mb-2">شعار الوضع الفاتح</label>
                <div className="flex flex-col gap-2">
                  {brandData.lightLogo &&
                  <div className="relative w-full h-12 rounded-md border border-border overflow-hidden bg-secondary/30">
                      <img src={brandData.lightLogo} alt="شعار فاتح" className="w-full h-full object-contain p-1" />
                      <button
                      type="button"
                      onClick={() => setBrandData({ ...brandData, lightLogo: null })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                      
                        <X size={14} />
                      </button>
                    </div>
                  }
                  <label className="flex items-center justify-center gap-1 px-1.5 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
                    <Upload size={11} />
                    رفع
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('lightLogo', file);
                      }}
                      className="hidden" />
                    
                  </label>
                  </div>
                  </div>

                  {/* شعار التذييل */}
                  <div className="flex flex-col">
                <label className="block text-xs font-semibold text-foreground mb-2">شعار التذييل</label>
                <div className="flex flex-col gap-2">
                  {brandData.footerLogo &&
                  <div className="relative w-full h-12 rounded-md border border-border overflow-hidden bg-secondary/30">
                      <img src={brandData.footerLogo} alt="شعار التذييل" className="w-full h-full object-contain p-1" />
                      <button
                      type="button"
                      onClick={() => setBrandData({ ...brandData, footerLogo: null })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                      
                        <X size={14} />
                      </button>
                    </div>
                  }
                  <label className="flex items-center justify-center gap-1 px-1.5 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
                   <Upload size={11} />
                   رفع
                   <input
                      key={brandData.footerLogo ? 'footer-logo-1' : 'footer-logo-0'}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('footerLogo', file);
                      }}
                      className="hidden" />
                    
                  </label>
                  </div>
                  </div>

                  {/* شعار الوضع الداكن */}
                  <div className="flex flex-col">
                <label className="block text-xs font-semibold text-foreground mb-2">شعار الوضع الداكن</label>
                <div className="flex flex-col gap-2">
                  {brandData.darkLogo &&
                  <div className="relative w-full h-12 rounded-md border border-border overflow-hidden bg-slate-900">
                      <img src={brandData.darkLogo} alt="شعار داكن" className="w-full h-full object-contain p-1" />
                      <button
                      type="button"
                      onClick={() => setBrandData({ ...brandData, darkLogo: null })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                      
                        <X size={14} />
                      </button>
                    </div>
                  }
                  <label className="flex items-center justify-center gap-1 px-1.5 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
                    <Upload size={11} />
                    رفع
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('darkLogo', file);
                      }}
                      className="hidden" />
                    
                  </label>
                  </div>
                  </div>

                  {/* أيقونة المتصفح */}
                  <div className="flex flex-col">
                <label className="block text-xs font-semibold text-foreground mb-2">أيقونة المتصفح</label>
                <div className="flex flex-col gap-2">
                  {brandData.favicon &&
                  <div className="relative w-full h-12 rounded-md border border-border overflow-hidden bg-secondary/30">
                      <img src={brandData.favicon} alt="أيقونة" className="w-full h-full object-contain p-1" />
                      <button
                      type="button"
                      onClick={() => setBrandData({ ...brandData, favicon: null })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                      
                        <X size={14} />
                      </button>
                    </div>
                  }
                  <label className="flex items-center justify-center gap-1 px-1.5 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
                    <Upload size={11} />
                    رفع
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('favicon', file);
                      }}
                      className="hidden" />
                    
                  </label>
                  </div>
                  </div>

                  {/* أيقونة التحميل */}
                  <div className="flex flex-col">
                <label className="block text-xs font-semibold text-foreground mb-2">أيقونة التحميل</label>
                <div className="flex flex-col gap-2">
                  {brandData.loadingIcon &&
                  <div className="relative w-full h-12 rounded-md border border-border overflow-hidden bg-secondary/30">
                      <img src={brandData.loadingIcon} alt="أيقونة تحميل" className="w-full h-full object-contain p-1" />
                      <button
                      type="button"
                      onClick={() => setBrandData({ ...brandData, loadingIcon: null })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded hover:bg-destructive/90">
                      
                        <X size={14} />
                      </button>
                    </div>
                  }
                  <label className="flex items-center justify-center gap-1 px-1.5 py-1 border border-primary rounded-md bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors font-medium text-xs">
                    <Upload size={11} />
                    رفع
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('loadingIcon', file);
                      }}
                      className="hidden" />
                    
                  </label>
                  </div>
                  </div>
                  </div>

            {/* اسم العلامة التجارية والتذييل */}
            <div className="space-y-6">
              {/* اسم العلامة التجارية */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">اسم العلامة التجارية</label>
                <input
                  type="text"
                  value={brandData.brandName}
                  onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                  placeholder="أدخل اسم العلامة التجارية"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                
              </div>

              {/* نص التذييل */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">نص التذييل</label>
                <input
                  type="text"
                  value={brandData.footerText}
                  onChange={(e) => setBrandData({ ...brandData, footerText: e.target.value })}
                  placeholder="أدخل نص التذييل"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                
              </div>

              {/* ألوان النظام */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">ألوان النظام</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* لون الهوية */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">لون الهوية</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.primaryColor}
                        onChange={(e) => setBrandData({ ...brandData, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                        <input
                          type="text"
                          value={brandData.primaryColor}
                          onChange={(e) => setBrandData({ ...brandData, primaryColor: e.target.value })}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (/^#[0-9A-F]{6}$/i.test(text)) {
                              setBrandData({ ...brandData, primaryColor: text });
                            }
                          }} className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                          title="الصق رمز لون" />
                        
                        <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(brandData.primaryColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="نسخ اللون">
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText().catch(() => '');
                              if (/^#[0-9A-F]{6}$/i.test(text)) {
                                setBrandData({ ...brandData, primaryColor: text });
                              }
                            }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="لصق اللون">
                            <ClipboardPaste size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* لون الأزرار */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">لون الأزرار</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.buttonColor}
                        onChange={(e) => setBrandData({ ...brandData, buttonColor: e.target.value })}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                        <input
                          type="text"
                          value={brandData.buttonColor}
                          onChange={(e) => setBrandData({ ...brandData, buttonColor: e.target.value })}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (/^#[0-9A-F]{6}$/i.test(text)) {
                              setBrandData({ ...brandData, buttonColor: text });
                            }
                          }}
                          className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                          title="الصق رمز لون" />

                          <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                           type="button"
                           onClick={() => navigator.clipboard.writeText(brandData.buttonColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                           title="نسخ اللون">
                           <Copy size={16} />
                          </button>
                          <button
                           type="button"
                           onClick={async () => {
                             const text = await navigator.clipboard.readText().catch(() => '');
                             if (/^#[0-9A-F]{6}$/i.test(text)) {
                               setBrandData({ ...brandData, buttonColor: text });
                             }
                           }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                           title="لصق اللون">
                           <ClipboardPaste size={16} />
                          </button>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* لون التبويبة المختاره */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">لون التبويبة المختاره</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.tabsActiveColor}
                        onChange={(e) => setBrandData({ ...brandData, tabsActiveColor: e.target.value })}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                        <input
                          type="text"
                          value={brandData.tabsActiveColor}
                          onChange={(e) => setBrandData({ ...brandData, tabsActiveColor: e.target.value })}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (/^#[0-9A-F]{6}$/i.test(text)) {
                              setBrandData({ ...brandData, tabsActiveColor: text });
                            }
                          }} className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                          title="الصق رمز لون" />
                        
                        <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(brandData.tabsActiveColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="نسخ اللون">
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText().catch(() => '');
                              if (/^#[0-9A-F]{6}$/i.test(text)) {
                                setBrandData({ ...brandData, tabsActiveColor: text });
                              }
                            }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="لصق اللون">
                            <ClipboardPaste size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* لون التبويبات الغير مختاره */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">لون التبويبات الغير مختاره</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.tabsInactiveColor}
                        onChange={(e) => {
                          setBrandData({ ...brandData, tabsInactiveColor: e.target.value });
                          document.documentElement.style.setProperty('--tabs-inactive', e.target.value);
                        }}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                         <input
                           type="text"
                           value={brandData.tabsInactiveColor}
                           onChange={(e) => {
                             setBrandData({ ...brandData, tabsInactiveColor: e.target.value });
                             document.documentElement.style.setProperty('--tabs-inactive', e.target.value);
                           }}
                           onPaste={(e) => {
                             const text = e.clipboardData.getData('text');
                             if (/^#[0-9A-F]{6}$/i.test(text)) {
                               setBrandData({ ...brandData, tabsInactiveColor: text });
                               document.documentElement.style.setProperty('--tabs-inactive', text);
                             }
                           }} className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                           title="الصق رمز لون" />
                        
                        <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(brandData.tabsInactiveColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="نسخ اللون">
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText().catch(() => '');
                              if (/^#[0-9A-F]{6}$/i.test(text)) {
                                setBrandData({ ...brandData, tabsInactiveColor: text });
                                document.documentElement.style.setProperty('--tabs-inactive', text);
                              }
                            }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="لصق اللون">
                            <ClipboardPaste size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* خلفية رأس الجدول */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">خلفية رأس الجدول</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.tableHeaderBgColor}
                        onChange={(e) => {
                          setBrandData({ ...brandData, tableHeaderBgColor: e.target.value });
                          document.documentElement.style.setProperty('--table-header-bg', e.target.value);
                        }}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                        <input
                          type="text"
                          value={brandData.tableHeaderBgColor}
                          onChange={(e) => setBrandData({ ...brandData, tableHeaderBgColor: e.target.value })}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (/^#[0-9A-F]{6}$/i.test(text)) {
                              setBrandData({ ...brandData, tableHeaderBgColor: text });
                            }
                          }} className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                          title="الصق رمز لون" />
                        
                        <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(brandData.tableHeaderBgColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="نسخ اللون">
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText().catch(() => '');
                              if (/^#[0-9A-F]{6}$/i.test(text)) {
                                setBrandData({ ...brandData, tableHeaderBgColor: text });
                              }
                            }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="لصق اللون">
                            <ClipboardPaste size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* نص رأس الجدول */}
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs font-semibold text-foreground">نص رأس الجدول</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={brandData.tableHeaderTextColor}
                        onChange={(e) => {
                          setBrandData({ ...brandData, tableHeaderTextColor: e.target.value });
                          document.documentElement.style.setProperty('--table-header-text', e.target.value);
                        }}
                        className="w-7 h-7 rounded-md border-2 border-border cursor-pointer hover:opacity-80 flex-shrink-0 p-0.5" />
                      
                      <div className="flex-1 relative border border-border rounded-md bg-background">
                        <input
                          type="text"
                          value={brandData.tableHeaderTextColor}
                          onChange={(e) => setBrandData({ ...brandData, tableHeaderTextColor: e.target.value })}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (/^#[0-9A-F]{6}$/i.test(text)) {
                              setBrandData({ ...brandData, tableHeaderTextColor: text });
                            }
                          }} className="bg-[#ffffff] pt-2 pr-1 pb-2 pl-1 text-xs font-mono text-right normal-case rounded-md w-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"

                          title="الصق رمز لون" />
                        
                        <div className="pr-2 pl-1 absolute left-0 top-0 bottom-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(brandData.tableHeaderTextColor)} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="نسخ اللون">
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText().catch(() => '');
                              if (/^#[0-9A-F]{6}$/i.test(text)) {
                                setBrandData({ ...brandData, tableHeaderTextColor: text });
                              }
                            }} className="bg-slate-200 text-primary pr-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"

                            title="لصق اللون">
                            <ClipboardPaste size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* زر الحفظ */}
              <button onClick={handleSave} disabled={saveMutation.isPending} className="bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
            </div>
          }

          {activeSection === "system" &&
          <div className="space-y-6">
              {/* تنسيق التاريخ */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  تنسيق التاريخ
                </label>
                <select
                value={systemData.dateFormat}
                onChange={(e) => setSystemData({ ...systemData, dateFormat: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20">
                
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

              {/* تنسيق الوقت */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  تنسيق الوقت
                </label>
                <select
                value={systemData.timeFormat}
                onChange={(e) => setSystemData({ ...systemData, timeFormat: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20">
                
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

              {/* تنسيق التاريخ والوقت معاً */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">تنسيق التاريخ والوقت معاً</label>
                <select
                value={systemData.dateTimeFormat}
                onChange={(e) => setSystemData({ ...systemData, dateTimeFormat: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20">
                
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

              {/* التوقيت الزمني */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">التوقيت الزمني</label>
                <select
                value={systemData.timezone}
                onChange={(e) => setSystemData({ ...systemData, timezone: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20">
                
                  <option value="UTC">التوقيت العالمي (GMT/UTC)</option>
                  <option value="Africa/Cairo">أفريقيا/القاهرة (GMT+2)</option>
                  <option value="Africa/Johannesburg">أفريقيا/جوهانسبرج (GMT+2)</option>
                  <option value="Africa/Lagos">أفريقيا/لاغوس (GMT+1)</option>
                  <option value="Africa/Nairobi">أفريقيا/نيروبي (GMT+3)</option>
                  <option value="Asia/Amman">آسيا/عمّان (GMT+2/3)</option>
                  <option value="Asia/Baghdad">آسيا/بغداد (GMT+3)</option>
                  <option value="Asia/Bangkok">آسيا/بانكوك (GMT+7)</option>
                  <option value="Asia/Beirut">آسيا/بيروت (GMT+2/3)</option>
                  <option value="Asia/Calcutta">آسيا/كالكتا (GMT+5:30)</option>
                  <option value="Asia/Chongqing">آسيا/تشونغتشينغ (GMT+8)</option>
                  <option value="Asia/Dubai">آسيا/دبي (GMT+4)</option>
                  <option value="Asia/Hong_Kong">آسيا/هونغ كونغ (GMT+8)</option>
                  <option value="Asia/Jakarta">آسيا/جاكرتا (GMT+7)</option>
                  <option value="Asia/Jerusalem">آسيا/القدس (GMT+2/3)</option>
                  <option value="Asia/Kolkata">آسيا/كولكاتا (GMT+5:30)</option>
                  <option value="Asia/Kuwait">آسيا/الكويت (GMT+3)</option>
                  <option value="Asia/Manila">آسيا/مانيلا (GMT+8)</option>
                  <option value="Asia/Muscat">آسيا/مسقط (GMT+4)</option>
                  <option value="Asia/Riyadh">آسيا/الرياض (GMT+3)</option>
                  <option value="Asia/Seoul">آسيا/سيول (GMT+9)</option>
                  <option value="Asia/Shanghai">آسيا/شنغهاي (GMT+8)</option>
                  <option value="Asia/Singapore">آسيا/سنغافورة (GMT+8)</option>
                  <option value="Asia/Tehran">آسيا/طهران (GMT+3:30/4:30)</option>
                  <option value="Asia/Tokyo">آسيا/طوكيو (GMT+9)</option>
                  <option value="Atlantic/Azores">الأطلسي/آزوريس (GMT-1/0)</option>
                  <option value="Atlantic/Cape_Verde">الأطلسي/الرأس الأخضر (GMT-1)</option>
                  <option value="Europe/Amsterdam">أوروبا/أمستردام (GMT+1/2)</option>
                  <option value="Europe/Athens">أوروبا/أثينا (GMT+2/3)</option>
                  <option value="Europe/Berlin">أوروبا/برلين (GMT+1/2)</option>
                  <option value="Europe/Brussels">أوروبا/بروكسل (GMT+1/2)</option>
                  <option value="Europe/Budapest">أوروبا/بودابست (GMT+1/2)</option>
                  <option value="Europe/Dublin">أوروبا/دبلن (GMT+0/1)</option>
                  <option value="Europe/Istanbul">أوروبا/اسطنبول (GMT+3)</option>
                  <option value="Europe/London">أوروبا/لندن (GMT+0/1)</option>
                  <option value="Europe/Madrid">أوروبا/مدريد (GMT+1/2)</option>
                  <option value="Europe/Moscow">أوروبا/موسكو (GMT+3)</option>
                  <option value="Europe/Paris">أوروبا/باريس (GMT+1/2)</option>
                  <option value="Europe/Rome">أوروبا/روما (GMT+1/2)</option>
                  <option value="Europe/Stockholm">أوروبا/ستوكهولم (GMT+1/2)</option>
                  <option value="Europe/Vienna">أوروبا/فيينا (GMT+1/2)</option>
                  <option value="Europe/Zurich">أوروبا/زيوريخ (GMT+1/2)</option>
                  <option value="America/Anchorage">أمريكا/أنكوريج (GMT-9/-8)</option>
                  <option value="America/Chicago">أمريكا/شيكاغو (GMT-6/-5)</option>
                  <option value="America/Denver">أمريكا/دنفر (GMT-7/-6)</option>
                  <option value="America/Los_Angeles">أمريكا/لوس أنجلس (GMT-8/-7)</option>
                  <option value="America/Mexico_City">أمريكا/مكسيكو سيتي (GMT-6/-5)</option>
                  <option value="America/New_York">أمريكا/نيويورك (GMT-5/-4)</option>
                  <option value="America/Toronto">أمريكا/تورنتو (GMT-5/-4)</option>
                  <option value="America/Vancouver">أمريكا/فانكوفر (GMT-8/-7)</option>
                  <option value="Australia/Brisbane">أستراليا/بريسبان (GMT+10)</option>
                  <option value="Australia/Melbourne">أستراليا/ملبورن (GMT+10/11)</option>
                  <option value="Australia/Perth">أستراليا/بيرث (GMT+8)</option>
                  <option value="Australia/Sydney">أستراليا/سيدني (GMT+10/11)</option>
                  <option value="Pacific/Auckland">المحيط الهادئ/أوكلاند (GMT+12/13)</option>
                  <option value="Pacific/Fiji">المحيط الهادئ/فيجي (GMT+12/13)</option>
                  <option value="Pacific/Honolulu">المحيط الهادئ/هونولولو (GMT-10)</option>
                </select>
              </div>

              {/* تفعيل صفحة الهبوط */}
              <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">تفعيل صفحة الهبوط</label>
                <button
                onClick={() => setSystemData({ ...systemData, landingPageEnabled: !systemData.landingPageEnabled })}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                systemData.landingPageEnabled ? "bg-primary" : "bg-muted"}`
                }>
                
                  <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${
                  systemData.landingPageEnabled ? "right-1" : "right-9"}`
                  } />
                
                </button>
              </div>

              {/* تفعيل وضع الصيانة */}
              <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">تفعيل وضع الصيانة</label>
                <button
                onClick={() => setSystemData({ ...systemData, maintenanceModeEnabled: !systemData.maintenanceModeEnabled })}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                systemData.maintenanceModeEnabled ? "bg-destructive" : "bg-muted"}`
                }>
                
                  <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${
                  systemData.maintenanceModeEnabled ? "right-1" : "right-9"}`
                  } />
                
                </button>
              </div>

              {/* نص رسالة الصيانة */}
              {systemData.maintenanceModeEnabled &&
            <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">نص رسالة الصيانة</label>
                  <textarea
                value={systemData.maintenanceText}
                onChange={(e) => setSystemData({ ...systemData, maintenanceText: e.target.value })}
                placeholder="أدخل رسالة الصيانة التي ستظهر للعملاء"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows="4" />
              
                </div>
            }

              {/* زر الحفظ */}
              <button
              onClick={() => saveSystemMutation.mutate(systemData)}
              disabled={saveSystemMutation.isPending}
              className="bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {saveSystemMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>

            </div>
          }

          {activeSection === "contact" &&
          <div className="space-y-6">
              {/* وسائل التواصل الديناميكية */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">وسائل التواصل</h4>
                  <button
                    type="button"
                    onClick={addContactItem}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={14} />
                    إضافة وسيلة تواصل
                  </button>
                </div>

                {contactData.contact_items.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    لا توجد وسائل تواصل مضافة بعد — اضغط "إضافة وسيلة تواصل"
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleContactDragEnd}>
                    <Droppable droppableId="contact-items-list">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.contact_items.map((item, index) => {
                            const typeInfo = contactTypes.find(t => t.value === item.type) || contactTypes[0];
                            return (
                              <Draggable key={index} draggableId={`contact-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 bg-secondary/30 border border-border rounded-lg p-3 transition-shadow ${snapshot.isDragging ? "shadow-lg opacity-90" : ""}`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                                      title="اسحب لإعادة الترتيب"
                                    >
                                      <GripVertical size={16} />
                                    </div>
                                    <select
                                      value={item.type}
                                      onChange={(e) => updateContactItem(index, "type", e.target.value)}
                                      className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white flex-shrink-0"
                                      dir="rtl"
                                    >
                                      {contactTypes.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      value={item.value}
                                      onChange={(e) => updateContactItem(index, "value", e.target.value)}
                                      placeholder={typeInfo.placeholder}
                                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                    />
                                    {/* منتقي الأيقونة */}
                                    <IconPickerPopover
                                      value={item.icon || ""}
                                      onChange={(iconName) => {
                                        console.log("الأيقونة المختارة:", iconName, typeof iconName);
                                        updateContactItem(index, "icon", iconName);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeContactItem(index)}
                                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors flex-shrink-0"
                                    >
                                      <Trash2 size={15} />
                                    </button>
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
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={14} />
                    إضافة وسيلة تواصل
                  </button>
                </div>

                {contactData.social_links.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    لا توجد وسائل تواصل مضافة بعد
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleSocialDragEnd}>
                    <Droppable droppableId="social-links-list">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {contactData.social_links.map((link, index) => (
                            <Draggable key={index} draggableId={`social-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-3 bg-secondary/30 border border-border rounded-lg p-3 transition-shadow ${snapshot.isDragging ? "shadow-lg opacity-90" : ""}`}
                                >
                                  {/* Drag handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                                    title="اسحب لإعادة الترتيب"
                                  >
                                    <GripVertical size={16} />
                                  </div>
                                  <select
                                    value={link.platform}
                                    onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                                    className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white flex-shrink-0"
                                    dir="rtl"
                                  >
                                    {socialPlatforms.map(p => (
                                      <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                  />
                                  {/* منتقي الأيقونة */}
                                  <IconPickerPopover
                                    value={link.icon || ""}
                                    onChange={(iconName) => updateSocialLink(index, "icon", iconName)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSocialLink(index)}
                                    className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors flex-shrink-0"
                                  >
                                    <Trash2 size={15} />
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
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  console.log("===== البيانات الحالية قبل الحفظ =====");
                  console.log(JSON.stringify(contactData, null, 2));
                  console.log("عدد contact_items:", contactData.contact_items?.length);
                  console.log("عدد social_links:", contactData.social_links?.length);
                  saveContactMutation.mutate(contactData);
                }}
                disabled={saveContactMutation.isPending}
                className="bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saveContactMutation.isPending ? "جارٍ الحفظ..." : "حفظ إعدادات التواصل"}
              </button>
            </div>
          }

          {activeSection !== "brand" && activeSection !== "system" && activeSection !== "contact" &&
          <div className="text-center py-12">
              <div className="text-muted-foreground text-sm">لا توجد محتويات حتى الآن</div>
            </div>
          }
        </motion.div>
      </div>
    </motion.div>);

}