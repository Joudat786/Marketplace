import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Building2, Plus, Search, CheckCircle, Clock, XCircle,
  Edit, Trash2, ArrowLeft, LayoutGrid, Table as TableIcon,
  Star, StarOff, MoreVertical, UserPlus, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import SlidePanel from "@/components/superadmin/SlidePanel";
import WorkspaceForm from "@/components/client/WorkspaceForm";
import WorkspaceEditPanel from "@/components/client/WorkspaceEditPanel";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { formatDateRiyadh as formatDate } from "@/utils/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  active: { label: 'نشط', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  trial: { label: 'تجريبي', icon: Clock, class: 'text-orange-600 bg-orange-50 border-orange-200' },
  suspended: { label: 'موقوف', icon: XCircle, class: 'text-red-600 bg-red-50 border-red-200' },
  cancelled: { label: 'ملغي', icon: XCircle, class: 'text-slate-600 bg-slate-50 border-slate-200' },
};

const joinMethodLabels = {
  owner: 'منشئ المساحة',
  invited: 'دعوة مرسلة',
  request: 'دعوة مستلمة',
};

const joinStatusConfig = {
  pending: { label: 'قيد الانتظار', class: 'text-orange-600 bg-orange-50 border-orange-200' },
  approved: { label: 'مقبول', class: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'مرفوض', class: 'text-red-600 bg-red-50 border-red-200' },
};


