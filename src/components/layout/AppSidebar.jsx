import { useState, useEffect, useRef, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
Home, Star, StarOff, Archive, Settings, Building2, Globe, LogOut, Store,
ChevronLeft, ChevronRight, LayoutDashboard, Package, CreditCard, Users,
Sliders, Bell, MessageSquare, Mail, Truck, Coins, CheckSquare, ToggleRight,
Palette, MapPin, UserCheck, HardDrive, Trash2, GripVertical, Eye, EyeOff,
Plus, Edit2, Save, RotateCcw, ExternalLink, ChevronDown, Monitor, Shield,
Briefcase, Target, Percent, Tag, ArrowRight, Check, Receipt } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { getIconByName } from "@/components/superadmin/IconPickerPopover";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from
"@/components/ui/context-menu";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useToast } from "@/components/ui/use-toast";

// ─── التبويبات ───
const TABS = [
{ id: "home", icon: Home, label: "الرئيسية" },
{ id: "favorites", icon: Star, label: "المفضلة" },
{ id: "archive", icon: Archive, label: "الأرشيف" },
{ id: "settings", icon: Settings, label: "الإعدادات" }];

// ✅ لا توجد قوائم ثابتة هنا — القائمة الجانبية تقرأ فقط من قاعدة البيانات عبر مصمم القائمة



