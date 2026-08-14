import React from "react";
import { ArrowRight, Package, Building2, Mail, Calendar, CreditCard, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRiyadh as formatDate } from "@/utils/dateUtils";

const statusConfig = {
  active:          { label: "نشط",           bg: "bg-emerald-100", text: "text-emerald-700" },
  trial:           { label: "تجريبي",         bg: "bg-blue-100",    text: "text-blue-700" },
  expired:         { label: "منتهي",          bg: "bg-red-100",     text: "text-red-700" },
  suspended:       { label: "موقوف",          bg: "bg-amber-100",   text: "text-amber-700" },
  pending_payment: { label: "بانتظار الدفع",  bg: "bg-orange-100",  text: "text-orange-700" },
  pending_setup:   { label: "بانتظار الإعداد",bg: "bg-purple-100",  text: "text-purple-700" },
  uninstalled:     { label: "ملغى",           bg: "bg-gray-100",    text: "text-gray-600" },
};

export default function SubscriptionDetailPanel({ item, workspace, app, onClose }) {
  if (!item) return null;
  const sc = statusConfig[item.status] || statusConfig.suspended;

  return (
    <div dir="rtl" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-border bg-card sticky top-0 z-10">
        <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">تفاصيل الاشتراك</h2>
          <p className="text-xs text-muted-foreground">{item.app_name || app?.name || "—"}</p>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", sc.bg, sc.text)}>
          {sc.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* التطبيق */}
        <Section title="معلومات التطبيق" icon={<Package size={16} />}>
          <Row label="اسم التطبيق" value={item.app_name || app?.name || "—"} />
          <Row label="معرف التطبيق" value={item.app_id} mono />
          <Row label="نوع التطبيق" value={app?.app_type === "ui" ? "واجهة مستخدم" : "خدمة خلفية"} />
          {app?.categories?.length > 0 && <Row label="التصنيفات" value={app.categories.join("، ")} />}
        </Section>

        {/* مساحة العمل */}
        <Section title="مساحة العمل" icon={<Building2 size={16} />}>
          <Row label="اسم مساحة العمل" value={workspace?.name || item.workspace_id || "—"} />
          <Row label="البريد الإلكتروني" value={workspace?.owner_email || "—"} />
          <Row label="رقم مساحة العمل" value={workspace?.workspace_number || "—"} />
          <Row label="الحالة" value={workspace?.status || "—"} />
        </Section>

        {/* الاشتراك */}
        <Section title="تفاصيل الاشتراك" icon={<CreditCard size={16} />}>
          <Row label="حالة الاشتراك" value={sc.label} badge badgeBg={sc.bg} badgeText={sc.text} />
          <Row label="حالة الدفع" value={item.payment_status === "paid" ? "مدفوع" : item.payment_status === "trial" ? "تجريبي" : item.payment_status === "free" ? "مجاني" : "غير مدفوع"} />
          <Row label="دورة الفوترة" value={item.billing_cycle === "monthly" ? "شهري" : item.billing_cycle === "yearly" ? "سنوي" : "—"} />
          <Row label="السعر الشهري" value={app?.monthly_price ? `${app.monthly_price} ${app.currency || ""}` : "—"} />
          <Row label="السعر السنوي" value={app?.yearly_price ? `${app.yearly_price} ${app.currency || ""}` : "—"} />
          <Row label="تم الإعداد" value={item.is_configured ? "نعم" : "لا"} />
        </Section>

        {/* التواريخ */}
        <Section title="التواريخ" icon={<Calendar size={16} />}>
          <Row label="تاريخ التثبيت" value={formatDate(item.installed_at)} />
          <Row label="انتهاء الاشتراك" value={formatDate(item.subscription_ends_at)} />
          <Row label="انتهاء التجربة" value={formatDate(item.trial_ends_at)} />
          {item.uninstalled_at && <Row label="تاريخ إلغاء التثبيت" value={formatDate(item.uninstalled_at)} />}
          <Row label="آخر تحديث" value={formatDate(item.updated_date)} />
        </Section>

        {/* اسم مخصص */}
        {(item.custom_name || item.custom_icon_url) && (
          <Section title="تخصيص العميل" icon={<Info size={16} />}>
            {item.custom_name && <Row label="الاسم المخصص" value={item.custom_name} />}
            {item.custom_icon_url && (
              <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground">الأيقونة المخصصة</span>
                <img src={item.custom_icon_url} className="w-8 h-8 rounded object-contain" alt="" />
              </div>
            )}
          </Section>
        )}

        {/* ملاحظات */}
        {item.notes && (
          <Section title="ملاحظات" icon={<Info size={16} />}>
            <p className="text-sm text-foreground">{item.notes}</p>
          </Section>
        )}

        {/* المعرف */}
        <Section title="معلومات تقنية" icon={<Clock size={16} />}>
          <Row label="معرف السجل" value={item.id} mono />
          <Row label="تاريخ الإنشاء" value={formatDate(item.created_date)} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, badge, badgeBg, badgeText }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {badge ? (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", badgeBg, badgeText)}>{value}</span>
      ) : (
        <span className={cn("text-xs font-semibold text-foreground text-left", mono && "font-mono text-[11px]")}>{value}</span>
      )}
    </div>
  );
}