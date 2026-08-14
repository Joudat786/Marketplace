import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Save, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight, Wifi, Loader2, Send, Settings, Info, Sliders, ExternalLink } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";
import { useNavigate } from "react-router-dom";
import AppCustomizationSection from "@/components/apps/AppCustomizationSection";
import MyFatoorahSettingsPage from "@/pages/superadmin/settings/MyFatoorahSettings";
import BankTransferSettingsPage from "@/pages/superadmin/settings/BankTransferSettings";

const settingsPageMap = {
  myfatoorah: MyFatoorahSettingsPage,
  bank_transfer: BankTransferSettingsPage,
};

function SettingsPageInPanel({ settingsPage }) {
  const PageComponent = settingsPageMap[settingsPage];
  if (!PageComponent) return (
    <div className="text-center py-12 text-muted-foreground text-sm">لا توجد صفحة إعدادات لهذا التطبيق</div>
  );
  return <div className="overflow-y-auto"><PageComponent /></div>;
}

export default function AppSetupPanel({ open, onClose, installedApp, app }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const workspaceCtx = useWorkspace();
  const selectedWorkspace = !isSuperAdmin ? (workspaceCtx?.selectedWorkspace || null) : null;

  const [activeTab, setActiveTab] = useState("setup");
  const [config, setConfig] = useState({});
  const [showValues, setShowValues] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [customName, setCustomName] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [testMessageLoading, setTestMessageLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("رسالة تجريبية");

  const { data: latestInstalledApp } = useQuery({
    queryKey: ["installedApp-setup", installedApp?.id, selectedWorkspace?.id],
    queryFn: async () => {
      if (!installedApp?.id) return null;
      // للسوبر أدمن: جلب مباشرة بالـ id فقط
      if (isSuperAdmin) {
        const apps = await base44.entities.InstalledApp.filter({ id: installedApp.id });
        return apps && apps.length > 0 ? apps[0] : installedApp;
      }
      // للعملاء: تحقق من workspace_id
      if (!selectedWorkspace?.id) return null;
      const apps = await base44.entities.InstalledApp.filter({ id: installedApp.id, workspace_id: selectedWorkspace.id });
      return apps && apps.length > 0 ? apps[0] : installedApp;
    },
    enabled: !!installedApp?.id && open && (isSuperAdmin || !!selectedWorkspace?.id)
  });

  const currentInstalledApp = latestInstalledApp || installedApp;
  const fields = app?.integration_fields || [];

  const isValidOwner = () => {
    if (!user || !currentInstalledApp) return false;
    // السوبر أدمن: يملك وصولاً لأي تطبيق من نوع super_admin أو لم يُحدد owner_type
    if (isSuperAdmin) return currentInstalledApp.owner_type === 'super_admin' || !currentInstalledApp.owner_type || currentInstalledApp.owner_type === 'workspace';
    if (!selectedWorkspace?.id) return false;
    if (currentInstalledApp.workspace_id !== selectedWorkspace.id) return false;
    return currentInstalledApp.owner_type === 'workspace';
  };

  useEffect(() => {
    if (open && currentInstalledApp && isValidOwner()) {
      setConfig(currentInstalledApp.client_config || {});
      setCustomName(currentInstalledApp.custom_name || "");
      setCustomIconUrl(currentInstalledApp.custom_icon_url || "");
      setTestResult(null);
      setShowValues({});
      setActiveTab("setup");
    }
  }, [open, currentInstalledApp, fields.length, app]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isSuperAdmin && !selectedWorkspace?.id) {
        throw new Error("❌ خطأ: لم يتم تحديد مساحة العمل");
      }
      for (const field of fields) {
        if (field.required && !config[field.key]?.trim()) {
          throw new Error(`الحقل "${field.label}" إجباري`);
        }
      }
      const updateData = {
        client_config: config,
        is_configured: true,
        status: "active",
        workspace_id: isSuperAdmin ? null : selectedWorkspace?.id,
      };
      if (app?.allow_custom_name) updateData.custom_name = customName;
      if (app?.allow_custom_icon) updateData.custom_icon_url = customIconUrl;
      return await base44.entities.InstalledApp.update(currentInstalledApp.id, updateData);
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات الربط وتفعيل التطبيق بنجاح ✅" });
      if (!isSuperAdmin) {
        queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["installedApp-setup"] });
      onClose();
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const toggleShow = (key) => setShowValues(prev => ({ ...prev, [key]: !prev[key] }));

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const apiKey = config.api_token || config.api_key || config.token || config.Api_Key;
      if (!apiKey?.trim()) {
        toast({ title: "تنبيه", description: "يرجى إدخال رمز API أولاً", variant: "destructive" });
        return;
      }
      const res = await base44.functions.invoke("ourSmsProxy", { action: "testConnection", payload: { token: apiKey } });
      if (res.data?.success) {
        setTestResult("success");
        toast({ title: "✅ الاتصال ناجح", description: "تم الاتصال بخدمة الرسائل بنجاح" });
      } else {
        setTestResult("error");
        toast({ title: "❌ فشل الاتصال", description: res.data?.error || "تحقق من صحة البيانات", variant: "destructive" });
      }
    } catch (e) {
      setTestResult("error");
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    setBalanceLoading(true);
    setBalance(null);
    try {
      const apiKey = config.api_token || config.api_key || config.token || config.Api_Key ||
        currentInstalledApp.client_config?.api_token || currentInstalledApp.client_config?.api_key;
      if (!apiKey?.trim()) {
        toast({ title: "تنبيه", description: "يرجى إدخال رمز API أولاً", variant: "destructive" });
        return;
      }
      const res = await base44.functions.invoke("ourSmsProxy", { action: "getCredits", payload: { token: apiKey } });
      if (res.data?.success) {
        setBalance(res.data.credits);
        toast({ title: "✅ الرصيد", description: `الرصيد المتوفر: ${res.data.credits}` });
      } else {
        toast({ title: "❌ خطأ", description: res.data?.error || "فشل استرجاع الرصيد", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) { toast({ title: "تنبيه", description: "أدخل رقم الجوال", variant: "destructive" }); return; }
    if (!testMessage.trim()) { toast({ title: "تنبيه", description: "أدخل نص الرسالة", variant: "destructive" }); return; }
    setTestMessageLoading(true);
    try {
      const apiKey = config.api_token || config.api_key || config.token || config.Api_Key ||
        currentInstalledApp.client_config?.api_token || currentInstalledApp.client_config?.api_key;
      if (!apiKey?.trim()) {
        toast({ title: "تنبيه", description: "يرجى إدخال رمز API أولاً", variant: "destructive" });
        return;
      }
      const senderName = config.default_sender?.trim() || "OurSMS";
      const res = await base44.functions.invoke("ourSmsProxy", {
        action: "sendTestSms",
        payload: { token: apiKey.trim(), mobile: testPhone.trim(), message: testMessage.trim(), src: senderName }
      });
      if (res.data?.success) {
        toast({ title: "✅ تم الإرسال", description: res.data?.message || "تم إرسال الرسالة التجريبية بنجاح" });
        setTestPhone("");
        setTestMessage("رسالة تجريبية");
      } else {
        toast({ title: "❌ فشل الإرسال", description: res.data?.error || "فشل في إرسال الرسالة", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    } finally {
      setTestMessageLoading(false);
    }
  };

  if (!app || !currentInstalledApp) return null;
  if (!isSuperAdmin && !isValidOwner()) return null;

  const isOurSMSApp = app.id === "oursms" || app.name?.toLowerCase().includes("oursms");

  const tabs = [
    { key: "setup", label: "الربط والإعدادات", icon: Settings },
    { key: "info", label: "الوصف والاستخدام", icon: Info },
    { key: "custom", label: "إعدادات مخصصة", icon: Sliders },
  ];

  return (
    <SlidePanel open={open} onClose={onClose}>
      <div className="flex flex-col h-full" dir="rtl">

        {/* الرأس */}
        <div className="flex items-center gap-3 p-6 border-b border-border flex-shrink-0">
          <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
            <ArrowRight size={18} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {app.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-10 h-10 rounded-xl object-contain border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">📦</div>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">{app.name}</h2>
              <p className="text-xs text-muted-foreground">{app.short_description || app.description || "إعداد وتكوين التطبيق"}</p>
            </div>
          </div>
          {/* حالة الإعداد */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            currentInstalledApp.is_configured
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          }`}>
            {currentInstalledApp.is_configured
              ? <><CheckCircle size={13} /> مفعّل</>
              : <><AlertTriangle size={13} /> يحتاج إعداد</>}
          </div>
        </div>

        {/* التبويبات */}
        <div className="flex border-b border-border flex-shrink-0 bg-secondary/20">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all flex-1 justify-center ${
                  activeTab === tab.key
                    ? "border-primary text-primary bg-white"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* محتوى التبويبات */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ===== تبويب 1: الربط والإعدادات ===== */}
          {activeTab === "setup" && (
            <div className="space-y-5">
              {/* حقول الربط */}
              {fields.length === 0 ? (
                app?.settings_page ? (
                  <SettingsPageInPanel settingsPage={app.settings_page} />
                ) : (
                  <div className="text-center py-12 bg-secondary/20 rounded-xl">
                    <Settings size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">هذا التطبيق لا يحتاج إعداداً إضافياً</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">بيانات الربط</h3>
                  {fields.map((field) => (
                    <div key={field.key}>
                      {field.type === "checkbox" ? (
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/50">
                          <input
                            type="checkbox"
                            checked={config[field.key] || false}
                            onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.checked }))}
                            className="w-5 h-5 rounded border-border"
                          />
                          <span className="font-semibold text-foreground">{field.label}</span>
                        </label>
                      ) : field.type === "select" ? (
                        <>
                          <label className="block text-sm font-semibold text-foreground mb-1.5">
                            {field.label}{field.required && <span className="text-destructive mr-1">*</span>}
                          </label>
                          <select
                            value={config[field.key] || ""}
                            onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            dir="rtl"
                          >
                            <option value="">اختر...</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {field.help_text && <p className="text-xs text-muted-foreground mt-1">💡 {field.help_text}</p>}
                        </>
                      ) : (
                        <>
                          <label className="block text-sm font-semibold text-foreground mb-1.5">
                            {field.label}{field.required && <span className="text-destructive mr-1">*</span>}
                          </label>
                          <div className="relative">
                            <input
                              type={field.type === "password" && !showValues[field.key] ? "password" : "text"}
                              value={config[field.key] || ""}
                              onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                              dir={field.type === "password" || field.type === "url" ? "ltr" : "rtl"}
                            />
                            {field.type === "password" && (
                              <button type="button" onClick={() => toggleShow(field.key)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showValues[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                          {field.help_text && <p className="text-xs text-muted-foreground mt-1">💡 {field.help_text}</p>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* نتيجة الاختبار */}
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold ${
                  testResult === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {testResult === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {testResult === "success" ? "✅ الاتصال بالبوابة يعمل بشكل صحيح" : "❌ فشل الاتصال — تحقق من البيانات المدخلة"}
                </div>
              )}

              {/* رسالة تجريبية - OurSMS */}
              {isOurSMSApp && currentInstalledApp.is_configured && (
                <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm font-semibold text-foreground">إرسال رسالة تجريبية</p>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">رقم الجوال *</label>
                    <input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="مثال: 966501234567"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">نص الرسالة *</label>
                    <textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="أدخل نص الرسالة التجريبية"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none" dir="rtl" />
                  </div>
                  <p className="text-xs text-primary/70">💡 سيتم الإرسال باسم المرسل: <span className="font-semibold">{config.default_sender?.trim() || "OurSMS"}</span></p>
                  <button onClick={handleSendTestMessage} disabled={testMessageLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {testMessageLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {testMessageLoading ? "جارٍ الإرسال..." : "إرسال رسالة تجريبية"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== تبويب 2: الوصف والاستخدام ===== */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* معلومات التطبيق */}
              <div className="flex items-start gap-4 p-4 bg-secondary/20 rounded-xl border border-border">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-xl object-contain border border-border flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">📦</div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{app.name}</h3>
                  {app.primary_category && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{app.primary_category}</span>
                  )}
                  {(app.description || app.short_description) && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{app.description || app.short_description}</p>
                  )}
                </div>
              </div>

              {/* التسعير */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/40 px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">معلومات الاشتراك</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">النوع</span>
                    <span className="text-sm font-semibold text-foreground">
                      {app.is_free ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">مجاني</span> : <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">مدفوع</span>}
                    </span>
                  </div>
                  {!app.is_free && (
                    <>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-sm text-muted-foreground">السعر الشهري</span>
                        <span className="text-sm font-semibold text-foreground">{app.monthly_price} {app.currency}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-sm text-muted-foreground">السعر السنوي</span>
                        <span className="text-sm font-semibold text-foreground">{app.yearly_price} {app.currency}</span>
                      </div>
                    </>
                  )}
                  {app.has_trial && (
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-sm text-muted-foreground">فترة تجريبية</span>
                      <span className="text-sm font-semibold text-emerald-600">{app.trial_days} يوم مجاناً</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">حالة التفعيل</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${currentInstalledApp.is_configured ? "text-emerald-700 bg-emerald-50" : "text-yellow-700 bg-yellow-50"}`}>
                      {currentInstalledApp.is_configured ? "مفعّل ومربوط" : "يحتاج إعداد"}
                    </span>
                  </div>
                </div>
              </div>

              {/* كيفية الاستخدام */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/40 px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">كيفية الاستخدام</p>
                </div>
                <div className="p-4 space-y-3">
                  {fields.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">لإعداد هذا التطبيق، يلزمك توفير البيانات التالية من مزود الخدمة:</p>
                      <ul className="space-y-1.5">
                        {fields.map(field => (
                          <li key={field.key} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <div>
                              <span className="font-semibold text-foreground">{field.label}</span>
                              {field.required && <span className="text-destructive text-xs mr-1">(مطلوب)</span>}
                              {field.help_text && <p className="text-xs text-muted-foreground mt-0.5">{field.help_text}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-sm text-emerald-700">هذا التطبيق لا يحتاج إعداداً خاصاً — يعمل مباشرة بعد التثبيت</p>
                    </div>
                  )}
                </div>
              </div>

              {/* الفئات */}
              {app.categories?.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-secondary/40 px-4 py-3 border-b border-border">
                    <p className="text-sm font-bold text-foreground">التصنيفات</p>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {app.categories.map((cat, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{cat}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* معلومات التثبيت */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/40 px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">معلومات التثبيت</p>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">حالة التطبيق</span>
                    <span className="font-semibold text-foreground">{currentInstalledApp.status || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">دورة الفوترة</span>
                    <span className="font-semibold text-foreground">{currentInstalledApp.billing_cycle === "yearly" ? "سنوية" : "شهرية"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">حالة الدفع</span>
                    <span className="font-semibold text-foreground">{currentInstalledApp.payment_status || "-"}</span>
                  </div>
                  {currentInstalledApp.trial_ends_at && (
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">انتهاء التجربة</span>
                      <span className="font-semibold text-foreground">{currentInstalledApp.trial_ends_at}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== تبويب 3: إعدادات مخصصة ===== */}
          {activeTab === "custom" && (
            <div className="space-y-5">
              {/* تخصيص الاسم والأيقونة */}
              {(app?.allow_custom_name || app?.allow_custom_icon) ? (
                <AppCustomizationSection
                  app={app}
                  customName={customName}
                  customIconUrl={customIconUrl}
                  onCustomNameChange={setCustomName}
                  onCustomIconChange={setCustomIconUrl}
                />
              ) : (
                <div className="text-center py-12 bg-secondary/20 rounded-xl">
                  <Sliders size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">لا توجد إعدادات مخصصة</p>
                  <p className="text-xs text-muted-foreground mt-1">لم يتم تفعيل خيارات التخصيص لهذا التطبيق من قِبَل المسؤول</p>
                </div>
              )}


            </div>
          )}
        </div>

        {/* الأزرار السفلية */}
        <div className="flex items-center gap-3 p-6 border-t border-border flex-shrink-0 flex-wrap">
          {/* زر فتح التطبيق فقط لتطبيقات الواجهة (app_type: ui) */}
          {app?.app_type === 'ui' && app?.route && currentInstalledApp?.status === 'active' && (
            <button
              onClick={() => { onClose(); navigate(app.route); }}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={16} />
              فتح التطبيق
            </button>
          )}
          {(activeTab === "setup" || activeTab === "custom") && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={16} />
              {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ وتفعيل"}
            </button>
          )}
          {currentInstalledApp.is_configured && isOurSMSApp && activeTab === "setup" && (
            <>
              <button onClick={handleTestConnection} disabled={testLoading}
                className="flex items-center gap-2 bg-secondary border border-border text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50">
                {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                {testLoading ? "جارٍ الاختبار..." : "اختبار الاتصال"}
              </button>
              <button onClick={handleCheckBalance} disabled={balanceLoading}
                className="flex items-center gap-2 bg-secondary border border-border text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50">
                {balanceLoading ? <Loader2 size={16} className="animate-spin" /> : "💰"}
                {balanceLoading ? "جارٍ الجلب..." : "عرض الرصيد"}
              </button>
            </>
          )}
          <button onClick={onClose} className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
            إغلاق
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}