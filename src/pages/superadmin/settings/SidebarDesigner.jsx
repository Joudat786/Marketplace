import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useLocation } from "react-router-dom";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, Edit2, Save, RotateCcw,
  ExternalLink, ChevronRight, ChevronDown, Monitor, Users, Shield,
  Home, Archive, Settings, Package, Search, X, BarChart3, FileText, Copy, Minus, Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconPickerPopover, { getIconByName } from "@/components/superadmin/IconPickerPopover";
import SystemRoutesPanel from "@/components/superadmin/SystemRoutesPanel";
import BulkImportModal from "@/components/superadmin/BulkImportModal";
import CopySidebarModal from "@/components/superadmin/CopySidebarModal";
import AppsDesignerTab from "@/components/superadmin/sidebar-designer/AppsDesignerTab";
import SlidePanel from "@/components/superadmin/SlidePanel";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";


// ─── الإعدادات الافتراضية ───
const defaultSuperAdmin = {
  home: [
    { id: "sa-dashboard", label: "لوحة التحكم", icon: "Monitor", visible: true, type: "internal", path: "/", children: [] },
    { id: "sa-clients", label: "العملاء", icon: "Users", visible: true, type: "internal", path: "/clients/support", children: [
      { id: "sa-clients-list", label: "قائمة العملاء", icon: "Users", visible: true, type: "internal", path: "/platform-clients" },
      { id: "sa-clients-support", label: "تذاكر الدعم", icon: "MessageSquare", visible: true, type: "internal", path: "/clients/support" },
    ]},
    { id: "sa-partners", label: "الشركاء", icon: "Briefcase", visible: true, type: "internal", path: "/partners", children: [
      { id: "sa-partners-list", label: "قائمة الشركاء", icon: "Briefcase", visible: true, type: "internal", path: "/partners" },
      { id: "sa-partners-support", label: "تذاكر الدعم", icon: "MessageSquare", visible: true, type: "internal", path: "/partners/support" },
    ]},
    { id: "sa-marketing", label: "التسويق", icon: "Target", visible: true, type: "internal", path: "/marketing", children: [
      { id: "sa-marketing-main", label: "التسويق", icon: "Target", visible: true, type: "internal", path: "/marketing" },
      { id: "sa-coupons", label: "قسائم التخفيض", icon: "Percent", visible: true, type: "internal", path: "/marketing/coupons" },
      { id: "sa-offers", label: "العروض", icon: "Tag", visible: true, type: "internal", path: "/marketing/offers" },
    ]},
    { id: "sa-apps", label: "مدير التطبيقات", icon: "Package", visible: true, type: "internal", path: "/app-manager", children: [] },
    { id: "sa-platform-clients", label: "عملاء المنصة", icon: "Users", visible: true, type: "internal", path: "/platform-clients", children: [] },
    { id: "sa-client-subscriptions", label: "اشتراكات العملاء", icon: "CreditCard", visible: true, type: "internal", path: "/client-subscriptions", children: [] },

  ],
  archive: [],
  settings: [
    { id: "sa-settings-general", label: "الإعدادات العامة", icon: "Settings", visible: true, type: "internal", path: "/settings/general", hide_if_empty: false, children: [] },
    { id: "sa-settings-notifications", label: "إعدادات الإشعارات", icon: "Bell", visible: true, type: "internal", path: "/settings/notifications", hide_if_empty: false, children: [] },
    { id: "sa-settings-tabby", label: "إعدادات Tabby", icon: "CreditCard", visible: true, type: "internal", path: "/settings/tabby", hide_if_empty: false, children: [] },
    { id: "sa-settings-tamara", label: "إعدادات Tamara", icon: "CreditCard", visible: true, type: "internal", path: "/settings/tamara", hide_if_empty: false, children: [] },
    { id: "sa-settings-subscription-mode", label: "نمط الاشتراك", icon: "ToggleRight", visible: true, type: "internal", path: "/settings/subscription-mode", hide_if_empty: false, children: [] },
    { id: "sa-settings-messaging", label: "إعدادات المراسلة", icon: "MessageSquare", visible: true, type: "internal", path: "/settings/messaging", hide_if_empty: false, children: [] },
    { id: "sa-settings-sms", label: "إعدادات الرسائل", icon: "MessageSquare", visible: true, type: "internal", path: "/settings/sms", hide_if_empty: false, children: [] },
    { id: "sa-settings-oursms", label: "إعدادات OurSMS", icon: "MessageSquare", visible: true, type: "internal", path: "/settings/oursms", hide_if_empty: false, children: [] },
    { id: "sa-settings-email", label: "إعدادات البريد", icon: "Mail", visible: true, type: "internal", path: "/settings/email", hide_if_empty: false, children: [] },
    { id: "sa-settings-payment", label: "إعدادات الدفع", icon: "CreditCard", visible: true, type: "internal", path: "/settings/payment", hide_if_empty: false, children: [] },
    { id: "sa-settings-shipping", label: "إعدادات الشحن", icon: "Truck", visible: true, type: "internal", path: "/settings/shipping", hide_if_empty: false, children: [] },
    { id: "sa-settings-languages", label: "إعدادات اللغات", icon: "Globe", visible: true, type: "internal", path: "/settings/languages", hide_if_empty: false, children: [] },
    { id: "sa-settings-currencies", label: "إعدادات العملات", icon: "DollarSign", visible: true, type: "internal", path: "/settings/currencies", hide_if_empty: false, children: [] },
    { id: "sa-settings-locations", label: "إعدادات المواقع", icon: "MapPin", visible: true, type: "internal", path: "/settings/locations", hide_if_empty: false, children: [] },
    { id: "sa-settings-required-fields", label: "الحقول المطلوبة", icon: "CheckSquare", visible: true, type: "internal", path: "/settings/required-fields", hide_if_empty: false, children: [] },
    { id: "sa-settings-form-designer", label: "مصمم النماذج", icon: "FileText", visible: true, type: "internal", path: "/settings/form-designer", hide_if_empty: false, children: [] },
    { id: "sa-settings-sidebar", label: "مصمم القائمة", icon: "Sliders", visible: true, type: "internal", path: "/settings/sidebar-designer", hide_if_empty: false, children: [] },
    { id: "sa-settings-users", label: "المستخدمين والصلاحيات", icon: "UserCheck", visible: true, type: "internal", path: "/settings/users", hide_if_empty: false, children: [] },
    { id: "sa-settings-backup", label: "النسخ الاحتياطي", icon: "HardDrive", visible: true, type: "internal", path: "/settings/backup", hide_if_empty: false, children: [] },
    { id: "sa-app-categories", label: "تصنيفات التطبيقات", icon: "Package", visible: true, type: "internal", path: "/app-categories", hide_if_empty: false, children: [] },
    { id: "sa-plan-features", label: "مميزات الباقات", icon: "Star", visible: true, type: "internal", path: "/plan-features", hide_if_empty: false, children: [] },
    { id: "sa-app-designer", label: "مصمم التطبيقات", icon: "Layers", visible: true, type: "internal", path: "/app-designer", hide_if_empty: false, children: [] },
  ],
};

const defaultClient = {
  home: [
    { id: "cl-dashboard", label: "نظرة عامة", icon: "Monitor", visible: true, type: "internal", path: "/", children: [] },
    { id: "cl-workspaces", label: "مساحات العمل", icon: "Building2", visible: true, type: "internal", path: "/workspaces", children: [] },
    { id: "cl-appstore", label: "متجر التطبيقات", icon: "ShoppingCart", visible: true, type: "internal", path: "/app-store", children: [] },
    { id: "cl-subscriptions", label: "اشتراكاتي", icon: "CreditCard", visible: true, type: "internal", path: "/subscriptions", children: [] },
  ],
  archive: [],
  settings: [],
};