export default function AppSidebar({ expanded, onToggle, onSwitchWorkspace }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceCtx = useWorkspace();
  
  // تحديد حالة الإدارة ديناميكياً بناءً على Workspace المختار
  const isAdmin = workspaceCtx?.selectedWorkspace?.workspace_number === 1 && workspaceCtx?.selectedWorkspace?.workspace_owner_type === 'super_admin';

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const wsDropdownRef = useRef(null);

  // إغلاق الـ dropdown عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target)) {
        setWsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [activeTab, setActiveTab] = useState("home");
  const [favorites, setFavorites] = useState([]);
  const [sidebarItems, setSidebarItems] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  // مكدّس لدعم مستويات غير محدودة: كل عنصر = { item, children }
  const [parentStack, setParentStack] = useState([]);
  const selectedParent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;
  const [sortedWorkspaces, setSortedWorkspaces] = useState([]);

  // ─── جلب بيانات المستخدم ───
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  // ─── Mutation لتعيين الافتراضية ───
  const setDefaultMutation = useMutation({
    mutationFn: (workspaceId) => base44.auth.updateMe({ default_workspace_id: workspaceId }),
    onSuccess: async () => {
      await refetchUser();
      toast({ title: "✓", description: "تم تعيين مساحة العمل الافتراضية" });
    },
    onError: () => {
      toast({ title: "❌", description: "فشل التحديث", variant: "destructive" });
    }
  });

  // ─── جلب البيانات ───
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.sidebar_favorites && Array.isArray(user.sidebar_favorites)) {
          setFavorites(user.sidebar_favorites);
        }
        // جلب ترتيب مساحات العمل المحفوظ
        if (user?.workspaces_order && Array.isArray(user.workspaces_order)) {
          setSortedWorkspaces(user.workspaces_order);
        }
      } catch {}
    };
    loadFavorites();
  }, []);

  const { data: sidebarConfig } = useQuery({
    queryKey: ["sidebarConfig"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ 
        settings_type: "sidebar_config" 
      });
      return settings?.[0];
    },
    staleTime: Infinity,
    gcTime: Infinity
  });

  // استخدام الـ context المشترك لمساحات العمل
  const workspaces = workspaceCtx?.workspaces || [];
  const workspace = workspaceCtx?.selectedWorkspace || null;

  const { data: brandSettings } = useQuery({
    queryKey: ["brandSettings"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "brand" });
      return settings?.[0];
    }
  });

  // جلب التطبيقات لعرض أيقوناتها
  const { data: allApps = [] } = useQuery({
    queryKey: ["apps-sidebar"],
    queryFn: () => base44.entities.App.list()
  });

  // جلب التطبيقات المثبتة بناءً على workspace_id
  const ownerId = workspace?.id || null;
  const { data: installedApps = [] } = useQuery({
    queryKey: ["installedApps-sidebar", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const apps = await base44.entities.InstalledApp.filter({ workspace_id: ownerId });
      return apps.filter((app) => !["suspended", "expired", "uninstalled"].includes(app.status));
    },
    enabled: !!ownerId,
    staleTime: 0,
    gcTime: 0
  });

  const installedAppIds = new Set(installedApps.map((ia) => ia.app_id));

  const getAppIconUrl = (item) => {
    if (item.type !== "app") return null;
    const appId = item.appId || item.path;
    const app = allApps.find((a) => a.id === appId);
    return app?.icon_url || null;
  };

  // ─── استخراج عناصر القائمة (من قاعدة البيانات فقط عبر مصمم القائمة) ───
  useEffect(() => {
    if (sidebarConfig?.sidebar_items_json) {
      try {
        const parsed = JSON.parse(sidebarConfig.sidebar_items_json);
        const isAdminWs = workspace?.workspace_number === 1;
        const section = isAdmin && isAdminWs ? "super_admin" : "client";
        const items = {};
        for (const tab of TABS) {
          const tabItems = parsed[section]?.[tab.id] || [];
          items[tab.id] = tabItems.map((item) => {
            if (item.type === "app") {
              const appId = item.appId || item.path;
              if (!installedAppIds.has(appId)) return null;
              const app = allApps.find((a) => a.id === appId);
              const resolvedPath = app?.route || item.path || "#";
              return {
                ...item,
                icon: item.icon || "Package",
                iconUrl: app?.icon_url || null,
                path: resolvedPath,
                children: (item.children || []).map((c) => {
                  const childApp = c.type === "app" ? allApps.find((a) => a.id === (c.appId || c.path)) : null;
                  if (c.type === "app" && !installedAppIds.has(c.appId || c.path)) return null;
                  return { ...c, icon: c.icon || "Package", iconUrl: childApp?.icon_url || null, path: childApp?.route || c.path };
                }).filter(Boolean)
              };
            }
            return {
              ...item,
              icon: item.icon || "Package",
              iconUrl: null,
              children: (item.children || []).map((c) => {
                if (c.type === "app") {
                  const appId = c.appId || c.path;
                  if (!installedAppIds.has(appId)) return null;
                  const childApp = allApps.find((a) => a.id === appId);
                  return { ...c, icon: c.icon || "Package", iconUrl: childApp?.icon_url || null, path: childApp?.route || c.path };
                }
                return { ...c, icon: c.icon || "Package", iconUrl: null };
              }).filter(Boolean)
            };
          }).filter(Boolean);
        }
        setSidebarItems(items);
      } catch {}
    } else {
      // ✅ لا يوجد config محفوظ → قائمة فارغة (المستخدم يجب أن يضبط القائمة من مصمم القائمة)
      setSidebarItems({ home: [], favorites: [], archive: [], settings: [] });
    }
    setParentStack([]);
  }, [sidebarConfig, isAdmin, installedAppIds.size, workspace?.id, workspace?.workspace_number, workspace?.workspace_owner_type]);

  // ─── إدارة المفضلة ───
  const addToFavorites = async (item) => {
    if (favorites.some((f) => f.url === item.url)) {
      toast({ title: "العنصر موجود مسبقاً في المفضلة" });
      return;
    }
    const newFav = {
      title: item.label,
      url: item.path,
      icon: item.icon || "Star",
      system: "sidebar"
    };
    const newFavorites = [...favorites, newFav];
    setFavorites(newFavorites);
    try {
      await base44.auth.updateMe({ sidebar_favorites: newFavorites });
      toast({ title: "✓ تمت الإضافة للمفضلة" });
    } catch {}
  };

  const removeFromFavorites = async (url) => {
    const newFavorites = favorites.filter((f) => f.url !== url);
    setFavorites(newFavorites);
    try {
      await base44.auth.updateMe({ sidebar_favorites: newFavorites });
      toast({ title: "✓ تمت الإزالة من المفضلة" });
    } catch {}
  };

  const isInFavorites = (url) => favorites.some((f) => f.url === url);

  const isNavActive = (path) => {
    if (!path || path === "#") return false;
    // المسار "/" يطابق فقط الصفحة الرئيسية تماماً
    if (path === "/") return location.pathname === "/";
    // مطابقة تامة فقط — لا نستخدم startsWith لتجنب تلوين المسار الأب عند زيارة الأبناء
    return location.pathname === path;
  };

  const handleFavoritesDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(favorites);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFavorites(items);
    try {
      await base44.auth.updateMe({ sidebar_favorites: items });
    } catch {}
  };

  const handleWorkspacesDragEnd = async (result) => {
    if (!result.destination) return;
    const currentList = displayWorkspaces || [];
    const items = Array.from(currentList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const orderIds = items.map((w) => w.id);
    setSortedWorkspaces(orderIds);
    try {
      await base44.auth.updateMe({ workspaces_order: orderIds });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "تم حفظ الترتيب", description: "تم حفظ ترتيب مساحات العمل بنجاح" });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل حفظ الترتيب", variant: "destructive" });
    }
  };

  // استخدام الترتيب المحفوظ أو الترتيب الافتراضي (تصاعدي حسب workspace_number)
  const displayWorkspaces = sortedWorkspaces.length > 0 ?
  workspaces.sort((a, b) => {
    const aIdx = sortedWorkspaces.indexOf(a.id);
    const bIdx = sortedWorkspaces.indexOf(b.id);
    return (aIdx === -1 ? workspaces.length : aIdx) - (bIdx === -1 ? workspaces.length : bIdx);
  }) :
  workspaces.sort((a, b) => (a.workspace_number ?? 999) - (b.workspace_number ?? 999));

  // ─── هل العنصر "فارغ فعلياً" بغض النظر عن hide_if_empty ───
  const isEffectivelyEmpty = (item) => {
    // تطبيق غير مثبت → فارغ دائماً
    if (item.type === "app") {
      const appId = item.appId || item.path;
      return !installedAppIds.has(appId);
    }
    // عنصر داخلي/خارجي بدون أطفال مرئية → ليس فارغاً (له صفحة خاصة)
    const children = (item.children || []).filter((c) => c.visible !== false);
    if (children.length === 0) return false;
    // له أطفال: فارغ فقط إذا كل أطفاله فارغة
    return children.every((c) => isEffectivelyEmpty(c));
  };

  // دالة تكرارية: هل العنصر يجب إخفاؤه بسبب hide_if_empty؟
  // المنطق: عنصر فارغ إذا:
  // 1. تطبيق غير مثبت
  // 2. عنصر داخلي/خارجي بدون عناصر فرعية مرئية **بدون السويتش**
  const isEmptyForHide = (item) => {
    // تطبيق غير مثبت → فارغ
    if (item.type === "app") {
      const appId = item.appId || item.path;
      return !installedAppIds.has(appId);
    }

    // عنصر داخلي أو خارجي: تحقق من الأطفال المرئية الفعلية (بدون السويتش)
    const children = item.children || [];
    if (children.length === 0) return true; // لا أطفال نهائياً → فارغ

    // الأطفال المرئية = يجب أن تكون visible=true و (تطبيق مثبت أو عنصر داخلي/خارجي)
    const visibleChildren = children.filter((c) => {
      if (c.visible === false) return false;
      if (c.type === "app") {
        const appId = c.appId || c.path;
        return installedAppIds.has(appId);
      }
      return true;
    });

    if (visibleChildren.length === 0) return true; // لا أطفال مرئية → فارغ

    // الآن تحقق من كل طفل مرئي:
    // - إذا كان له السويتش مفعل (hide_if_empty=true) → فارغ إذا كان هو نفسه فارغ
    // - إذا لم يكن له السويتش (hide_if_empty=false) → ليس فارغ (يظهر دائماً)
    return visibleChildren.every((c) => {
      // عناصر بدون السويتش → ليست فارغة
      if (!c.hide_if_empty) return false;
      // عناصر مع السويتش → فارغة إذا كانت بنفسها فارغة تكرارياً
      return isEmptyForHide(c);
    });
  };

  const shouldShowItem = (item) => {
    if (item.visible === false) return false;
    // تطبيق غير مثبت → يُخفى دائماً
    if (item.type === "app") {
      const appId = item.appId || item.path;
      if (!installedAppIds.has(appId)) return false;
    }
    // حساب ما إذا كان العنصر فارغاً وإخفاؤه إذا كان hide_if_empty = true
    if (item.hide_if_empty) {
      if (isEmptyForHide(item)) return false;
    }
    return true;
  };

  const currentItems = sidebarItems[activeTab] || [];

  // ─── مكون Item ───
  const NavItem = ({ item }) => {
    const Icon = getIconByName(item.icon);
    const visibleChildren = (item.children || []).filter((c) => shouldShowItem(c));

    // فصل التطبيقات المدمجة عن العناصر الأخرى
    const nonEmbeddedChildren = visibleChildren.filter((c) => !(c.type === "app" && c.appType === "embedded"));
    const embeddedAppChildren = visibleChildren.filter((c) => c.type === "app" && c.appType === "embedded");

    // أي عنصر له أطفال مرئيون (غير مدمجة) يُعامَل كمجلد
    const hasNonEmbeddedChildren = nonEmbeddedChildren.length > 0;
    // إذا كان له فقط تطبيقات مدمجة → يُعامَل كرابط مباشر
    const hasOnlyEmbeddedApps = embeddedAppChildren.length > 0 && !hasNonEmbeddedChildren;

    if (hasNonEmbeddedChildren || hasOnlyEmbeddedApps) {
      const isActive = parentStack.some((p) => p.id === item.id);

      // إذا كان العنصر يحتوي على تطبيقات مدمجة فقط → فتح صفحة بدلاً من عرض الأطفال في القائمة
      if (hasOnlyEmbeddedApps) {
        const navPath = item.path || "#";
        return (
          <Link
            key={item.id}
            to={navPath}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all h-10",
              expanded && "justify-start",
              !expanded && "justify-center",
              isNavActive(navPath) ?
              "bg-primary/10 text-primary font-semibold border-r-2 border-primary" :
              "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
            title={!expanded ? item.label : ""}>
            {item.type === "app" && item.iconUrl ?
            <img src={item.iconUrl} alt={item.label} className="w-5 h-5 rounded object-contain flex-shrink-0" /> :

            <Icon size={18} className="flex-shrink-0" strokeWidth={isNavActive(navPath) ? 2.5 : 1.5} />
            }
            {expanded && <span className="text-sm flex-1">{item.label}</span>}
          </Link>);

      }

      return (
        <button
          key={item.id}
          onClick={() => setParentStack((prev) => [...prev, item])}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all h-10",
            isActive ?
            "bg-primary/10 text-primary font-semibold border-r-2 border-primary" :
            "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}>
          <div className="flex items-center gap-3 flex-1">
            <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
            {expanded && <span className="text-sm">{item.label}</span>}
          </div>
          <ChevronLeft size={16} className="text-muted-foreground flex-shrink-0" />
        </button>);
    }

    const navPath = item.path || "#";
    const isActive = item.path ? isNavActive(item.path) : false;

    return (
      <Link
        key={item.id}
        to={navPath}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all h-10",
          expanded && "justify-start",
          !expanded && "justify-center",
          isActive ?
          "bg-primary/10 text-primary font-semibold border-r-2 border-primary" :
          "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        )}
        title={!expanded ? item.label : ""}>
        {item.type === "app" && item.iconUrl ?
        <img src={item.iconUrl} alt={item.label} className="w-5 h-5 rounded object-contain flex-shrink-0" /> :

        <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
        }
        {expanded && <span className="text-sm flex-1">{item.label}</span>}
      </Link>);
  };

  return (
    <aside
      className="fixed top-0 right-0 h-screen bg-white border-l border-border flex flex-col z-40 transition-all duration-300 flex-shrink-0 overflow-visible"
      style={{ width: expanded ? 270 : 72 }}
      dir="rtl">
      
      {/* ─── Header ─── */}
      <div className="h-14 flex items-center gap-2 px-3 flex-shrink-0 border-b border-border relative" style={{ zIndex: 9999 }} ref={wsDropdownRef}>
        {/* Toggle Button - فوق الخط الفاصل */}
        <button
          onClick={onToggle}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-border rounded-md flex items-center justify-center hover:bg-primary/5 hover:border-primary transition-all shadow-sm z-50"
          title={expanded ? "طي" : "توسيع"}>
          {expanded ? <ChevronRight size={14} className="text-foreground" /> : <ChevronLeft size={14} className="text-foreground" />}
        </button>
        
        <button
           onClick={() => setWsDropdownOpen((v) => !v)}
           className={`flex gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity pt-2 items-center`}
           style={{ flexDirection: 'row-reverse' }}>

           <div className="flex-shrink-0 ml-auto">
             {expanded ? (
               <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", wsDropdownOpen && "rotate-180")} />
             ) : (
               <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", wsDropdownOpen && "rotate-180")} />
             )}
           </div>

           <div className={`flex gap-2 flex-1 min-w-0 ${expanded ? 'items-center justify-start' : 'flex-col items-center justify-center'}`}>
             <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
             {workspace?.logo_url ?
              <img src={workspace.logo_url} alt="" className="w-full h-full object-cover" /> :
              isAdmin ?
              <Globe size={16} className="text-white" /> :
              <Building2 size={16} className="text-white" />
              }
             </div>
             {expanded ?
            <div className="flex-1 min-w-0 text-right">
             <p className="text-xs font-bold truncate leading-tight">
              {workspace?.name || (isAdmin ? brandSettings?.brand_name || "الإدارة" : "مساحة العمل")}
              </p>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
             {isAdmin ? "مساحة عمل السوبر أدمن" : "مساحة العمل"}
             {workspace?.workspace_number && <span className="text-primary font-bold">#{workspace.workspace_number}</span>}
             </p>
             </div> :

            <span className="text-[7px] font-bold text-muted-foreground -mt-2">
             #{workspace?.workspace_number || '1'}
             </span>
            }
           </div>
        </button>

        {/* Workspace Dropdown - للجميع */}
        {wsDropdownOpen &&
        <div
          className="absolute top-full right-0 z-50 bg-white border border-border shadow-xl overflow-hidden"
          style={{ width: expanded ? "100%" : 260, left: expanded ? 0 : "auto", borderRadius: "0 0 0.75rem 0.75rem" }}>
          
            {/* عنوان القائمة */}
            <div className="px-3 py-2 bg-secondary/40 border-b border-border">
              <p className="text-[11px] font-bold text-muted-foreground">مساحات العمل</p>
            </div>

            {displayWorkspaces.length > 0 ?
          <DragDropContext onDragEnd={handleWorkspacesDragEnd}>
                <Droppable droppableId="workspaces-list">
                  {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="max-h-64 overflow-y-auto py-1">
                      {displayWorkspaces.map((ws, idx) =>
                <Draggable key={ws.id} draggableId={ws.id} index={idx}>
                          {(dprovided, dsnapshot) =>
                  <div
                    ref={dprovided.innerRef}
                    {...dprovided.draggableProps}
                    className={cn("transition-colors", dsnapshot.isDragging && "bg-primary/10 shadow-md rounded-lg mx-1")}>
                    
                              <button
                              onClick={() => {onSwitchWorkspace(ws.id); setWsDropdownOpen(false);}}
                              className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-right",
                              workspace?.id === ws.id && "bg-primary/5"
                              )}>
                      
                                <div {...dprovided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
                                  <GripVertical size={12} />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
                                  {ws.logo_url ?
                        <img src={ws.logo_url} alt="" className="w-full h-full object-cover rounded-lg" /> :
                        <Building2 size={14} className="text-primary" />
                        }
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="text-xs font-medium text-foreground truncate">{ws.name}</p>
                                  {ws.workspace_number &&
                                  <p className="text-[9px] text-muted-foreground">#{ws.workspace_number}</p>
                        }
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                          type="button"
                          onClick={(e) => {e.stopPropagation();setDefaultMutation.mutate(ws.id);}}
                          title={user?.default_workspace_id === ws.id ? "إزالة من المفضلة" : "تعيين كـ افتراضية"}>
                          
                                    {user?.default_workspace_id === ws.id ?
                          <Star size={13} className="text-amber-400 fill-amber-400" /> :

                          <Star size={13} className="text-muted-foreground/40 hover:text-amber-400" />
                          }
                                  </button>
                                  {workspace?.id === ws.id && <Check size={13} className="text-primary" />}
                                </div>
                              </button>
                            </div>
                  }
                        </Draggable>
                )}
                      {provided.placeholder}
                    </div>
              }
                </Droppable>
              </DragDropContext> :

          <p className="text-xs text-muted-foreground text-center py-6">لا توجد مساحات عمل</p>
          }

            <div className="border-t border-border">
              <Link
              to="/workspaces"
              onClick={() => setWsDropdownOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
              
                <Building2 size={14} />
                إدارة مساحات العمل
              </Link>
            </div>
          </div>
        }
      </div>



      {/* ─── Tabs ─── */}
      <div className="px-3 pt-3 pb-1">
        {expanded ?
        <div className="bg-secondary/70 rounded-xl p-1 flex gap-1">
            {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {setActiveTab(tab.id);setParentStack([]);}}
                className={cn(
                  "flex-1 h-10 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-tabsActive shadow-sm" : "hover:bg-white/60"
                )}>
                
                  <Icon size={16} className={isActive ? "text-white" : "text-tabsInactive"} />
                </button>);

          })}
          </div> :

        <div className="bg-secondary/70 rounded-xl p-1 flex flex-col gap-1">
            {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {setActiveTab(tab.id);setParentStack([]);}}
                className={cn(
                  "w-full h-10 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-tabsActive shadow-sm" : "hover:bg-white/60"
                )}>
                
                  <Icon size={16} className={isActive ? "text-white" : "text-tabsInactive"} />
                </button>);

          })}
          </div>
        }
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
        {selectedParent && activeTab !== "favorites" ?
        <div>
            {/* breadcrumb أفقي — صف واحد مع scroll */}
            <div className="overflow-x-auto scrollbar-hide mb-2 px-1">
              <div className="flex items-center gap-1 whitespace-nowrap">
              <button
                onClick={() => setParentStack([])}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-accent text-muted-foreground hover:text-foreground text-xs transition-colors flex-shrink-0">
                
                <ChevronRight size={12} />
                {expanded && <span>الرئيسية</span>}
              </button>
              {parentStack.map((p, idx) => idx < parentStack.length - 1 &&
              <div key={p.id} className="flex items-center gap-1 flex-shrink-0">
                  <ChevronLeft size={11} className="text-muted-foreground/50" />
                  <button
                  onClick={() => setParentStack((prev) => prev.slice(0, idx + 1))}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground text-xs transition-colors">
                  
                    {expanded && <span className="truncate max-w-[70px]">{p.label}</span>}
                  </button>
                </div>
              )}
              {parentStack.length > 0 && <ChevronLeft size={11} className="text-muted-foreground/50 flex-shrink-0" />}
              <div className="px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                {expanded && <span className="truncate max-w-[80px]">{selectedParent.label}</span>}
              </div>
              </div>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="space-y-0.5">
              {(selectedParent.children || []).filter(shouldShowItem).filter((child) => !(child.type === "app" && child.appType === "embedded")).map((child) => {
              const isFav = isInFavorites(child.path);
              return (
                <ContextMenu key={child.id}>
                  <ContextMenuTrigger asChild>
                    <div className="group">
                      <NavItem item={child} />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {isFav ?
                    <ContextMenuItem onClick={() => removeFromFavorites(child.path)} className="gap-2 text-red-600">
                        <Star className="w-4 h-4 fill-current" />
                        إزالة من المفضلة
                      </ContextMenuItem> :
                    <ContextMenuItem onClick={() => addToFavorites({ label: child.label, path: child.path, icon: child.icon })} className="gap-2">
                        <Star className="w-4 h-4" />
                        إضافة للمفضلة
                      </ContextMenuItem>
                    }
                  </ContextMenuContent>
                </ContextMenu>);
            })}
            </div>
          </div> :

        <>
            {activeTab === "favorites" ?
          favorites.length === 0 ?
          expanded && <div className="text-xs text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
            <Star size={20} className="text-gray-300" />
            <p>لا توجد عناصر مفضلة</p>
            <p className="text-[10px] text-gray-400">انقر بزر الفأرة الأيمن على أي صفحة لإضافتها</p>
          </div> :

          <DragDropContext onDragEnd={handleFavoritesDragEnd}>
            <Droppable droppableId="favorites-list">
              {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                  {favorites.map((fav, idx) => {
                  const Icon = getIconByName(fav.icon);
                  return (
                    <Draggable key={fav.url} draggableId={fav.url} index={idx}>
                        {(dprovided, dsnapshot) =>
                      <div ref={dprovided.innerRef} {...dprovided.draggableProps}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        removeFromFavorites(fav.url);
                      }}
                      className={cn("group rounded-lg transition-all flex items-center", dsnapshot.isDragging && "shadow-lg bg-white")}>
                            {expanded && <div {...dprovided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 flex-shrink-0">
                              <GripVertical size={14} />
                            </div>}
                            <Link to={fav.url} className="flex-1">
                              <div className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg h-10",
                            isNavActive(fav.url) ?
                            "bg-primary/10 text-primary font-semibold border-r-2 border-primary" :
                            "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          )}>
                                <Icon size={16} className="flex-shrink-0" />
                                {expanded && <span className="text-sm flex-1">{fav.title}</span>}
                              </div>
                            </Link>
                            {expanded && <button
                          onClick={() => removeFromFavorites(fav.url)}
                          className="p-1 hover:bg-red-50 rounded text-red-600 flex-shrink-0">
                              <Trash2 size={14} />
                            </button>}
                          </div>
                      }
                      </Draggable>);

                })}
                  {provided.placeholder}
                </div>
              }
            </Droppable>
          </DragDropContext> :


          currentItems.filter(shouldShowItem).length === 0 ?
          expanded && <div className="text-xs text-muted-foreground text-center py-8">لا توجد عناصر</div> :

          currentItems.filter(shouldShowItem).map((item) => {
            // عرض الفاصل كخط بسيط
            if (item.type === "separator") {
               const topMargin = item.separatorMargin || 4;
               const bottomMargin = item.separatorMargin || 4;
               return (
                 <div key={item.id} className="h-px bg-border" style={{ marginTop: `${topMargin}px`, marginBottom: `${bottomMargin}px` }} />
              );
            }

            const isFav = isInFavorites(item.path);
            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <NavItem item={item} />
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {isFav ?
                  <ContextMenuItem onClick={() => removeFromFavorites(item.path)} className="gap-2 text-red-600">
                      <Star className="w-4 h-4 fill-current" />
                      إزالة من المفضلة
                    </ContextMenuItem> :

                  <ContextMenuItem onClick={() => addToFavorites({ label: item.label, path: item.path, icon: item.icon })} className="gap-2">
                      <Star className="w-4 h-4" />
                      إضافة للمفضلة
                    </ContextMenuItem>
                  }
                </ContextMenuContent>
              </ContextMenu>);

          })
          }
          </>
        }
      </nav>

      {/* ─── Bottom Bar ─── */}
      <div className="flex-shrink-0 border-t border-border px-3 py-3">
        {expanded ?
        <div className="flex items-center gap-2">
            <Link to="/app-store" className="flex-1">
              <div className="bg-[#eae9fc] rounded-xl h-10 hover:bg-primary/20 flex items-center justify-center gap-2 transition-colors">
                <Store size={16} className="text-primary" />
                <span className="text-xs font-semibold text-primary">متجر التطبيقات</span>
              </div>
            </Link>
            <button className="bg-[#eae9fc] text-accent-foreground rounded-lg w-10 h-10 hover:opacity-80 transition-opacity flex-shrink-0 flex items-center justify-center">
              <span className="text-xs font-bold">؟</span>
            </button>
          </div> :

        <div className="flex flex-col gap-2">
            <Link to="/app-store" className="w-full">
              <div className="bg-[#eae9fc] rounded-xl w-full h-10 hover:bg-primary/20 flex items-center justify-center">
                <Store size={16} className="text-primary" />
              </div>
            </Link>
            <button className="bg-[#eae9fc] text-muted-foreground rounded-lg w-full h-10 hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center">
              <span className="text-xs font-bold">؟</span>
            </button>
          </div>
        }
      </div>
    </aside>);

}