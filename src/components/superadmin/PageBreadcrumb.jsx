import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Home, HelpCircle, ArrowRight } from "lucide-react";
import SlidePanel from "./SlidePanel";

const helpContent = {
  "/super-admin": {
    title: "الرئيسية",
    description: "لوحة التحكم الرئيسية — نظرة عامة على النظام والإحصائيات الأساسية"
  },
  "/super-admin/app-manager": {
    title: "مدير التطبيقات",
    description: "إدارة التطبيقات المتاحة — إضافة، تعديل، حذف التطبيقات وتحديد حالاتها وصلاحيات التثبيت"
  },
  "/super-admin/plan-form": {
    title: "نموذج الباقة",
    description: "إنشاء وتعديل باقات الاشتراك — تحديد الأسعار والمميزات والحدود المتاحة"
  },
  "/super-admin/app-categories": {
    title: "تصنيفات التطبيقات",
    description: "إدارة تصنيفات التطبيقات — تنظيم التطبيقات حسب الفئات في المتجر"
  },
  "/super-admin/plan-features": {
    title: "مميزات الباقات",
    description: "إدارة المميزات المتاحة — إضافة المميزات الجديدة وربطها بالباقات"
  },
  "/super-admin/settings/general": {
    title: "الإعدادات العامة",
    description: "إعدادات النظام الأساسية — البيانات العامة والمعلومات الأساسية"
  },
};

const breadcrumbLabels = {
  "/super-admin": "الرئيسية",
  "/super-admin/clients": "العملاء",
  "/super-admin/clients/support": "تذاكر دعم العملاء",
  "/super-admin/partners": "الشركاء",
  "/super-admin/partners/support": "تذاكر دعم الشركاء",
  "/super-admin/marketing": "التسويق",
  "/super-admin/marketing/coupons": "قسائم التخفيض",
  "/super-admin/marketing/offers": "العروض",
  "/super-admin/orders-subscriptions": "الطلبات والاشتراكات",
  "/super-admin/app-manager": "مدير التطبيقات",
  "/super-admin/plan-form": "نموذج الباقة",
  "/super-admin/app-categories": "تصنيفات التطبيقات",
  "/super-admin/plan-features": "مميزات الباقات",
  "/super-admin/app-form": "نموذج التطبيق",
  "/super-admin/settings/general": "الإعدادات العامة",
  "/super-admin/settings/notifications": "إعدادات الإشعارات",
  "/super-admin/settings/sms": "إعدادات الرسائل",
  "/super-admin/settings/email": "إعدادات البريد الإلكتروني",
  "/super-admin/settings/payment": "إعدادات الدفع",
  "/super-admin/settings/shipping": "إعدادات الشحن",
  "/super-admin/settings/languages": "إعدادات اللغات",
  "/super-admin/settings/currencies": "إعدادات العملات",
  "/super-admin/settings/required-fields": "الحقول المطلوبة",
  "/super-admin/settings/subscription-mode": "نمط الاشتراك",
  "/super-admin/settings/form-designer": "مصمم النماذج",
  "/super-admin/settings/locations": "إعدادات المواقع",
  "/super-admin/settings/archive": "إعدادات الأرشيف",
  "/super-admin/settings/users": "المستخدمين والصلاحيات",
  "/super-admin/settings/backup": "النسخ الاحتياطي",
  "/super-admin/settings/sidebar-designer": "مصمم القائمة الجانبية",
};

const segmentLabels = {
  "clients": "العملاء",
  "partners": "الشركاء",
  "marketing": "التسويق",
  "coupons": "قسائم التخفيض",
  "offers": "العروض",
  "support": "الدعم",
  "app-manager": "مدير التطبيقات",
  "settings": "الإعدادات",
  "general": "الإعدادات العامة",
  "notifications": "الإشعارات",
  "sms": "الرسائل القصيرة",
  "email": "البريد الإلكتروني",
  "payment": "الدفع",
  "shipping": "الشحن",
  "languages": "اللغات",
  "currencies": "العملات",
  "required-fields": "الحقول المطلوبة",
  "subscription-mode": "نمط الاشتراك",
  "form-designer": "مصمم النماذج",
  "locations": "المواقع",
  "archive": "الأرشيف",
  "users": "المستخدمون",
  "backup": "النسخ الاحتياطي",
  "sidebar-designer": "مصمم القائمة الجانبية",
  "plan-form": "نموذج الباقة",
  "app-categories": "تصنيفات التطبيقات",
  "plan-features": "مميزات الباقات",
  "app-form": "نموذج التطبيق",
  "orders-subscriptions": "الطلبات والاشتراكات",
};

export default function PageBreadcrumb() {
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = [
    { label: "الرئيسية", path: "/super-admin", icon: Home }
  ];

  let currentPath = "";
  for (let i = 1; i < pathSegments.length; i++) {
    currentPath += "/" + pathSegments[i];
    const label = breadcrumbLabels[currentPath] || segmentLabels[pathSegments[i]] || pathSegments[i];
    breadcrumbs.push({ label, path: currentPath });
  }

  const currentHelp = helpContent[location.pathname] || {
    title: breadcrumbs[breadcrumbs.length - 1]?.label || "المساعدة",
    description: "معلومات مساعدة حول هذه الصفحة"
  };

  return (
    <>
      <div className="bg-card px-6 py-0 border-b border-border z-20">
        <div className="flex items-center justify-between text-sm">
          {/* المسار على اليمين */}
          <div className="flex items-center gap-2">
            {breadcrumbs.map((crumb, index) =>
              <div key={crumb.path} className="flex items-center gap-2">
                {index === 0 ?
                  <Link
                    to={crumb.path}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Home size={14} className="flex-shrink-0" />
                    <span>{crumb.label}</span>
                  </Link> :
                  index === breadcrumbs.length - 1 ?
                    <span className="text-foreground font-medium">{crumb.label}</span> :
                    <Link
                      to={crumb.path}
                      className="text-muted-foreground hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                }
                {index < breadcrumbs.length - 1 &&
                  <ChevronLeft size={14} className="text-muted-foreground flex-shrink-0" />
                }
              </div>
            )}
          </div>

          {/* أيقونة المساعدة على اليسار */}
          <button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg bg-secondary/40 hover:bg-secondary/70"
            style={{ marginLeft: '-9px' }}
            title="اضغط للحصول على المساعدة"
          >
            <HelpCircle size={16} className="flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Slide Panel للمساعدة */}
      <SlidePanel open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="space-y-8 p-8">
          <div className="flex items-center gap-3 border-b border-border pb-6">
            <button
              onClick={() => setHelpOpen(false)}
              className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowRight size={20} />
            </button>
            <h1 className="text-3xl font-bold text-foreground">{currentHelp.title}</h1>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-foreground leading-relaxed">{currentHelp.description}</p>
          </div>
        </div>
      </SlidePanel>
    </>
  );
}