const defaultPartner = {
  home: [
    { id: "pt-dashboard", label: "لوحة الشريك", icon: "Monitor", visible: true, type: "internal", path: "/partner", children: [] },
    { id: "pt-clients", label: "العملاء", icon: "Users", visible: true, type: "internal", path: "/partner/clients", children: [] },
    { id: "pt-reports", label: "التقارير", icon: "BarChart2", visible: true, type: "internal", path: "/partner/reports", children: [] },
  ],
  archive: [],
  settings: [],
};

const PANELS = [
  { id: "super_admin", label: "مساحة عمل السوبر أدمن", icon: Shield, default: defaultSuperAdmin },
  { id: "partner", label: "مساحة عمل الشركاء", icon: Monitor, default: defaultPartner },
  { id: "client", label: "مساحة عمل العملاء", icon: Users, default: defaultClient },
];

const TABS = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "archive", label: "الأرشيف", icon: Archive },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

export default function SidebarDesigner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setToolbarActions } = useOutletContext() || {};
  const { selectedWorkspace } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  // قراءة اللوحة والتبويب من URL params (عند الانتقال من روابط النظام)
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [activePanel, setActivePanel] = useState(() => {
    const p = urlParams.get("panel");
    return p && ["super_admin", "client", "partner"].includes(p) ? p : "super_admin";
  });
  const [activeTab, setActiveTab] = useState(() => {
    const t = urlParams.get("tab");
    return t && ["home", "archive", "settings"].includes(t) ? t : "home";
  });

  // مزامنة اللوحة والتبويب عند تغيّر URL params (مثلاً عند النقر من روابط النظام)
  useEffect(() => {
    const p = urlParams.get("panel");
    const t = urlParams.get("tab");
    if (p && ["super_admin", "client", "partner"].includes(p)) setActivePanel(p);
    if (t && ["home", "archive", "settings"].includes(t)) setActiveTab(t);
  }, [urlParams]);
  const [items, setItems] = useState({
    super_admin: defaultSuperAdmin,
    client: defaultClient,
    partner: defaultPartner,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [parentDisplayMode, setParentDisplayMode] = useState("sidebar");
  const [showAppReport, setShowAppReport] = useState(false);
  const [reportFilter, setReportFilter] = useState("all"); // all, used, unused
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  const [highlightedItemLabel, setHighlightedItemLabel] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDraggingActive, setIsDraggingActive] = useState(false);

  const { data: savedConfig } = useQuery({
    queryKey: ["sidebarDesignerConfig"],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ 
        settings_type: "sidebar_config" 
      });
      return settings && settings.length > 0 ? settings[0] : null;
    },
    staleTime: Infinity,
    gcTime: Infinity
  });

  // جلب التطبيقات - التطبيقات عامة للمنصة وليس لها workspace_id
  const { data: apps = [] } = useQuery({
    queryKey: ["apps-for-sidebar"],
    queryFn: () => base44.entities.App.list(),
  });

  const getAppIconUrl = (item) => {
    if (item.type !== "app") return null;
    const appId = item.appId || item.path;
    const app = apps.find(a => a.id === appId);
    return app?.icon_url || null;
  };

  const cleanNodeLoad = (item) => ({
    ...item,
    icon: item.icon || "Package",
    iconUrl: null,
    children: (item.children || []).map(cleanNodeLoad)
  });

  const autoSaveDoneRef = useRef(false);

  useEffect(() => {
    if (savedConfig?.sidebar_items_json) {
      // تحميل الإعدادات المحفوظة
      try {
        const parsed = JSON.parse(savedConfig.sidebar_items_json);
        const upgraded = {};
        for (const panel of PANELS) {
          const panelData = parsed[panel.id];
          if (Array.isArray(panelData)) {
            upgraded[panel.id] = { home: panelData.map(cleanNodeLoad), archive: [], settings: [] };
          } else if (panelData && typeof panelData === "object") {
            upgraded[panel.id] = {
              home: (panelData.home || panel.default.home).map(cleanNodeLoad),
              archive: (panelData.archive || []).map(cleanNodeLoad),
              settings: (panelData.settings || panel.default.settings).map(cleanNodeLoad),
            };
          } else {
            upgraded[panel.id] = panel.default;
          }
        }
        setItems(upgraded);
      } catch {}
    } else if (!autoSaveDoneRef.current && savedConfig !== undefined) {
      // ✅ لا يوجد config محفوظ → احفظ الإعدادات الافتراضية تلقائياً في قاعدة البيانات
      autoSaveDoneRef.current = true;
      const defaultData = {};
      for (const panel of PANELS) {
        defaultData[panel.id] = panel.default;
      }
      saveMutation.mutate(defaultData);
      toast({ title: "تهيئة تلقائية", description: "تم حفظ إعدادات القائمة الافتراضية في قاعدة البيانات" });
    }
  }, [savedConfig, selectedWorkspace?.id]);

  const cleanNode = (item) => ({
    ...item,
    icon: item.icon || "Package",
    iconUrl: null,
    children: (item.children || []).map(cleanNode)
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = {};
      for (const panel in data) {
        cleanData[panel] = {};
        for (const tab in data[panel]) {
          cleanData[panel][tab] = (data[panel][tab] || []).map(cleanNode);
        }
      }
      const existing = await base44.entities.GeneralSettings.filter({ 
        settings_type: "sidebar_config" 
      });
      const payload = {
        brand_name: "sidebar_config",
        settings_type: "sidebar_config",
        sidebar_items_json: JSON.stringify(cleanData)
      };
      if (existing && existing.length > 0) {
        return await base44.entities.GeneralSettings.update(existing[0].id, payload);
      } else {
        return await base44.entities.GeneralSettings.create(payload);
      }
    },
    onSuccess: () => {
      toast({ title: "نجح", description: "تم حفظ إعدادات القائمة الجانبية بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["sidebarDesignerConfig", selectedWorkspace?.id] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (setToolbarActions) {
      setToolbarActions({ 
        reports: { onClick: () => setShowAppReport(true) },
        add: { onClick: () => setShowAddForm(true) } 
      });
    }
  }, [setToolbarActions]);

  const getDefaultTab = (panel, tab) => {
    const panelData = items[panel];
    if (!panelData || !Array.isArray(panelData[tab])) {
      return PANELS.find(p => p.id === panel)?.default[tab] || [];
    }
    return panelData[tab];
  };

  const currentItems = Array.isArray(items[activePanel]?.[activeTab]) ? items[activePanel][activeTab] : getDefaultTab(activePanel, activeTab);
  const mainDropId = `sidebar-items-${activePanel}-${activeTab}`;

  const setCurrentItems = (newItems) => {
    setItems(prev => {
      const panelDefault = PANELS.find(p => p.id === activePanel)?.default || {};
      const currentPanelData = prev[activePanel] || panelDefault;
      const updatedPanelData = {
        home: activeTab === 'home' ? (Array.isArray(newItems) ? newItems : []) : (currentPanelData.home || []),
        archive: activeTab === 'archive' ? (Array.isArray(newItems) ? newItems : []) : (currentPanelData.archive || []),
        settings: activeTab === 'settings' ? (Array.isArray(newItems) ? newItems : []) : (currentPanelData.settings || [])
      };
      return {
        ...prev,
        [activePanel]: updatedPanelData
      };
    });
  };

  // استخراج displayMode من العنصر الأب المحدد للتعديل
  const getParentDisplayMode = () => {
    if (editingItem?.isChild && editingItem?.parentId) {
      const parent = currentItems.find(i => i.id === editingItem.parentId);
      return parent?.displayMode || "sidebar";
    }
    return "sidebar";
  };

  const addItemToCurrentTab = (newItem) => {
    setItems(prev => {
      const panelData = prev[activePanel] || {};
      const currentTabItems = Array.isArray(panelData[activeTab]) ? panelData[activeTab] : [];
      return {
        ...prev,
        [activePanel]: {
          ...panelData,
          [activeTab]: [...currentTabItems, newItem]
        }
      };
    });
  };

  // ─── تحويل الشجرة إلى قائمة مسطحة (فقط للعرض المرئي) ───
  const flattenTree = (nodes, parentId = null, depth = 0) => {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, _parentId: parentId, _depth: depth });
      if (expandedItems[node.id] && (node.children || []).length > 0) {
        result.push(...flattenTree(node.children, node.id, depth + 1));
      }
    }
    return result;
  };

  // ─── تطبيق إعادة الترتيب على الشجرة الأصلية مع الحفاظ على الأبناء المطوية ───
  const reorderTree = (tree, draggedId, targetParentId, newIndexInParent) => {
    // استخرج العنصر المسحوب من أي مكان في الشجرة
    let draggedNode = null;
    const removeFromTree = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (node.id === draggedId) {
          draggedNode = node; // احفظه كاملاً مع أبنائه
          return acc;
        }
        acc.push({ ...node, children: removeFromTree(node.children || []) });
        return acc;
      }, []);
    };
    const treeWithout = removeFromTree(tree);
    if (!draggedNode) return tree;

    // أضف العنصر في مكانه الجديد
    const insertIntoTree = (nodes, parentId) => {
      if (parentId === null) {
        // أضف في المستوى الجذري
        const result = [...nodes];
        result.splice(newIndexInParent, 0, draggedNode);
        return result;
      }
      return nodes.map(node => {
        if (node.id === parentId) {
          const newChildren = [...(node.children || [])];
          newChildren.splice(newIndexInParent, 0, draggedNode);
          return { ...node, children: newChildren };
        }
        return { ...node, children: insertIntoTree(node.children || [], parentId) };
      });
    };
    return insertIntoTree(treeWithout, targetParentId);
  };

  const handleDragEnd = (result) => {
    setIsDraggingActive(false);
    const { source, destination, combine } = result;
    if (!destination && !combine) return;

    const flat = flattenTree(currentItems);

    // ─── COMBINE: إفلات فوق عنصر → يصبح فرعياً له ───
    if (combine) {
      const draggedItem = flat.find(i => i.id === result.draggableId);
      const targetId = combine.draggableId;
      if (!draggedItem || draggedItem.id === targetId) return;

      // احسب index الإدراج (آخر ابن للهدف)
      const targetNode = currentItems.find(n => n.id === targetId) || 
        currentItems.flatMap(n => n.children || []).find(n => n.id === targetId);
      const insertIndex = (targetNode?.children || []).length;

      const newTree = reorderTree(currentItems, result.draggableId, targetId, insertIndex);
      setExpandedItems(p => ({ ...p, [targetId]: true }));
      setItems(prev => {
        const panelData = prev[activePanel] || {};
        return { ...prev, [activePanel]: { ...panelData, [activeTab]: newTree } };
      });
      return;
    }

    // ─── REORDER: تغيير الترتيب ───
    if (source.index === destination.index) return;

    const draggedFlat = flat[source.index];
    const destFlat = flat[destination.index];
    if (!draggedFlat) return;

    // حدد الأب الهدف: نفس أب العنصر الوجهة
    const targetParentId = destFlat?._parentId || null;

    // احسب index الجديد داخل الأب
    const siblingsFlat = flat.filter(i => (i._parentId || null) === targetParentId);
    const destSiblingIndex = siblingsFlat.findIndex(i => i.id === destFlat?.id);
    const newIndexInParent = destSiblingIndex === -1 ? siblingsFlat.length : destSiblingIndex;

    const newTree = reorderTree(currentItems, draggedFlat.id, targetParentId, newIndexInParent);
    setItems(prev => {
      const panelData = prev[activePanel] || {};
      return { ...prev, [activePanel]: { ...panelData, [activeTab]: newTree } };
    });
  };

  // دالة تكرارية لتبديل الظهور في أي مستوى
  const toggleNodeVisibility = (nodes, targetId) => nodes.map(node => {
    if (node.id === targetId) return { ...node, visible: !node.visible };
    return { ...node, children: toggleNodeVisibility(node.children || [], targetId) };
  });

  const toggleVisibility = (itemId) => {
    setItems(prev => {
      const panelData = prev[activePanel] || {};
      const tabItems = Array.isArray(panelData[activeTab]) ? panelData[activeTab] : [];
      return { ...prev, [activePanel]: { ...panelData, [activeTab]: toggleNodeVisibility(tabItems, itemId) } };
    });
  };

  // دالة تكرارية للحذف من أي مستوى
  const removeNodeFromTree = (nodes, targetId) => nodes.reduce((acc, node) => {
    if (node.id === targetId) return acc;
    acc.push({ ...node, children: removeNodeFromTree(node.children || [], targetId) });
    return acc;
  }, []);

  const deleteItem = (itemId) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setItems(prev => {
      const panelData = prev[activePanel] || {};
      const tabItems = Array.isArray(panelData[activeTab]) ? panelData[activeTab] : [];
      return { ...prev, [activePanel]: { ...panelData, [activeTab]: removeNodeFromTree(tabItems, itemId) } };
    });
  };

  // تكرار تكراري لأي عنصر في الشجرة
  const deepDuplicate = (node) => ({
    ...node,
    id: `${node.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    children: (node.children || []).map(deepDuplicate)
  });

  const duplicateInTree = (nodes, targetId) => {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, children: duplicateInTree(node.children || [], targetId) });
      if (node.id === targetId) result.push(deepDuplicate(node));
    }
    return result;
  };

  const duplicateItem = (itemId) => {
    setItems(prev => {
      const panelData = prev[activePanel] || {};
      const tabItems = Array.isArray(panelData[activeTab]) ? panelData[activeTab] : [];
      return { ...prev, [activePanel]: { ...panelData, [activeTab]: duplicateInTree(tabItems, itemId) } };
    });
    toast({ title: "تم", description: "تم تكرار العنصر بنجاح" });
  };

  const resetToDefault = () => {
    if (!confirm("هل تريد إعادة تعيين القائمة للإعدادات الافتراضية؟")) return;
    const panel = PANELS.find(p => p.id === activePanel);
    if (panel) setItems(prev => ({ ...prev, [activePanel]: panel.default }));
  };

  // إضافة تطبيق للقائمة (يمنع التكرار على نفس المستوى الرئيسي)
  const addSeparator = () => {
    const newItem = {
      id: `separator-${Date.now()}`,
      label: "خط فاصل",
      icon: "Minus",
      visible: true,
      type: "separator",
      path: "",
      children: [],
    };
    addItemToCurrentTab(newItem);
    toast({ title: "تمت الإضافة", description: "تم إضافة خط فاصل جديد" });
  };

  const buildAppChildren = (parentApp) => {
    const addedIds = new Set();
    const children = [];
    const addChild = (childApp) => {
      if (!childApp || addedIds.has(childApp.id)) return;
      addedIds.add(childApp.id);
      children.push({
        id: `app-child-${childApp.id}-${Math.random().toString(36).slice(2,8)}`,
        label: childApp.name,
        icon: "Package",
        visible: true,
        type: "app",
        path: childApp.route || "",
        appId: childApp.id,
        children: []
      });
    };
    for (const rel of (parentApp.related_apps || [])) {
      const childApp = apps.find(a => a.id === rel.app_id);
      addChild(childApp);
    }
    for (const a of apps) {
      if (!a.is_addon) continue;
      const pids = a.parent_app_ids?.length > 0 ? a.parent_app_ids : (a.parent_app_id ? [a.parent_app_id] : []);
      if (pids.includes(parentApp.id)) addChild(a);
    }
    return children;
  };

  const addAppToSidebar = async (app, displayMode = "sidebar", autoChildren = false) => {
    // تحقق من عدم وجوده مسبقاً كعنصر رئيسي
    const alreadyExists = currentItems.some(
      item => item.type === "app" && (item.appId === app.id || item.path === app.id)
    );
    if (alreadyExists) {
      toast({ title: "تنبيه", description: `التطبيق "${app.name}" موجود مسبقاً في هذا التبويب`, variant: "destructive" });
      return;
    }

    const children = autoChildren ? buildAppChildren(app) : [];

    const newItem = {
      id: `app-${app.id}-${Date.now()}`,
      label: app.name,
      icon: "Package",
      visible: true,
      type: "app",
      path: app.route || app.id,
      appId: app.id,
      iconUrl: null,
      displayMode,
      appType: "normal",
      children,
    };
    addItemToCurrentTab(newItem);
    // فتح العنصر تلقائياً إذا كان له أبناء
    if (children.length > 0) {
      setExpandedItems(p => ({ ...p, [newItem.id]: true }));
    }
    toast({ title: "تمت الإضافة", description: `تم إضافة "${app.name}"${children.length > 0 ? ` مع ${children.length} عنصر فرعي` : ""}` });
  };

  // حذف التطبيق من القائمة الجانبية عند حذفه
  const removeAppFromSidebar = (appId) => {
    setItems(prev => {
      const updated = { ...prev };
      for (const panelId in updated) {
        const panelData = updated[panelId];
        for (const tabId in panelData) {
          const items = Array.isArray(panelData[tabId]) ? panelData[tabId] : [];
          // حذف التطبيق من العناصر الرئيسية
          panelData[tabId] = items
            .filter(item => !(item.type === "app" && (item.appId === appId || item.path === appId)))
            .map(item => ({
              ...item,
              // حذف التطبيق من العناصر الفرعية
              children: (item.children || []).filter(child => !(child.type === "app" && (child.appId === appId || child.path === appId)))
            }));
        }
      }
      return updated;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مصمم القائمة الجانبية</h1>
          <p className="text-sm text-muted-foreground mt-1">تحكم كامل بعناصر القائمة الجانبية لكل مساحة عمل</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
             <button onClick={resetToDefault} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
                <RotateCcw size={15} />
                إعادة تعيين
              </button>
             <button
               onClick={() => saveMutation.mutate(items)}
               disabled={saveMutation.isPending}
               className="flex items-center gap-2 px-4 py-2 bg-buttonColor text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
             >
               <Save size={15} />
               {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
             </button>
          </div>
          <button
            onClick={() => navigate("/app-designer")}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 whitespace-nowrap"
            title="مصمم التطبيقات - هيكل العلاقات والإضافات"
          >
            🧩 مصمم التطبيقات
          </button>
          <button
            onClick={() => setShowRoutesPanel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 whitespace-nowrap"
            title="عرض جميع روابط النظام المتاحة لنسخها"
          >
            📋 روابط النظام
          </button>
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="flex gap-2 bg-secondary/60 p-1.5 rounded-xl w-fit">
        {PANELS.map(panel => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              onClick={() => { setActivePanel(panel.id); setActiveTab("home"); }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                isActive ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
            >
              <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
              {panel.label}
            </button>
          );
        })}
      </div>

      <div>
        {/* Editor */}
        <div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex border-b border-border bg-secondary/40">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-semibold transition-all border-b-2",
                      isActive ? "bg-white border-b-2 text-primary" : "border-transparent text-muted-foreground hover:bg-white/60 hover:text-foreground"
                    )}
                    style={isActive ? { borderBottomColor: 'hsl(var(--primary))' } : {}}
                  >
                    <Icon size={15} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    <span>{tab.label}</span>
                    <span className={cn("text-xs font-normal px-1.5 py-0.5 rounded-full", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {(items[activePanel]?.[tab.id] || []).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Toolbar - مخفي في تبويب التطبيقات */}
            <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: 'var(--table-header-bg)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { setSelectionMode(m => !m); setSelectedIds(new Set()); }} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap border", selectionMode ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:bg-secondary/60")}>تحديد</button>
                {selectionMode && <>
                  <button onClick={() => setSelectedIds(selectedIds.size === currentItems.length ? new Set() : new Set(currentItems.map(i=>i.id)))} className="px-3 py-2 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 whitespace-nowrap">{selectedIds.size === currentItems.length ? "إلغاء الكل" : `تحديد الكل (${currentItems.length})`}</button>
                  {selectedIds.size > 0 && <>
                    <button
                      onClick={() => {
                        const ids = Array.from(selectedIds);
                        setItems(prev => {
                          const pd = prev[activePanel] || {};
                          const ti = Array.isArray(pd[activeTab]) ? pd[activeTab] : [];
                          return { ...prev, [activePanel]: { ...pd, [activeTab]: ti.map(it => ids.includes(it.id) ? { ...it, hide_if_empty: true } : it) } };
                        });
                        toast({ title: "تم", description: `تم تفعيل الإخفاء التلقائي لـ ${ids.length} عنصر` });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
                    >
                      🙈 إخفاء تلقائي: تفعيل
                    </button>
                    <button
                      onClick={() => {
                        const ids = Array.from(selectedIds);
                        setItems(prev => {
                          const pd = prev[activePanel] || {};
                          const ti = Array.isArray(pd[activeTab]) ? pd[activeTab] : [];
                          return { ...prev, [activePanel]: { ...pd, [activeTab]: ti.map(it => ids.includes(it.id) ? { ...it, hide_if_empty: false } : it) } };
                        });
                        toast({ title: "تم", description: `تم تعطيل الإخفاء التلقائي لـ ${ids.length} عنصر` });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
                    >
                      👁 إخفاء تلقائي: تعطيل
                    </button>
                    <button onClick={() => {if(!confirm(`هل تريد حذف ${selectedIds.size} عنصر؟`))return;const ids=Array.from(selectedIds);setItems(prev=>{const pd=prev[activePanel]||{};const ti=Array.isArray(pd[activeTab])?pd[activeTab]:[];const f=ti.reduce((a,it)=>{if(ids.includes(it.id))return a;a.push({...it,children:(it.children||[]).filter(c=>!ids.includes(c.id))});return a;},[]);return{...prev,[activePanel]:{...pd,[activeTab]:f}};});setSelectedIds(new Set());setSelectionMode(false);toast({title:"تم الحذف",description:`تم حذف ${ids.length} عنصر`});}} className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-white text-xs font-bold rounded-lg hover:opacity-90"><Trash2 size={14}/>حذف ({selectedIds.size})</button>
                  </>}
                </>}
                </div>
              <div className="flex flex-col flex-1 mx-3">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold" style={{ color: 'var(--table-header-text)' }}>
                    عناصر تبويب "{TABS.find(t => t.id === activeTab)?.label}" ({currentItems.length})
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                      {selectedIds.size} محدد
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">اسحب العناصر بين الرئيسية والفرعية لتغيير مستواها</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                <button
                 onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                <Plus size={14} />
                إضافة عنصر
              </button>
              <button
                onClick={addSeparator}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 text-white text-xs font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
                title="إضافة خط فاصل بين العناصر"
              >
                <Minus size={14} />
                إضافة فاصل
              </button>

                {/* زر إضافة تطبيق */}
                  <div className="relative">
                      <button
                        onClick={() => setShowAppPicker(p => !p)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <Package size={14} />
                        إضافة تطبيق
                      </button>
                      {showAppPicker && (
                        <AppPickerDropdown
                          apps={apps}
                          onSelect={addAppToSidebar}
                          onClose={() => setShowAppPicker(false)}
                          currentItems={currentItems}
                          selectedWorkspace={selectedWorkspace}
                          activePanel={activePanel}
                        />
                      )}
                    </div>

                  {/* زر إضافة عناصر دفعة واحدة */}
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                    title="استيراد عناصر متعددة حسب مساحة العمل"
                  >
                    <FileText size={14} />
                    استيراد دفعة
                  </button>

                  {/* زر نسخ من مساحة عمل أخرى */}
                  <button
                    onClick={() => setShowCopyModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                    title="نسخ عناصر من مساحة عمل أخرى"
                  >
                    <Copy size={14} />
                    نسخ من مساحة أخرى
                  </button>
                  </div>
              </div>
            </div>

            <DragDropContext
              onDragStart={() => setIsDraggingActive(true)}
              onDragEnd={handleDragEnd}
            >
              <Droppable droppableId={mainDropId} type="FLAT-ITEM" isCombineEnabled={true}>
                {(provided) => {
                  const flatItems = flattenTree(currentItems);
                  return (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-border">
                    {flatItems.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        لا توجد عناصر — اضغط "إضافة عنصر" أو "إضافة تطبيق" للبدء
                      </div>
                    ) : flatItems.map((item, idx) => {
                      const depth = item._depth || 0;
                      const indentPx = depth * 24;
                      const hasChildren = (item.children || []).length > 0;
                      const isExpanded = !!expandedItems[item.id];
                      const isSep = item.type === "separator";

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={idx}>
                          {(pd, snap) => (
                            <div
                              ref={pd.innerRef}
                              {...pd.draggableProps}
                              className={cn(
                                "bg-card transition-all border-b border-border/30",
                                snap.isDragging && "shadow-xl opacity-90 z-50",
                                snap.combineTargetFor && "ring-2 ring-primary ring-inset bg-primary/5",
                                highlightedItemLabel && item.label === highlightedItemLabel && "ring-2 ring-amber-400 bg-amber-50"
                              )}
                            >
                              <div
                                className="flex items-center gap-2 py-2.5 hover:bg-secondary/20"
                                style={{ paddingRight: `${indentPx + 16}px`, paddingLeft: '8px' }}
                              >
                                {selectionMode && depth === 0 && <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => {const s = new Set(selectedIds); s.has(item.id) ? s.delete(item.id) : s.add(item.id); setSelectedIds(s);}} className="cursor-pointer flex-shrink-0" />}
                                <div {...pd.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
                                  <GripVertical size={depth > 0 ? 13 : 16} />
                                </div>

                                {isSep ? (
                                  <div className="flex-1 h-px bg-border mx-2" />
                                ) : (
                                  <>
                                    <button
                                      onClick={() => hasChildren && setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                                      className={cn("flex-shrink-0", hasChildren ? "text-muted-foreground hover:text-foreground cursor-pointer" : "opacity-0 pointer-events-none")}
                                    >
                                      {isExpanded ? <ChevronDown size={depth > 0 ? 13 : 15} /> : <ChevronRight size={depth > 0 ? 13 : 15} />}
                                    </button>

                                    <div className="flex-shrink-0">
                                      {item.type === "app" && getAppIconUrl(item) ? (
                                        <img src={getAppIconUrl(item)} alt={item.label} className="w-4 h-4 rounded object-contain" />
                                      ) : (
                                        (() => { const Icon = getIconByName(item.icon); return <Icon size={depth > 0 ? 13 : 16} className={depth > 0 ? "text-primary/70" : "text-primary"} />; })()
                                      )}
                                    </div>

                                    <span className={cn("flex-1 font-medium truncate", depth > 0 ? "text-xs" : "text-sm", !item.visible && "line-through text-muted-foreground")}>
                                      {item.label}
                                      {hasChildren && <span className="text-[9px] text-muted-foreground mr-1">({item.children.length})</span>}
                                    </span>

                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0",
                                      item.type === "app" ? "bg-emerald-100 text-emerald-700" :
                                      item.type === "external" ? "bg-orange-100 text-orange-700" :
                                      "bg-blue-100 text-blue-700")}>
                                      {item.type === "app" ? "تطبيق" : item.type === "external" ? "خارجي" : "داخلي"}
                                    </span>
                                    {item.hide_if_empty && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">إخفاء تلقائي</span>}
                                    {depth === 0 && item.type !== "app" && <span className="text-xs text-muted-foreground font-mono flex-shrink-0 max-w-[100px] truncate hidden sm:block">{item.path}</span>}
                                  </>
                                )}

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!isSep && (
                                    <button onClick={() => { setShowAddForm({ parentId: item.id }); setExpandedItems(p => ({ ...p, [item.id]: true })); }} className="p-1 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title="إضافة فرعي"><Plus size={12} /></button>
                                  )}
                                  {!isSep && (
                                    <button onClick={() => toggleVisibility(item.id)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title={item.visible ? "إخفاء" : "إظهار"}>
                                      {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                  )}
                                  <button onClick={() => setEditingItem({ itemId: item.id, isChild: depth > 0, parentId: item._parentId, data: item })} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary" title="تعديل"><Edit2 size={12} /></button>
                                  <button onClick={() => duplicateItem(item.id)} className="p-1 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600" title="تكرار"><Copy size={12} /></button>
                                  <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="حذف"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                  );
                }}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

      </div>

      {/* App Report Drawer */}
      {showAppReport && (
        <AppReportDrawer
          items={items}
          apps={apps}
          reportFilter={reportFilter}
          setReportFilter={setReportFilter}
          onClose={() => setShowAppReport(false)}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          apps={apps}
          items={items}
          currentItems={currentItems}
          activePanel={activePanel}
          activeTab={activeTab}
          selectedWorkspace={selectedWorkspace}
          onImport={(newItems) => {
            setCurrentItems(newItems);
            toast({ title: "تمت الإضافة", description: `تم إضافة عناصر جديدة بنجاح` });
            setShowBulkImport(false);
          }}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {/* Copy Sidebar Modal */}
      {showCopyModal && (
        <CopySidebarModal
          items={items}
          activePanel={activePanel}
          activeTab={activeTab}
          onCopy={({ items: itemsToCopy }) => {
            setCurrentItems([...currentItems, ...itemsToCopy]);
            toast({ title: "تم النسخ", description: `تم نسخ ${itemsToCopy.length} عنصر بنجاح` });
          }}
          onClose={() => setShowCopyModal(false)}
        />
      )}

      {/* System Routes Panel */}
      <SystemRoutesPanel
        open={showRoutesPanel}
        onClose={() => setShowRoutesPanel(false)}
        onNavigateToUsage={({ panelId, tabId, itemLabel }) => {
          setActivePanel(panelId);
          setActiveTab(tabId);
          setHighlightedItemLabel(itemLabel);
          // فتح العناصر الأب تلقائياً إذا كان العنصر فرعياً
          const panelData = items[panelId];
          const tabItems = panelData?.[tabId] || [];
          const findAndExpand = (nodes) => {
            for (const node of nodes) {
              if ((node.children || []).some(c => c.label === itemLabel)) {
                setExpandedItems(p => ({ ...p, [node.id]: true }));
                return true;
              }
              for (const child of (node.children || [])) {
                if ((child.children || []).some(gc => gc.label === itemLabel)) {
                  setExpandedItems(p => ({ ...p, [node.id]: true, [child.id]: true }));
                  return true;
                }
              }
            }
            return false;
          };
          findAndExpand(tabItems);
          // إزالة التمييز بعد 4 ثواني
          setTimeout(() => setHighlightedItemLabel(null), 4000);
        }}
      />

      {/* Add/Edit Form - SlidePanel */}
      <SlidePanel
        open={!!(showAddForm || editingItem)}
        onClose={() => { setShowAddForm(false); setEditingItem(null); }}
      >
        {(showAddForm || editingItem) && (
          <ItemForm
            item={editingItem?.data || null}
            isChildEdit={editingItem?.isChild || false}
            parentId={typeof showAddForm === "object" ? showAddForm.parentId : null}
            parentDisplayMode={editingItem?.isChild ? getParentDisplayMode() : undefined}
            onSave={(newItem) => {
              const safeNewItem = { ...newItem, icon: newItem.icon || "Package", iconUrl: null };

              setItems(prev => {
                const panelData = prev[activePanel] || {};
                const tabItems = Array.isArray(panelData[activeTab]) ? panelData[activeTab] : [];
                let newItems;

                if (editingItem) {
                  if (editingItem.isChild) {
                    const updateNodeInTree = (nodes) => nodes.map(node => {
                      if (node.id === editingItem.itemId) {
                        return { ...node, ...safeNewItem, icon: safeNewItem.icon || node.icon || "Package" };
                      }
                      if (node.children?.length > 0) {
                        return { ...node, children: updateNodeInTree(node.children) };
                      }
                      return node;
                    });
                    newItems = updateNodeInTree(tabItems);
                  } else {
                    newItems = tabItems.map(item => {
                      if (item.id !== editingItem.itemId) return item;
                      const updatedItem = { 
                        ...item, 
                        ...safeNewItem,
                        icon: safeNewItem.icon || item.icon || "Package"
                      };
                      if (updatedItem.children?.length > 0) {
                        updatedItem.children = updatedItem.children.map(child => ({
                          ...child,
                          displayMode: updatedItem.displayMode
                        }));
                      }
                      return updatedItem;
                    });
                  }
                  setEditingItem(null);
                } else {
                  const parentId = typeof showAddForm === "object" ? showAddForm.parentId : null;
                  if (parentId) {
                    const addChildToNode = (nodes) => nodes.map(node => {
                      if (node.id === parentId) return {
                        ...node,
                        children: [...(node.children || []), { ...safeNewItem, id: `item-${Date.now()}`, children: [] }]
                      };
                      return { ...node, children: addChildToNode(node.children || []) };
                    });
                    newItems = addChildToNode(tabItems);
                  } else {
                    newItems = [...tabItems, { 
                      ...safeNewItem, 
                      id: `item-${Date.now()}`, 
                      children: []
                    }];
                  }
                  setShowAddForm(false);
                }

                return {
                  ...prev,
                  [activePanel]: { ...panelData, [activeTab]: newItems }
                };
              });
            }}
            onCancel={() => { setShowAddForm(false); setEditingItem(null); }}
          />
        )}
      </SlidePanel>
    </motion.div>
  );
}



// ─── مكون اختيار التطبيق ───
// ─── مكون بادج صلاحية التطبيق ───
function AppPermissionBadge({ app, activePanel }) {
  const panelPermMap = {
    super_admin: { field: "super_admin_can_install", label: "السوبر أدمن" },
    partner: { field: "partners_can_install", label: "الشركاء" },
    client: { field: "clients_can_install", label: "العملاء" },
  };
  const perm = panelPermMap[activePanel];
  if (!perm) return null;
  const canInstall = app[perm.field] !== false;
  if (canInstall) return null;
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0 whitespace-nowrap">
      ⚠️ {perm.label} لا يمكنهم تثبيته
    </span>
  );
}

function AppPickerDropdown({ apps, onSelect, onClose, currentItems = [], selectedWorkspace, activePanel }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [showOnlyUnused, setShowOnlyUnused] = useState(false);
  const [autoAddChildren, setAutoAddChildren] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({
    position: "fixed",
    top: 0,
    left: 0,
    width: 420,
    maxHeight: "540px",
    display: "flex",
    flexDirection: "column",
    zIndex: 50
  });
  const ref = useRef(null);

  // تجميع كل IDs التطبيقات المضافة في القائمة الحالية (بما فيها الفرعية بأي عمق)
  const addedAppIds = new Set();
  const collectAppIds = (nodes) => {
    for (const item of nodes) {
      if (item.type === "app" && (item.appId || item.path)) {
        addedAppIds.add(item.appId || item.path);
      }
      if (item.children?.length > 0) collectAppIds(item.children);
    }
  };
  collectAppIds(currentItems);

  // جلب التصنيفات من AppCategory - التصنيفات عامة للمنصة
  const { data: appCategories = [] } = useQuery({
    queryKey: ["appCategories"],
    queryFn: () => base44.entities.AppCategory.list(),
  });

  // احصاء التطبيقات حسب التصنيفات من جدول AppCategory
  const categoryCounts = {};
  appCategories.forEach(cat => {
    if (cat.is_active) {
      categoryCounts[cat.name] = apps.filter(a => a.is_active && a.categories && a.categories.includes(cat.name)).length;
    }
  });
  
  const categories = ["all", ...appCategories
    .filter(c => c.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(c => c.name)];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = apps.filter(app => {
    const appActive = app.is_active;
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
    const appCats = (app.categories && app.categories.length > 0) ? app.categories : [];
    const matchesCategory = selectedCategory === "all" || appCats.includes(selectedCategory);
    const matchesUnused = !showOnlyUnused || !addedAppIds.has(app.id);
    return appActive && matchesSearch && matchesCategory && matchesUnused;
  });

  const handleToggle = (appId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filtered.map(app => app.id));
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(allIds);
    }
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) return;
    const selectedArray = Array.from(selected);
    for (const appId of selectedArray) {
      const app = apps.find(a => a.id === appId);
      if (app) {
        await onSelect(app, "sidebar", autoAddChildren);
      }
    }
    setSelected(new Set());
    onClose();
  };

  return (
    <div ref={ref} className="bg-white border border-border rounded-xl shadow-xl z-50 flex flex-col" dir="rtl" style={popoverStyle}>
      {/* Search */}
      <div className="p-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2 py-1.5">
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن تطبيق..."
            className="flex-1 bg-transparent text-xs outline-none text-right"
            autoFocus
          />
        </div>
      </div>

      {/* Categories - Fixed to show */}
      <div className="px-3 py-3 border-b border-border flex gap-2 overflow-x-auto flex-shrink-0">
        {categories.map(cat => {
          const count = cat === "all" ? apps.filter(a => a.is_active).length : (categoryCounts[cat] || 0);
          return (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span>{cat === "all" ? "الكل" : cat}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === cat ? "bg-white/30" : "bg-white/20"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter: غير مضافة فقط */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0 flex items-center justify-between bg-amber-50/60">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnused}
            onChange={e => { setShowOnlyUnused(e.target.checked); setSelected(new Set()); }}
            className="cursor-pointer accent-amber-500"
          />
          <span className="text-xs font-semibold text-amber-700">
            عرض غير المضافة فقط
          </span>
        </label>
        <span className="text-[10px] text-muted-foreground">
          مضاف: <span className="font-bold text-emerald-600">{addedAppIds.size}</span> / الكل: <span className="font-bold">{apps.filter(a => a.is_active).length}</span>
        </span>
      </div>

      {/* Toggle: إضافة الأبناء تلقائياً */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0 flex items-center justify-between bg-blue-50/60">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => setAutoAddChildren(v => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${autoAddChildren ? "bg-blue-500" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${autoAddChildren ? "right-0.5" : "right-4"}`} />
          </button>
          <span className="text-xs font-semibold text-blue-700">
            إضافة الأبناء تلقائياً
          </span>
        </label>
        <span className="text-[10px] text-blue-600">
          {autoAddChildren ? "✓ سيتم إضافة التطبيقات الفرعية" : "يدوي فقط"}
        </span>
      </div>

      {/* Select All Header */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0 flex items-center justify-between bg-secondary/10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selected.size === filtered.length}
            onChange={handleSelectAll}
            className="cursor-pointer"
          />
          <span className="text-xs font-semibold text-foreground">
            {filtered.length > 0 ? `تحديد الكل (${filtered.length})` : "لا توجد تطبيقات"}
          </span>
        </label>
      </div>

      {/* Apps List */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">لا توجد تطبيقات</p>
        ) : filtered.map(app => {
          const isAdded = addedAppIds.has(app.id);
          return (
            <button
              key={app.id}
              onClick={() => handleToggle(app.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-right transition-colors border-b border-border/50 last:border-0 ${
                selected.has(app.id) ? "bg-primary/5 border-r-2 border-r-primary" :
                isAdded ? "bg-emerald-50/60 hover:bg-emerald-50" :
                "hover:bg-primary/5"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(app.id)}
                onChange={() => {}}
                className="flex-shrink-0 cursor-pointer"
              />
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.name} className="w-8 h-8 rounded-lg object-contain flex-shrink-0 border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs truncate">{app.name}</p>
                <div className="leading-tight">
                  <p className="text-[10px] text-muted-foreground">التصنيفات: {app.categories && app.categories.length > 0 ? app.categories.map(c => { const cat = appCategories.find(ac => ac.id === c || ac.name === c); return cat ? cat.name : c; }).join("، ") : "—"}</p>
                  <p className="text-[10px] text-primary font-semibold">الرئيسي: {app.primary_category ? (appCategories.find(ac => ac.id === app.primary_category || ac.name === app.primary_category)?.name || app.primary_category) : "—"}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {isAdded && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    ✓ مضاف
                  </span>
                )}
                <AppPermissionBadge app={app} activePanel={activePanel} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer with Add button */}
      {selected.size > 0 && (
        <div className="px-3 py-2 border-t border-border bg-secondary/20 flex-shrink-0 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">{selected.size} محدد</span>
          <button
            onClick={handleAddSelected}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            إضافة المحدد
          </button>
        </div>
      )}
    </div>
  );
}

// ─── نموذج الإضافة/التعديل ───
function ItemForm({ item, parentId, isChildEdit, parentDisplayMode, onSave, onCancel }) {
  const [form, setForm] = useState({
    label: item?.label || "",
    icon: item?.icon || "Home",
    type: item?.type || "internal",
    path: item?.path || "",
    visible: item?.visible !== false,
    hide_if_empty: item?.hide_if_empty || false,
    displayMode: item?.displayMode || (parentDisplayMode || "sidebar"),
    appType: item?.appType || "normal",
    separatorMargin: item?.separatorMargin || 4,
  });

  // العنصر يُعامَل كتطبيق (تعديل الأيقونة فقط) إذا كان type=app وهو في وضع تعديل فرعي
  const isApp = item?.type === "app" && isChildEdit;
  // العنصر فرعي فقط إذا تم تمرير parentId صراحةً (وضع الإضافة الفرعية)
  const isChild = !!parentId;
  // هل هو فاصل (موجود أو جديد)
  const isSeparator = form.type === "separator";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isApp && !isSeparator && !form.label.trim()) { alert("اسم العنصر مطلوب"); return; }
    if (!isApp && !isSeparator && !form.path.trim()) { alert("المسار / الرابط مطلوب"); return; }
    onSave({
      ...(item || {}),
      ...form,
      icon: form.icon || item?.icon || "Package",
      iconUrl: null
    });
  };

  const title = isSeparator ? "إعدادات الفاصل" : isApp ? "تعديل أيقونة التطبيق" : item ? "تعديل العنصر" : parentId ? "إضافة عنصر فرعي" : "إضافة عنصر جديد";

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/40 flex-shrink-0">
        <button type="button" onClick={onCancel} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
          <ArrowRight size={18} className="text-muted-foreground" />
        </button>
        <h3 className="text-base font-bold text-foreground flex-1">{title}</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 content-start">
        {/* حقول الفاصل فقط */}
        {isSeparator && (
          <div className="col-span-2 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-4">التحكم في المسافة</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground">المسافة أعلى وأسفل الفاصل</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max="64" step="1" value={form.separatorMargin}
                      onChange={e => setForm({ ...form, separatorMargin: parseInt(e.target.value) })}
                      className="flex-1 cursor-pointer accent-primary" />
                    <span className="text-sm font-bold text-primary min-w-[50px] text-center bg-primary/10 rounded px-2 py-0.5">{form.separatorMargin}px</span>
                  </div>
                </div>
                {/* معاينة مباشرة */}
                <div className="p-3 bg-white border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-2 text-center">معاينة</p>
                  <div className="flex flex-col">
                    <div className="h-6 bg-secondary/40 rounded flex items-center px-2"><span className="text-[10px] text-muted-foreground">عنصر القائمة</span></div>
                    <div style={{ marginTop: `${form.separatorMargin}px`, marginBottom: `${form.separatorMargin}px` }} className="h-px bg-border" />
                    <div className="h-6 bg-secondary/40 rounded flex items-center px-2"><span className="text-[10px] text-muted-foreground">عنصر القائمة</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isApp && !isSeparator && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5">اسم العنصر *</label>
              <input type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="مثال: لوحة التحكم"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">نوع الرابط</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="internal">صفحة داخلية</option>
                <option value="external">رابط خارجي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{form.type === "external" ? "الرابط الخارجي *" : "مسار الصفحة *"}</label>
              <input type="text" value={form.path} onChange={e => setForm({ ...form, path: e.target.value })}
                placeholder={form.type === "external" ? "https://example.com" : "/super-admin/clients"}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                dir="ltr" />
            </div>
          </>
        )}
        {/* حقل الأيقونة يظهر فقط لغير الفاصل */}
        {!isSeparator && (
        <div className={isApp ? "col-span-2" : ""}>
          <label className="block text-sm font-semibold mb-1.5">الأيقونة</label>
          <div className="flex items-center gap-3">
            <IconPickerPopover value={form.icon} onChange={icon => setForm({ ...form, icon })} />
            <span className="text-sm font-medium text-foreground">{form.icon || "لم تختر أيقونة"}</span>
          </div>
        </div>
        )}
        {isApp && (
          <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-right text-sm text-amber-700">
            ✏️ يمكنك تغيير الأيقونة من القائمة أعلاه — ستظهر هذه الأيقونة في القائمة الجانبية بدلاً من الصورة الافتراضية
          </div>
        )}

        {isApp && !isChild && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-3">🎯 نوع التطبيق</label>
              <p className="text-xs text-muted-foreground mb-4">اختر كيفية ظهور التطبيق وتفاعل المستخدم معه</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, appType: "normal" })}
                  className={cn("p-4 rounded-lg border-2 transition-all text-right", form.appType === "normal" ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-400")}
                >
                  <div className="text-sm font-semibold text-foreground">🔗 عادي</div>
                  <div className="text-[10px] text-muted-foreground mt-1">التطبيق يفتح في صفحة منفصلة بـ route خاص به</div>
                  <div className="text-[9px] text-blue-600 font-medium mt-2">أفضل لـ: التطبيقات المستقلة الكبيرة</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, appType: "embedded" })}
                  className={cn("p-4 rounded-lg border-2 transition-all text-right", form.appType === "embedded" ? "border-purple-500 bg-purple-50" : "border-border hover:border-purple-400")}
                >
                  <div className="text-sm font-semibold text-foreground">📦 مدمج</div>
                  <div className="text-[10px] text-muted-foreground mt-1">التطبيق يُحمّل داخل صفحة الإعدادات كـ component</div>
                  <div className="text-[9px] text-purple-600 font-medium mt-2">أفضل لـ: الإعدادات والتكوينات</div>
                </button>
              </div>
              <div className={cn("mt-3 p-3 rounded-lg border text-xs", form.appType === "normal" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700")}>
                {form.appType === "normal" ? (
                  <div>
                    <p className="font-semibold mb-1">✓ نوع عادي:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• التطبيق له route خاص به مثل: /my-app</li>
                      <li>• عند النقر يتم الانتقال للصفحة المنفصلة</li>
                      <li>• يظهر في الـ URL والـ breadcrumb</li>
                      <li>• استخدم للتطبيقات الكاملة المستقلة</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-1">✓ نوع مدمج:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• التطبيق يظهر داخل صفحة الإعدادات كـ component</li>
                      <li>• عند النقر يتم تحميل التطبيق بدون تغيير الصفحة</li>
                      <li>• لا يغير الـ URL أو الـ breadcrumb</li>
                      <li>• استخدم لأدوات الإعدادات والتكوينات البسيطة</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!isApp && !isChild && !isSeparator && !parentId && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-3">طريقة عرض العناصر الفرعية</label>
              <p className="text-xs text-muted-foreground mb-3">العنصر الرئيسي سيظهر في القائمة الجانبية دائماً، هذا الخيار يحدد أين تظهر العناصر الفرعية</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, displayMode: "sidebar" })}
                  className={cn("p-4 rounded-lg border-2 transition-all text-right", form.displayMode === "sidebar" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                >
                  <div className="text-sm font-semibold text-foreground">في القائمة</div>
                  <div className="text-[10px] text-muted-foreground mt-1">العناصر الفرعية تحت العنصر الأب في القائمة الجانبية</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, displayMode: "page" })}
                  className={cn("p-4 rounded-lg border-2 transition-all text-right", form.displayMode === "page" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-primary/40")}
                >
                  <div className="text-sm font-semibold text-foreground">داخل الصفحة</div>
                  <div className="text-[10px] text-muted-foreground mt-1">العناصر الفرعية تظهر كبطاقات مُضمَّنة في صفحة الأب</div>
                </button>
              </div>
            </div>
          </>
        )}
        {!isApp && !isChild && !isSeparator && !parentId && (
          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="visible" checked={form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} className="cursor-pointer" />
              <label htmlFor="visible" className="text-sm font-semibold cursor-pointer">إظهار العنصر في القائمة</label>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-foreground">إخفاء تلقائياً إذا كان فارغاً</p>
                <p className="text-xs text-muted-foreground mt-0.5">يُخفى إذا لم يحتوِ على تطبيقات مثبتة أو عناصر فرعية مرئية</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, hide_if_empty: !form.hide_if_empty })}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.hide_if_empty ? "bg-amber-500" : "bg-muted"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${form.hide_if_empty ? "right-1" : "right-7"}`} />
              </button>
            </div>
          </div>
        )}
        {isChild && (
          <div className="col-span-2">
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-foreground">إخفاء تلقائياً إذا كان فارغاً</p>
                <p className="text-xs text-muted-foreground mt-0.5">يُخفى إذا لم يكن تطبيقه مثبتاً أو فرعياته فارغة</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, hide_if_empty: !form.hide_if_empty })}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.hide_if_empty ? "bg-amber-500" : "bg-muted"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${form.hide_if_empty ? "right-1" : "right-7"}`} />
              </button>
            </div>
          </div>
        )}
        <div className="col-span-2 flex items-center gap-3 pt-2 border-t border-border">
          <button type="submit" className="px-5 py-2 bg-buttonColor text-white text-sm font-semibold rounded-lg hover:opacity-90">حفظ التعديل</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 border border-border text-sm font-semibold rounded-lg hover:bg-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}

