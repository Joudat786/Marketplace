import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import DashboardLayout from './components/layout/DashboardLayout';
import { WorkspaceProvider, useWorkspace } from '@/lib/WorkspaceContext';

// Landing
import Landing from './pages/Landing';

// Client pages
import ClientDashboard from './pages/client/Dashboard';
import WorkspacesPage from './pages/client/Workspaces';

import WorkspaceSettings from './pages/client/WorkspaceSettings';
import CompanyProfile from './pages/client/CompanyProfile';
import AppStorePage from './pages/client/AppStore';
import SubscriptionsPage from './pages/client/Subscriptions';

// Client Settings Pages
import ClientGeneralSettings from './pages/client/settings/GeneralSettings.jsx';
// GeneralSettings merged into WorkspaceSettings
import ClientNotificationSettings from './pages/client/settings/NotificationSettings';
import ClientSMSSettings from './pages/client/settings/SMSSettings';
import ClientEmailSettings from './pages/client/settings/EmailSettings';

import ClientShippingSettings from './pages/client/settings/ShippingSettings';
import ClientLanguageSettings from './pages/client/settings/LanguageSettings';
import ClientCurrencySettings from './pages/client/settings/CurrencySettings';
import ClientLocationSettings from './pages/client/settings/LocationSettings';
import ClientRequiredFieldsSettings from './pages/client/settings/RequiredFieldsSettings';
import ClientFormDesigner from './pages/client/settings/FormDesigner';
import ClientArchiveSettings from './pages/client/settings/ArchiveSettings';
import ClientUsersAndPermissions from './pages/client/settings/UsersAndPermissions';
import ClientBackupAndRestore from './pages/client/settings/BackupAndRestore';

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ClientSupportPage from './pages/superadmin/ClientSupport';
import PartnersPage from './pages/superadmin/Partners';
import PartnerSupportPage from './pages/superadmin/PartnerSupport';
import MarketingPage from './pages/superadmin/Marketing';
import MarketingCouponsPage from './pages/superadmin/MarketingCoupons';
import MarketingOffersPage from './pages/superadmin/MarketingOffers';
import AppManager from './pages/superadmin/AppManager';
import PlanForm from './pages/superadmin/PlanForm';
import AppCategories from './pages/superadmin/AppCategories';
import PlanFeatures from './pages/superadmin/PlanFeatures';

// App Form
import AppForm from './pages/superadmin/AppForm';
import ClientSubscriptionsPage from './pages/superadmin/ClientSubscriptions';
import AppDesigner from './pages/superadmin/AppDesigner';

// Platform Clients
import PlatformClients from './pages/superadmin/PlatformClients';

// Settings Pages
import GeneralSettings from './pages/superadmin/settings/GeneralSettings';
import NotificationSettings from './pages/superadmin/settings/NotificationSettings';


import ShippingSettings from './pages/superadmin/settings/ShippingSettings.jsx';
import SMSSettings from './pages/superadmin/settings/SMSSettings.jsx';
import EmailSettings from './pages/superadmin/settings/EmailSettings.jsx';


import MessagingSettings from './pages/superadmin/settings/MessagingSettings.jsx';
import LanguageSettings from './pages/superadmin/settings/LanguageSettings';
import { useEffect } from 'react';
import LoadingScreen from './components/common/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import MaintenancePage from './components/landing/MaintenancePage';
import CurrencySettings from './pages/superadmin/settings/CurrencySettings';
import RequiredFieldsSettings from './pages/superadmin/settings/RequiredFieldsSettings';
import SubscriptionMode from './pages/superadmin/settings/SubscriptionMode';
import FormDesigner from './pages/superadmin/settings/FormDesigner';
import LocationSettings from './pages/superadmin/settings/LocationSettings';
import ArchiveSettings from './pages/superadmin/settings/ArchiveSettings';
import UsersAndPermissions from './pages/superadmin/settings/UsersAndPermissions';
import BackupAndRestore from './pages/superadmin/settings/BackupAndRestore';
import SidebarDesigner from './pages/superadmin/settings/SidebarDesigner';
import OurSMSSettings from './pages/superadmin/settings/OurSMSSettings';
import BankTransferRequests from './pages/superadmin/BankTransferRequests';
import BankTransferSettings from './pages/superadmin/settings/BankTransferSettings';
import MyFatoorahSettings from './pages/superadmin/settings/MyFatoorahSettings';
import Checkout from './pages/payment/Checkout';
import PaymentSuccess from './pages/payment/PaymentSuccess';




