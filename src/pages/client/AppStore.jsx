import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, ShoppingCart, CheckCircle, AlertTriangle, Settings, Package, ArrowLeft, Grid3X3, List, ChevronDown, SlidersHorizontal, Building2, X, ExternalLink, History, Filter } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import AppSetupPanel from "@/components/apps/AppSetupPanel";
import SubscriptionHistoryPanel from "@/components/apps/SubscriptionHistoryPanel";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { AppVideoPlayer } from "@/components/apps/AppVideoSection";
import AppCard from "@/components/apps/AppCard";
import AddonsTab from "@/components/apps/AddonsTab";

// ─── مكوّن Dropdown للفلتر ───
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find((o) => o.key === value);
  const isActive = value !== 'all';

  React.useEffect(() => {
    const handler = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          isActive ?
          "bg-primary text-white border-primary" :
          "bg-secondary border-border text-foreground hover:bg-secondary/80"
        )}>
        
        <span>{label}</span>
        {isActive && <span className="text-[10px] opacity-80">: {selected?.label}</span>}
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open &&
      <div className="absolute top-full mt-1 right-0 z-50 min-w-[120px] bg-white border border-border rounded-xl shadow-xl overflow-hidden">
          {options.map((opt) =>
        <button
          key={opt.key}
          onClick={() => {onChange(opt.key);setOpen(false);}}
          className={cn(
            "w-full text-right px-3 py-2 text-xs flex items-center justify-between transition-colors border-b border-border/30 last:border-0",
            value === opt.key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-secondary/50 text-foreground"
          )}>
          
              {opt.label}
              {value === opt.key && <span className="text-primary text-[10px]">✓</span>}
            </button>
        )}
        </div>
      }
    </div>);

}

