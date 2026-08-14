import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Home, HelpCircle, ArrowRight } from "lucide-react";
import SlidePanel from "@/components/superadmin/SlidePanel";

const helpContent = {
  "/": {
    title: "الرئيسية",
    description: "لوحة التحكم الرئيسية — نظرة عامة على النظام والإحصائيات الأساسية"
  },
  "/app-store": {
    title: "متجر التطبيقات",
    description: "استعرض وثبت التطبيقات المتاحة حسب احتياجاتك"
  },
  "/workspaces": {
    title: "مساحات العمل",
    description: "إدارة مساحات العمل والمشاريع الخاصة بك"
  },
  "/subscriptions": {
    title: "الاشتراكات والفواتير",
    description: "عرض واشتراكاتك والفواتير والإحصائيات"
  },
};

const breadcrumbLabels = {
  "/": "الرئيسية",
  "/app-store": "متجر التطبيقات",
  "/workspaces": "مساحات العمل",
  "/subscriptions": "الاشتراكات",
};

const segmentLabels = {
  "app-store": "متجر التطبيقات",
  "workspaces": "مساحات العمل",
  "subscriptions": "الاشتراكات",
};

export default function PageBreadcrumb() {
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = [
    { label: "الرئيسية", path: "/" }
  ];

  let currentPath = "";
  for (let i = 0; i < pathSegments.length; i++) {
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