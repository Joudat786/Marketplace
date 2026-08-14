import { useState, useEffect, useRef } from "react";
import { ArrowRight, Loader2, Search, ChevronDown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BulkActionsPanel({ selectedAppIds, onConfirm, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    is_addon: null,
    parent_app_ids: [],
    is_active: null,
    is_ready: null,
    categories: [],
    primary_category: "",
    is_free: null,
    currency: "SAR",
    monthly_price: null,
    yearly_price: null,
    has_trial: null,
    trial_days: 14,
    super_admin_can_install: null,
    clients_can_install: null,
    visibility_mode: null,
    allowed_plan_ids: [],
    restriction_message: null,
    allow_custom_name: null,
    allow_custom_icon: null,
    app_type: null,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // جلب جميع التطبيقات والتصنيفات والباقات
  const { data: allApps = [] } = useQuery({
    queryKey: ["apps-for-bulk"],
    queryFn: () => base44.entities.App.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["appCategories"],
    queryFn: () => base44.entities.AppCategory.list(),
    select: (data) => [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.Plan.list()
  });

  const handleConfirm = () => {
    if (Object.values(formData).every(v => v === null || (Array.isArray(v) && v.length === 0))) {
      alert("اختر حقول واحدة على الأقل للتحديث");
      return;
    }
    onConfirm(formData);
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => {
      const updated = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: updated };
    });
  };

  const handleParentAppSelect = (appId) => {
    setFormData(prev => {
      const updated = prev.parent_app_ids.includes(appId)
        ? prev.parent_app_ids.filter(id => id !== appId)
        : [...prev.parent_app_ids, appId];
      return { ...prev, parent_app_ids: updated };
    });
  };

  const [parentAppSearch, setParentAppSearch] = useState("");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const catDropdownRef = useRef(null);
  const [primaryCatDropdownOpen, setPrimaryCatDropdownOpen] = useState(false);
  const primaryCatDropdownRef = useRef(null);
  const [primaryCatSearch, setPrimaryCatSearch] = useState("");

  const mainApps = allApps.filter(a => !a.is_addon && !selectedAppIds.includes(a.id));
  const filteredMainApps = mainApps.filter(a => a.name.toLowerCase().includes(parentAppSearch.toLowerCase()));

  const filteredCats = categories.filter(c => c.is_active && c.name.toLowerCase().includes(catSearch.toLowerCase()));

  // إغلاق الـ dropdown عند النقر خارجه
  useEffect(() => {
    const handleClick = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
      if (primaryCatDropdownRef.current && !primaryCatDropdownRef.current.contains(e.target)) {
        setPrimaryCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 sticky top-0 bg-card">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          title="رجوع"
        >
          <ArrowRight size={20} className="text-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">تعديل جماعي للتطبيقات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            تعديل {selectedAppIds.length} تطبيق — عدّل الحقول المطلوبة فقط
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="basic" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-border sticky top-14 bg-card">
            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="categories">التصنيفات والنوع</TabsTrigger>
            <TabsTrigger value="pricing">التسعير</TabsTrigger>
            <TabsTrigger value="visibility">الصلاحيات والظهور</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="p-6 space-y-6">
            {/* نوع التطبيق (Addon) */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">نوع التطبيق</h3>
              <div className={`border-2 rounded-xl transition-all p-4 ${formData.is_addon !== null ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">إضافة (Add-on)</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, is_addon: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", formData.is_addon === true ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_addon: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", formData.is_addon === false ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      لا
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_addon: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", formData.is_addon === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                </div>

                {formData.is_addon && (
                  <div className="border-t border-primary/20 pt-4">
                    <p className="text-xs text-muted-foreground mb-3">اختر التطبيقات الرئيسية</p>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={parentAppSearch}
                        onChange={e => setParentAppSearch(e.target.value)}
                        placeholder="ابحث في التطبيقات..."
                        className="w-full border border-border rounded-lg pr-8 pl-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                      />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filteredMainApps.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">لا توجد نتائج</p>
                      ) : filteredMainApps.map(app => (
                        <label key={app.id} className="flex items-center gap-2 p-2 hover:bg-secondary/40 rounded-lg cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={formData.parent_app_ids.includes(app.id)}
                            onChange={() => handleParentAppSelect(app.id)}
                            className="w-4 h-4"
                          />
                          <span>{app.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* الحالة */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">الحالة</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, is_active: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_active === true ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      مفعل
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_active: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_active === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}
                    >
                      معطل
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_active: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_active === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">مفعل / معطل</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, is_ready: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_ready === true ? "bg-emerald-500 text-white" : "border border-border hover:border-emerald-500")}
                    >
                      جاهز
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_ready: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_ready === false ? "bg-amber-500 text-white" : "border border-border hover:border-amber-500")}
                    >
                      قيد التطوير
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_ready: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_ready === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">جاهز للنشر</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Categories & Type Tab */}
          <TabsContent value="categories" className="p-6 space-y-6" style={{ marginTop: '48px' }}>
            {/* Dropdown متعدد الاختيار للتصنيفات */}
            <div className="border border-border rounded-xl p-4 bg-card">
              <div className="mb-3 pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">التصنيفات</h3>
                <p className="text-xs text-muted-foreground mt-1">اختر التصنيفات التي سيظهر فيها التطبيق في متجر التطبيقات</p>
              </div>
              <div className="relative" ref={catDropdownRef}>
                {/* زر فتح الـ Dropdown */}
                <button
                  type="button"
                  onClick={() => setCatDropdownOpen(v => !v)}
                  dir="rtl"
                  className="w-full flex items-center justify-between border border-border rounded-lg px-3 py-2.5 bg-white text-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-right"
                >
                  <span className={formData.categories.length === 0 ? "text-muted-foreground" : "text-foreground font-medium"}>
                    {formData.categories.length === 0
                      ? "اختر التصنيفات..."
                      : `${formData.categories.length} تصنيف محدد`}
                  </span>
                  <ChevronDown size={16} className={cn("text-muted-foreground transition-transform flex-shrink-0", catDropdownOpen && "rotate-180")} />
                </button>

                {/* الـ Tags للتصنيفات المختارة */}
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {categories.filter(c => formData.categories.includes(c.id)).map(cat => (
                      <span key={cat.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className="hover:text-primary/60 mr-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* قائمة الـ Dropdown */}
                {catDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
                    {/* بحث */}
                    <div className="p-2 border-b border-border">
                      <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2 py-1.5">
                        <Search size={13} className="text-muted-foreground flex-shrink-0" />
                        <input
                          type="text"
                          value={catSearch}
                          onChange={e => setCatSearch(e.target.value)}
                          placeholder="ابحث في التصنيفات..."
                          className="flex-1 bg-transparent text-xs outline-none text-right"
                          autoFocus
                        />
                      </div>
                    </div>
                    {/* تحديد الكل */}
                    <div className="px-3 py-2 border-b border-border bg-secondary/20">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={filteredCats.length > 0 && filteredCats.every(c => formData.categories.includes(c.id))}
                          onChange={() => {
                            const allSelected = filteredCats.every(c => formData.categories.includes(c.id));
                            if (allSelected) {
                              setFormData(prev => ({ ...prev, categories: prev.categories.filter(id => !filteredCats.find(c => c.id === id)) }));
                            } else {
                              const toAdd = filteredCats.filter(c => !formData.categories.includes(c.id)).map(c => c.id);
                              setFormData(prev => ({ ...prev, categories: [...prev.categories, ...toAdd] }));
                            }
                          }}
                          className="w-3.5 h-3.5"
                        />
                        تحديد الكل ({filteredCats.length})
                      </label>
                    </div>
                    {/* القائمة */}
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCats.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-4">لا توجد نتائج</p>
                      ) : filteredCats.map(cat => (
                        <label key={cat.id} className={cn("flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors border-b border-border/40 last:border-0", formData.categories.includes(cat.id) && "bg-primary/5")}>
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(cat.id)}
                            onChange={() => handleCategorySelect(cat.id)}
                            className="w-3.5 h-3.5 flex-shrink-0"
                          />
                          {cat.icon && <span className="text-base">{cat.icon}</span>}
                          <span className="text-sm text-foreground">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* التصنيف الرئيسي */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">التصنيف الرئيسي</label>
              {formData.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
                  اختر تصنيفاً واحداً على الأقل أعلاه لتحديد التصنيف الرئيسي
                </p>
              ) : (
                <div className="relative" ref={primaryCatDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPrimaryCatDropdownOpen(v => !v)}
                    dir="rtl"
                    className="w-full flex items-center justify-between border border-border rounded-lg px-3 py-2.5 bg-white text-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-right"
                  >
                    <span className={!formData.primary_category ? "text-muted-foreground" : "text-foreground font-medium"}>
                      {!formData.primary_category
                        ? "لا تعدل"
                        : (() => { const cat = categories.find(c => c.id === formData.primary_category); return cat ? `${cat.icon || ""} ${cat.name}` : "لا تعدل"; })()
                      }
                    </span>
                    <ChevronDown size={16} className={cn("text-muted-foreground transition-transform flex-shrink-0", primaryCatDropdownOpen && "rotate-180")} />
                  </button>

                  {primaryCatDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
                      {/* بحث */}
                      <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2 py-1.5">
                          <Search size={13} className="text-muted-foreground flex-shrink-0" />
                          <input
                            type="text"
                            value={primaryCatSearch}
                            onChange={e => setPrimaryCatSearch(e.target.value)}
                            placeholder="ابحث في التصنيفات..."
                            className="flex-1 bg-transparent text-xs outline-none text-right"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {/* خيار لا تعدل */}
                        <button
                          type="button"
                          onClick={() => { setFormData({ ...formData, primary_category: "" }); setPrimaryCatDropdownOpen(false); }}
                          className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-sm text-right hover:bg-primary/5 transition-colors border-b border-border/40", !formData.primary_category && "bg-primary/5")}
                        >
                          <span className="text-muted-foreground">— لا تعدل</span>
                        </button>
                        {categories.filter(c => formData.categories.includes(c.id) && c.name.toLowerCase().includes(primaryCatSearch.toLowerCase())).map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => { setFormData({ ...formData, primary_category: cat.id }); setPrimaryCatDropdownOpen(false); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-sm text-right hover:bg-primary/5 transition-colors border-b border-border/40 last:border-0", formData.primary_category === cat.id && "bg-primary/5")}
                          >
                            {cat.icon && <span className="text-base">{cat.icon}</span>}
                            <span className="text-foreground">{cat.name}</span>
                            {formData.primary_category === cat.id && <span className="mr-auto text-primary text-xs font-bold">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* نوع التطبيق */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-1">نوع التطبيق</h3>
              <p className="text-xs text-muted-foreground mb-3">هل يفتح المستخدم شاشة للتطبيق أم أنه يعمل في الخلفية فقط؟</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, app_type: "ui" })}
                  className={cn("flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl cursor-pointer transition-all text-sm", formData.app_type === "ui" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                >
                  <span className="text-xl">🖥️</span>
                  <span className="text-xs font-bold text-foreground">واجهة (UI)</span>
                  <span className="text-[10px] text-muted-foreground text-center">له شاشة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, app_type: "service" })}
                  className={cn("flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl cursor-pointer transition-all text-sm", formData.app_type === "service" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                >
                  <span className="text-xl">⚙️</span>
                  <span className="text-xs font-bold text-foreground">خدمة (Service)</span>
                  <span className="text-[10px] text-muted-foreground text-center">بدون شاشة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, app_type: null })}
                  className={cn("flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl cursor-pointer transition-all text-sm", formData.app_type === null ? "border-muted bg-muted/30" : "border-border hover:border-muted")}
                >
                  <span className="text-xl">—</span>
                  <span className="text-xs font-bold text-muted-foreground">لا تعدل</span>
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">نوع التسعير</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({ ...formData, is_free: true })}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_free === true ? "bg-emerald-500 text-white" : "border border-border hover:border-emerald-500")}
                >
                  مجاني
                </button>
                <button
                  onClick={() => setFormData({ ...formData, is_free: false })}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_free === false ? "bg-primary text-white" : "border border-border hover:border-primary")}
                >
                  مدفوع
                </button>
                <button
                  onClick={() => setFormData({ ...formData, is_free: null })}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.is_free === null ? "bg-muted text-muted-foreground" : "border border-border")}
                >
                  لا تعدل
                </button>
              </div>
            </div>

            {formData.is_free === false && (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">العملة</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">السعر الشهري</label>
                    <input
                      type="number"
                      value={formData.monthly_price === null ? "" : formData.monthly_price}
                      onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      placeholder="0"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">السعر السنوي</label>
                    <input
                      type="number"
                      value={formData.yearly_price === null ? "" : formData.yearly_price}
                      onChange={(e) => setFormData({ ...formData, yearly_price: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      placeholder="0"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, has_trial: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.has_trial === true ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      فترة تجريبية
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_trial: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.has_trial === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}
                    >
                      بدون تجريبة
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_trial: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.has_trial === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                </div>

                {formData.has_trial === true && (
                  <input
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 14 })}
                    min="1"
                    max="365"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="عدد أيام التجريبة"
                  />
                )}
              </div>
            )}
          </TabsContent>

          {/* Permissions & Visibility Tab */}
          <TabsContent value="visibility" className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">الصلاحيات</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, super_admin_can_install: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.super_admin_can_install === true ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      سماح
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, super_admin_can_install: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.super_admin_can_install === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}
                    >
                      منع
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, super_admin_can_install: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.super_admin_can_install === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">السوبر أدمن</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, clients_can_install: true })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.clients_can_install === true ? "bg-primary text-white" : "border border-border hover:border-primary")}
                    >
                      سماح
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, clients_can_install: false })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.clients_can_install === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}
                    >
                      منع
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, clients_can_install: null })}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.clients_can_install === null ? "bg-muted text-muted-foreground" : "border border-border")}
                    >
                      لا تعدل
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">العملاء</span>
                </div>
              </div>
            </div>

            {formData.clients_can_install === true && (
              <div className="border-t border-border pt-4 space-y-3">
                <label className="block text-sm font-bold text-foreground">طريقة ظهور التطبيق في متجر العملاء</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "ظاهر للجميع", desc: "يظهر لجميع العملاء بدون قيود" },
                    { value: "restricted", label: "ظاهر مع قيود", desc: "يظهر للجميع لكن التثبيت مقيّد بباقات محددة" },
                    { value: "hidden", label: "مخفي / حصري", desc: "لا يظهر إلا لأصحاب الباقات المحددة فقط" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, visibility_mode: opt.value })}
                      className={cn("w-full px-3 py-2.5 rounded-lg border-2 text-right transition-all", formData.visibility_mode === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                    >
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, visibility_mode: null })}
                    className={cn("w-full px-3 py-2 rounded-lg text-xs font-semibold border", formData.visibility_mode === null ? "bg-muted text-muted-foreground border-muted" : "border-border hover:border-muted")}
                  >
                    لا تعدل
                  </button>
                </div>

                {formData.visibility_mode === "restricted" && (
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">رسالة القيود (تظهر للعميل)</label>
                    <input
                      type="text"
                      value={formData.restriction_message || ""}
                      onChange={(e) => setFormData({ ...formData, restriction_message: e.target.value })}
                      placeholder="مثال: هذا التطبيق متاح في الباقة الاحترافية فقط"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    />
                  </div>
                )}

                {(formData.visibility_mode === "restricted" || formData.visibility_mode === "hidden") && plans.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">
                      {formData.visibility_mode === "hidden" ? "الباقات التي ترى التطبيق" : "الباقات المسموح لها بالتثبيت"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {plans.map(plan => (
                        <label key={plan.id} className={cn("flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer text-xs transition-all", formData.allowed_plan_ids.includes(plan.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/20")}>
                          <input type="checkbox" checked={formData.allowed_plan_ids.includes(plan.id)} onChange={() => { const updated = formData.allowed_plan_ids.includes(plan.id) ? formData.allowed_plan_ids.filter(id => id !== plan.id) : [...formData.allowed_plan_ids, plan.id]; setFormData({ ...formData, allowed_plan_ids: updated }); }} className="w-3.5 h-3.5" />
                          <div>
                            <p className="font-semibold text-foreground">{plan.name}</p>
                            <p className="text-[10px] text-muted-foreground">{plan.is_free ? "مجاني" : `${plan.monthly_price} ر.س/شهر`}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* تخصيص العميل */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-1">تخصيص التطبيق من قِبَل العميل</h3>
              <p className="text-xs text-muted-foreground mb-3">عند التفعيل يتمكن العميل من تخصيص اسم وصورة التطبيق</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => setFormData({ ...formData, allow_custom_name: true })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_name === true ? "bg-primary text-white" : "border border-border hover:border-primary")}>سماح</button>
                    <button onClick={() => setFormData({ ...formData, allow_custom_name: false })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_name === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}>منع</button>
                    <button onClick={() => setFormData({ ...formData, allow_custom_name: null })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_name === null ? "bg-muted text-muted-foreground" : "border border-border")}>لا تعدل</button>
                  </div>
                  <span className="text-xs text-muted-foreground">تخصيص الاسم</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => setFormData({ ...formData, allow_custom_icon: true })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_icon === true ? "bg-primary text-white" : "border border-border hover:border-primary")}>سماح</button>
                    <button onClick={() => setFormData({ ...formData, allow_custom_icon: false })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_icon === false ? "bg-destructive text-white" : "border border-border hover:border-destructive")}>منع</button>
                    <button onClick={() => setFormData({ ...formData, allow_custom_icon: null })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", formData.allow_custom_icon === null ? "bg-muted text-muted-foreground" : "border border-border")}>لا تعدل</button>
                  </div>
                  <span className="text-xs text-muted-foreground">تخصيص الصورة</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex gap-2 sticky bottom-0 bg-card">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جارٍ التحديث...
            </>
          ) : (
            "تطبيق التحديثات"
          )}
        </button>
      </div>
    </div>
  );
}