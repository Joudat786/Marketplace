import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { 
  CreditCard, Save, TestTube, CheckCircle, XCircle, 
  Eye, EyeOff, Copy, Check, Globe, Key, Link, AlertTriangle,
  Zap, Info
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyFatoorahSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const COUNTRY_OPTIONS = [
    { value: 'SAU', label: '🇸🇦 المملكة العربية السعودية', base_url: 'https://api-sa.myfatoorah.com', currency: 'SAR' },
    { value: 'ARE', label: '🇦🇪 الإمارات العربية المتحدة', base_url: 'https://api-ae.myfatoorah.com', currency: 'AED' },
    { value: 'QAT', label: '🇶🇦 قطر', base_url: 'https://api-qa.myfatoorah.com', currency: 'QAR' },
    { value: 'EGY', label: '🇪🇬 مصر', base_url: 'https://api-eg.myfatoorah.com', currency: 'EGP' },
    { value: 'KWT', label: '🇰🇼 الكويت', base_url: 'https://api.myfatoorah.com', currency: 'KWD' },
    { value: 'BHR', label: '🇧🇭 البحرين', base_url: 'https://api.myfatoorah.com', currency: 'BHD' },
    { value: 'OMN', label: '🇴🇲 عُمان', base_url: 'https://api.myfatoorah.com', currency: 'OMR' },
    { value: 'JOR', label: '🇯🇴 الأردن', base_url: 'https://api.myfatoorah.com', currency: 'JOD' },
  ];

  const [form, setForm] = useState({
    is_enabled: false,
    api_key: '',
    country_code: 'SAU',
    base_url: 'https://api-sa.myfatoorah.com',
    mode: 'test',
    supplier_code: '',
    webhook_secret: '',
    default_currency: 'SAR',
    success_url: '',
    error_url: '',
    notes: ''
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['myFatoorahSettings'],
    queryFn: () => base44.entities.MyFatoorahSettings.list()
  });

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const s = settingsData[0];
      // استنتاج country_code من base_url إذا لم يكن محفوظاً
      let detectedCountry = s.country_code || 'SAU';
      if (!s.country_code && s.base_url) {
        if (s.base_url.includes('api-sa')) detectedCountry = 'SAU';
        else if (s.base_url.includes('api-ae')) detectedCountry = 'ARE';
        else if (s.base_url.includes('api-qa')) detectedCountry = 'QAT';
        else if (s.base_url.includes('api-eg')) detectedCountry = 'EGY';
        else if (s.base_url.includes('api-kw')) detectedCountry = 'KWT';
      }
      setForm({
        is_enabled: s.is_enabled ?? false,
        api_key: s.api_key || '',
        country_code: detectedCountry,
        base_url: s.base_url || 'https://api-sa.myfatoorah.com',
        mode: s.mode || 'test',
        supplier_code: s.supplier_code || '',
        webhook_secret: s.webhook_secret || '',
        default_currency: s.default_currency || 'SAR',
        success_url: s.success_url || '',
        error_url: s.error_url || '',
        notes: s.notes || ''
      });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settingsData && settingsData.length > 0) {
        return base44.entities.MyFatoorahSettings.update(settingsData[0].id, data);
      } else {
        return base44.entities.MyFatoorahSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFatoorahSettings'] });
      toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات ماي فاتورة بنجاح' });
    },
    onError: (e) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' })
  });

  const handleSave = () => saveMutation.mutate(form);

  const handleTest = async () => {
    if (!form.api_key?.trim()) {
      setTestResult({ success: false, message: 'يرجى إدخال مفتاح API أولاً ثم احفظ الإعدادات قبل الاختبار' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // حفظ الإعدادات أولاً لضمان أن الدالة تقرأ أحدث بيانات
      if (settingsData && settingsData.length > 0) {
        await base44.entities.MyFatoorahSettings.update(settingsData[0].id, form);
      } else {
        await base44.entities.MyFatoorahSettings.create(form);
      }
      const res = await base44.functions.invoke('testMyFatoorahConnection', {});
      const data = res.data;
      setTestResult({ success: data.success, message: data.message });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'حدث خطأ غير متوقع';
      setTestResult({ success: false, message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyWebhook = () => {
    const appUrl = window.location.origin;
    const webhookUrl = `${appUrl}/api/functions/myFatoorahWebhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const appUrl = window.location.origin;
  const webhookUrl = `${appUrl}/api/functions/myFatoorahWebhook`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">إعدادات ماي فاتورة</h1>
            <p className="text-xs text-muted-foreground">ربط بوابة الدفع لاستقبال المدفوعات الإلكترونية</p>
          </div>
        </div>
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <TestTube size={15} className={testing ? 'animate-spin' : ''} />
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={15} />
            {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* نتيجة الاختبار */}
      {testResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {testResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-semibold">{testResult.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* القسم الأول: بيانات الاتصال */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <Key size={15} className="text-primary" />
            بيانات الاتصال
          </h2>

          {/* تفعيل البوابة */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-foreground">تفعيل بوابة ماي فاتورة</p>
              <p className="text-xs text-muted-foreground">تفعّل/توقف بوابة الدفع</p>
            </div>
            <button
              onClick={() => handleChange('is_enabled', !form.is_enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.is_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_enabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* وضع التشغيل */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">وضع التشغيل</label>
            <div className="flex gap-2">
              {[
                { value: 'test', label: '🧪 اختبار (Test)' },
                { value: 'live', label: '🚀 إنتاج (Live)' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    handleChange('mode', opt.value);
                    if (opt.value === 'test') {
                      handleChange('base_url', 'https://apitest.myfatoorah.com');
                    } else {
                      const country = COUNTRY_OPTIONS.find(c => c.value === form.country_code);
                      handleChange('base_url', country?.base_url || 'https://api-sa.myfatoorah.com');
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    form.mode === opt.value
                      ? opt.value === 'live'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-amber-100 text-amber-700 border-amber-300'
                      : 'bg-secondary border-border hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* الدولة */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              الدولة <span className="text-destructive">*</span>
              {form.mode === 'test' && <span className="text-muted-foreground font-normal mr-2">(لا تؤثر في وضع الاختبار)</span>}
            </label>
            <select
              value={form.country_code}
              onChange={(e) => {
                const country = COUNTRY_OPTIONS.find(c => c.value === e.target.value);
                handleChange('country_code', e.target.value);
                if (form.mode === 'live' && country) {
                  handleChange('base_url', country.base_url);
                  handleChange('default_currency', country.currency);
                }
              }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              dir="rtl"
            >
              {COUNTRY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* رابط API (للعرض فقط) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">رابط API <span className="text-muted-foreground font-normal">(يُحدَّد تلقائياً)</span></label>
            <div className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-secondary font-mono text-muted-foreground" dir="ltr">
              {form.mode === 'test' ? 'https://apitest.myfatoorah.com' : form.base_url}
            </div>
          </div>

          {/* مفتاح API */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">مفتاح API <span className="text-destructive">*</span></label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={form.api_key}
                onChange={(e) => handleChange('api_key', e.target.value)}
                placeholder="أدخل مفتاح API من لوحة ماي فاتورة"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pl-10 font-mono"
                dir="ltr"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* العملة الافتراضية */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">العملة الافتراضية</label>
            <select
              value={form.default_currency}
              onChange={(e) => handleChange('default_currency', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="KWD">دينار كويتي (KWD)</option>
              <option value="AED">درهم إماراتي (AED)</option>
              <option value="BHD">دينار بحريني (BHD)</option>
              <option value="QAR">ريال قطري (QAR)</option>
              <option value="OMR">ريال عماني (OMR)</option>
              <option value="JOD">دينار أردني (JOD)</option>
              <option value="EGP">جنيه مصري (EGP)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </div>

          {/* كود المورد */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">كود المورد <span className="text-muted-foreground">(اختياري)</span></label>
            <input
              type="text"
              value={form.supplier_code}
              onChange={(e) => handleChange('supplier_code', e.target.value)}
              placeholder="Supplier Code"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* القسم الثاني: روابط التوجيه والـ Webhook */}
        <div className="space-y-5">
          {/* روابط إعادة التوجيه */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Link size={15} className="text-primary" />
              روابط إعادة التوجيه
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">رابط نجاح الدفع</label>
              <input
                type="url"
                value={form.success_url}
                onChange={(e) => handleChange('success_url', e.target.value)}
                placeholder={`${appUrl}/payment/success`}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">رابط فشل الدفع</label>
              <input
                type="url"
                value={form.error_url}
                onChange={(e) => handleChange('error_url', e.target.value)}
                placeholder={`${appUrl}/payment/error`}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Webhook */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Zap size={15} className="text-primary" />
              إعداد Webhook (التفعيل التلقائي)
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-semibold mb-1 flex items-center gap-1">
                <Info size={13} /> كيفية الإعداد
              </p>
              <p className="text-xs text-blue-700">
                انسخ الرابط أدناه وأضفه في إعدادات Webhook في لوحة تحكم ماي فاتورة تحت قسم "Payment Notification"
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">رابط Webhook</label>
              <div className="flex gap-2">
                <input type="text" value={webhookUrl} readOnly
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-xs bg-secondary font-mono text-muted-foreground" dir="ltr" />
                <button onClick={handleCopyWebhook}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-secondary transition-colors">
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copied ? 'تم!' : 'نسخ'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">سر التحقق <span className="text-muted-foreground">(اختياري)</span></label>
              <input type="text" value={form.webhook_secret}
                onChange={(e) => handleChange('webhook_secret', e.target.value)}
                placeholder="Webhook Secret"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* ملاحظات */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border mb-4">
              <Info size={15} className="text-primary" /> ملاحظات داخلية
            </h2>
            <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="ملاحظات للاستخدام الداخلي..." rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
      </div>

      {/* تحذير وضع الاختبار */}
      {form.mode === 'test' && form.is_enabled && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-semibold">
            أنت في وضع الاختبار — لن تُعالَج أي مدفوعات حقيقية. غيّر الوضع إلى "إنتاج" عند الإطلاق الفعلي.
          </p>
        </div>
      )}
    </motion.div>
  );
}