// UnifiedLayout - لوحة واحدة ديناميكية
const UnifiedLayout = () => {
  return (
    <DashboardLayout />
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const workspaceCtxInApp = useWorkspace();
  const isLoadingWorkspace = workspaceCtxInApp?.isLoadingWorkspace;

  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "system" });
      return settings && settings.length > 0 ? settings[0] : null;
    },
    enabled: !!user
  });

  const { data: brandSettings } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "brand" });
      return settings && settings.length > 0 ? settings[0] : null;
    },
    enabled: !!user
  });

  // تطبيق الألوان على CSS variables
  useEffect(() => {
    if (brandSettings) {
      const root = document.documentElement;
      if (brandSettings.primary_color) {
        const [r, g, b] = hexToRgb(brandSettings.primary_color);
        root.style.setProperty('--primary', `${hslFromRgb(r, g, b)}`);
      }
      if (brandSettings.button_color) {
        const [r, g, b] = hexToRgb(brandSettings.button_color);
        root.style.setProperty('--button-color', hslFromRgb(r, g, b));
      }
      if (brandSettings.tabs_active_color) {
        const [r, g, b] = hexToRgb(brandSettings.tabs_active_color);
        root.style.setProperty('--tabs-active', `${hslFromRgb(r, g, b)}`);
      }
      if (brandSettings.tabs_inactive_color) {
        root.style.setProperty('--tabs-inactive', brandSettings.tabs_inactive_color);
      }
      if (brandSettings.table_header_bg_color) {
        root.style.setProperty('--table-header-bg', brandSettings.table_header_bg_color);
      }
      if (brandSettings.table_header_text_color) {
        root.style.setProperty('--table-header-text', brandSettings.table_header_text_color);
      }
    }
  }, [brandSettings]);

  const isMaintenanceMode = systemSettings?.maintenance_mode_enabled === true;
  const isAdmin = user?.role === 'super_admin';

  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage brandSettings={brandSettings} maintenanceText={systemSettings?.maintenance_text} />;
  }

  // إذا كان العميل غير مسجل دخول في أي workspace، وجهه للاختيار
  // (يتم التعامل معه في WorkspaceContext)

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // إذا كان المستخدم غير مسجل دخول، عرض صفحة الهبوط
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* لوحة موحدة لكل المستخدمين - السوبر أدمن في Workspace #1، والعملاء في مساحاتهم */}
      <Route path="/" element={<UnifiedLayout />}>
        {/* الصفحة الرئيسية */}
        <Route index element={isAdmin ? <SuperAdminDashboard /> : <ClientDashboard />} />
        
        {/* المشترك بين الكل */}
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="workspaces/:id" element={<WorkspaceSettings />} />
        <Route path="company-profile" element={<CompanyProfile />} />
        <Route path="app-store" element={<AppStorePage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        
        {/* إعدادات متشابهة */}
        <Route path="settings/general" element={isAdmin ? <GeneralSettings /> : <WorkspaceSettings />} />
        <Route path="settings/notifications" element={isAdmin ? <NotificationSettings /> : <ClientNotificationSettings />} />
        <Route path="settings/sms" element={isAdmin ? <SMSSettings /> : <ClientSMSSettings />} />
        <Route path="settings/email" element={isAdmin ? <EmailSettings /> : <ClientEmailSettings />} />

        <Route path="settings/shipping" element={isAdmin ? <ShippingSettings /> : <ClientShippingSettings />} />
        <Route path="settings/languages" element={isAdmin ? <LanguageSettings /> : <ClientLanguageSettings />} />
        <Route path="settings/currencies" element={isAdmin ? <CurrencySettings /> : <ClientCurrencySettings />} />
        <Route path="settings/locations" element={isAdmin ? <LocationSettings /> : <ClientLocationSettings />} />
        <Route path="settings/required-fields" element={isAdmin ? <RequiredFieldsSettings /> : <ClientRequiredFieldsSettings />} />
        <Route path="settings/form-designer" element={isAdmin ? <FormDesigner /> : <ClientFormDesigner />} />
        <Route path="settings/archive" element={isAdmin ? <ArchiveSettings /> : <ClientArchiveSettings />} />
        <Route path="settings/users" element={isAdmin ? <UsersAndPermissions /> : <ClientUsersAndPermissions />} />
        <Route path="settings/backup" element={isAdmin ? <BackupAndRestore /> : <ClientBackupAndRestore />} />
        
        {/* ✅ تطبيقات الإدارة - فقط السوبر أدمن */}
        {isAdmin && (
          <>
            <Route path="clients/support" element={<ClientSupportPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="partners/support" element={<PartnerSupportPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="marketing/coupons" element={<MarketingCouponsPage />} />
            <Route path="marketing/offers" element={<MarketingOffersPage />} />
            <Route path="app-manager" element={<AppManager />} />
            <Route path="plan-form" element={<PlanForm />} />
            <Route path="app-categories" element={<AppCategories />} />
            <Route path="plan-features" element={<PlanFeatures />} />
            <Route path="app-form" element={<AppForm />} />
            <Route path="app-designer" element={<AppDesigner />} />
            <Route path="platform-clients" element={<PlatformClients />} />
            <Route path="client-subscriptions" element={<ClientSubscriptionsPage />} />
            <Route path="settings/messaging" element={<MessagingSettings />} />

            <Route path="settings/subscription-mode" element={<SubscriptionMode />} />
            <Route path="settings/sidebar-designer" element={<SidebarDesigner />} />
            <Route path="settings/oursms" element={<OurSMSSettings />} />
            <Route path="bank-transfer-requests" element={<BankTransferRequests />} />
            <Route path="settings/bank-transfer" element={<BankTransferSettings />} />
            <Route path="settings/myfatoorah" element={<MyFatoorahSettings />} />
          </>
        )}
        
      </Route>



      {/* صفحات الدفع - خارج DashboardLayout */}
      <Route path="/payment/checkout" element={<Checkout />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

import { base44 } from '@/api/base44Client';

// تحويل hex إلى RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

// تحويل RGB إلى HSL
const hslFromRgb = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <WorkspaceProvider>
            <AuthenticatedApp />
          </WorkspaceProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App