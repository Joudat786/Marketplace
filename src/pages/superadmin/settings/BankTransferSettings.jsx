import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Save, Building2, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BankAccountsManager from "@/components/bank/BankAccountsManager";

export default function SuperAdminBankTransferSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ID المساحة الإدارية الثابت (workspace_number = 1)
  const adminWorkspaceId = "6a1a2f4b8cd417ef2ba461aa";

  const [formData, setFormData] = useState({
    is_enabled: false,
    instructions: "",
    payment_deadline_enabled: true,
    payment_deadline_value: 24,
    payment_deadline_unit: "hours",
    auto_confirm: false,
    require_transfer_proof: true,
    transfer_proof_required: false,
    show_sender_name: false,
    sender_name_required: false,
    notes: "",
  });

  const UNIT_OPTIONS = [
    { value: "minutes", label: "دقيقة" },
    { value: "hours",   label: "ساعة" },
    { value: "days",    label: "يوم" },
  ];

  const { data: settings, isLoading } = useQuery({
    queryKey: ["bankTransferSettings-admin"],
    queryFn: async () => {
      const result = await base44.entities.BankTransferSettings.filter({ workspace_id: adminWorkspaceId });
      return result?.[0] || null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        is_enabled: settings.is_enabled ?? false,
        instructions: settings.instructions ?? "",
        payment_deadline_enabled: settings.payment_deadline_enabled ?? true,
        payment_deadline_value: settings.payment_deadline_value ?? 24,
        payment_deadline_unit: settings.payment_deadline_unit ?? "hours",
        auto_confirm: settings.auto_confirm ?? false,
        require_transfer_proof: settings.require_transfer_proof ?? true,
        transfer_proof_required: settings.transfer_proof_required ?? false,
        show_sender_name: settings.show_sender_name ?? false,
        sender_name_required: settings.sender_name_required ?? false,
        notes: settings.notes ?? "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = { ...formData, workspace_id: adminWorkspaceId };
      if (settings?.id) {
        return await base44.entities.BankTransferSettings.update(settings.id, dataToSave);
      } else {
        return await base44.entities.BankTransferSettings.create(dataToSave);
      }
    },
    onSuccess: () => {
      toast({ title: "✓", description: "تم حفظ إعدادات التحويل البنكي بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["bankTransferSettings-admin"] });
    },
    onError: (error) => {
      toast({ title: "❌", description: error.message || "فشل الحفظ", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 size={22} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">إعدادات التحويل البنكي</h1>
              <p className="text-sm text-muted-foreground">تكوين طريقة الدفع بالتحويل البنكي للنظام</p>
            </div>
          </div>
        </div>

        {/* شريط الأدوات */}
        <div className="flex gap-3">
          <Link to="/bank-transfer-requests">
            <Button variant="outline" className="gap-2">
              <ClipboardList size={16} />
              مراجعة طلبات التحويل
            </Button>
          </Link>
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowRight size={16} />
            رجوع
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2"
            style={{ backgroundColor: "hsl(var(--button-color))", color: "white" }}
          >
            <Save size={16} />
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>

      {/* النموذج */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* التفعيل */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div>
            <p className="font-semibold text-foreground">تفعيل التحويل البنكي</p>
            <p className="text-xs text-muted-foreground mt-0.5">السماح للعملاء بالدفع عن طريق التحويل البنكي</p>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 ${formData.is_enabled ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${formData.is_enabled ? "mr-6" : ""}`} />
          </button>
        </div>

        {formData.is_enabled && (
          <>
            <div className="border-t border-border pt-6">
              <BankAccountsManager adminWorkspaceId={adminWorkspaceId} />
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-semibold text-foreground mb-4">الإعدادات والتعليمات</h3>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">تعليمات التحويل للعميل</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="أدخل التعليمات التي ستظهر للعميل عند اختيار التحويل البنكي..."
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                />
              </div>

              {/* مهلة الدفع */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">مهلة إتمام التحويل</label>
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payment_deadline_enabled: !prev.payment_deadline_enabled }))}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 ${formData.payment_deadline_enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${formData.payment_deadline_enabled ? "mr-6" : ""}`} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.payment_deadline_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_deadline_value: parseInt(e.target.value) || 1 }))}
                    disabled={!formData.payment_deadline_enabled}
                    className="w-24 border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:bg-muted"
                  />
                  <select
                    value={formData.payment_deadline_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_deadline_unit: e.target.value }))}
                    disabled={!formData.payment_deadline_enabled}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right disabled:opacity-40 disabled:bg-muted"
                    dir="rtl"
                  >
                    {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                  {!formData.payment_deadline_enabled && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">معطّلة</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.require_transfer_proof}
                    onChange={(e) => setFormData(prev => ({ ...prev, require_transfer_proof: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">طلب إثبات التحويل</span>
                    <p className="text-xs text-muted-foreground">يُطلب من العميل رفع صورة إيصال التحويل</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_confirm}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_confirm: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">تأكيد تلقائي</span>
                    <p className="text-xs text-muted-foreground">تأكيد الطلب تلقائياً دون انتظار مراجعة يدوية</p>
                  </div>
                </label>
              </div>

              {/* إعدادات إشعار التحويل */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground text-sm">إعدادات إشعار التحويل</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.require_transfer_proof}
                    onChange={(e) => setFormData(prev => ({ ...prev, require_transfer_proof: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">إظهار حقل رفع إشعار التحويل</span>
                    <p className="text-xs text-muted-foreground">يظهر للعميل خيار رفع صورة إيصال التحويل</p>
                  </div>
                </label>
                {formData.require_transfer_proof && (
                  <label className="flex items-center gap-3 cursor-pointer mr-8">
                    <input
                      type="checkbox"
                      checked={formData.transfer_proof_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, transfer_proof_required: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-semibold text-foreground">إجباري</span>
                      <p className="text-xs text-muted-foreground">لا يمكن إكمال الطلب بدون رفع الإيصال</p>
                    </div>
                  </label>
                )}
              </div>

              {/* إعدادات اسم المُحوِّل */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground text-sm">اسم صاحب الحساب المُحوِّل</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_sender_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_sender_name: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">إظهار حقل اسم المُحوِّل</span>
                    <p className="text-xs text-muted-foreground">يطلب من العميل إدخال اسم صاحب الحساب الذي حوّل منه</p>
                  </div>
                </label>
                {formData.show_sender_name && (
                  <label className="flex items-center gap-3 cursor-pointer mr-8">
                    <input
                      type="checkbox"
                      checked={formData.sender_name_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, sender_name_required: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-semibold text-foreground">إجباري</span>
                      <p className="text-xs text-muted-foreground">لا يمكن إكمال الطلب بدون إدخال اسم المُحوِّل</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات داخلية</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات للاستخدام الداخلي فقط..."
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}