import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Save, AlertCircle } from "lucide-react";

export default function SubscriptionMode() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  const { data: subscriptionSettings = [] } = useQuery({
    queryKey: ["subscription-settings"],
    queryFn: () => base44.entities.SubscriptionSettings.list()
  });

  useEffect(() => {
    if (subscriptionSettings.length > 0) {
      setSettings(subscriptionSettings[0]);
    } else {
      setSettings({
        plans_enabled: true,
        pay_per_use_enabled: false,
        subscription_mode: "plans_only"
      });
    }
  }, [subscriptionSettings]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SubscriptionSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscription-settings"]);
      setLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubscriptionSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscription-settings"]);
      setLoading(false);
    }
  });

  const handleModeChange = async (mode) => {
    if (!settings) return;
    setLoading(true);

    const newSettings = {
      subscription_mode: mode,
      plans_enabled: mode === "plans_only" || mode === "both",
      pay_per_use_enabled: mode === "pay_per_use_only" || mode === "both"
    };

    if (settings.id) {
      await updateMutation.mutateAsync({ id: settings.id, data: newSettings });
    } else {
      await createMutation.mutateAsync(newSettings);
    }
  };

  if (!settings) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات نمط الاشتراك</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة أنماط الاشتراك المتاحة للعملاء</p>
      </div>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">ملاحظة مهمة</p>
          <p className="text-sm text-blue-800 mt-1">
            اختر نمط الاشتراك الذي سيكون متاحاً للعملاء الجدد والحاليين
          </p>
        </div>
      </div>

      {/* Subscription Mode Options */}
      <div className="space-y-3">
        {[
          {
            mode: "plans_only",
            title: "الباقات فقط",
            description: "السماح للعملاء بالاشتراك في الباقات المحددة فقط",
            icon: "📦"
          },
          {
            mode: "pay_per_use_only",
            title: "الاشتراك حسب الاستخدام فقط",
            description: "السماح للعملاء بالاشتراك في التطبيقات بشكل فردي حسب الاستخدام",
            icon: "⏱️"
          },
          {
            mode: "both",
            title: "كلا النمطين",
            description: "السماح للعملاء بالاختيار بين الباقات أو الاشتراك حسب الاستخدام",
            icon: "🔄"
          }
        ].map((option) => (
          <button
            key={option.mode}
            onClick={() => handleModeChange(option.mode)}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
              settings.subscription_mode === option.mode
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{option.icon}</span>
                  {option.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 mt-1 ${
                  settings.subscription_mode === option.mode
                    ? "border-primary bg-primary"
                    : "border-border"
                }`}
              >
                {settings.subscription_mode === option.mode && (
                  <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-secondary/50 border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">الملخص</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الباقات مفعّلة:</span>
            <span className={`font-semibold ${settings.plans_enabled ? "text-green-600" : "text-destructive"}`}>
              {settings.plans_enabled ? "✓ مفعّلة" : "✗ معطّلة"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">الاشتراك حسب الاستخدام:</span>
            <span className={`font-semibold ${settings.pay_per_use_enabled ? "text-green-600" : "text-destructive"}`}>
              {settings.pay_per_use_enabled ? "✓ مفعّل" : "✗ معطّل"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}