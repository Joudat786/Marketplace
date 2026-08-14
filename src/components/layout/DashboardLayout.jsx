import { useState, useCallback, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import PageBreadcrumbAdmin from "@/components/superadmin/PageBreadcrumb";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PageToolbar from "@/components/superadmin/PageToolbar";
import OnboardingModal from "@/components/client/OnboardingModal";

import { LayoutGrid, List } from "lucide-react";

const pageToolbarConfig = {
  "/super-admin/clients": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/partners": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/marketing/coupons": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/marketing/offers": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/orders-subscriptions": ["upload", "download", "reports", "filter", "delete"],
  "/super-admin/clients/support": ["filter", "reports"],
  "/super-admin/partners/support": ["filter", "reports"],
  "/super-admin/app-manager": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/app-manager": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/settings/currencies": ["add", "upload", "download", "reports", "filter", "delete"],
  "/super-admin/plan-form": [],
  "/super-admin/app-categories": ["add", "upload", "download", "filter", "delete"],
  "/super-admin/plan-features": ["add", "upload", "download", "filter", "delete"],
  "/super-admin/settings/sidebar-designer": ["add", "reports"]
};

export default function DashboardLayout() {
  const workspaceCtx = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // تحديد إذا كان المستخدم admin بناءً على Workspace #1
  const isAdmin = workspaceCtx?.selectedWorkspace?.workspace_number === 1 && workspaceCtx?.selectedWorkspace?.workspace_owner_type === 'super_admin';

  // عدم عرض breadcrumb و toolbar إلا للإدارة
  const showAdminUI = isAdmin;
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved ? JSON.parse(saved) : false;
  });
  const initialSyncDoneRef = useRef(false);

  // حفظ حالة sidebar عند التغيير
  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(expanded));
  }, [expanded]);

  // جلب بيانات المستخدم الحالي وسجل PlatformClient (للعملاء فقط)
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    enabled: !showAdminUI
  });

  const { data: platformClients = [], isLoading: isLoadingClient } = useQuery({
    queryKey: ["platformClient", currentUser?.email],
    queryFn: () => base44.entities.PlatformClient.filter({ email: currentUser.email }),
    enabled: !showAdminUI && !!currentUser?.email
  });
  const platformClient = platformClients[0] || null;
  const [headerSearch, setHeaderSearch] = useState("");
  const [toolbarActions, setToolbarActions] = useState({});
  const [selectedCount, setSelectedCount] = useState(0);
  const [toolbarCustomItems, setToolbarCustomItems] = useState(null);
  
  // ✅ مراقبة تغييرات مساحة العمل وتحديث URL تلقائياً عند أول تحميل
  useEffect(() => {
    if (workspaceCtx?.selectedWorkspace && !initialSyncDoneRef.current) {
      const currentWsId = searchParams.get('workspace');
      if (workspaceCtx.selectedWorkspace.id && currentWsId !== workspaceCtx.selectedWorkspace.id) {
        initialSyncDoneRef.current = true;
        setSearchParams({ workspace: workspaceCtx.selectedWorkspace.id }, { replace: true });
      }
    }
  }, [workspaceCtx?.selectedWorkspace?.id, searchParams, setSearchParams]);

  // ✅ حفظ آخر مسار عند التنقل (للاستعادة بعد التحديث)
  useEffect(() => {
    sessionStorage.setItem('lastPath', location.pathname);
  }, [location.pathname]);

  // ✅ التحقق من إذا كان المستخدم قد انتقل من Super Admin إلى مساحة عمل عادية
  // قائمة الصفحات المسموحة للجميع (غير الإدارية)
  const allowedForAll = ['/', '/workspaces', '/app-store', '/subscriptions', '/financial', '/payment', '/company-profile'];
  const allowedSettingsForAll = ['/settings/general', '/settings/notifications', '/settings/sms', '/settings/email', '/settings/payment', '/settings/shipping', '/settings/languages', '/settings/currencies', '/settings/locations', '/settings/required-fields', '/settings/form-designer', '/settings/archive', '/settings/users', '/settings/backup'];

  // ✅ مرجع لمنع التوجيه المبكر قبل اكتمال تحميل المساحة
  const workspaceLoadedRef = useRef(false);
  useEffect(() => {
    if (workspaceCtx?.selectedWorkspace) {
      workspaceLoadedRef.current = true;
    }
  }, [workspaceCtx?.selectedWorkspace]);

  useEffect(() => {
    // انتظر حتى يكتمل تحميل بيانات مساحة العمل (مرّت مرة واحدة على الأقل)
    if (!workspaceLoadedRef.current) return;
    if (!workspaceCtx?.selectedWorkspace) return;
    if (isAdmin) return; // السوبر أدمن يدخل كل شيء

    const currentPath = location.pathname;

    // تحقق هل الصفحة مسموحة للجميع
    const isAllowed =
      allowedForAll.some(p => currentPath === p || (p !== '/' && currentPath.startsWith(p + '/'))) ||
      allowedSettingsForAll.includes(currentPath) ||
      currentPath.startsWith('/workspaces/') ||
      currentPath.startsWith('/financial/') ||
      currentPath === '/company-profile';

    // إذا كان في صفحة غير مسموحة وليس admin، أعده للرئيسية
    if (!isAllowed) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate, workspaceCtx?.selectedWorkspace]);

  // ✅ Wrapper حول switchWorkspace لتحديث URL أيضاً
   const handleWorkspaceSwitch = useCallback((wsId) => {
     if (workspaceCtx?.switchWorkspace) {
       const newWs = workspaceCtx.workspaces?.find(w => w.id === wsId);
       workspaceCtx.switchWorkspace(wsId);
       // حدّث URL query param
       setSearchParams({ workspace: wsId }, { replace: true });
       // انتقل للرئيسية عند تبديل مساحة العمل
       navigate('/', { replace: true });
     }
   }, [workspaceCtx, setSearchParams, navigate]);
  // حالة طريقة العرض للباقات (جدول / بطاقات)
  const [plansViewType, setPlansViewType] = useState("table");
  // حالة طريقة العرض للتطبيقات (جدول / بطاقات)
  const [appsViewType, setAppsViewType] = useState("cards");
  // التبويب النشط في شاشة AppManager (apps / plans)
  const [appManagerActiveTab, setAppManagerActiveTab] = useState("apps");
  const isAppManager = location.pathname === "/app-manager";
  const sidebarWidth = expanded ? 220 : 72;
  const toolbarItems = pageToolbarConfig[location.pathname] || [];


  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl" style={{ display: "flex" }}>
      <AppSidebar expanded={expanded} onToggle={() => setExpanded((e) => !e)} onSwitchWorkspace={handleWorkspaceSwitch} />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginRight: expanded ? 270 : 72 }}>
        <div className="sticky top-0 z-30">
           <AppHeader sidebarWidth={sidebarWidth} onToggleSidebar={() => setExpanded((e) => !e)} searchValue={headerSearch} onSearchChange={setHeaderSearch} />
           {showAdminUI ? (
             <>
               <PageBreadcrumbAdmin />
               <PageToolbar
                 items={toolbarItems}
                 actions={toolbarActions}
                 selectedCount={selectedCount}
                 customItems={toolbarCustomItems}
                 plansViewType={isAppManager && appManagerActiveTab === "plans" ? plansViewType : null}
                 onPlansViewChange={isAppManager && appManagerActiveTab === "plans" ? setPlansViewType : null}
                 appsViewType={isAppManager && appManagerActiveTab === "apps" ? appsViewType : null}
                 onAppsViewChange={isAppManager && appManagerActiveTab === "apps" ? setAppsViewType : null}
               />
             </>
           ) : (
             <PageBreadcrumb />
           )}
         </div>

        {/* Onboarding إجباري للعملاء الجدد - انتظر اكتمال التحميل قبل العرض */}
        {!showAdminUI && currentUser && !isLoadingClient && (
          <OnboardingModal user={currentUser} platformClient={platformClient} />
        )}

        <main className="transition-all duration-300 flex-1 overflow-y-auto">
          <div className="px-6 py-4 animate-fade-in">
            <Outlet context={{ headerSearch, setHeaderSearch, setToolbarActions, setSelectedCount, setToolbarCustomItems, plansViewType, setPlansViewType, appsViewType, setAppsViewType, appManagerActiveTab, setAppManagerActiveTab, selectedWorkspace: workspaceCtx?.selectedWorkspace, switchWorkspace: handleWorkspaceSwitch, isAdmin: showAdminUI }} />

          </div>
        </main>
      </div>
    </div>);

}