import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Package, Settings, CheckCircle, AlertTriangle, ShoppingCart, Search, Trash2 } from "lucide-react";
import AppSetupPanel from "@/components/apps/AppSetupPanel";

export default function MyApps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [setupPanel, setSetupPanel] = useState({ open: false, installedApp: null, app: null });

  // جلب جميع التطبيقات المتاحة للسوبر أدمن
  const { data: apps = [] } = useQuery({
    queryKey: ['appsForAdmin'],
    queryFn: () => base44.entities.App.filter({ is_active: true, super_admin_can_install: true })
  });

  // جلب التطبيقات المثبتة للسوبر أدمن فقط
  const { data: installedApps = [], isLoading } = useQuery({
    queryKey: ['installedApps', 'super_admin'],
    queryFn: () => base44.entities.InstalledApp.filter({ owner_type: "super_admin" })
  });

  const installMutation = useMutation({
    mutationFn: async (app) => {
      return await base44.entities.InstalledApp.create({
        app_id: app.id,
        owner_type: "super_admin",
        owner_id: null,
        status: app.has_trial ? "trial" : (app.is_free ? "active" : "pending_payment"),
        payment_status: app.is_free ? "free" : (app.has_trial ? "trial" : "unpaid"),
        is_configured: (app.integration_fields || []).length === 0,
        trial_ends_at: app.has_trial
          ? new Date(Date.now() + (app.trial_days || 14) * 86400000).toISOString().split('T')[0]
          : null
      });
    },
    onSuccess: (data, app) => {
      toast({ title: "تم التثبيت", description: `تم تثبيت ${app.name}` });
      queryClient.invalidateQueries({ queryKey: ["installedApps"] });
      if ((app.integration_fields || []).length > 0) {
        setSetupPanel({ open: true, installedApp: data, app });
      }
    },
    onError: (err) => toast({ title: "خطأ", description: err.message, variant: "destructive" })
  });

  const uninstallMutation = useMutation({
    mutationFn: async (id) => await base44.entities.InstalledApp.delete(id),
    onSuccess: () => {
      toast({ title: "تم", description: "تم إلغاء التثبيت" });
      queryClient.invalidateQueries({ queryKey: ["installedApps"] });
    }
  });

  const getInstalledApp = (appId) => installedApps.find(ia => ia.app_id === appId);

  const getAppStatus = (app) => {
    const inst = getInstalledApp(app.id);
    if (!inst) return "not_installed";
    if (!inst.is_configured && (app.integration_fields || []).length > 0) return "needs_setup";
    return inst.status;
  };

  const filtered = apps.filter(app => {
    const matchSearch = !search.trim() || app.name?.includes(search);
    const status = getAppStatus(app);
    const matchFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'installed' ? status !== 'not_installed' :
      filterStatus === 'not_installed' ? status === 'not_installed' :
      filterStatus === 'needs_setup' ? status === 'needs_setup' : true;
    return matchSearch && matchFilter;
  });

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}`;
  };

  const statusCounts = {
    all: apps.length,
    installed: apps.filter(a => getAppStatus(a) !== 'not_installed').length,
    not_installed: apps.filter(a => getAppStatus(a) === 'not_installed').length,
    needs_setup: apps.filter(a => getAppStatus(a) === 'needs_setup').length
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} dir="rtl" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">تطبيقاتي</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة التطبيقات المثبتة في حسابك كسوبر أدمن</p>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث..."
            className="w-full border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'installed', label: 'المثبتة' },
            { key: 'not_installed', label: 'غير مثبتة' },
            { key: 'needs_setup', label: 'تحتاج إعداد' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-card border-border text-foreground hover:bg-secondary"
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filterStatus === f.key ? "bg-white/30 text-white" : "bg-secondary text-muted-foreground"
              }`}>{statusCounts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* شبكة التطبيقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((app, i) => {
          const installed = getInstalledApp(app.id);
          const status = getAppStatus(app);
          const isInstalled = status !== 'not_installed';
          const needsSetup = status === 'needs_setup';

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-xl p-5 hover:shadow-md transition-all relative ${
                needsSetup ? "border-yellow-300" :
                isInstalled ? "border-green-300" :
                "border-border hover:border-primary/30"
              }`}
            >
              {isInstalled && (
                <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                  needsSetup ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                }`}>
                  {needsSetup ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                  {needsSetup ? "يحتاج إعداد" : "مثبَّت"}
                </div>
              )}

              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Package size={22} className="text-primary" />
                )}
              </div>

              <h3 className="text-sm font-bold text-foreground mb-1">{app.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{app.description}</p>

              {(app.integration_fields || []).length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  <Settings size={11} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{app.integration_fields.length} حقل ربط</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <div>
                  {app.is_free ? (
                    <span className="text-xs font-bold text-emerald-600">مجاناً</span>
                  ) : (
                    <span className="text-xs font-bold text-foreground">{app.monthly_price} {app.currency}/شهر</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isInstalled && (app.integration_fields || []).length > 0 && (
                    <button
                      onClick={() => setSetupPanel({ open: true, installedApp: installed, app })}
                      className={`p-1.5 rounded-lg transition-all ${
                        needsSetup ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                      title="إعداد الربط"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  {!isInstalled ? (
                    <button
                      onClick={() => installMutation.mutate(app)}
                      disabled={installMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      تثبيت
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm(`هل تريد إلغاء تثبيت ${app.name}؟`)) {
                          uninstallMutation.mutate(installed.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-xs bg-secondary text-destructive hover:bg-destructive/10 transition-all border border-border"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد تطبيقات</p>
        </div>
      )}

      <AppSetupPanel
        open={setupPanel.open}
        onClose={() => setSetupPanel({ open: false, installedApp: null, app: null })}
        installedApp={setupPanel.installedApp}
        app={setupPanel.app}
      />
    </motion.div>
  );
}