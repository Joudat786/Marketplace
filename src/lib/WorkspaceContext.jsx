import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const WorkspaceContext = createContext(null);

const CACHE_KEY = "ws_cache";
const SELECTED_KEY = "ws_selected";
const EMAIL_KEY = "ws_email";

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
};
const writeCache = (list) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
};

export function WorkspaceProvider({ children }) {
  const [searchParams] = useSearchParams();
  const urlWorkspaceId = searchParams.get("workspace");
  const { user } = useAuth();

  // قراءة الكاش فوراً — هذا يمنع أي flash لشاشة التحميل
  const cached = readCache();
  const [workspaces, setWorkspaces] = useState(cached);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    () => localStorage.getItem(SELECTED_KEY) || null
  );
  // لا نعرض شاشة تحميل أبداً — نعتمد على الكاش فوراً
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  const fetchingRef = useRef(false);
  const isSuperAdmin = user?.role === 'super_admin';

  const pickWorkspace = useCallback((list) => {
    if (!list.length) return null;
    if (urlWorkspaceId && list.some(w => w.id === urlWorkspaceId)) return urlWorkspaceId;
    const storedId = localStorage.getItem(SELECTED_KEY);
    if (storedId && list.some(w => w.id === storedId)) return storedId;
    const adminWs = list.find(w => w.is_admin_workspace);
    return adminWs?.id || list[0]?.id;
  }, [urlWorkspaceId]);

  const applyWorkspaces = useCallback((list) => {
    const sorted = [...list].sort((a, b) => {
      if (a.is_admin_workspace) return -1;
      if (b.is_admin_workspace) return 1;
      return (a.workspace_number || 999999) - (b.workspace_number || 999999);
    });
    setWorkspaces(sorted);
    writeCache(sorted);

    // لا تُغير المساحة المختارة إذا كانت لا تزال موجودة في القائمة الجديدة
    setSelectedWorkspaceId(prev => {
      const stillExists = prev && sorted.some(w => w.id === prev);
      if (stillExists) return prev; // حافظ على الاختيار الحالي
      const wsId = pickWorkspace(sorted);
      if (wsId) {
        localStorage.setItem(SELECTED_KEY, wsId);
        return wsId;
      }
      return prev;
    });

    setIsLoadingWorkspace(false);
  }, [pickWorkspace]);

  useEffect(() => {
    if (!user?.email) {
      // تسجيل خروج فعلي — امسح كل شيء
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
      setIsLoadingWorkspace(false);
      fetchingRef.current = false;
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(SELECTED_KEY);
        localStorage.removeItem(EMAIL_KEY);
      } catch {}
      return;
    }

    // تغيير حساب (مستخدم مختلف تماماً) — امسح كاش المستخدم السابق
    const savedEmail = localStorage.getItem(EMAIL_KEY);
    if (savedEmail && savedEmail !== user.email) {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(SELECTED_KEY);
      } catch {}
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
      setIsLoadingWorkspace(true);
      fetchingRef.current = false;
    }
    // احفظ الـ email الحالي دائماً
    try { localStorage.setItem(EMAIL_KEY, user.email); } catch {}

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // دائماً امسح الكاش القديم عند كل تحميل لضمان الحصول على أحدث المساحات
    try { localStorage.removeItem(CACHE_KEY); } catch {}

    const currentCache = readCache();
    const hasCachedData = false; // نُعطّل الكاش دائماً لضمان جلب أحدث البيانات
    const email = user.email;
    const fullName = user.full_name || '';
    const role = user.role || 'user';

    const doFetch = async () => {
      try {
        const response = await base44.functions.invoke('getUserWorkspaces', {});
        const results = response?.data?.workspaces;
        if (results && results.length > 0) {
          // امسح الكاش القديم دائماً قبل تطبيق النتائج الجديدة
          try { localStorage.removeItem(CACHE_KEY); } catch {}
          applyWorkspaces(results);
          fetchingRef.current = false;
          return true;
        }
        // إذا عاد response ناجح لكن بقائمة فارغة (ليس خطأ) — لا تعتبره فشلاً
        if (results && results.length === 0 && response?.data) {
          return false; // مستخدم جديد لا يملك workspaces بعد
        }
      } catch (err) {
        console.error("[WorkspaceContext] fetch error:", err);
      }
      return false;
    };

    const tryFetch = async () => {
      // انتظر 800ms لضمان أن الـ token جاهز في SDK بعد تحميل المستخدم
      await new Promise(r => setTimeout(r, 800));

      if (hasCachedData) {
        // مستخدم قديم لديه كاش → امسح الكاش وحدّث فوراً للحصول على أحدث البيانات
        try { localStorage.removeItem(CACHE_KEY); } catch {}
        await doFetch();
        return;
      }

      // لا كاش → جلب مباشر عبر getUserWorkspaces
      const fetched = await doFetch();
      if (fetched) return;

      // لم يُرجع شيء → تحقق هل هو مستخدم جديد
      let workspaceExistsInDB = false;
      try {
        const existing = await base44.entities.Workspace.filter({ owner_email: email });
        workspaceExistsInDB = existing && existing.length > 0;
      } catch (e) {
        console.error("[WorkspaceContext] DB check error:", e);
      }

      if (workspaceExistsInDB) {
        // workspace موجود لكن getUserWorkspaces أرجع فارغ → retry
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(r => setTimeout(r, 1500));
          if (await doFetch()) return;
        }
        setIsLoadingWorkspace(false);
        fetchingRef.current = false;
        return;
      }

      // مستخدم جديد حقاً — استدعِ onUserRegistered مباشرة
      console.log("[WorkspaceContext] New user, calling onUserRegistered...");
      try {
        await base44.functions.invoke('onUserRegistered', {
          data: { email, full_name: fullName, role }
        });
        console.log("[WorkspaceContext] onUserRegistered called successfully");
      } catch (e) {
        console.error("[WorkspaceContext] onUserRegistered error:", e);
      }

      // انتظر إنشاء البيانات ثم جلبها
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        if (await doFetch()) return;
      }

      console.error("[WorkspaceContext] Failed after all retries");
      setIsLoadingWorkspace(false);
      fetchingRef.current = false;
    };

    tryFetch();
  }, [user?.email, applyWorkspaces]);

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) || workspaces[0] || null;

  const switchWorkspace = (wsId) => {
    if (wsId && workspaces.some(w => w.id === wsId)) {
      setSelectedWorkspaceId(wsId);
      localStorage.setItem(SELECTED_KEY, wsId);
    }
  };

  // تحديث بيانات workspace معين مباشرة في الـ state (بدون إعادة fetch)
  const updateWorkspaceData = useCallback((wsId, newData) => {
    setWorkspaces(prev => {
      const updated = prev.map(w => w.id === wsId ? { ...w, ...newData } : w);
      writeCache(updated);
      return updated;
    });
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!user?.email) return [];
    try {
      // امسح الكاش أولاً لضمان عدم عرض بيانات قديمة
      try { localStorage.removeItem(CACHE_KEY); } catch {}
      // أعد تمكين الجلب
      fetchingRef.current = false;
      const response = await base44.functions.invoke('getUserWorkspaces', {});
      const results = response?.data?.workspaces;
      if (results && results.length > 0) {
        applyWorkspaces(results);
        return results;
      }
    } catch (err) {
      console.error("[WorkspaceContext] refreshWorkspaces error:", err);
    }
    return [];
  }, [user?.email, applyWorkspaces]);

  const getNextWorkspaceNumber = () => {
    if (isSuperAdmin) {
      const nums = workspaces
        .filter(w => w.workspace_owner_type === 'super_admin' && !w.is_admin_workspace)
        .map(w => w.workspace_number || 1);
      return (nums.length ? Math.max(...nums) : 1) + 1;
    } else {
      const nums = workspaces
        .filter(w => w.workspace_owner_type === 'client')
        .map(w => w.workspace_number || 100000000);
      return (nums.length ? Math.max(...nums) : 100000000) + 1;
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      selectedWorkspace,
      switchWorkspace,
      workspaces,
      isSuperAdmin,
      getNextWorkspaceNumber,
      isLoadingWorkspace,
      refreshWorkspaces,
      updateWorkspaceData,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}