export default function AppStorePage({ ownerType = "workspace", ownerId: propOwnerId }) {
  const workspaceCtx = useWorkspace();
  const selectedWorkspace = workspaceCtx?.selectedWorkspace;
  const currentWorkspaceId = selectedWorkspace?.id || null;
  const [activeTab, setActiveTab] = useState('apps');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [setupPanel, setSetupPanel] = useState({ open: false, installedApp: null, app: null });
  const [showNoWorkspaceAlert, setShowNoWorkspaceAlert] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [expandedTab, setExpandedTab] = useState('description');
  const [subscriptionPanel, setSubscriptionPanel] = useState({ open: false, appId: null });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showAddonsStandalone, setShowAddonsStandalone] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: categories = [] } = useQuery({
    queryKey: ['appCategories'],
    queryFn: () => base44.entities.AppCategory.filter({ is_active: true })
  });

  // التفريق يعتمد على مساحة العمل: مساحة #1 (الإدارية) = سوبر أدمن، بقية المساحات = عملاء
  const isAdminWorkspace = selectedWorkspace?.is_admin_workspace === true || selectedWorkspace?.workspace_number === 1;

  const { data: apps = [] } = useQuery({
    queryKey: ['clientApps', isAdminWorkspace, selectedWorkspace?.id],
    queryFn: () => isAdminWorkspace ?
    base44.entities.App.filter({ is_active: true, super_admin_can_install: true }) :
    base44.entities.App.filter({ is_active: true, clients_can_install: true }),
    staleTime: 0, // ✅ البيانات تُعتبر قديمة فوراً لتجبر إعادة الجلب
    refetchInterval: 5000 // ✅ إعادة جلب كل 5 ثوان
  });

  // مراقبة التغييرات في التطبيقات والتثبيتات بالوقت الفعلي
  useEffect(() => {
    const unsubscribe = base44.entities.App.subscribe((event) => {
      if (event.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['clientApps', ownerType] });
      }
    });
    return unsubscribe;
  }, [ownerType, queryClient]);

  // مراقبة التغييرات في التثبيتات
  useEffect(() => {
    const unsubscribe = base44.entities.InstalledApp.subscribe((event) => {
      if (event.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['installedApps', ownerType, selectedWorkspace?.id] });
      }
    });
    return unsubscribe;
  }, [ownerType, selectedWorkspace?.id, queryClient]);

  const resolvedOwnerId = propOwnerId !== undefined ? propOwnerId : ownerType === "workspace" ? currentWorkspaceId : user?.id;

  const { data: installedApps = [], isLoading: isLoadingInstalled } = useQuery({
    queryKey: ['installedApps', selectedWorkspace?.id],
    queryFn: async () => {
      if (!user || !selectedWorkspace?.id) return [];
      const result = await base44.entities.InstalledApp.filter({ workspace_id: selectedWorkspace.id });
      return result;
    },
    enabled: !!user && !!selectedWorkspace?.id,
    staleTime: 0,
    refetchInterval: 3000
  });

  // جلب طلبات التحويل البنكي لهذه المساحة لمعرفة الحالة الحقيقية
  const { data: bankTransferRequests = [] } = useQuery({
    queryKey: ['bankTransferRequests', selectedWorkspace?.id],
    queryFn: () => base44.entities.BankTransferRequest.filter({ workspace_id: selectedWorkspace?.id }),
    enabled: !!selectedWorkspace?.id,
    staleTime: 0,
    refetchInterval: 5000
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plansStore'],
    queryFn: () => base44.entities.Plan.filter({ is_active: true })
  });

  const activeCategories = categories
    .filter(c => {
      if (!c.is_active) return false;
      if (!c.target_audience || c.target_audience === 'all') return true;
      if (c.target_audience === 'super_admin_only') return isAdminWorkspace;
      if (c.target_audience === 'clients_only') return !isAdminWorkspace;
      return true;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // فتح جميع التصنيفات افتراضياً عند تحميل البيانات
  useEffect(() => {
    if (activeCategories.length > 0) {
      setExpandedCategories(new Set(activeCategories.map(c => c.id)));
    }
  }, [categories]);

  const toggleAllCategories = () => {
    const allIds = new Set(activeCategories.map(c => c.id));
    if (expandedCategories.size === allIds.size) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(allIds);
    }
  };

  const checkWorkspaceBeforeInstall = (callback) => {
    if (!selectedWorkspace?.id) {
      setShowNoWorkspaceAlert(true);
      return;
    }
    callback();
  };

  // بناء رابط checkout للتطبيقات المدفوعة
  const buildInstallUrl = (app, billing = "monthly") => {
    const params = new URLSearchParams({
      appId: app.id,
      appName: app.name,
      billing,
      price: billing === "yearly" ? (app.yearly_price || 0) : (app.monthly_price || 0),
      workspaceId: selectedWorkspace?.id || "",
      workspaceName: selectedWorkspace?.name || "",
    });
    return `/payment/checkout?${params}`;
  };

  // دمج عناصر التطبيق في القائمة الجانبية
  const addAppToSidebar = async (app) => {
    if (!app.sidebar_items || app.sidebar_items.length === 0) return;
    try {
      const allSettings = await base44.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
      if (!allSettings || allSettings.length === 0) return;
      const sidebarSetting = allSettings[0];
      const config = JSON.parse(sidebarSetting.sidebar_items_json || "{}");

      // ── بناء الشجرة الصحيحة من sidebar_items ──
      // العناصر قد تكون محفوظة كشجرة (children) أو كقائمة مسطحة (_parentId)
      const buildTree = (items) => {
        // إذا كانت القائمة تحتوي على _parentId → بناء شجرة منها
        const hasFlatStructure = items.some(i => i._parentId !== undefined);
        if (!hasFlatStructure) {
          // هيكل شجري مباشر — أضف app_source_id وأعد بناء الأبناء
          const assignIds = (item, idx) => ({
            ...item,
            id: `app-sidebar-${app.id}-${idx}-${Date.now()}`,
            app_source_id: app.id,
            visible: item.visible !== false,
            children: (item.children || []).map((c, ci) => ({
              ...c,
              id: `app-sidebar-${app.id}-${idx}-c${ci}-${Date.now()}`,
            })),
          });
          return items.map(assignIds);
        }

        // قائمة مسطحة → بناء شجرة
        const map = {};
        items.forEach((item, idx) => {
          map[item.id] = {
            ...item,
            id: `app-sidebar-${app.id}-${idx}-${Date.now()}`,
            app_source_id: app.id,
            visible: item.visible !== false,
            children: [],
          };
        });
        const roots = [];
        items.forEach(item => {
          if (item._parentId && map[item._parentId]) {
            map[item._parentId].children.push(map[item.id]);
          } else if (!item._parentId) {
            roots.push(map[item.id]);
          }
        });
        // تنظيف الحقول المؤقتة
        const clean = (node) => {
          const { _parentId, _depth, _expanded, ...rest } = node;
          return { ...rest, children: (rest.children || []).map(clean) };
        };
        return roots.map(clean);
      };

      const treeItems = buildTree(app.sidebar_items);

      // إضافة كل عنصر جذري في اللوحة/التبويب المناسبين
      treeItems.forEach(item => {
        const panel = item.target_panel || "client";
        const tab = item.target_tab || "home";
        if (!config[panel]) config[panel] = { home: [], archive: [], settings: [] };
        if (!Array.isArray(config[panel][tab])) config[panel][tab] = [];

        // تجنب التكرار
        const alreadyExists = config[panel][tab].some(i => i.app_source_id === app.id);
        if (!alreadyExists) {
          config[panel][tab].push(item);
        }
      });

      await base44.entities.GeneralSettings.update(sidebarSetting.id, {
        sidebar_items_json: JSON.stringify(config)
      });
      queryClient.invalidateQueries({ queryKey: ["sidebarConfig"] });
      queryClient.invalidateQueries({ queryKey: ["sidebarDesignerConfig"] });
    } catch (err) {
      console.warn("فشل إضافة عناصر القائمة:", err);
    }
  };

  // إزالة عناصر التطبيق من القائمة الجانبية
  const removeAppFromSidebar = async (app) => {
    if (!app.sidebar_items || app.sidebar_items.length === 0) return;
    try {
      const allSettings = await base44.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
      if (!allSettings || allSettings.length === 0) return;
      const sidebarSetting = allSettings[0];
      const config = JSON.parse(sidebarSetting.sidebar_items_json || "{}");

      for (const panel in config) {
        for (const tab in config[panel]) {
          if (Array.isArray(config[panel][tab])) {
            config[panel][tab] = config[panel][tab].filter(i => i.app_source_id !== app.id);
          }
        }
      }

      await base44.entities.GeneralSettings.update(sidebarSetting.id, {
        sidebar_items_json: JSON.stringify(config)
      });
      queryClient.invalidateQueries({ queryKey: ["sidebarConfig"] });
      queryClient.invalidateQueries({ queryKey: ["sidebarDesignerConfig"] });
    } catch (err) {
      console.warn("فشل إزالة عناصر القائمة:", err);
    }
  };

  const installMutation = useMutation({
    mutationFn: async (app) => {
      if (!selectedWorkspace?.id) {
        throw new Error("يجب اختيار مساحة عمل أولاً");
      }
      return await base44.entities.InstalledApp.create({
        app_id: app.id,
        app_name: app.name,
        installed_at: new Date().toISOString(),
        workspace_id: selectedWorkspace.id,
        owner_type: selectedWorkspace.workspace_owner_type || 'client',
        owner_id: selectedWorkspace.id,
        status: app.has_trial ? "trial" : app.is_free ? "active" : "pending_payment",
        payment_status: app.is_free ? "free" : app.has_trial ? "trial" : "unpaid",
        is_configured: (app.integration_fields || []).length === 0,
        trial_ends_at: app.has_trial ?
          new Date(Date.now() + (app.trial_days || 14) * 86400000).toISOString().split('T')[0] : null
      });
    },
    onSuccess: async (data, app) => {
      toast({ title: "تم التثبيت", description: `تم تثبيت ${app.name} بنجاح` });
      queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });

      // ── إنشاء سجل SubscriptionRecord للتطبيقات المجانية والتجريبية ──
      if (app.is_free || app.has_trial) {
        const now = new Date();
        const trialEndDate = app.has_trial
              ? new Date(now.getTime() + (app.trial_days || 14) * 86400000).toISOString()
              : undefined; // مجاني = لا يُرسَل end_date نهائياً
        try {
          await base44.entities.SubscriptionRecord.create({
            user_email: user?.email,
            workspace_id: selectedWorkspace?.id,
            workspace_name: selectedWorkspace?.name || "",
            name: app.name,
            type: "app",
            app_id: app.id,
            subscription_source: app.is_free ? "free" : "plan",
            start_date: now.toISOString(),
            ...(trialEndDate ? { end_date: trialEndDate } : {}),
            amount: 0,
            currency: "SAR",
            billing_cycle: "monthly",
            status: "active",
            payment_id: data?.id || null,
          });
          queryClient.invalidateQueries({ queryKey: ["subscriptions", app.id, selectedWorkspace?.id] });
        } catch (err) {
          console.warn("فشل إنشاء سجل الاشتراك:", err);
        }
      }

      // ── التثبيت التلقائي للتطبيقات المرتبطة ──
      // فقط التطبيقات التي لديها auto_install: true وهي مجانية
      const relatedApps = app.related_apps || [];
      const parentIsTrial = app.has_trial && data?.payment_status === 'trial';
      for (const rel of relatedApps) {
        if (!rel.auto_install) continue; // فقط auto_install: true
        // ابحث عن التطبيق في القائمة
        const childApp = apps.find(a => a.id === rel.app_id);
        if (!childApp) continue;
        // لا تثبت إذا كان مدفوعاً (يجب الدفع أولاً)
        if (!childApp.is_free) continue;
        // لا تثبت الابن المجاني الإجباري إذا كان الأب في فترة تجريبية فقط
        // (الابن يُثبَّت فعلياً فقط عند الاشتراك المدفوع الحقيقي)
        if (parentIsTrial && rel.relation_type === 'required_child') continue;
        // لا تثبت إذا كان مثبتاً مسبقاً
        const alreadyInstalled = installedApps.find(ia => ia.app_id === childApp.id && ia.status !== 'uninstalled');
        if (alreadyInstalled) continue;
        // ثبّت التطبيق الفرعي تلقائياً
        try {
          const childData = await base44.entities.InstalledApp.create({
            app_id: childApp.id,
            app_name: childApp.name,
            installed_at: new Date().toISOString(),
            workspace_id: selectedWorkspace.id,
            owner_type: selectedWorkspace.workspace_owner_type || 'client',
            owner_id: selectedWorkspace.id,
            status: 'active',
            payment_status: 'free',
            is_configured: (childApp.integration_fields || []).length === 0,
          });
          // إنشاء سجل SubscriptionRecord للتطبيق الفرعي المجاني
          await base44.entities.SubscriptionRecord.create({
            user_email: user?.email,
            workspace_id: selectedWorkspace?.id,
            workspace_name: selectedWorkspace?.name || "",
            name: childApp.name,
            type: "app",
            app_id: childApp.id,
            subscription_source: "free",
            start_date: new Date().toISOString(),
            // بدون end_date للتطبيقات المجانية — غير محدود
            amount: 0,
            currency: "SAR",
            billing_cycle: "monthly",
            status: "active",
            payment_id: childData?.id || null,
          });
        } catch (err) {
          console.warn(`فشل التثبيت التلقائي لـ ${childApp.name}:`, err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });

      if ((app.integration_fields || []).length > 0) {
        setSetupPanel({ open: true, installedApp: { ...data, is_configured: false }, app });
      }
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const handleTrialInstall = (app) => {
    checkWorkspaceBeforeInstall(() => installMutation.mutate(app));
  };

  const uninstallMutation = useMutation({
    mutationFn: async ({ installedAppId, app }) => {
      const deleteData = app?.delete_data_on_uninstall === true;
      if (deleteData) {
        // حذف بيانات التطبيق أولاً من جميع الـ entities المرتبطة
        if (selectedWorkspace?.id) {
          await base44.functions.invoke('deleteAppData', {
            appId: app.id,
            workspaceId: selectedWorkspace.id
          });
        }
        // ثم حذف سجل التثبيت نهائياً
        await base44.entities.InstalledApp.delete(installedAppId);
      } else {
        // احتفظ بالبيانات — فقط غيّر الحالة إلى uninstalled
        await base44.entities.InstalledApp.update(installedAppId, {
          status: "uninstalled",
          uninstalled_at: new Date().toISOString()
        });
      }
      return { app, deleteData };
    },
    onSuccess: async ({ app, deleteData }) => {
      if (deleteData) {
        toast({ title: "تم إلغاء التثبيت", description: "تم حذف التطبيق وبياناته نهائياً" });
      } else {
        toast({ title: "تم إلغاء التثبيت", description: "بياناتك محفوظة — يمكنك إعادة التثبيت في أي وقت" });
      }
      queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });
      if (app) await removeAppFromSidebar(app);
    },
    onError: (error) => {
      console.error(`[AppStore] ❌ Uninstall failed:`, error);
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  });

  const getInstalledApp = (appId) => installedApps.find((ia) => ia.app_id === appId);

   const [filterAppStatus, setFilterAppStatus] = useState('all');
   const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
   const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState('all');
   const [filterSetupStatus, setFilterSetupStatus] = useState('all');

   // حساب الحالة الفعلية للتطبيق (مع التحقق من انتهاء الفترة التجريبية والاشتراك المدفوع)
   const getActualStatusFromTrialEndDate = (installed, app) => {
     if (!installed) return 'not_installed';

     const today = new Date();

     // ✅ حالة إلغاء التثبيت مع الاحتفاظ بالبيانات
     if (installed.status === 'uninstalled') return 'uninstalled';

     // ✅ التحقق من تحول التطبيق من مجاني لمدفوع
     if (app && app.is_free === false && installed.payment_status === 'free') {
       return 'pending_payment';
     }

     // ✅ إذا كان InstalledApp بحالة pending_payment، تحقق من طلب التحويل الفعلي
     if (installed.status === 'pending_payment' || installed.payment_status === 'unpaid') {
       // ابحث عن آخر طلب تحويل لهذا التطبيق في هذه المساحة
       const appTransferReq = bankTransferRequests
         .filter(r => r.installed_app_id === installed.id || r.workspace_id === installed.workspace_id)
         .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

       // إذا كان آخر طلب مرفوضاً → التطبيق موقوف (ليس بانتظار التحقق)
       if (appTransferReq?.status === 'rejected') return 'suspended';
       // إذا كان مقبولاً → يجب أن يكون قد تم تفعيله، لكن كإجراء دفاعي نعيد الحالة كما هي
       if (appTransferReq?.status === 'approved') return installed.status;
       // لا يوجد طلب أو الطلب pending → بانتظار التحقق
       return 'pending_payment';
     }

     // فحص انتهاء الاشتراك المدفوع
     if (installed.subscription_ends_at && installed.payment_status === 'paid') {
       if (today > new Date(installed.subscription_ends_at)) {
         return 'expired';
       }
       return installed.status;
     }

     // فحص انتهاء الفترة التجريبية
     if (installed.trial_ends_at && installed.payment_status === 'trial') {
       if (today > new Date(installed.trial_ends_at)) {
         return 'expired';
       }
       return installed.status;
     }

     // التطبيقات المجانية
     if (installed.payment_status === 'free') {
       return installed.status;
     }

     return installed.status;
   };

   const getAppStatus = (app) => {
      const installed = getInstalledApp(app.id);
      if (!installed) return "not_installed";
      // استخدم الحالة المحسوبة ديناميكياً (مع تمرير التطبيق للتحقق من التغييرات)
      return getActualStatusFromTrialEndDate(installed, app);
    };

  const getPaymentStatus = (app) => {
    if (app.is_free) return "free";
    if (app.has_trial) return "trial";
    return "paid";
  };

  const getSubscriptionStatus = (app) => {
    const installed = getInstalledApp(app.id);
    if (!installed || !installed.trial_ends_at) return null;
    const trialEndDate = new Date(installed.trial_ends_at);
    const today = new Date();
    const daysLeft = Math.ceil((trialEndDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "expired";
    if (daysLeft <= 7) return "warning";
    return "active";
  };

  // مرادف لـ getActualStatusFromTrialEndDate (للتوافق مع props القديمة) - memoized
  const getActualAppStatus = React.useMemo(() => {
    return (app, installed) => getActualStatusFromTrialEndDate(installed, app);
  }, [installedApps, apps, bankTransferRequests]);

  const getSetupStatus = (app) => {
    const installed = getInstalledApp(app.id);
    if (!installed) return null;
    return installed.is_configured ? "complete" : "pending";
  };

  let filtered = [...apps].filter((app) => {
    // إخفاء الإضافات من القائمة الرئيسية إلا إذا كان showAddonsStandalone مفعلاً
    if (app.is_addon && !showAddonsStandalone) return false;
    const matchSearch = !search.trim() || app.name?.includes(search) || app.description?.includes(search);

    const appStatus = getAppStatus(app);
    const matchAppStatus =
    filterAppStatus === 'all' ? true :
    filterAppStatus === 'installed' ? appStatus !== 'not_installed' :
    filterAppStatus === 'not_installed' ? appStatus === 'not_installed' : true;

    const paymentStatus = getPaymentStatus(app);
    const matchPaymentStatus =
    filterPaymentStatus === 'all' ? true :
    filterPaymentStatus === 'free' ? paymentStatus === 'free' :
    filterPaymentStatus === 'paid' ? paymentStatus === 'paid' :
    filterPaymentStatus === 'trial' ? paymentStatus === 'trial' : true;

    const subscriptionStatus = getSubscriptionStatus(app);
    const matchSubscriptionStatus =
    filterSubscriptionStatus === 'all' ? true :
    filterSubscriptionStatus === 'active' ? subscriptionStatus === 'active' :
    filterSubscriptionStatus === 'warning' ? subscriptionStatus === 'warning' :
    filterSubscriptionStatus === 'expired' ? subscriptionStatus === 'expired' : true;

    const setupStatus = getSetupStatus(app);
    const matchSetupStatus =
    filterSetupStatus === 'all' ? true :
    filterSetupStatus === 'complete' ? setupStatus === 'complete' :
    filterSetupStatus === 'pending' ? setupStatus === 'pending' : true;

    // دالة مساعدة: تحقق إذا كان التصنيف (اسم أو ID) يطابق اسم التصنيف المطلوب
    const appMatchesCategory = (appCatValue, targetCatName) => {
      if (!appCatValue || !targetCatName) return false;
      // مطابقة مباشرة بالاسم
      if (appCatValue === targetCatName) return true;
      // مطابقة عن طريق ID → ابحث عن الاسم في قائمة التصنيفات
      const catById = categories.find(c => c.id === appCatValue);
      if (catById && catById.name === targetCatName) return true;
      return false;
    };

    const matchCategory =
    selectedCategory === 'all' ? true :
    (app.categories || []).some(c => appMatchesCategory(c, selectedCategory)) ||
    appMatchesCategory(app.primary_category, selectedCategory);

    return matchSearch && matchAppStatus && matchPaymentStatus && matchSubscriptionStatus && matchSetupStatus && matchCategory;
  });

  // ترتيب التطبيقات حسب التصنيف المختار
  if (selectedCategory !== 'all') {
    filtered = filtered.sort((a, b) => {
      // احصل على رقم الترتيب من كل تطبيق لكل تصنيف
      const aOrder = a.category_sort_orders?.[selectedCategory] ?? (a.sort_order ?? 999);
      const bOrder = b.category_sort_orders?.[selectedCategory] ?? (b.sort_order ?? 999);
      return aOrder - bOrder;
    });
  } else {
    // في "الكل"، رتب حسب أول تصنيف من التطبيق بناءً على ترتيب التصنيفات في sidebar
    filtered = filtered.sort((a, b) => {
      // جد أول تصنيف من تصنيفات التطبيق (بناءً على ترتيب sidebar)
      let aFirstCatName = null;
      let aFirstCatOrder = 999;
      
      for (const dbCat of categories.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0))) {
        if (a.categories?.some(appCat => {
          const catName = categories.find(c => c.id === appCat)?.name || appCat;
          return catName === dbCat.name;
        })) {
          aFirstCatName = dbCat.name;
          aFirstCatOrder = dbCat.sort_order ?? 999;
          break;
        }
      }

      let bFirstCatName = null;
      let bFirstCatOrder = 999;
      
      for (const dbCat of categories.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0))) {
        if (b.categories?.some(appCat => {
          const catName = categories.find(c => c.id === appCat)?.name || appCat;
          return catName === dbCat.name;
        })) {
          bFirstCatName = dbCat.name;
          bFirstCatOrder = dbCat.sort_order ?? 999;
          break;
        }
      }

      // إذا تساوت التصنيفات، رتب حسب ترتيب التطبيق داخل ذلك التصنيف
      if (aFirstCatOrder === bFirstCatOrder) {
        const aAppOrder = a.category_sort_orders?.[aFirstCatName] ?? 999;
        const bAppOrder = b.category_sort_orders?.[bFirstCatName] ?? 999;
        return aAppOrder - bAppOrder;
      }

      return aFirstCatOrder - bFirstCatOrder;
    });
  }

  const formatDate = (d) => {
    if (!d) return "-";
    // normalize: إذا لم يكن فيه Z أو offset → أضف Z لمعاملته كـ UTC
    const raw = typeof d === "string" && !/Z|[+-]\d{2}:?\d{2}$/.test(d.trim()) ? d.trim() + "Z" : d;
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = fmt.formatToParts(new Date(raw));
    const get = (t) => parts.find(p => p.type === t)?.value ?? "00";
    return `${get("year")}/${get("month")}/${get("day")}`;
  };

  const getCategoryCount = (catName) => {
    return apps.filter((a) => {
      const appMatchesCategory = (appCatValue) => {
        if (!appCatValue) return false;
        if (appCatValue === catName) return true;
        const catById = categories.find(c => c.id === appCatValue);
        return catById?.name === catName;
      };
      return (a.categories || []).some(appMatchesCategory) || appMatchesCategory(a.primary_category);
    }).length;
  };

  const appStatusFilters = [
  { key: 'all', label: 'الكل', color: 'bg-gray-100 text-gray-700' },
  { key: 'installed', label: 'مثبت', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'not_installed', label: 'غير مثبت', color: 'bg-slate-100 text-slate-700' }];

  const paymentStatusFilters = [
  { key: 'all', label: 'الكل', color: 'bg-blue-100 text-blue-700' },
  { key: 'free', label: 'مجاني', color: 'bg-green-100 text-green-700' },
  { key: 'paid', label: 'مدفوع', color: 'bg-amber-100 text-amber-700' },
  { key: 'trial', label: 'تجريبي', color: 'bg-purple-100 text-purple-700' }];

  const subscriptionStatusFilters = [
  { key: 'all', label: 'الكل', color: 'bg-gray-100 text-gray-700' },
  { key: 'active', label: 'نشط', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'warning', label: 'قارب على الانتهاء', color: 'bg-amber-100 text-amber-700' },
  { key: 'expired', label: 'منتهي', color: 'bg-red-100 text-red-700' }];

  const setupStatusFilters = [
  { key: 'all', label: 'الكل', color: 'bg-gray-100 text-gray-700' },
  { key: 'complete', label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'pending', label: 'قيد الإعداد', color: 'bg-orange-100 text-orange-700' }];


  return (
    <div dir="rtl" className="flex gap-0 h-full flex-col">

      {/* ─── Tabs Header ─── */}
      <div className="pr-4 pb-1 pl-4 flex justify-start">
        <div className="bg-slate-200 p-1 rounded-xl inline-flex gap-0">
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-4 py-2 font-semibold text-[12px] transition-all rounded-lg ${
            activeTab === 'apps' ?
            'text-white bg-tabsActive' :
            'text-foreground hover:text-primary'}`
            }>
            
            التطبيقات
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 font-semibold text-[12px] transition-all rounded-lg ${
            activeTab === 'plans' ?
            'text-white bg-tabsActive' :
            'text-foreground hover:text-primary'}`
            }>
            
            الباقات
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* ─── Sidebar ─── */}
      {activeTab === 'apps' &&
        <aside className="w-72 flex-shrink-0 border-l border-border bg-card rounded-xl flex flex-col overflow-hidden sticky top-6 self-start" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {/* بحث وتصنيفات */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم التطبيق أو الوصف..."
                className="w-full bg-secondary/50 border border-border rounded-lg pr-8 pl-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
              
          </div>
        </div>

        <div className="pt-3 pr-3 pb-3 pl-3 overflow-y-auto flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">التصنيفات</p>
          <div className="space-y-0.5">
            <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all' ?
                'bg-primary text-white' :
                'text-foreground hover:bg-secondary'}`
                }>
                
              <div className="flex items-center gap-2">
                <span>🏪</span>
                <span>جميع التطبيقات</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                selectedCategory === 'all' ? 'bg-white/30 text-white' : 'bg-secondary text-muted-foreground'}`
                }>{apps.length}</span>
            </button>

            {categories.filter(c => {
              if (!c.is_active) return false;
              if (!c.target_audience || c.target_audience === 'all') return true;
              if (c.target_audience === 'super_admin_only') return isAdminWorkspace;
              if (c.target_audience === 'clients_only') return !isAdminWorkspace;
              return true;
            }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((cat) =>
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.name ?
                'bg-primary text-white' :
                'text-foreground hover:bg-secondary'}`
                }>
                
                <div className="flex items-center gap-2">
                  <span>{cat.icon || '📂'}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                selectedCategory === cat.name ? 'bg-white/30 text-white' : 'bg-secondary text-muted-foreground'}`
                }>{getCategoryCount(cat.name)}</span>
              </button>
              )}
          </div>
        </div>
      </aside>
        }

      {/* ─── Main Content ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Header + Filters */}
        <div className="sticky top-0 z-20 bg-background pb-2">
        {activeTab === 'apps' &&
        <div className="flex items-center gap-2 mb-2">
        </div>}
        {/* بحث سريع في رأس الصفحة */}
        {activeTab === 'apps' &&
        <div className="mb-2">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في التطبيقات..."
              className="w-full bg-white border border-border rounded-xl pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive">
                <X size={14} />
              </button>
            )}
          </div>
          {search && <p className="text-xs text-primary mt-1 font-semibold">{filtered.length} نتيجة لـ "{search}"</p>}
        </div>}
        {activeTab === 'apps' &&
        <div className="flex items-center gap-2 mb-2">
            {/* البوكس الرئيسي */}
            <div className="bg-card border border-border rounded-2xl py-2 flex items-center gap-2 flex-shrink-0 px-3">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart size={14} className="text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">متجر التطبيقات</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  <span className="font-semibold text-primary">{filtered.length}</span> تطبيق
                </p>
              </div>
            </div>

            {/* الفلاتر خارج البوكس على اليسار */}
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              <FilterDropdown label="الحالة" options={appStatusFilters} value={filterAppStatus} onChange={(val) => {
                 setFilterAppStatus(val);
                 // عند اختيار "غير مثبت"، فعّل عرض الإضافات تلقائياً حتى تظهر إضافات التطبيقات غير المثبتة
                 if (val === 'not_installed') setShowAddonsStandalone(true);
               }} />
              <FilterDropdown label="السعر" options={paymentStatusFilters} value={filterPaymentStatus} onChange={setFilterPaymentStatus} />
              <FilterDropdown label="الاشتراك" options={subscriptionStatusFilters} value={filterSubscriptionStatus} onChange={setFilterSubscriptionStatus} />
              <FilterDropdown label="الإعداد" options={setupStatusFilters} value={filterSetupStatus} onChange={setFilterSetupStatus} />
              {/* زر عرض الإضافات */}
              <button
                onClick={() => setShowAddonsStandalone(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                  showAddonsStandalone
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                }`}
                title={showAddonsStandalone ? "إخفاء الإضافات" : "عرض الإضافات"}
              >
                🧩 {showAddonsStandalone ? "إخفاء الإضافات" : "عرض الإضافات"}
              </button>
              {(filterAppStatus !== 'all' || filterPaymentStatus !== 'all' || filterSubscriptionStatus !== 'all' || filterSetupStatus !== 'all') &&
                <button
                  onClick={() => {setFilterAppStatus('all');setFilterPaymentStatus('all');setFilterSubscriptionStatus('all');setFilterSetupStatus('all');}}
                  className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-colors font-semibold flex-shrink-0">
                  
                  مسح
                </button>
                }
            </div>
          </div>
            }
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
        {activeTab === 'plans' ?
            plans.length === 0 ?
            <div className="text-center py-20 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد باقات متاحة</p>
            </div> :

            <div className="py-8 px-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {plans.
                sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).
                map((plan, i) =>
                <PlanCard key={plan.id} plan={plan} index={i} apps={apps} />
                )}
              </div>
            </div> :

            isLoadingInstalled ?
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-start gap-2">
                      <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                  </div>
                  <div className="p-3"><div className="h-8 bg-muted rounded-lg"></div></div>
                </div>
              ))}
            </div> :
            filtered.length === 0 ?
            <div className="text-center py-20 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد تطبيقات في هذا التصنيف</p>
          </div> :
            viewMode === 'grid' && selectedCategory === 'all' ?
            <div className="space-y-8">
              {/* زر فتح/إغلاق الكل */}
              <div className="flex justify-start">
                <button
                  onClick={toggleAllCategories}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
                >
                  <svg className={cn("w-4 h-4 transition-transform", expandedCategories.size === activeCategories.length && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  {expandedCategories.size === activeCategories.length ? 'إغلاق الكل' : 'فتح الكل'}
                </button>
              </div>
              {activeCategories.map(cat => {
                const appsInCat = filtered.filter(a => 
                  a.categories?.some(appCat => {
                    const catName = categories.find(c => c.id === appCat)?.name || appCat;
                    return catName === cat.name;
                  })
                );
                
                if (appsInCat.length === 0) return null;

                const isExpanded = expandedCategories.has(cat.id);
                
                return (
                  <div key={cat.id}>
                    {/* رأس التصنيف - قابل للنقر */}
                     <button 
                       onClick={() => {
                          const updated = new Set(expandedCategories);
                          if (updated.has(cat.id)) {
                            updated.delete(cat.id);
                          } else {
                            updated.add(cat.id);
                          }
                          setExpandedCategories(updated);
                        }}
                       className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 rounded-xl mb-4 border border-border hover:bg-secondary/50 transition-colors"
                     >
                       <div className="flex items-center gap-2">
                         {cat.icon && <span className="text-xl">{cat.icon}</span>}
                         <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-semibold text-emerald-600">{appsInCat.filter(a => getInstalledApp(a.id)).length} مثبت</span>
                         <span className="text-sm font-semibold text-muted-foreground">{appsInCat.length} تطبيق</span>
                         <svg className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                       </div>
                     </button>
                    
                    {/* التطبيقات في هذا التصنيف - قابلة للإظهار/الإخفاء */}
                    {isExpanded && (
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                       {appsInCat.map((app, i) =>
                        <AppCard
                          key={app.id}
                          app={app}
                          index={i}
                          installedApp={getInstalledApp(app.id)}
                          status={getAppStatus(app)}
                          installMutation={installMutation}
                          handleTrialInstall={handleTrialInstall}
                          allApps={apps}
                          installedApps={installedApps}
                          getActualAppStatus={getActualAppStatus}
                          onInstallAddon={(addon) => checkWorkspaceBeforeInstall(() => {
                            if (!addon.is_free && addon.monthly_price > 0) {
                              navigate(`/payment/checkout?${new URLSearchParams({ appId: addon.id, appName: addon.name, billing: "monthly", price: addon.monthly_price || 0 })}`);
                            } else {
                              installMutation.mutate(addon);
                            }
                          })}
                          onUninstallAddon={(installedId, name, addon) => {if (window.confirm(`هل تريد إلغاء إضافة ${name}؟`)) uninstallMutation.mutate({ installedAppId: installedId, app: addon });}}
                          onSetupAddon={(addon, installedAddon) => {if (installedAddon) setSetupPanel({ open: true, installedApp: installedAddon, app: addon });}}
                          onInstall={() => {
                           if (!app.is_ready) return;
                           checkWorkspaceBeforeInstall(() => {
                             if (!app.is_free) {
                               navigate(buildInstallUrl(app, "monthly"));
                             } else {
                               installMutation.mutate(app);
                             }
                           });
                          }}
                          onUninstall={() => {
                             uninstallMutation.mutate({ installedAppId: getInstalledApp(app.id).id, app });
                          }}
                          onSetup={() => {
                           const installed = getInstalledApp(app.id);
                           if (installed) setSetupPanel({ open: true, installedApp: installed, app });
                          }}
                          installPending={installMutation.isPending}
                          formatDate={formatDate}
                          expandedAppId={expandedAppId}
                          setExpandedAppId={setExpandedAppId}
                          buildInstallUrl={buildInstallUrl}
                          onShowSubscriptionHistory={(appId) => setSubscriptionPanel({ open: true, appId })} />
                          )}
                          </div>
                          )}
                          </div>
                          );
                          })}
                          </div> :
                          viewMode === 'grid' ?
                          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                          {filtered.map((app, i) =>
                          <AppCard
                          key={app.id}
                          app={app}
                          index={i}
                          installedApp={getInstalledApp(app.id)}
                          status={getAppStatus(app)}
                          installMutation={installMutation}
                          handleTrialInstall={handleTrialInstall}
                          allApps={apps}
                          installedApps={installedApps}
                          getActualAppStatus={getActualAppStatus}
                          onInstallAddon={(addon) => checkWorkspaceBeforeInstall(() => {
                          if (!addon.is_free && addon.monthly_price > 0) {
                          navigate(`/payment/checkout?${new URLSearchParams({ appId: addon.id, appName: addon.name, billing: "monthly", price: addon.monthly_price || 0 })}`);
                          } else {
                          installMutation.mutate(addon);
                          }
                          })}
                          onUninstallAddon={(installedId, name, addon) => {if (window.confirm(`هل تريد إلغاء إضافة ${name}؟`)) uninstallMutation.mutate({ installedAppId: installedId, app: addon });}}
                          onSetupAddon={(addon, installedAddon) => {if (installedAddon) setSetupPanel({ open: true, installedApp: installedAddon, app: addon });}}
                          onInstall={() => {
                          const installed = getInstalledApp(app.id);
                          if (installed?.status === 'uninstalled') {
                          base44.entities.InstalledApp.update(installed.id, { status: 'active', uninstalled_at: null })
                          .then(async () => {
                          toast({ title: "✓ إعادة التثبيت", description: "تم إعادة تثبيت التطبيق بنجاح" });
                            queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });
                            // إنشاء سجل اشتراك جديد عند إعادة التثبيت
                            const now = new Date();
                            const reinstallEndDate = app.is_free
                              ? undefined
                              : new Date(now.getTime() + (app.trial_days || 14) * 86400000).toISOString();
                            await base44.entities.SubscriptionRecord.create({
                              user_email: user?.email,
                              workspace_id: selectedWorkspace?.id,
                              workspace_name: selectedWorkspace?.name || "",
                              name: app.name,
                              type: "app",
                              app_id: app.id,
                              subscription_source: app.is_free ? "free" : "plan",
                              start_date: now.toISOString(),
                              ...(reinstallEndDate ? { end_date: reinstallEndDate } : {}),
                              amount: 0,
                              currency: "SAR",
                              billing_cycle: "monthly",
                              status: "active",
                              payment_id: installed?.id || null,
                            });
                            queryClient.invalidateQueries({ queryKey: ["subscriptions", app.id, selectedWorkspace?.id] });
                          });
                          return;
                          }
                          if (!app.is_ready) return;
                          checkWorkspaceBeforeInstall(() => {
                          if (!app.is_free) {
                          navigate(buildInstallUrl(app, "monthly"));
                          } else {
                          installMutation.mutate(app);
                          }
                          });
                          }}
                          onUninstall={() => {
                          uninstallMutation.mutate({ installedAppId: getInstalledApp(app.id).id, app });
                          }}
                          onSetup={() => {
                          const installed = getInstalledApp(app.id);
                          if (installed) setSetupPanel({ open: true, installedApp: installed, app });
                          }}
                          installPending={installMutation.isPending}
                          formatDate={formatDate}
                          expandedAppId={expandedAppId}
                          setExpandedAppId={setExpandedAppId}
                          buildInstallUrl={buildInstallUrl}
                          onShowSubscriptionHistory={(appId) => setSubscriptionPanel({ open: true, appId })} />

                )}
                </div> :

            <div className="space-y-2">
            {filtered.map((app, i) =>
              <AppListRow
                key={app.id}
                app={app}
                index={i}
                installedApp={getInstalledApp(app.id)}
                status={getAppStatus(app)}
                getActualAppStatus={getActualAppStatus}
                onInstall={() => {
                 const installed = getInstalledApp(app.id);
                 if (installed?.status === 'uninstalled') {
                   base44.entities.InstalledApp.update(installed.id, { status: 'active', uninstalled_at: null })
                     .then(async () => {
                       toast({ title: "✓ إعادة التثبيت", description: "تم إعادة تثبيت التطبيق بنجاح" });
                       queryClient.invalidateQueries({ queryKey: ["installedApps", selectedWorkspace?.id] });
                       const now = new Date();
                       const reinstallEndDate2 = app.is_free
                          ? undefined
                          : new Date(now.getTime() + (app.trial_days || 14) * 86400000).toISOString();
                        await base44.entities.SubscriptionRecord.create({
                          user_email: user?.email,
                          workspace_id: selectedWorkspace?.id,
                          workspace_name: selectedWorkspace?.name || "",
                          name: app.name,
                          type: "app",
                          app_id: app.id,
                          subscription_source: app.is_free ? "free" : "plan",
                          start_date: now.toISOString(),
                          ...(reinstallEndDate2 ? { end_date: reinstallEndDate2 } : {}),
                          amount: 0,
                          currency: "SAR",
                          billing_cycle: "monthly",
                          status: "active",
                          payment_id: installed?.id || null,
                        });
                       queryClient.invalidateQueries({ queryKey: ["subscriptions", app.id, selectedWorkspace?.id] });
                     });
                   return;
                 }
                 if (!app.is_ready) return;
                 checkWorkspaceBeforeInstall(() => {
                   if (!app.is_free) {
                     navigate(buildInstallUrl(app, "monthly"));
                   } else {
                     installMutation.mutate(app);
                   }
                 });
                 }}
                 onUninstall={() => {
                  uninstallMutation.mutate({ installedAppId: getInstalledApp(app.id).id, app });
                 }}
                 onSetup={() => {
                   const installed = getInstalledApp(app.id);
                   if (installed) setSetupPanel({ open: true, installedApp: installed, app });
                 }}
                 installPending={installMutation.isPending}
                 buildInstallUrl={buildInstallUrl}
                 allApps={apps}
                 onShowSubscriptionHistory={(appId) => setSubscriptionPanel({ open: true, appId })} />

              )}
          </div>
            }
        </div>
      </div>
      </div>

      <AppSetupPanel
        open={setupPanel.open}
        onClose={() => setSetupPanel({ open: false, installedApp: null, app: null })}
        installedApp={setupPanel.installedApp}
        app={setupPanel.app} />

      <SubscriptionHistoryPanel
        open={subscriptionPanel.open}
        onClose={() => setSubscriptionPanel({ open: false, appId: null })}
        appId={subscriptionPanel.appId}
        workspace={selectedWorkspace} />

      {/* نافذة تنبيه: لا توجد مساحة عمل */}
      {showNoWorkspaceAlert &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">لا توجد مساحة عمل</h2>
            <p className="text-sm text-muted-foreground mb-6">
              يجب إنشاء مساحة عمل أولاً قبل تثبيت أي تطبيق. مساحة العمل هي بيئة عملك التي تحتوي على تطبيقاتك وبياناتك.
            </p>
            <div className="flex gap-3">
              <button
              onClick={() => {setShowNoWorkspaceAlert(false);navigate('/workspaces');}}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              
                إنشاء مساحة عمل الآن
              </button>
              <button
              onClick={() => setShowNoWorkspaceAlert(false)}
              className="flex-1 bg-secondary text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
              
                إغلاق
              </button>
            </div>
          </div>
        </div>
      }
      
    </div>);

}







// ─── List View ───
function AppListRow({ app, index, installedApp, status, onInstall, onUninstall, onSetup, installPending, getActualAppStatus, onShowSubscriptionHistory, buildInstallUrl, allApps }) {
  const { toast } = useToast();
  // استخدم الحالة الفعلية (مع حساب انتهاء الفترة التجريبية)
  const actualStatus = getActualAppStatus ? getActualAppStatus(app, installedApp) : status;
  const requiredChildren = (app.related_apps || [])
    .filter(r => r.relation_type === "required_child")
    .map(r => (allApps || []).find(a => a.id === r.app_id))
    .filter(Boolean);
  const hasRequiredChildWithoutTrial = requiredChildren.some(c => !c.is_free && !c.has_trial);
  const isInstalled = actualStatus !== 'not_installed';
  const needsSetup = actualStatus === 'needs_setup';
  const isTrial = actualStatus === 'trial';
  const isExpired = actualStatus === 'expired';
  const isReady = app.is_ready === true;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-card border rounded-xl px-4 py-3 flex items-center gap-4 hover:shadow-sm transition-all ${
      needsSetup ? "border-yellow-200" : isInstalled ? "border-green-200" : "border-border"}`
      }>
      
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
        {app.icon_url ?
        <img src={app.icon_url} alt={app.name} className="w-7 h-7 object-contain" /> :
        <Package size={18} className="text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-foreground">{app.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          isReady ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`
          }>{isReady ? "جاهز" : "قريباً"}</span>
          {isInstalled &&
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          needsSetup ? "bg-yellow-100 text-yellow-700" : isTrial ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`
          }>{needsSetup ? "يحتاج إعداد" : isTrial ? "تجريبي" : "مثبَّت"}</span>
          }
        </div>
        <p className="text-xs text-muted-foreground truncate">{app.description}</p>
      </div>
      <div className="text-xs text-muted-foreground flex-shrink-0">
        {app.is_free ? <span className="text-emerald-600 font-bold">مجاناً</span> : <span>{app.monthly_price} {app.currency}/شهر</span>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isInstalled && (app.integration_fields || []).length > 0 &&
        <button 
          onClick={() => {
            if (isExpired) {
              toast({ title: "غير متاح", description: "يجب تجديد الاشتراك أولاً", variant: "destructive" });
              return;
            }
            onSetup();
          }}
          disabled={isExpired}
          title={isExpired ? "يجب تجديد الاشتراك أولاً" : ""}
          className={`p-1.5 rounded-lg transition-all ${isExpired ? "bg-gray-100 text-gray-400 cursor-not-allowed" : needsSetup ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-muted-foreground"}`}>
            <Settings size={13} />
          </button>
        }
        {isInstalled &&
        <button
          onClick={() => onShowSubscriptionHistory?.(app.id)}
          title="سجل الاشتراك"
          className="p-1.5 rounded-lg transition-all bg-blue-50 text-blue-600 hover:bg-blue-100">
            <History size={13} />
          </button>
        }
        {!isInstalled ?
        <button
          onClick={onInstall}
          disabled={installPending || !isReady}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
          !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white hover:opacity-90 disabled:opacity-50"}`
          }>
          
            {!isReady ? "قريباً" : (app.has_trial && !hasRequiredChildWithoutTrial) ? `تجربة ${app.trial_days}د` : app.is_free ? "تثبيت" : "اشترك"}

          </button> :

        <button onClick={onUninstall} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive border border-border">
            إلغاء
          </button>
        }
          </div>
          </motion.div>);

}