// ─── تقرير التطبيقات ───
function AppReportDrawer({ items, apps, reportFilter, setReportFilter, onClose }) {
  const [expandedApps, setExpandedApps] = useState({});

  // احصاء التطبيقات المستخدمة وأماكن استخدامها
  const getAppUsage = () => {
    const usage = {};
    
    // الذهاب عبر جميع الأنظمة والتبويبات
    for (const [panelId, panelData] of Object.entries(items)) {
      const tabs = Array.isArray(panelData) ? { home: panelData } : panelData;
      
      for (const [tabId, tabItems] of Object.entries(tabs)) {
        if (!Array.isArray(tabItems)) continue;
        
        tabItems.forEach(item => {
          if (item.type === "app") {
            const app = apps.find(a => a.id === item.appId);
            if (!usage[item.appId]) {
              usage[item.appId] = {
                app,
                locations: [],
                count: 0
              };
            }
            usage[item.appId].locations.push({
              panel: panelId,
              tab: tabId,
              displayMode: item.displayMode
            });
            usage[item.appId].count++;
          }
          
          // البحث في العناصر الفرعية
          if (item.children) {
            item.children.forEach(child => {
              if (child.type === "app") {
                const app = apps.find(a => a.id === child.appId);
                if (!usage[child.appId]) {
                  usage[child.appId] = {
                    app,
                    locations: [],
                    count: 0
                  };
                }
                usage[child.appId].locations.push({
                  panel: panelId,
                  tab: tabId,
                  parent: item.label,
                  displayMode: child.displayMode
                });
                usage[child.appId].count++;
              }
            });
          }
        });
      }
    }
    
    return usage;
  };

  const usedApps = getAppUsage();
  const usedAppIds = new Set(Object.keys(usedApps));
  const unusedApps = apps.filter(app => !usedAppIds.has(app.id));
  
  let filteredApps = [];
  if (reportFilter === "used") {
    filteredApps = Object.values(usedApps).sort((a, b) => b.count - a.count);
  } else if (reportFilter === "unused") {
    filteredApps = unusedApps.map(app => ({ app, locations: [], count: 0 }));
  } else {
    filteredApps = [
      ...Object.values(usedApps).sort((a, b) => b.count - a.count),
      ...unusedApps.map(app => ({ app, locations: [], count: 0 }))
    ];
  }

  const panelLabels = {
    super_admin: "مساحة عمل السوبر أدمن",
    client: "مساحة عمل العملاء",
    partner: "مساحة عمل الشركاء"
  };

  const tabLabels = {
    home: "الرئيسية",
    archive: "الأرشيف",
    settings: "الإعدادات"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        onClick={e => e.stopPropagation()}
        className="fixed left-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <h2 className="text-lg font-bold text-foreground">تقرير التطبيقات</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-primary/10 rounded-lg">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border flex gap-2">
          {[
            { value: "all", label: "الكل" },
            { value: "used", label: `المستخدمة (${Object.keys(usedApps).length})` },
            { value: "unused", label: `الغير مستخدمة (${unusedApps.length})` }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setReportFilter(filter.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                reportFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredApps.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">لا توجد تطبيقات</p>
            </div>
          ) : (
            filteredApps.map(item => {
              const { app, locations, count } = item;
              if (!app) return null;
              const expanded = !!expandedApps[app.id];
              
              return (
                <div key={app.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* App Header */}
                  <button
                    onClick={() => setExpandedApps(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/40 transition-colors text-right"
                  >
                    <div className="flex-shrink-0">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.name} className="w-8 h-8 rounded object-contain" />
                      ) : (
                        <Package size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-semibold text-sm text-foreground truncate">{app.name}</p>
                    </div>
                    {locations.length > 0 && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                        {count}× مستخدم
                      </span>
                    )}
                    {locations.length === 0 && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">
                        غير مستخدم
                      </span>
                    )}
                    {locations.length > 0 && (
                      <div className="flex-shrink-0 text-muted-foreground">
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    )}
                  </button>

                  {/* Locations List */}
                  {expanded && locations.length > 0 && (
                    <div className="border-t border-border/50 p-3 space-y-2 bg-secondary/10">
                      {locations.map((loc, idx) => (
                        <div key={idx} className="text-xs bg-white rounded p-2 border border-border/50">
                          <p className="font-semibold text-foreground">
                            📍 {panelLabels[loc.panel]} - {tabLabels[loc.tab]}
                          </p>
                          {loc.parent && (
                            <p className="text-muted-foreground mt-1">
                              تحت: <span className="font-medium">{loc.parent}</span>
                            </p>
                          )}
                          <p className="text-muted-foreground mt-1">
                            طريقة العرض: <span className={cn("font-medium", loc.displayMode === "page" ? "text-purple-600" : "text-blue-600")}>
                              {loc.displayMode === "page" ? "داخل الصفحة" : "في القائمة"}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

import SidebarPreviewPanel from "@/components/superadmin/SidebarPreviewPanel";