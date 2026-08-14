import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Check, CreditCard, Loader2, ShieldCheck, ArrowRight, Landmark, Copy, Upload, X, ChevronDown, Search, ZoomIn, Download, Globe } from "lucide-react";
import MyFatoorahEmbedded from "@/components/payment/MyFatoorahEmbedded";
import { Link } from "react-router-dom";

// ─── مكوّن صف بيانات بنكية ───
function BankRow({ label, value, copyable }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-emerald-100 last:border-0">
      <span className="text-muted-foreground text-xs flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-foreground text-xs" dir="ltr">{value}</span>
        {copyable && (
          <button onClick={handleCopy} className="p-0.5 rounded hover:bg-emerald-100 transition-colors" title="نسخ">
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── معاينة شهادة الآيبان ───
function IbanCertificateViewer({ url }) {
  const [lightbox, setLightbox] = useState(false);
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  return (
    <>
      <div className="flex items-center justify-between py-1.5 border-b border-emerald-100 last:border-0">
        <span className="text-muted-foreground text-xs flex-shrink-0">شهادة الآيبان</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setLightbox(true)} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold hover:bg-blue-100">
            <ZoomIn size={10} /> عرض
          </button>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 bg-secondary text-foreground rounded text-[10px] font-bold hover:bg-secondary/80">
            <Download size={10} /> تنزيل
          </a>
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-bold text-sm">شهادة الآيبان</span>
              <button onClick={() => setLightbox(false)} className="p-1.5 hover:bg-secondary rounded-lg"><X size={16} /></button>
            </div>
            <div className="overflow-auto p-4 flex items-center justify-center" style={{ maxHeight: "80vh" }}>
              {isImage
                ? <img src={url} alt="شهادة الآيبان" className="max-w-full max-h-full object-contain rounded-xl" />
                : <iframe src={url} className="w-full rounded-xl border border-border" style={{ height: "75vh" }} title="شهادة الآيبان" />
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Checkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("planId");
  const appId = urlParams.get("appId");
  const appName = urlParams.get("appName");
  const presetBilling = urlParams.get("billing") || "monthly";
  const purchaseType = urlParams.get("type");
  const qty = Number(urlParams.get("qty") || 1);
  const workspaceId = urlParams.get("workspaceId");
  const workspaceName = urlParams.get("workspaceName");
  const planName = urlParams.get("planName");
  const bundleAppsRaw = urlParams.get("bundleApps");
  const bundleApps = bundleAppsRaw ? JSON.parse(decodeURIComponent(bundleAppsRaw)) : null;
  const freeRequiredRaw = urlParams.get("freeRequiredApps");
  const freeRequiredApps = freeRequiredRaw ? JSON.parse(decodeURIComponent(freeRequiredRaw)) : [];

  const [billing, setBilling] = useState(presetBilling);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // null = لم يتم التحديد بعد
  const [myFatoorahLoading, setMyFatoorahLoading] = useState(false);
  const [myFatoorahDone, setMyFatoorahDone] = useState(false);
  const [bankTransferMode, setBankTransferMode] = useState("immediate");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderNameError, setSenderNameError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [bankTransferDone, setBankTransferDone] = useState(false);
  const [savedBankTransferRequestId, setSavedBankTransferRequestId] = useState(null);
  const [lateReceiptFile, setLateReceiptFile] = useState(null);
  const [lateReceiptUploading, setLateReceiptUploading] = useState(false);
  const [lateReceiptDone, setLateReceiptDone] = useState(false);
  const [lateReceiptError, setLateReceiptError] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: plans = [] } = useQuery({
    queryKey: ["publicPlans"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getPublicPlans", {});
      return res.data?.plans || [];
    },
    enabled: !!planId
  });

  // جلب إعدادات الدفع — مساحة العمل الإدارية
  const ADMIN_WORKSPACE_ID = "6a1a2f4b8cd417ef2ba461aa";

  const { data: paymentSettings, isLoading: anyPaymentLoading } = useQuery({
    queryKey: ["checkoutPaymentSettings"],
    queryFn: async () => {
      const [bankArr, mfArr] = await Promise.all([
        base44.entities.BankTransferSettings.filter({ workspace_id: ADMIN_WORKSPACE_ID }),
        base44.entities.MyFatoorahSettings.list(),
      ]);
      return { bank: bankArr?.[0] || null, mf: mfArr?.[0] || null };
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق — لا إعادة جلب متكررة
    cacheTime: 10 * 60 * 1000,
  });

  const bankTransferSettings = paymentSettings?.bank || null;
  const myFatoorahSettings   = paymentSettings?.mf   || null;
  const bankTransferEnabled  = bankTransferSettings?.is_enabled === true;
  const myFatoorahEnabled    = myFatoorahSettings?.is_enabled   === true;
  const anyPaymentAvailable  = bankTransferEnabled || myFatoorahEnabled;

  // تحديد طريقة الدفع الافتراضية بعد تحميل الإعدادات
  useEffect(() => {
    if (paymentMethod !== null) return;
    if (!anyPaymentLoading && paymentSettings) {
      if (bankTransferEnabled) setPaymentMethod("bank_transfer");
      else if (myFatoorahEnabled) setPaymentMethod("myfatoorah");
    }
  }, [anyPaymentLoading, paymentSettings, bankTransferEnabled, myFatoorahEnabled]);

  // جلب الحسابات البنكية المفعّلة
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bankAccountsCheckout"],
    queryFn: async () => {
      const accounts = await base44.entities.BankAccount.filter({ workspace_id: ADMIN_WORKSPACE_ID, is_active: true });
      return accounts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    enabled: bankTransferEnabled,
  });

  const selectedBankAccount = bankAccounts.find(a => a.id === selectedBankAccountId) || bankAccounts[0] || null;

  const plan = plans.find(p => p.id === planId);
  const appPrice = Number(urlParams.get("price") || 0);
  const bundlePrice = bundleApps
    ? bundleApps.reduce((sum, a) => sum + (billing === "yearly" ? (a.yearly_price || 0) : (a.monthly_price || 0)), 0)
    : null;
  const price = bundleApps
    ? bundlePrice
    : planId
      ? (billing === "yearly" ? plan?.yearly_price : plan?.monthly_price)
      : appPrice;
  const isFree = plan?.is_free || price === 0;

  // شاشة تأكيد التحويل البنكي
  if (bankTransferDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-emerald-50/30 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-xl space-y-5"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Landmark size={40} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">تم استلام طلبك! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              {bankTransferMode === "deadline"
                ? "يرجى إتمام التحويل البنكي خلال المهلة المحددة"
                : "سيتم تفعيل اشتراكك بعد مراجعة التحويل"}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-3xl font-bold text-emerald-700">{price} ر.س</p>
            <p className="text-xs text-emerald-600 mt-1">{billing === "yearly" ? "سنوي" : "شهري"}</p>
          </div>
          {selectedBankAccount && (
            <div className="text-right space-y-1 bg-secondary/20 rounded-xl p-4">
              {selectedBankAccount.bank_name && <BankRow label="اسم البنك" value={selectedBankAccount.bank_name} />}
              {selectedBankAccount.account_holder_name && <BankRow label="اسم الحساب" value={selectedBankAccount.account_holder_name} />}
              {selectedBankAccount.iban && <BankRow label="رقم الآيبان" value={selectedBankAccount.iban} copyable />}
              {selectedBankAccount.account_number && <BankRow label="رقم الحساب" value={selectedBankAccount.account_number} copyable />}
            </div>
          )}

          {/* رفع الإيصال بعد المهلة */}
          {bankTransferMode === "deadline" && savedBankTransferRequestId && !lateReceiptDone && (
            <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 bg-amber-50 text-right space-y-3">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><Upload size={16} />رفع إيصال التحويل</p>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-amber-400 rounded-lg p-3 hover:bg-amber-100 transition-colors bg-white">
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => { setLateReceiptFile(e.target.files?.[0] || null); setLateReceiptError(""); }} />
                <Upload size={14} className="text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700">{lateReceiptFile ? `✓ ${lateReceiptFile.name}` : "اضغط لرفع صورة الإيصال أو ملف PDF"}</span>
              </label>
              {lateReceiptError && <p className="text-xs text-destructive">⚠ {lateReceiptError}</p>}
              {lateReceiptFile && (
                <button onClick={async () => {
                  setLateReceiptUploading(true);
                  try {
                    const uploadRes = await base44.integrations.Core.UploadFile({ file: lateReceiptFile });
                    if (!uploadRes?.file_url) throw new Error("فشل رفع الملف");
                    await base44.entities.BankTransferRequest.update(savedBankTransferRequestId, { receipt_url: uploadRes.file_url });
                    setLateReceiptDone(true);
                  } catch (e) { setLateReceiptError(e.message); }
                  setLateReceiptUploading(false);
                }} disabled={lateReceiptUploading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {lateReceiptUploading ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</> : <><Upload size={14} /> رفع الإيصال</>}
                </button>
              )}
            </div>
          )}
          {lateReceiptDone && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-lg p-3 text-sm font-semibold">
              <Check size={16} /> تم رفع الإيصال بنجاح!
            </div>
          )}

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            ⚠️ سيتم تفعيل اشتراكك بعد التحقق من التحويل من قِبل فريقنا
          </p>
          <Link to="/subscriptions"
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            <ArrowRight size={16} /> متابعة حالة الاشتراك
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!planId && !appId && !purchaseType && !bundleApps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground">لم يتم تحديد باقة أو تطبيق</p>
          <Link to="/app-store" className="text-primary text-sm mt-2 block hover:underline">العودة للمتجر</Link>
        </div>
      </div>
    );
  }

  const handleMyFatoorahPay = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    setMyFatoorahLoading(true);
    setError(null);
    try {
      const itemName = bundleApps
        ? bundleApps.map(a => a.name).join(" + ")
        : appName || planName || "اشتراك";

      // تثبيت التطبيق بحالة pending_payment أولاً لنحصل على installedAppId
      let installedAppId = null;
      if (appId && workspaceId) {
        const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: appId });
        if (!existing || existing.length === 0) {
          const ia = await base44.entities.InstalledApp.create({
            app_id: appId, app_name: appName,
            installed_at: new Date().toISOString(),
            workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
            status: "pending_payment", payment_status: "unpaid", billing_cycle: billing, is_configured: false,
          });
          installedAppId = ia?.id || null;
        } else {
          installedAppId = existing[0]?.id || null;
        }
      } else if (bundleApps && bundleApps.length > 0 && workspaceId) {
        for (let i = 0; i < bundleApps.length; i++) {
          const bApp = bundleApps[i];
          const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: bApp.id });
          if (!existing || existing.length === 0) {
            const ia = await base44.entities.InstalledApp.create({
              app_id: bApp.id, app_name: bApp.name,
              installed_at: new Date().toISOString(),
              workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
              status: "pending_payment", payment_status: "unpaid", billing_cycle: billing, is_configured: false,
            });
            if (i === 0) installedAppId = ia?.id || null;
          } else {
            if (i === 0) installedAppId = existing[0]?.id || null;
          }
        }
      }

      // تثبيت المتطلبات المجانية فوراً
      if (freeRequiredApps.length > 0 && workspaceId) {
        const allInstalled = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId });
        for (const freeApp of freeRequiredApps) {
          const alreadyInstalled = allInstalled.find(ia => ia.app_id === freeApp.id && ia.status !== 'uninstalled');
          if (!alreadyInstalled) {
            await base44.entities.InstalledApp.create({
              app_id: freeApp.id, app_name: freeApp.name,
              installed_at: new Date().toISOString(),
              workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
              status: "active", payment_status: "free", is_configured: true,
            });
          }
        }
      }

      // reference_id بصيغة installedAppId:workspaceId حتى يُفعّله الـ Webhook تلقائياً
      const referenceId = installedAppId && workspaceId ? `${installedAppId}:${workspaceId}` : null;

      const res = await base44.functions.invoke("createMyFatoorahInvoice", {
        amount: price,
        currency: myFatoorahSettings?.default_currency || "SAR",
        customer_name: user.full_name || user.email,
        customer_email: user.email,
        description: itemName,
        reference_id: referenceId,
        billing_cycle: billing,
        workspace_id: workspaceId,
      });

      const invoiceUrl = res.data?.invoice_url || res.data?.invoiceURL;
      if (invoiceUrl) {
        window.location.href = invoiceUrl;
      } else {
        throw new Error(res.data?.error || "فشل إنشاء فاتورة الدفع");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setMyFatoorahLoading(false);
    }
  };

  const handlePay = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    setLoading(true);
    setError(null);

    try {
      // التحقق من الحقول الإجبارية
      if (bankTransferMode === "immediate" && bankTransferSettings?.require_transfer_proof && bankTransferSettings?.transfer_proof_required && !receiptFile) {
        setReceiptError("إشعار التحويل إجباري، يرجى رفع صورة الإيصال");
        setLoading(false);
        return;
      }
      if (bankTransferSettings?.show_sender_name && bankTransferSettings?.sender_name_required && !senderName.trim()) {
        setSenderNameError("اسم المُحوِّل إجباري");
        setLoading(false);
        return;
      }

      const itemName = bundleApps
        ? bundleApps.map(a => a.name).join(" + ")
        : appName || plan?.name || planName || "اشتراك";

      // رفع الإيصال إن وُجد
      let receiptUrl = null;
      if (bankTransferMode === "immediate" && receiptFile) {
        setReceiptUploading(true);
        const uploadRes = await base44.integrations.Core.UploadFile({ file: receiptFile });
        receiptUrl = uploadRes?.file_url || null;
        setReceiptUploading(false);
      }

      // تثبيت التطبيق بحالة pending_payment
      let installedAppId = null;
      if (bundleApps && bundleApps.length > 0 && workspaceId) {
        for (let i = 0; i < bundleApps.length; i++) {
          const bApp = bundleApps[i];
          const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: bApp.id });
          if (!existing || existing.length === 0) {
            const ia = await base44.entities.InstalledApp.create({
              app_id: bApp.id, app_name: bApp.name,
              installed_at: new Date().toISOString(),
              workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
              status: "pending_payment", payment_status: "unpaid", billing_cycle: billing, is_configured: false,
            });
            if (i === 0) installedAppId = ia?.id || null;
          } else {
            if (i === 0) installedAppId = existing[0]?.id || null;
          }
        }
      } else if (appId && workspaceId) {
        const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: appId });
        if (!existing || existing.length === 0) {
          const ia = await base44.entities.InstalledApp.create({
            app_id: appId, app_name: appName,
            installed_at: new Date().toISOString(),
            workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
            status: "pending_payment", payment_status: "unpaid", billing_cycle: billing, is_configured: false,
          });
          installedAppId = ia?.id || null;
        } else {
          installedAppId = existing[0]?.id || null;
        }
      }

      // تثبيت المتطلبات المجانية فوراً
      if (freeRequiredApps.length > 0 && workspaceId) {
        const allInstalled = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId });
        for (const freeApp of freeRequiredApps) {
          const alreadyInstalled = allInstalled.find(ia => ia.app_id === freeApp.id && ia.status !== 'uninstalled');
          if (!alreadyInstalled) {
            await base44.entities.InstalledApp.create({
              app_id: freeApp.id, app_name: freeApp.name,
              installed_at: new Date().toISOString(),
              workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
              status: "active", payment_status: "free", is_configured: true,
            });
          }
        }
      }

      // حساب موعد الانتهاء إذا اختار "أمهلني"
      const deadlineAt = bankTransferMode === "deadline" && bankTransferSettings?.payment_deadline_enabled
        ? (() => {
            const d = new Date();
            const val = bankTransferSettings.payment_deadline_value || 24;
            const unit = bankTransferSettings.payment_deadline_unit || "hours";
            if (unit === "minutes") d.setMinutes(d.getMinutes() + val);
            else if (unit === "hours") d.setHours(d.getHours() + val);
            else d.setDate(d.getDate() + val);
            return d.toISOString();
          })()
        : null;

      // إنشاء طلب التحويل البنكي
      const btRequest = await base44.entities.BankTransferRequest.create({
        workspace_id: workspaceId || null,
        installed_app_id: installedAppId,
        customer_name: user.full_name || user.email,
        customer_email: user.email,
        app_name: itemName,
        amount: price,
        currency: "SAR",
        billing_cycle: billing,
        transfer_mode: bankTransferMode,
        sender_name: senderName || null,
        receipt_url: receiptUrl || null,
        bank_account_id: selectedBankAccount?.id || null,
        bank_name: selectedBankAccount?.bank_name || null,
        bank_account_holder: selectedBankAccount?.account_holder_name || null,
        bank_iban: selectedBankAccount?.iban || null,
        status: "pending",
        deadline_at: deadlineAt,
      });

      setSavedBankTransferRequestId(btRequest?.id || null);
      setBankTransferDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* رأس */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/app-store" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowRight size={18} className="text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">إتمام الاشتراك</h1>
            <p className="text-sm text-muted-foreground">أنت على بُعد خطوة واحدة من البدء</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          {/* ملخص الطلب */}
          <div className="bg-primary/5 border-b border-border p-6">
            <div className="flex items-center gap-3 mb-1">
              <CreditCard size={20} className="text-primary" />
              <h2 className="text-base font-bold text-foreground">
                {bundleApps
                  ? `حزمة تطبيقات (${bundleApps.length} تطبيقات)`
                  : appId ? `اشتراك: ${appName || "التطبيق"}` : `باقة: ${plan?.name || planName || "..."}`}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {user ? `تسجيل لـ: ${user.full_name || user.email}` : "سيتم ربط الاشتراك بحسابك"}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* اختيار دورة الفوترة */}
            {plan && !plan.is_free && plan.yearly_price > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">دورة الفوترة</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setBilling("monthly")}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${billing === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <p className="text-sm font-bold text-foreground">شهري</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.monthly_price} ر.س / شهر</p>
                  </button>
                  <button onClick={() => setBilling("yearly")}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${billing === "yearly" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-400"}`}>
                    <p className="text-sm font-bold text-foreground">سنوي</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.yearly_price} ر.س / سنة</p>
                  </button>
                </div>
              </div>
            )}

            {/* ملخص السعر */}
            <div className="bg-secondary/30 rounded-xl p-4">
              {bundleApps ? (
                bundleApps.map((a, i) => {
                  const aPrice = billing === "yearly" ? (a.yearly_price || 0) : (a.monthly_price || 0);
                  return (
                    <div key={i} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{a.name}</span>
                      <span className="text-sm font-semibold text-foreground">{a.is_free ? "مجاني" : `${aPrice} ر.س`}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">المبلغ</span>
                  <span className="text-sm font-semibold text-foreground">{isFree ? "مجاناً" : `${price} ر.س`}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">نوع الاشتراك</span>
                <span className="text-sm font-semibold text-foreground">{billing === "yearly" ? "سنوي" : "شهري"}</span>
              </div>
              <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">الإجمالي</span>
                <span className="text-xl font-bold text-primary">{isFree ? "مجاناً" : `${price} ر.س`}</span>
              </div>
            </div>

            {/* ===== طرق الدفع ===== */}
            {!isFree && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">طريقة الدفع</p>

                {anyPaymentLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                    <Loader2 size={16} className="animate-spin" /> جاري تحميل طرق الدفع...
                  </div>
                ) : !anyPaymentAvailable ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-amber-700">⚠️ لا توجد طرق دفع متاحة حالياً</p>
                    <p className="text-xs text-amber-600 mt-1">يرجى التواصل مع الدعم الفني</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* التحويل البنكي */}
                    {bankTransferEnabled && (
                      <button onClick={() => setPaymentMethod("bank_transfer")}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${paymentMethod === "bank_transfer" ? "border-emerald-600 bg-emerald-50" : "border-border hover:border-emerald-400"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "bank_transfer" ? "border-emerald-600" : "border-muted-foreground"}`}>
                          {paymentMethod === "bank_transfer" && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">التحويل البنكي</p>
                          <p className="text-xs text-muted-foreground">تحويل مباشر لحساب البنك</p>
                        </div>
                        <Landmark size={18} className="text-emerald-600 flex-shrink-0" />
                      </button>
                    )}

                    {/* ماي فاتورة */}
                    {myFatoorahEnabled && (
                      <button onClick={() => setPaymentMethod("myfatoorah")}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${paymentMethod === "myfatoorah" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "myfatoorah" ? "border-primary" : "border-muted-foreground"}`}>
                          {paymentMethod === "myfatoorah" && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">الدفع الإلكتروني (ماي فاتورة)</p>
                          <p className="text-xs text-muted-foreground">بطاقة ائتمانية، مدى، Apple Pay وغيرها</p>
                        </div>
                        <Globe size={18} className="text-primary flex-shrink-0" />
                      </button>
                    )}

                    {/* تفاصيل ماي فاتورة — Embedded Payment */}
                    {paymentMethod === "myfatoorah" && (
                      <div className="border border-border rounded-xl overflow-hidden">
                        <div className="p-3 bg-primary/5 border-b border-border flex items-center gap-2">
                          <CreditCard size={14} className="text-primary" />
                          <p className="text-xs text-primary font-semibold">الدفع الإلكتروني المباشر — بيانات بطاقتك آمنة ومشفرة</p>
                        </div>
                        <div className="p-4">
                          {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
                              <p className="text-sm text-destructive font-semibold">❌ {error}</p>
                            </div>
                          )}
                          <MyFatoorahEmbedded
                            amount={price}
                            currency={myFatoorahSettings?.default_currency || "SAR"}
                            customerName={user?.full_name || user?.email || ""}
                            customerEmail={user?.email || ""}
                            description={bundleApps ? bundleApps.map(a => a.name).join(" + ") : appName || planName || "اشتراك"}
                            referenceId={workspaceId}
                            onSuccess={async () => {
                              setMyFatoorahDone(true);
                              // تفعيل التطبيق بعد نجاح الدفع
                              try {
                                if (appId && workspaceId) {
                                  const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: appId });
                                  if (!existing || existing.length === 0) {
                                    await base44.entities.InstalledApp.create({
                                      app_id: appId, app_name: appName,
                                      installed_at: new Date().toISOString(),
                                      workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
                                      status: "active", payment_status: "paid", billing_cycle: billing, is_configured: false,
                                    });
                                  } else {
                                    await base44.entities.InstalledApp.update(existing[0].id, { status: "active", payment_status: "paid" });
                                  }
                                } else if (bundleApps && workspaceId) {
                                  for (const bApp of bundleApps) {
                                    const existing = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId, app_id: bApp.id });
                                    if (!existing || existing.length === 0) {
                                      await base44.entities.InstalledApp.create({
                                        app_id: bApp.id, app_name: bApp.name,
                                        installed_at: new Date().toISOString(),
                                        workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
                                        status: "active", payment_status: "paid", billing_cycle: billing, is_configured: false,
                                      });
                                    } else {
                                      await base44.entities.InstalledApp.update(existing[0].id, { status: "active", payment_status: "paid" });
                                    }
                                  }
                                }
                                if (freeRequiredApps.length > 0 && workspaceId) {
                                  const allInstalled = await base44.entities.InstalledApp.filter({ workspace_id: workspaceId });
                                  for (const freeApp of freeRequiredApps) {
                                    const alreadyInstalled = allInstalled.find(ia => ia.app_id === freeApp.id && ia.status !== 'uninstalled');
                                    if (!alreadyInstalled) {
                                      await base44.entities.InstalledApp.create({
                                        app_id: freeApp.id, app_name: freeApp.name,
                                        installed_at: new Date().toISOString(),
                                        workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
                                        status: "active", payment_status: "free", is_configured: true,
                                      });
                                    }
                                  }
                                }
                                setTimeout(() => { window.location.href = "/subscriptions"; }, 2500);
                              } catch (e) { setError(e.message); }
                            }}
                            onError={(msg) => setError(msg)}
                          />
                        </div>
                      </div>
                    )}

                    {/* تفاصيل التحويل البنكي */}
                    {paymentMethod === "bank_transfer" && (<>


                    {/* تفاصيل التحويل البنكي */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border border-border rounded-xl overflow-hidden text-sm" style={{ display: paymentMethod === "bank_transfer" ? "block" : "none" }}>

                      {/* اختيار الحساب البنكي */}
                      {bankAccounts.length > 0 && (
                        <div className="p-3 border-b border-border bg-secondary/20">
                          <label className="block text-xs font-semibold text-foreground mb-1.5">اختر الحساب البنكي للتحويل</label>
                          <div className="relative">
                            <button type="button" onClick={() => { setBankDropdownOpen(o => !o); setBankSearch(""); }}
                              className="w-full flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2.5 text-sm bg-background hover:bg-secondary/30 transition-colors text-right">
                              <span className="flex-1 text-right truncate">
                                {selectedBankAccount ? `${selectedBankAccount.bank_name} — ${selectedBankAccount.account_holder_name}` : "اختر حساباً..."}
                              </span>
                              <ChevronDown size={14} className={`text-muted-foreground flex-shrink-0 transition-transform ${bankDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            {bankDropdownOpen && (
                              <div className="absolute z-50 right-0 left-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
                                <div className="p-2 border-b border-border">
                                  <div className="relative">
                                    <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input type="text" autoFocus value={bankSearch} onChange={e => setBankSearch(e.target.value)}
                                      placeholder="بحث..." className="w-full border border-border rounded-lg pr-8 pl-3 py-2 text-xs focus:outline-none" />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {bankAccounts.filter(a => !bankSearch ||
                                    a.bank_name?.toLowerCase().includes(bankSearch.toLowerCase()) ||
                                    a.account_holder_name?.toLowerCase().includes(bankSearch.toLowerCase())
                                  ).map(acc => (
                                    <button key={acc.id} type="button"
                                      onClick={() => { setSelectedBankAccountId(acc.id); setBankDropdownOpen(false); }}
                                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-secondary/40 transition-colors border-b border-border last:border-0 ${selectedBankAccount?.id === acc.id ? "bg-emerald-50" : ""}`}>
                                      <div>
                                        <p className="text-xs font-bold text-foreground">{acc.bank_name}</p>
                                        <p className="text-[10px] text-muted-foreground">{acc.account_holder_name}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* بيانات الحساب */}
                      {selectedBankAccount && (
                        <div className="p-4 space-y-1 bg-background">
                          {selectedBankAccount.account_holder_name && <BankRow label="صاحب الحساب" value={selectedBankAccount.account_holder_name} />}
                          {selectedBankAccount.account_number && <BankRow label="رقم الحساب" value={selectedBankAccount.account_number} copyable />}
                          {selectedBankAccount.iban && <BankRow label="رقم الآيبان" value={selectedBankAccount.iban} copyable />}
                          {selectedBankAccount.swift_code && <BankRow label="SWIFT" value={selectedBankAccount.swift_code} copyable />}
                          <IbanCertificateViewer url={selectedBankAccount.iban_certificate_url} />
                        </div>
                      )}

                      {/* خياران: الدفع الفوري / أمهلني */}
                      <div className="grid grid-cols-2 border-t border-border">
                        <button onClick={() => setBankTransferMode("immediate")}
                          className={`py-2.5 text-sm font-semibold transition-all border-l border-border ${bankTransferMode === "immediate" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>
                          الدفع الفوري
                        </button>
                        <button onClick={() => setBankTransferMode("deadline")}
                          className={`py-2.5 text-sm font-semibold transition-all ${bankTransferMode === "deadline" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>
                          أمهلني {bankTransferSettings?.payment_deadline_enabled && bankTransferSettings?.payment_deadline_value
                            ? `${bankTransferSettings.payment_deadline_value} ${bankTransferSettings.payment_deadline_unit === "minutes" ? "دقيقة" : bankTransferSettings.payment_deadline_unit === "hours" ? "ساعة" : "يوم"}`
                            : "لاحقاً"}
                        </button>
                      </div>

                      {/* اسم المُحوِّل */}
                      {bankTransferSettings?.show_sender_name && (
                        <div className="p-4 border-t border-border bg-secondary/20">
                          <label className="block text-xs font-semibold text-foreground mb-2">
                            اسم صاحب الحساب المُحوِّل
                            {bankTransferSettings?.sender_name_required
                              ? <span className="text-destructive mr-1">*</span>
                              : <span className="text-muted-foreground font-normal mr-1">(اختياري)</span>}
                          </label>
                          <input type="text" value={senderName}
                            onChange={e => { setSenderName(e.target.value); setSenderNameError(""); }}
                            placeholder="أدخل اسم صاحب الحساب المُحوِّل"
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${senderNameError ? "border-destructive" : "border-border"}`} />
                          {senderNameError && <p className="text-xs text-destructive mt-1">⚠ {senderNameError}</p>}
                        </div>
                      )}

                      {/* رفع إيصال — عند الدفع الفوري */}
                      {bankTransferMode === "immediate" && bankTransferSettings?.require_transfer_proof && (
                        <div className="p-4 border-t border-border bg-secondary/20">
                          <label className="block text-xs font-semibold text-foreground mb-2">
                            إضافة إشعار التحويل
                            {bankTransferSettings?.transfer_proof_required
                              ? <span className="text-destructive mr-1">*</span>
                              : <span className="text-muted-foreground font-normal mr-1">(اختياري)</span>}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-secondary transition-colors">
                            <input type="file" accept="image/*,application/pdf" className="hidden"
                              onChange={e => { setReceiptFile(e.target.files?.[0] || null); setReceiptError(""); }} />
                            <span className="text-xs text-muted-foreground">
                              {receiptFile ? `✓ ${receiptFile.name}` : "اضغط لرفع صورة الإيصال أو ملف PDF"}
                            </span>
                          </label>
                          {receiptError && <p className="text-xs text-destructive mt-1">⚠ {receiptError}</p>}
                        </div>
                      )}

                      {/* تنبيه المهلة */}
                      {bankTransferMode === "deadline" && bankTransferSettings?.payment_deadline_enabled && (
                        <div className="p-3 border-t border-border bg-amber-50 flex items-start gap-2">
                          <span className="text-amber-500 text-xs mt-0.5">ℹ</span>
                          <p className="text-xs text-amber-700">
                            عليك إرفاق صورة إشعار التحويل خلال {bankTransferSettings.payment_deadline_value} {
                              bankTransferSettings.payment_deadline_unit === "minutes" ? "دقيقة" :
                              bankTransferSettings.payment_deadline_unit === "hours" ? "ساعة" : "يوم"}
                          </p>
                        </div>
                      )}

                      {/* زر إتمام الدفع */}
                      <div className="p-4 border-t border-border bg-background space-y-3">
                        {error && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                            <p className="text-sm text-destructive font-semibold">❌ {error}</p>
                          </div>
                        )}
                        <button onClick={handlePay} disabled={loading || receiptUploading}
                          className="w-full py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-white bg-primary">
                          {loading || receiptUploading
                            ? <><Loader2 size={18} className="animate-spin" /> {receiptUploading ? "جارٍ رفع الإيصال..." : "جارٍ المعالجة..."}</>
                            : bankTransferMode === "immediate"
                              ? <><Landmark size={18} /> إتمام الدفع</>
                              : <><Check size={18} /> تأكيد الطلب</>
                          }
                        </button>
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-500" /> دفع آمن ومشفر</div>
                        </div>
                      </div>
                    </motion.div>
                    </>)}
                  </div>
                )}
              </div>
            )}

            {/* زر ابدأ مجاناً */}
            {isFree && (
              <div className="space-y-3">
                {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3"><p className="text-sm text-destructive font-semibold">❌ {error}</p></div>}
                <button onClick={async () => {
                  setLoading(true);
                  try {
                    if (appId && workspaceId) {
                      await base44.entities.InstalledApp.create({
                        app_id: appId, app_name: appName,
                        workspace_id: workspaceId, owner_type: "workspace", owner_id: workspaceId,
                        status: "active", payment_status: "free", billing_cycle: billing, is_configured: false
                      });
                    }
                    window.location.href = "/app-store";
                  } catch (e) { setError(e.message); setLoading(false); }
                }} disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-white bg-primary">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> جارٍ المعالجة...</> : <><Check size={18} /> ابدأ مجاناً</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}