// ─── Plan Subscribe Button ───
function PlanSubscribeButton({ plan, billing }) {
  const workspaceCtx = useWorkspace();
  const selectedWorkspace = workspaceCtx?.selectedWorkspace;
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams({
      planId: plan.id,
      planName: plan.name,
      billing,
      workspaceId: selectedWorkspace?.id || "",
      workspaceName: selectedWorkspace?.name || "",
    });
    navigate(`/payment/checkout?${params}`);
  };

  return (
    <button onClick={handleClick}
      className="w-full py-2.5 rounded-lg font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90">
      {plan.is_free ? "ابدأ مجاناً" : "اشترك الآن"}
    </button>
  );
}

// ─── Plan Card ───
function PlanCard({ plan, index, apps }) {
  const [billing, setBilling] = useState('monthly');
  const [expandedApps, setExpandedApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appCategoryFilter, setAppCategoryFilter] = useState('all');

  const colorMap = {
    slate: { border: '#cbd5e1', badge: '#f1e8e8', text: '#475569', bg: '#f8fafc' },
    blue: { border: '#60a5fa', badge: '#dbeafe', text: '#1e40af', bg: '#f0f9ff' },
    purple: { border: '#d946ef', badge: '#f3e8ff', text: '#a21caf', bg: '#faf5ff' },
    indigo: { border: '#818cf8', badge: '#e0e7ff', text: '#3730a3', bg: '#f0f4ff' }
  };

  const getPlanColors = (plan) => {
    if (plan.custom_color) {
      return {
        border: plan.custom_color,
        badge: `${plan.custom_color}20`,
        text: plan.custom_color,
        bg: `${plan.custom_color}08`
      };
    }
    return colorMap[plan.color] || colorMap.blue;
  };

  const getPlanSaving = (plan) => {
    if (!plan.monthly_price || !plan.yearly_price) return null;
    const percent = Math.round((1 - plan.yearly_price / (plan.monthly_price * 12)) * 100);
    return percent > 0 ? percent : null;
  };

  const getPrice = () => billing === "monthly" ? plan.monthly_price : plan.yearly_price;

  return (
    <div className="flex flex-col">
                <div className="h-8 flex justify-center items-center mb-1">
                  {plan.is_popular &&
        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow">
                      {plan.popular_label || "الأكثر شيوعاً"}
                    </span>
        }
                </div>
                <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="rounded-xl p-5 border-2 transition-all flex flex-col flex-1"
        style={plan.is_popular ? {
          backgroundColor: getPlanColors(plan).bg,
          borderColor: getPlanColors(plan).border,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        } : {
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)'
        }}>
        
                  <div className="flex items-center justify-center mb-2">
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-6">
                    {plan.is_free ?
          <span className="text-4xl font-bold text-green-500">مجاني</span> :

          <div className="flex flex-row-reverse items-baseline gap-4">
                        {!plan.is_free && plan.yearly_price > 0 &&
            <div className="inline-flex items-center bg-secondary rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                            <button
                onClick={() => setBilling("monthly")}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                billing === "monthly" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`
                }>
                
                              شهري
                            </button>
                            <button
                onClick={() => setBilling("yearly")}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                billing === "yearly" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`
                }>
                
                              سنوي
                              {getPlanSaving(plan) &&
                <span className="text-[9px] px-1 py-0.5 rounded-full" style={{
                  backgroundColor: getPlanColors(plan).badge,
                  color: getPlanColors(plan).text
                }}>
                                  وفّر {getPlanSaving(plan)}%
                                </span>
                }
                            </button>
                          </div>
            }
                        <div className="flex flex-row-reverse items-baseline gap-1">
                          <span className="text-muted-foreground text-sm">ريال</span>
                          <span className="text-2xl font-bold text-foreground">{getPrice().toFixed(2)}</span>
                        </div>
                      </div>
          }
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>عدد المستخدمين</span>
                          <span className="font-semibold text-foreground">{plan.max_users > 0 ? plan.max_users : 'غير محدود'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>عدد مساحات العمل</span>
                          <span className="font-semibold text-foreground">{plan.max_workspaces > 0 ? plan.max_workspaces : 'غير محدود'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>مساحة التخزين</span>
                          <span className="font-semibold text-foreground">{plan.max_storage > 0 ? `${plan.max_storage} GB` : 'غير محدودة'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-current/10 pt-3 mt-3">
                      <button
              onClick={() => setExpandedApps(!expandedApps)}
              className="w-full text-xs font-semibold bg-primary/8 hover:bg-primary/15 transition-all text-right px-4 py-3 rounded-lg flex items-center justify-between border border-primary/20">
                        <span className="font-bold text-foreground">التطبيقات المضمنة ({plan.included_apps?.length || 0})</span>
                        <span className="text-primary">{expandedApps ? "إغلاق التطبيقات ▲" : "عرض التطبيقات ▼"}</span>
                      </button>
                      
                      {expandedApps && plan.included_apps && plan.included_apps.length > 0 &&
            <>
                          {/* Search and Filter */}
                          <div className="space-y-2 mt-3 pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                              <input
                    type="text"
                    placeholder="ابحث عن تطبيق..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  
                            </div>
                            <select
                  value={appCategoryFilter}
                  onChange={(e) => setAppCategoryFilter(e.target.value)}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  
                              <option value="all">جميع التصنيفات</option>
                              {(() => {
                    const categories = new Set();
                    plan.included_apps?.forEach((appId) => {
                      const app = apps.find((a) => a.id === appId || a.name === appId);
                      if (app?.categories && Array.isArray(app.categories)) {
                        app.categories.forEach((cat) => categories.add(cat));
                      }
                    });
                    return Array.from(categories).map((cat) =>
                    <option key={cat} value={cat}>{cat}</option>
                    );
                  })()}
                            </select>
                          </div>

                          {/* Apps List */}
                          <div className="mt-3 space-y-2">
                            {plan.included_apps.
                map((appId) => {
                  let app = apps.find((a) => a.id === appId);
                  if (!app) {
                    app = apps.find((a) => a.name === appId);
                  }
                  return app;
                }).
                filter((app) => {
                  if (!app) return false;
                  const searchTerm = appSearch.toLowerCase();
                  const categoryFilter = appCategoryFilter;
                  const matchesSearch = app.name.toLowerCase().includes(searchTerm);
                  const matchesCategory = !categoryFilter || categoryFilter === 'all' || app.categories?.includes(categoryFilter);
                  return matchesSearch && matchesCategory;
                }).
                map((app, i) =>
                <div key={i} className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded">
                                  {app.icon_url && <img src={app.icon_url} alt="" className="w-4 h-4 rounded flex-shrink-0" />}
                                  <span className="text-primary font-bold">✓</span>
                                  <span className="text-foreground">{app.name}</span>
                                </div>
                )}
                          </div>
                        </>
            }
                      
                      {expandedApps && (!plan.included_apps || plan.included_apps.length === 0) &&
            <div className="text-xs text-muted-foreground text-center py-4">لا توجد تطبيقات مضمنة في هذه الباقة</div>
            }
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <PlanSubscribeButton plan={plan} billing={billing} />

                    {plan.has_trial && plan.trial_days > 0 &&
          <p className="text-center text-xs text-muted-foreground mt-2">
                        🎁 تجربة مجانية {plan.trial_days} يوم — بدون بطاقة ائتمان
                      </p>
          }
                  </div>
                </motion.div>
              </div>);

}