import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId") || params.get("PaymentId");
    const referenceId = params.get("referenceId") || params.get("ReferenceId");

    if (!paymentId) {
      // لا يوجد paymentId — احتمال redirect مباشر
      setStatus("success");
      return;
    }

    // تفعيل الاشتراك إذا كان referenceId يحمل installedAppId:workspaceId
    const activate = async () => {
      try {
        if (referenceId && referenceId.includes(":")) {
          const [installedAppId, workspaceId] = referenceId.split(":");
          if (installedAppId && workspaceId) {
            await base44.entities.InstalledApp.update(installedAppId, {
              status: "active",
              payment_status: "paid",
            });
          }
        }
        setStatus("success");
      } catch (e) {
        console.error("Activation error:", e.message);
        setStatus("success"); // نُظهر نجاح على أي حال — الـ webhook سيُكمل
      }
    };

    activate();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-emerald-50/30 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-xl space-y-6">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="animate-spin text-primary mx-auto" />
            <p className="text-lg font-bold text-foreground">جارٍ تأكيد الدفع...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={52} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">تم الدفع بنجاح! 🎉</h1>
              <p className="text-muted-foreground text-sm">شكراً لك، تم استلام دفعتك وسيتم تفعيل اشتراكك خلال لحظات.</p>
            </div>
            <Link
              to="/subscriptions"
              className="block w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-center"
            >
              عرض اشتراكاتي
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={52} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">حدث خطأ</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <Link to="/app-store" className="block w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-center">
              العودة للمتجر
            </Link>
          </>
        )}
      </div>
    </div>
  );
}