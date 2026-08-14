import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import BasicInfoTab from "@/components/superadmin/plan-form/BasicInfoTab";
import PricingTab from "@/components/superadmin/plan-form/PricingTab";
import ResourcesAndLimitsTab from "@/components/superadmin/plan-form/ResourcesAndLimitsTab";
import FeaturesTab from "@/components/superadmin/plan-form/FeaturesTab";
import AppsTab from "@/components/superadmin/plan-form/AppsTab";

const emptyForm = {
  name: "", description: "", monthly_price: "", yearly_price: "",
  max_users: "", max_workspaces: "", max_storage: "", features: [],
  included_apps: [], included_features: [], is_active: true, color: "blue", subscribers_count: 0, sort_order: 0,
  is_popular: false, popular_label: "الأكثر شيوعاً",
  has_trial: false, trial_days: 14, is_default: false,
  is_free: false,
  additional_user_price_monthly: 0, additional_user_price_yearly: 0,
  additional_workspace_price_monthly: 0, additional_workspace_price_yearly: 0,
  additional_storage_price_monthly: 0, additional_storage_price_yearly: 0,
  allow_additional_users: false, allow_additional_workspaces: false, allow_additional_storage: false
};

export default function PlanForm({ embeddedPlanId, onClose, onSaved } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = embeddedPlanId !== undefined ? embeddedPlanId : searchParams.get("id");
  const isEmbedded = onClose !== undefined;
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.Plan.list(),
    enabled: !!planId
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: () => base44.entities.App.list()
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => base44.entities.AppCategory.list(),
    select: (data) => [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  });

  const { data: planFeatures = [] } = useQuery({
    queryKey: ["plan-features"],
    queryFn: () => base44.entities.PlanFeature.list(),
    select: (data) => [...data].filter(f => f.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  });

  useEffect(() => {
    if (planId && plans.length > 0) {
      const found = plans.find(p => p.id === planId);
      if (found) setForm({ ...emptyForm, ...found });
    }
  }, [planId, plans]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Plan.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["plans"]); if (isEmbedded) { onSaved?.(); onClose?.(); } else navigate("/super-admin/app-manager?tab=plans", { state: { tab: "plans" } }); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Plan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["plans"]); if (isEmbedded) { onSaved?.(); onClose?.(); } else navigate("/super-admin/app-manager?tab=plans", { state: { tab: "plans" } }); }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name?.trim()) {
      alert('اسم الباقة مطلوب');
      return;
    }
    if (!form.is_free && (!form.monthly_price || Number(form.monthly_price) < 0)) {
      alert('السعر الشهري مطلوب');
      return;
    }
    if (!form.is_free && (!form.yearly_price || Number(form.yearly_price) < 0)) {
      alert('السعر السنوي مطلوب');
      return;
    }
    if (!form.max_users && form.max_users !== 0 || Number(form.max_users) < 0) {
      alert('الحد الأقصى للمستخدمين مطلوب');
      return;
    }
    if (!form.max_workspaces && form.max_workspaces !== 0 || Number(form.max_workspaces) < 0) {
      alert('الحد الأقصى للمساحات مطلوب');
      return;
    }
    if (!form.max_storage && form.max_storage !== 0 || Number(form.max_storage) < 0) {
      alert('مساحة التخزين مطلوبة');
      return;
    }

    setSaving(true);
    const formData = {
      ...form,
      monthly_price: Number(form.monthly_price) || 0,
      yearly_price: Number(form.yearly_price) || 0,
      max_users: Number(form.max_users),
      max_workspaces: Number(form.max_workspaces),
      max_storage: Number(form.max_storage),
      sort_order: Number(form.sort_order) || 0,
      included_apps: form.included_apps || [],
      included_features: form.included_features || []
    };
    if (planId) {
      await updateMutation.mutateAsync({ id: planId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={isEmbedded ? onClose : () => navigate("/super-admin/app-manager?tab=plans")}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{planId ? "تعديل الباقة" : "إضافة باقة جديدة"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدير الباقات والتطبيقات / {planId ? "تعديل" : "إضافة"}</p>
        </div>
      </div>

      {/* Form with Tabs */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="pricing">التسعير</TabsTrigger>
            <TabsTrigger value="resources">الحدود و الموارد</TabsTrigger>
            <TabsTrigger value="features">مميزات الباقة</TabsTrigger>
            <TabsTrigger value="apps">التطبيقات</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <BasicInfoTab form={form} setForm={setForm} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingTab form={form} setForm={setForm} />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourcesAndLimitsTab form={form} setForm={setForm} />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <FeaturesTab form={form} setForm={setForm} planFeatures={planFeatures} />
          </TabsContent>

          <TabsContent value="apps" className="mt-6">
            <AppsTab form={form} setForm={setForm} apps={apps} dbCategories={dbCategories} />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6">
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 bg-buttonColor text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "جارٍ الحفظ..." : planId ? "حفظ التعديلات" : "إضافة الباقة"}
          </button>
          <button
            type="button"
            onClick={isEmbedded ? onClose : () => navigate("/super-admin/app-manager?tab=plans")}
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}