export default function WorkspacesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const editIdFromUrl = urlParams.get('edit');
  const [tab, setTab] = useState('workspaces');
  const [reqSubTab, setReqSubTab] = useState('sent');
  const [wsSearch, setWsSearch] = useState('');
  const [reqSearch, setReqSearch] = useState('');
  const [panel, setPanel] = useState({ open: urlParams.get('create') === '1', id: null });
  const [editPanel, setEditPanel] = useState({ open: false, id: null });
  const [autoOpenDone, setAutoOpenDone] = useState(false);
  const [joinSlug, setJoinSlug] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshWorkspaces } = useWorkspace();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const isSuperAdmin = user?.role === 'super_admin';

  const { data: workspaces = [], isLoading: wsLoading, refetch: refetchWorkspaces } = useQuery({
    queryKey: ['workspaces', user?.email, isSuperAdmin],
    queryFn: async () => {
      if (!user?.email) return [];
      const response = await base44.functions.invoke('getUserWorkspaces', {});
      return response?.data?.workspaces || [];
    },
    enabled: !!user?.email,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // فتح editPanel تلقائياً بعد تحميل البيانات إذا كان هناك ?edit= في URL
  useEffect(() => {
    if (editIdFromUrl && !autoOpenDone && !wsLoading) {
      setEditPanel({ open: true, id: editIdFromUrl });
      setAutoOpenDone(true);
    }
  }, [editIdFromUrl, autoOpenDone, wsLoading]);

  const { data: joinRequests = [], isLoading: reqLoading } = useQuery({
    queryKey: ['joinRequests', user?.email],
    queryFn: () => user?.email ? base44.entities.JoinRequest.filter({ requester_email: user.email }) : [],
    enabled: !!user?.email,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', user?.email],
    queryFn: () => user?.email ? base44.entities.SubscriptionRecord.filter({ 
      user_email: user.email, 
      type: 'plan', 
      status: 'active',
      workspace_id: { $exists: true }
    }) : [],
    enabled: !!user?.email,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['workspaceMembers', user?.email],
    queryFn: () => user?.email ? base44.entities.WorkspaceMember.list() : [],
    enabled: !!user?.email,
  });

  const getMembersCount = (wsId) => allMembers.filter(m => m.workspace_id === wsId).length;

  const getPlanName = (ws) => {
    // البحث بالـ plan_id أولاً ثم بالاسم
    if (ws.plan_id) {
      const found = plans.find(p => p.id === ws.plan_id);
      if (found) return found.name;
    }
    // البحث عبر اسم الباقة المخزّن
    if (ws.plan) {
      const found = plans.find(p => p.name === ws.plan || p.id === ws.plan);
      if (found) return found.name;
    }
    // الرجوع للباقة المجانية
    const freePlan = plans.find(p => p.is_free);
    return freePlan ? freePlan.name : (ws.plan || 'مجانية');
  };

  const getActivePlan = () => {
    if (subscriptions.length === 0) return plans.find(p => p.is_free);
    const activeSub = subscriptions[0];
    return plans.find(p => p.id === activeSub.plan_id);
  };

  const canCreateWorkspace = () => {
    return { allowed: true };
  };



  const deleteWsMutation = useMutation({
    mutationFn: (id) => base44.entities.Workspace.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      refreshWorkspaces();
      toast({ title: "تم", description: "تم حذف مساحة العمل" });
    },
  });

  const handleDeleteWorkspace = (ws) => {
    // منع حذف مساحة العمل الإدارية (رقم 1)
    if (ws.workspace_number === 1) {
      toast({ title: "خطأ", description: "لا يمكن حذف مساحة العمل الإدارية", variant: "destructive" });
      return;
    }
    // منع حذف آخر مساحة عمل مملوكة للمستخدم
    const ownedWorkspaces = workspaces.filter(w => w.owner_email === user?.email);
    if (ownedWorkspaces.length <= 1) {
      toast({ title: "تنبيه", description: "لا يمكن حذف مساحة العمل الوحيدة — يجب أن يكون لديك مساحة عمل واحدة على الأقل", variant: "destructive" });
      return;
    }
    // تأكيد قبل الحذف
    if (confirm(`هل أنت متأكد من رغبتك في حذف مساحة العمل "${ws.name}"؟`)) {
      deleteWsMutation.mutate(ws.id);
    }
  };

  const cancelRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.JoinRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', user?.email] });
      toast({ title: "تم", description: "تم إلغاء الطلب" });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.JoinRequest.update(id, { status: 'approved', reviewed_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', user?.email] });
      toast({ title: "تم", description: "تم قبول الطلب" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.JoinRequest.update(id, { status: 'rejected', reviewed_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', user?.email] });
      toast({ title: "تم", description: "تم رفض الطلب" });
    },
  });

  const handleJoinBySlug = async () => {
    if (!joinSlug.trim()) {
      setJoinError('يرجى إدخال رمز مساحة العمل');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      // البحث عن مساحة العمل بالرمز
      const results = await base44.entities.Workspace.filter({ slug: joinSlug.trim() });
      if (!results || results.length === 0) {
        setJoinError('لم يتم العثور على مساحة عمل بهذا الرمز');
        setJoinLoading(false);
        return;
      }
      const ws = results[0];
      // التحقق أن المستخدم ليس بالفعل عضواً
      if (ws.owner_email === user?.email) {
        setJoinError('أنت مالك هذه المساحة بالفعل');
        setJoinLoading(false);
        return;
      }
      // التحقق من عدم وجود طلب سابق
      const existing = joinRequests.find(r => r.workspace_id === ws.id && r.requester_email === user?.email && r.status === 'pending');
      if (existing) {
        setJoinError('لديك طلب انضمام قيد الانتظار لهذه المساحة');
        setJoinLoading(false);
        return;
      }
      // إرسال طلب الانضمام
      await base44.entities.JoinRequest.create({
        workspace_id: ws.id,
        workspace_name: ws.name,
        workspace_logo: ws.logo_url || '',
        requester_email: user?.email,
        requester_name: user?.full_name || '',
        owner_email: ws.owner_email,
        status: 'pending',
      });
      queryClient.invalidateQueries({ queryKey: ['joinRequests', user?.email] });
      setJoinSlug('');
      toast({ title: "تم الإرسال", description: `تم إرسال طلب الانضمام إلى "${ws.name}" بنجاح` });
    } catch (err) {
      setJoinError('حدث خطأ، يرجى المحاولة مجدداً');
    }
    setJoinLoading(false);
  };

  const defaultWorkspaceId = user?.default_workspace_id;
  const { allowed: canCreate, reason: blockReason } = canCreateWorkspace();

  const filteredWorkspaces = workspaces.filter(w =>
    w.name?.toLowerCase().includes(wsSearch.toLowerCase()) ||
    w.owner_email?.toLowerCase().includes(wsSearch.toLowerCase())
  ).sort((a, b) => (a.workspace_number ?? 999) - (b.workspace_number ?? 999));

  const sentRequests = joinRequests.filter(r => r.requester_email === user?.email);
  const receivedRequests = joinRequests.filter(r => r.owner_email === user?.email);
  const activeRequests = reqSubTab === 'sent' ? sentRequests : receivedRequests;
  const filteredRequests = activeRequests.filter(r =>
    r.workspace_name?.toLowerCase().includes(reqSearch.toLowerCase()) ||
    r.owner_email?.toLowerCase().includes(reqSearch.toLowerCase())
  );

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link>
        <ArrowLeft size={12} />
        <span className="text-foreground font-medium">مساحات العمل</span>
      </div>

      {/* Header + Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مساحات العمل</h1>
          <p className="text-sm text-muted-foreground mt-1">{workspaces.length} مساحة عمل</p>
        </div>
        {tab === 'workspaces' && (
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                title="عرض جدول"
              >
                <TableIcon size={16} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 flex items-center justify-center transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                title="عرض بطاقات"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={() => setPanel({ open: true, id: null })}
              disabled={false}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              مساحة عمل جديدة
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 mb-5 w-fit">
        <button
          onClick={() => setTab('workspaces')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'workspaces' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          مساحات العمل
          <span className="mr-2 text-xs px-1.5 py-0.5 rounded-full bg-white/20">{workspaces.length}</span>
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'requests' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          طلبات الانضمام
          <span className="mr-2 text-xs px-1.5 py-0.5 rounded-full bg-white/20">{joinRequests.length}</span>
        </button>
      </div>

      {/* ===== TAB: مساحات العمل ===== */}
      {tab === 'workspaces' && (
        <div>
          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={wsSearch}
              onChange={e => setWsSearch(e.target.value)}
              placeholder="بحث في مساحات العمل..."
              className="w-full bg-card border border-border rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {wsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
              <Building2 size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">لا توجد مساحات عمل</p>
              <button
                onClick={() => setPanel({ open: true, id: null })}
                className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                إنشاء مساحة عمل
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" dir="rtl">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">#</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">رقم المساحة</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">المعرّف (ID)</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">الشعار</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">اسم مساحة العمل</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">عدد المستخدمين</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">المالك</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">طريقة الانضمام</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">نوع المستخدم</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">تاريخ الإنشاء</th>
                      <th className="text-center font-semibold px-3 py-3 sticky left-0 bg-inherit">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredWorkspaces.map((ws, i) => {
                        const isDefault = defaultWorkspaceId === ws.id;
                        const status = statusConfig[ws.status] || statusConfig.trial;
                        return (
                          <motion.tr
                            key={ws.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-t border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{i + 1}</td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <span className="font-bold text-primary text-sm">{ws.workspace_number ?? '-'}</span>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded select-all cursor-pointer" title="انقر للنسخ" onClick={() => { navigator.clipboard.writeText(ws.id); }}>
                                {ws.id}
                              </span>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <div className="flex justify-center">
                                {ws.logo_url ? (
                                  <img src={ws.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Building2 size={16} className="text-primary" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border font-semibold text-foreground">{ws.name}</td>
                             <td className="text-center px-3 py-3 border-l border-border">
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                                 {getMembersCount(ws.id)}
                               </span>
                             </td>
                             <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{ws.owner_email || '-'}</td>
                             <td className="text-center px-3 py-3 border-l border-border">
                              <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200">
                                {joinMethodLabels[ws.join_method] || joinMethodLabels['owner']}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <Badge variant="outline" className={`text-[10px] ${ws.owner_email === user?.email ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                                {ws.owner_email === user?.email ? 'مالك' : 'مستخدم'}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border text-xs text-muted-foreground">{formatDate(ws.created_date)}</td>
                            <td className="text-center px-3 py-3 sticky left-0 bg-card border-t border-border">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditPanel({ open: true, id: ws.id })}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                                >
                                  <Edit size={13} />
                                </button>
                                {ws.workspace_number !== 1 && (
                                  <button
                                    onClick={() => handleDeleteWorkspace(ws)}
                                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredWorkspaces.map((ws, i) => {
                  const status = statusConfig[ws.status] || statusConfig.trial;
                  const isDefault = defaultWorkspaceId === ws.id;
                  return (
                    <motion.div
                      key={ws.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            {ws.logo_url ? <img src={ws.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <Building2 size={22} className="text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{ws.name}</p>
                            <Badge variant="outline" className={`text-[10px] mt-1 ${status.class}`}>
                              <status.icon size={10} className="ml-1" />
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-all">
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditPanel({ open: true, id: ws.id })}>
                              <Edit size={13} className="ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            {ws.workspace_number !== 1 && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteWorkspace(ws)}>
                                <Trash2 size={13} className="ml-2" />
                                حذف
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                        <div>
                          <span className="block text-[10px] mb-0.5">الباقة</span>
                          <span className="font-medium text-foreground">{getPlanName(ws)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] mb-0.5">المستخدمون</span>
                          <span className="font-medium text-foreground">{getMembersCount(ws.id)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] mb-0.5">العملة</span>
                          <span className="font-medium text-foreground">{ws.currency || 'SAR'}</span>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: طلبات الانضمام ===== */}
      {tab === 'requests' && (
        <div>
          {/* بطاقة الانضمام */}
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <UserPlus size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">الانضمام لمساحة عمل</h3>
                <p className="text-xs text-muted-foreground">إرسال طلب انضمام — احصل على رمز مساحة العمل من مدير المساحة</p>
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  <Key size={12} className="inline ml-1" />
                  رمز مساحة العمل *
                </label>
                <input
                  value={joinSlug}
                  onChange={e => { setJoinSlug(e.target.value); setJoinError(''); }}
                  placeholder="أدخل رمز مساحة العمل"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                  onKeyDown={e => e.key === 'Enter' && handleJoinBySlug()}
                />
                {joinError && <p className="text-xs text-destructive mt-1">{joinError}</p>}
              </div>
              <button
                onClick={handleJoinBySlug}
                disabled={joinLoading}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
              >
                <UserPlus size={15} />
                {joinLoading ? 'جارٍ الإرسال...' : 'إرسال طلب انضمام'}
              </button>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1 mb-4 w-fit border border-border">
            <button
              onClick={() => setReqSubTab('sent')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${reqSubTab === 'sent' ? 'bg-white text-primary shadow border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              مرسلة
              <span className="mr-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{sentRequests.length}</span>
            </button>
            <button
              onClick={() => setReqSubTab('received')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${reqSubTab === 'received' ? 'bg-white text-primary shadow border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              مستلمة
              <span className="mr-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{receivedRequests.length}</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={reqSearch}
              onChange={e => setReqSearch(e.target.value)}
              placeholder="بحث في الطلبات..."
              className="w-full bg-card border border-border rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {reqLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
              <Building2 size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {reqSubTab === 'sent' ? 'لا توجد طلبات مرسلة' : 'لا توجد طلبات مستلمة'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" dir="rtl">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">#</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">الشعار</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">مساحة العمل</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">المالك</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">تاريخ الطلب</th>
                      <th className="text-center font-semibold px-3 py-3 border-l border-border">الحالة</th>
                      <th className="text-center font-semibold px-3 py-3 sticky left-0 bg-inherit">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredRequests.map((req, i) => {
                        const statusCfg = joinStatusConfig[req.status] || joinStatusConfig.pending;
                        return (
                          <motion.tr
                            key={req.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-t border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{i + 1}</td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <div className="flex justify-center">
                                {req.workspace_logo ? (
                                  <img src={req.workspace_logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Building2 size={16} className="text-primary" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center px-3 py-3 border-l border-border font-semibold text-foreground">{req.workspace_name || '-'}</td>
                            <td className="text-center px-3 py-3 border-l border-border text-muted-foreground text-xs">{req.owner_email || '-'}</td>
                            <td className="text-center px-3 py-3 border-l border-border text-xs text-muted-foreground">{formatDate(req.created_date)}</td>
                            <td className="text-center px-3 py-3 border-l border-border">
                              <Badge variant="outline" className={`text-[10px] ${statusCfg.class}`}>
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3 sticky left-0 bg-card border-t border-border">
                              {reqSubTab === 'sent' && req.status === 'pending' && (
                                <button
                                  onClick={() => cancelRequestMutation.mutate(req.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive hover:text-white transition-colors mx-auto"
                                >
                                  <XCircle size={12} />
                                  إلغاء
                                </button>
                              )}
                              {reqSubTab === 'received' && req.status === 'pending' && (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => acceptRequestMutation.mutate(req.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-colors"
                                  >
                                    <CheckCircle size={12} />
                                    قبول
                                  </button>
                                  <button
                                    onClick={() => rejectRequestMutation.mutate(req.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive hover:text-white transition-colors"
                                  >
                                    <XCircle size={12} />
                                    رفض
                                  </button>
                                </div>
                              )}
                              {req.status !== 'pending' && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SlidePanel - Create Workspace */}
      <SlidePanel open={panel.open} onClose={() => setPanel({ open: false, id: null })}>
        <WorkspaceForm
          embeddedId={panel.id}
          user={user}
          onClose={() => setPanel({ open: false, id: null })}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
            refetchWorkspaces();
            refreshWorkspaces();
          }}
        />
      </SlidePanel>

      {/* Edit Workspace Panel */}
      <WorkspaceEditPanel
        wsId={editPanel.id}
        open={editPanel.open}
        onClose={() => setEditPanel({ open: false, id: null })}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
          queryClient.invalidateQueries({ queryKey: ['workspace', editPanel.id] });
          refetchWorkspaces();
          refreshWorkspaces();
        }}
      />
    </div>
  );
}