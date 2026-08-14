import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppSetupPanel from "@/components/apps/AppSetupPanel";

/**
 * يعرض التطبيقات المُضمَّنة (displayMode === "page") كبطاقات قابلة للفتح/الإغلاق
 * @param {string} parentPath - مسار الصفحة الأم
 */
export default function EmbeddedApps({ parentPath, panelKey }) {
  const [openApps, setOpenApps] = useState({});
  const workspaceCtx = useWorkspace();
  const selectedWorkspace = workspaceCtx?.selectedWorkspace || null;

  const { data: sidebarConfig } = useQuery({
    queryKey: ["sidebarDesignerConfig"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const { data: allApps = [] } = useQuery({
    queryKey: ["apps-embedded"],
    queryFn: () => base44.entities.App.list()
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: installedApps = [] } = useQuery({
    queryKey: ["installedApps-embedded", user?.role, selectedWorkspace?.id],
    queryFn: async () => {
      if (!user) return [];
      const isAdmin = user.role === 'super_admin';
      const filterQuery = { owner_type: isAdmin ? "super_admin" : "workspace" };
      // للعملاء: فلتر حسب workspace_id (وليس owner_id)
      if (!isAdmin && selectedWorkspace?.id) {
        filterQuery.workspace_id = selectedWorkspace.id;
      }
      const apps = await base44.entities.InstalledApp.filter(filterQuery);
      // عرض جميع التطبيقات ما عدا الموقوفة والمنتهية
      return apps.filter(app => !["suspended", "expired"].includes(app.status));
    },
    enabled: !!user && (user.role === 'super_admin' || !!selectedWorkspace?.id)
  });

  const getAppIconUrl = (child) => {
    const appId = child.appId || child.path;
    const app = allApps.find(a => a.id === appId);
    return app?.icon_url || null;
  };

  const installedAppsMap = new Map(installedApps.map(ia => [ia.app_id, ia]));

  const embeddedApps = (() => {
    if (!sidebarConfig?.sidebar_items_json) return [];
    try {
      const parsed = JSON.parse(sidebarConfig.sidebar_items_json);
      const result = [];
      // إذا تم تحديد panelKey، ابحث فقط في ذلك الـ panel وليس في جميعها
      const panelsToSearch = panelKey ? [panelKey] : Object.keys(parsed);
      for (const panelKey of panelsToSearch) {
        const panelData = parsed[panelKey];
        const tabs = Array.isArray(panelData) ? { home: panelData } : panelData;
        if (!tabs || typeof tabs !== "object") continue;
        for (const tabItems of Object.values(tabs)) {
          if (!Array.isArray(tabItems)) continue;
          for (const item of tabItems) {
            if (item.path === parentPath && item.children?.length > 0) {
              for (const child of item.children) {
                // فحص: التطبيق يجب أن يكون مثبتاً ومكتملاً الإعداد وجاهزاً
                if (child && typeof child === "object" && child.type === "app" && child.displayMode === "page" && child.visible !== false) {
                  const appId = child.appId || child.path;
                  const installedApp = installedAppsMap.get(appId);
                  const app = allApps.find(a => a.id === appId);
                  // التطبيق يجب أن يكون مثبتاً وجاهزاً للاستخدام
                  if (installedApp && app && app.is_ready) {
                    result.push(child);
                  }
                }
              }
            }
          }
        }
      }
      return result;
    } catch { return []; }
  })();

  if (embeddedApps.length === 0) return null;

  const toggleApp = (id) => {
    setOpenApps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3" dir="rtl">
      {embeddedApps.map(app => {
        const isOpen = !!openApps[app.id];
        const iconUrl = getAppIconUrl(app);
        return (
          <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Header - قابل للنقر */}
            <button
              onClick={() => toggleApp(app.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-right"
            >
              {iconUrl ? (
                <img src={iconUrl} alt={app.label} className="w-10 h-10 rounded-xl object-contain border border-border flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-right">
                <p className="font-bold text-sm text-foreground">{app.label}</p>
              </div>
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isOpen ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>

            {/* Content - يفتح/يغلق مع الحقول مباشرة */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <AppSetupPanel
                    open={true}
                    onClose={() => toggleApp(app.id)}
                    app={allApps.find(a => a.id === (app.appId || app.path))}
                    installedApp={installedApps.find(ia => ia.app_id === (app.appId || app.path))}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}