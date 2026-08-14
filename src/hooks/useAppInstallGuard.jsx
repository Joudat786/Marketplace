import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { base44 } from "@/api/base44Client";
import { Lock, Clock } from "lucide-react";

/**
 * Hook للتحقق من أن تطبيقاً معيناً مثبَّت وفعَّال في مساحة العمل الحالية.
 * يُرجع { isAllowed, isLoading, guard }
 * - isAllowed: true فقط إذا كانت حالة التطبيق active أو trial
 * - pending_payment = بانتظار قبول التحويل البنكي → لا يُسمح بالوصول
 * - التطبيقات المجانية المرتبطة بتطبيق رئيسي: تعمل فقط إذا كان الرئيسي active/trial
 */
export function useAppInstallGuard(appId) {
  const { selectedWorkspace } = useWorkspace();

  const { data: guardData, isLoading } = useQuery({
    queryKey: ["installedApp-guard", appId, selectedWorkspace?.id],
    queryFn: async () => {
      if (!selectedWorkspace?.id || !appId) return { installed: null, parentBlocked: false };

      // جلب التطبيق المحدد
      const results = await base44.entities.InstalledApp.filter({
        workspace_id: selectedWorkspace.id,
        app_id: appId,
      });
      const installed = results?.[0] || null;

      if (!installed) return { installed: null, parentBlocked: false };

      // إذا كان التطبيق مجانياً (free)، تحقق من حالة التطبيق الرئيسي
      if (installed.payment_status === "free") {
        const appDef = await base44.entities.App.filter({ id: appId });
        const app = appDef?.[0];
        const parentIds = app?.parent_app_ids || (app?.parent_app_id ? [app.parent_app_id] : []);

        if (parentIds.length > 0) {
          const allInstalled = await base44.entities.InstalledApp.filter({
            workspace_id: selectedWorkspace.id,
          });

          // التطبيق الرئيسي يجب أن يكون active أو trial فقط
          const parentBlocked = parentIds.some(pid => {
            const parentInstalled = allInstalled.find(ia => ia.app_id === pid);
            if (!parentInstalled) return true;
            return !["active", "trial"].includes(parentInstalled.status);
          });

          return { installed, parentBlocked };
        }
      }

      return { installed, parentBlocked: false };
    },
    enabled: !!selectedWorkspace?.id && !!appId,
    staleTime: 30000,
  });

  const installed = guardData?.installed;
  const parentBlocked = guardData?.parentBlocked || false;

  // يُسمح بالوصول فقط إذا كانت الحالة active أو trial
  // pending_payment لا يُسمح بالوصول — التطبيق بانتظار قبول التحويل البنكي
  const allowedStatuses = ["active", "trial"];
  const isAllowed = !!installed && allowedStatuses.includes(installed.status) && !parentBlocked;

  const isPendingPayment = !!installed && installed.status === "pending_payment";

  const guard = !isLoading && !isAllowed ? (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500" dir="rtl">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPendingPayment || parentBlocked ? "bg-amber-100" : "bg-red-100"}`}>
        {isPendingPayment || parentBlocked
          ? <Clock className="w-8 h-8 text-amber-500" />
          : <Lock className="w-8 h-8 text-red-400" />
        }
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-700">
          {isPendingPayment
            ? "بانتظار قبول التحويل البنكي"
            : parentBlocked
              ? "التطبيق الرئيسي قيد المراجعة"
              : "التطبيق غير مثبَّت"}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {isPendingPayment
            ? "سيتم تفعيل هذا التطبيق بعد مراجعة وقبول طلب التحويل البنكي من فريقنا"
            : parentBlocked
              ? "سيتم تفعيل هذا التطبيق بعد الموافقة على التحويل البنكي للتطبيق الرئيسي"
              : "يجب تثبيت هذا التطبيق وتفعيله من متجر التطبيقات للوصول إلى هذه الصفحة"}
        </p>
      </div>
    </div>
  ) : null;

  return { isAllowed, isLoading, guard };
}