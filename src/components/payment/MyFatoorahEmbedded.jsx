import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";

function translateMFError(msg) {
  if (!msg) return "حدث خطأ غير متوقع";
  const m = msg.toLowerCase();
  if (m.includes("card details are invalid or missing")) return "بيانات البطاقة غير صحيحة أو مفقودة";
  if (m.includes("invalid card number")) return "رقم البطاقة غير صحيح";
  if (m.includes("expired")) return "البطاقة منتهية الصلاحية";
  if (m.includes("insufficient funds")) return "رصيد البطاقة غير كافٍ";
  if (m.includes("cvv") || m.includes("cvc")) return "رمز التحقق CVV غير صحيح";
  if (m.includes("declined")) return "تم رفض البطاقة من قِبل البنك";
  if (m.includes("timeout")) return "انتهت مهلة الجلسة، يرجى المحاولة مجدداً";
  if (m.includes("network") || m.includes("connection")) return "خطأ في الاتصال، يرجى المحاولة مجدداً";
  if (m.includes("session")) return "انتهت صلاحية الجلسة، يرجى إعادة المحاولة";
  if (m.includes("payment failed") || m.includes("failed")) return "فشلت عملية الدفع، يرجى المحاولة مجدداً";
  if (m.includes("3d secure") || m.includes("authentication")) return "فشل التحقق الأمني، يرجى المحاولة مجدداً";
  return msg;
}

export default function MyFatoorahEmbedded({
  amount, currency, customerName, customerEmail,
  description, referenceId, onSuccess, onError
}) {
  const [step, setStep] = useState("loading"); // loading | ready | done | error
  const [errorMsg, setErrorMsg] = useState(null);
  const initDone = useRef(false);

  const runInit = async () => {
    initDone.current = false;
    setStep("loading");
    setErrorMsg(null);

    // 1) جلب الجلسة من الخادم
    let d;
    try {
      const res = await base44.functions.invoke("initiateMyFatoorahSession", { amount });
      d = res.data;
      if (!d?.success) throw new Error(d?.error || "فشل إنشاء الجلسة");
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || "فشل الاتصال بخادم الدفع");
      setStep("error");
      return;
    }

    const { session_id, js_lib_url } = d;
    console.log("MF session_id:", session_id, "js_lib_url:", js_lib_url);

    // 2) تعريف الـ callback
    window.__myfatoorahCallback = (response) => {
      console.log("MF callback:", JSON.stringify(response));
      if (response.isSuccess) {
        setStep("done");
        if (onSuccess) onSuccess(response.sessionId || session_id);
        return;
      }
      const rawMsg = response.error || "فشل الدفع";
      const isApplePayError = rawMsg.toLowerCase().includes("apple pay") || rawMsg.toLowerCase().includes("apple_pay");
      if (isApplePayError) return; // تجاهل أخطاء Apple Pay
      const arabicMsg = translateMFError(rawMsg);
      setErrorMsg(arabicMsg);
      setStep("error");
      if (onError) onError(arabicMsg);
    };

    // 3) تنظيف الـ container
    const container = document.getElementById("mf-embedded-container");
    if (container) container.innerHTML = "";

    // 4) انتظار المكتبة المحملة مسبقاً من index.html ثم انتظار الـ container
    if (initDone.current) return;
    initDone.current = true;

    const tryInit = (attempts = 0) => {
      // المكتبة تُصدَّر كـ window.myfatoorah (حرف صغير)
      const mfLib = window.myfatoorah;
      if (!mfLib) {
        if (attempts > 60) {
          setErrorMsg("فشل تحميل مكتبة ماي فاتورة");
          setStep("error");
          return;
        }
        setTimeout(() => tryInit(attempts + 1), 300);
        return;
      }

      const el = document.getElementById("mf-embedded-container");
      if (!el) {
        setTimeout(() => tryInit(attempts + 1), 200);
        return;
      }

      try {
        mfLib.init({
          sessionId: session_id,
          callback: window.__myfatoorahCallback,
          containerId: "mf-embedded-container",
          shouldHandlePaymentUrl: true,
        });
        setStep("ready");
      } catch (err) {
        console.error("myfatoorah.init error:", err);
        setErrorMsg("فشل تهيئة نموذج الدفع: " + err.message);
        setStep("error");
      }
    };
    tryInit();
  };

  useEffect(() => {
    runInit();
    return () => { delete window.__myfatoorahCallback; };
  }, []);

  const isVisible = step === "ready";
  const isDone = step === "done";
  const isError = step === "error";
  const isLoading = step === "loading";

  return (
    <div className="space-y-4">

      {/* نجاح */}
      {isDone && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-emerald-700">تم الدفع بنجاح! 🎉</p>
          <p className="text-sm text-muted-foreground">سيتم تفعيل اشتراكك خلال لحظات</p>
        </div>
      )}

      {/* خطأ */}
      {isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-center space-y-3">
          <p className="text-destructive font-bold text-sm">❌ {errorMsg}</p>
          <button onClick={runInit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* تحميل */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm font-semibold">جارٍ تحضير بوابة الدفع...</p>
        </div>
      )}

      {/* 
        حاوية ماي فاتورة — يجب أن تبقى في الـ DOM دائماً أثناء loading و ready
        لأن myfatoorah.init يحتاجها موجودة عند استدعائه
      */}
      {!isDone && !isError && (
        <div>
          {isVisible && (
            <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
              <CreditCard size={16} className="text-primary" />
              <p className="text-sm font-bold text-foreground">أدخل بيانات البطاقة</p>
            </div>
          )}
          <div
            id="mf-embedded-container"
            style={{
              minHeight: isVisible ? 320 : 1,
              visibility: isLoading ? "hidden" : "visible",
              height: isLoading ? 1 : "auto",
              overflow: isLoading ? "hidden" : "visible",
            }}
          />
          {isVisible && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-3">
              <div className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                دفع آمن بتشفير SSL
              </div>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-[10px] text-muted-foreground/70">PCI DSS Compliant</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}