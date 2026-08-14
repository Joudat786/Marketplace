import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Save, Eye, EyeOff, Wifi, Loader2, Send, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";

export default function OurSMSSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({});
  const [showToken, setShowToken] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [sendTestPanel, setSendTestPanel] = useState({ open: false });
  const [testData, setTestData] = useState({ phone: "", message: "رسالة تجريبية", sender: "OurSMS" });
  const [testSendLoading, setTestSendLoading] = useState(false);

  // جلب المستخدم الحالي
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  // جلب الإعدادات المحفوظة
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const settings = await base44.entities.GeneralSettings.filter({ settings_type: "oursms_config" });
        if (settings && settings.length > 0) {
          setConfig(settings[0].oursms_config || {});
        }
      } catch (e) {
        console.error("Failed to load config:", e);
      }
    };
    loadConfig();
  }, []);

  // حفظ الإعدادات
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config.api_token?.trim()) {
        throw new Error("رمز API مطلوب");
      }
      const existing = await base44.entities.GeneralSettings.filter({ settings_type: "oursms_config" });
      const payload = {
        brand_name: "OurSMS Settings",
        settings_type: "oursms_config",
        oursms_config: config
      };
      if (existing && existing.length > 0) {
        return await base44.entities.GeneralSettings.update(existing[0].id, payload);
      } else {
        return await base44.entities.GeneralSettings.create(payload);
      }
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات OurSMS بنجاح ✅" });
      queryClient.invalidateQueries({ queryKey: ["oursmsSettings"] });
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("ourSmsProxy", { 
        action: "testConnection", 
        payload: { token: config.api_token } 
      });
      if (res.data?.success) {
        setTestResult("success");
        toast({ title: "✅ الاتصال ناجح", description: "تم الاتصال ببوابة OurSMS بنجاح" });
      } else {
        setTestResult("error");
        toast({ title: "❌ فشل الاتصال", description: res.data?.error || "تحقق من صحة رمز API", variant: "destructive" });
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
      const res = await base44.functions.invoke("ourSmsProxy", { 
        action: "getCredits", 
        payload: { token: config.api_token } 
      });
      if (res.data?.success) {
        setBalance(res.data.credits);
        toast({ title: "✅ الرصيد", description: `الرصيد المتوفر: ${res.data.credits}` });
      } else {
        toast({ title: "❌ خطأ", description: res.data?.error || "فشل في استرجاع الرصيد", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSendTestSMS = async () => {
    if (!testData.phone.trim()) {
      toast({ title: "تنبيه", description: "أدخل رقم الجوال", variant: "destructive" });
      return;
    }
    if (!testData.message.trim()) {
      toast({ title: "تنبيه", description: "أدخل نص الرسالة", variant: "destructive" });
      return;
    }
    setTestSendLoading(true);
    try {
      const res = await base44.functions.invoke("ourSmsProxy", { 
        action: "sendTestSms", 
        payload: { 
          token: config.api_token, 
          mobile: testData.phone.trim(), 
          message: testData.message.trim(),
          src: testData.sender.trim() || "OurSMS"
        } 
      });
      if (res.data?.success) {
        toast({ title: "✅ تم الإرسال", description: res.data?.message || "تم إرسال الرسالة التجريبية بنجاح" });
        setSendTestPanel({ open: false });
        setTestData({ phone: "", message: "رسالة تجريبية", sender: "OurSMS" });
      } else {
        toast({ title: "❌ فشل الإرسال", description: res.data?.error || "فشل في إرسال الرسالة التجريبية", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    } finally {
      setTestSendLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات OurSMS 📱</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة بيانات الربط مع خدمة رسائلنا (OurSMS)</p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Connection Status */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
          testResult === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : testResult === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-dashed border-border bg-secondary/20 text-muted-foreground"
        }`}>
          {testResult === "success" ? (
            <><CheckCircle size={18} /><span className="text-sm font-semibold">البوابة متصلة ومفعلة</span></>
          ) : testResult === "error" ? (
            <><AlertTriangle size={18} /><span className="text-sm font-semibold">فشل الاتصال</span></>
          ) : (
            <><span className="text-sm font-semibold">لم يتم الاختبار بعد</span></>
          )}
        </div>

        {/* API Token */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">رمز API *</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={config.api_token || ""}
              onChange={e => setConfig({ ...config, api_token: e.target.value })}
              placeholder="أدخل رمز API من OurSMS"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">💡 احصل على الرمز من: www.oursms.net → API Keys</p>
        </div>

        {/* Default Sender */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">اسم المرسل الافتراضي (اختياري)</label>
          <input
            type="text"
            value={config.default_sender || ""}
            onChange={e => setConfig({ ...config, default_sender: e.target.value })}
            placeholder="مثال: شركتك"
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">💡 الاسم الذي سيظهر للمستقبلين - يجب أن يكون مسجلاً في OurSMS</p>
        </div>

        {/* Balance Info */}
        {balance !== null && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              💰 رصيدك الحالي: <span className="text-lg font-bold">{balance}</span> رصيد
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border flex-wrap">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !config.api_token}
            className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={16} />
            {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testLoading || !config.api_token}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
            {testLoading ? "جارٍ الاختبار..." : "اختبار الاتصال"}
          </button>

          <button
            onClick={handleCheckBalance}
            disabled={balanceLoading || !config.api_token}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {balanceLoading ? <Loader2 size={16} className="animate-spin" /> : "💰"}
            {balanceLoading ? "جارٍ الجلب..." : "عرض الرصيد"}
          </button>

          <button
            onClick={() => setSendTestPanel({ open: true })}
            disabled={!config.api_token}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
            إرسال رسالة تجريبية
          </button>
        </div>
      </div>

      {/* Send Test SMS Panel */}
      <SlidePanel open={sendTestPanel.open} onClose={() => setSendTestPanel({ open: false })}>
        <div className="p-6 space-y-6" dir="rtl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSendTestPanel({ open: false })}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowRight size={18} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">إرسال رسالة تجريبية</h2>
              <p className="text-xs text-muted-foreground">اختبر الخدمة بإرسال رسالة تجريبية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">رقم الجوال *</label>
              <input
                type="text"
                value={testData.phone}
                onChange={e => setTestData({ ...testData, phone: e.target.value })}
                placeholder="مثال: 966501234567"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">نص الرسالة *</label>
              <textarea
                value={testData.message}
                onChange={e => setTestData({ ...testData, message: e.target.value })}
                placeholder="أدخل نص الرسالة"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">اسم المرسل</label>
              <input
                type="text"
                value={testData.sender}
                onChange={e => setTestData({ ...testData, sender: e.target.value })}
                placeholder="مثال: شركتك"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSendTestSMS}
              disabled={testSendLoading}
              className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={16} />
              {testSendLoading ? "جارٍ الإرسال..." : "إرسال"}
            </button>
            <button
              onClick={() => setSendTestPanel({ open: false })}
              className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </SlidePanel>
    </motion.div>
  );
}