import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit2, Building2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SlidePanel from "@/components/superadmin/SlidePanel";

function BankAccountForm({ account, adminWorkspaceId, onClose, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    bank_name: account?.bank_name ?? "",
    account_holder_name: account?.account_holder_name ?? "",
    account_number: account?.account_number ?? "",
    iban: account?.iban ?? "",
    swift_code: account?.swift_code ?? "",
    currency: account?.currency ?? "SAR",
    is_active: account?.is_active ?? true,
    iban_certificate_url: account?.iban_certificate_url ?? "",
    sort_order: account?.sort_order ?? 0,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, workspace_id: adminWorkspaceId, sort_order: Number(form.sort_order) || 0 };
      if (account?.id) {
        return await base44.entities.BankAccount.update(account.id, data);
      } else {
        return await base44.entities.BankAccount.create(data);
      }
    },
    onSuccess: () => {
      toast({ title: "✓", description: account?.id ? "تم تحديث الحساب البنكي" : "تم إضافة الحساب البنكي بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts-admin", adminWorkspaceId] });
      onSaved?.();
      onClose?.();
    },
    onError: (e) => toast({ title: "❌", description: e.message, variant: "destructive" }),
  });

  const f = (key, label, placeholder = "", type = "text", dir = "rtl") => (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        dir={dir}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/20 flex-shrink-0">
        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M5 12l7-7"/><path d="M5 12l7 7"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Building2 size={16} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">{account?.id ? "تعديل الحساب البنكي" : "إضافة حساب بنكي جديد"}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {f("bank_name", "اسم البنك *", "مثال: البنك الأهلي")}
        {f("account_holder_name", "اسم صاحب الحساب *", "الاسم الكامل لصاحب الحساب")}
        {f("account_number", "رقم الحساب", "رقم الحساب البنكي", "text", "ltr")}
        {f("iban", "رقم الآيبان (IBAN) *", "SA...", "text", "ltr")}
        {f("swift_code", "رمز SWIFT", "XXXXXXXXX", "text", "ltr")}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">العملة *</label>
          <select
            value={form.currency}
            onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
            dir="rtl"
          >
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="EUR">يورو (EUR)</option>
            <option value="AED">درهم إماراتي (AED)</option>
          </select>
        </div>
        {/* شهادة الآيبان */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">شهادة الآيبان (مرفق)</label>
          <div className="border border-border rounded-lg overflow-hidden">
            {/* زر الرفع */}
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                رفع ملف
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await base44.integrations.Core.UploadFile({ file });
                      if (res?.file_url) setForm(p => ({ ...p, iban_certificate_url: res.file_url }));
                    } catch {}
                    e.target.value = "";
                  }}
                />
              </label>
              {form.iban_certificate_url && <span className="text-xs text-emerald-600 font-semibold">✓ تم الرفع</span>}
            </div>
            {/* زر التكبير */}
            {form.iban_certificate_url && (
              <div className="flex items-center border-b border-border">
                <a
                  href={form.iban_certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l22 22M17 5H9a2 2 0 0 0-2 2v10"/><path d="M9 1v4"/></svg>
                  عرض المرفق
                </a>
                <div className="w-px h-6 bg-border" />
                {/* زر التنزيل */}
                <a
                  href={form.iban_certificate_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  تنزيل
                </a>
              </div>
            )}
          </div>
        </div>
        {f("sort_order", "ترتيب العرض", "0", "number")}
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-secondary/30 rounded-lg">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-5 h-5"
          />
          <span className="font-semibold text-foreground text-sm">الحساب نشط</span>
        </label>
      </div>
      <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.bank_name || !form.account_holder_name || !form.account_number || !form.iban || !form.currency}
          className="flex-1"
          style={{ backgroundColor: "hsl(var(--button-color))", color: "white" }}
        >
          {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
      </div>
    </div>
  );
}

export default function BankAccountsManager({ adminWorkspaceId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState({ open: false, account: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bankAccounts-admin", adminWorkspaceId],
    queryFn: () => base44.entities.BankAccount.filter({ workspace_id: adminWorkspaceId }),
    enabled: !!adminWorkspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => {
      toast({ title: "✓", description: "تم حذف الحساب البنكي" });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts-admin", adminWorkspaceId] });
      setDeleteConfirm(null);
    },
    onError: (e) => toast({ title: "❌", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">الحسابات البنكية</h3>
        <Button size="sm" onClick={() => setPanel({ open: true, account: null })} disabled={!adminWorkspaceId} className="gap-1.5 text-xs" style={{ backgroundColor: "hsl(var(--button-color))", color: "white" }}>
          <Plus size={13} /> إضافة حساب
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">جاري التحميل...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
          <Building2 size={28} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">لا توجد حسابات بنكية بعد</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => setPanel({ open: true, account: null })}>
            <Plus size={13} /> إضافة أول حساب
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${acc.is_active ? "border-border" : "border-dashed border-border opacity-60"}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${acc.is_active ? "bg-emerald-100" : "bg-gray-100"}`}>
                  <Building2 size={18} className={acc.is_active ? "text-emerald-600" : "text-gray-400"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground text-sm">{acc.bank_name}</p>
                    {acc.is_active
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle size={9}/> نشط</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center gap-1"><AlertTriangle size={9}/> غير نشط</span>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{acc.account_holder_name}</p>
                  {acc.iban && <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{acc.iban}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setPanel({ open: true, account: acc })} className="p-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors" title="تعديل">
                  <Edit2 size={13} className="text-foreground" />
                </button>
                <button onClick={() => setDeleteConfirm(acc)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="حذف">
                  <Trash2 size={13} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Panel: النموذج */}
      <SlidePanel open={panel.open} onClose={() => setPanel({ open: false, account: null })}>
        {panel.open && (
          <BankAccountForm
            account={panel.account}
            adminWorkspaceId={adminWorkspaceId}
            onClose={() => setPanel({ open: false, account: null })}
            onSaved={() => {}}
          />
        )}
      </SlidePanel>

      {/* تأكيد الحذف */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">تأكيد الحذف</h3>
                <p className="text-sm text-muted-foreground">هل تريد حذف حساب "{deleteConfirm.bank_name}"؟</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="flex-1">
                {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}