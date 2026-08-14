import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const email = user.email;
  const userId = user.id;
  const isSuperAdmin = user.role === 'super_admin';

  try {
    let workspaces = [];

    if (isSuperAdmin) {
      // السوبر أدمن: RLS يسمح له برؤية كل المساحات — استخدم user token مباشرة
      // list بدون فلتر يجلب كل ما يراه المستخدم حسب RLS
      const allWs = await base44.entities.Workspace.list('workspace_number', 500);
      console.log(`[super_admin] via user token list: ${allWs.length}`);
      // فلتر فقط super_admin workspaces
      workspaces = allWs.filter(w => w.workspace_owner_type === 'super_admin');
      console.log(`[super_admin] filtered super_admin: ${workspaces.length}`);
    } else {
      // العميل: نجلب بطرق متعددة ونجمعها
      const combinedMap = new Map();

      // الطريقة 1: جلب بـ owner_email (user token)
      try {
        const byOwnerEmail = await base44.entities.Workspace.filter({ owner_email: email });
        console.log(`[1] byOwnerEmail: ${byOwnerEmail.length}`);
        byOwnerEmail.forEach(w => combinedMap.set(w.id, w));
      } catch (e) { console.warn('[1] error:', e.message); }

      // الطريقة 2: جلب بـ owner_user_id (user token)
      try {
        const byUserId = await base44.entities.Workspace.filter({ owner_user_id: userId });
        console.log(`[2] byUserId: ${byUserId.length}`);
        byUserId.forEach(w => combinedMap.set(w.id, w));
      } catch (e) { console.warn('[2] error:', e.message); }

      // الطريقة 3: جلب بـ created_by (user token)
      try {
        const byCreatedBy = await base44.entities.Workspace.filter({ created_by: email });
        console.log(`[3] byCreatedBy: ${byCreatedBy.length}`);
        byCreatedBy.forEach(w => combinedMap.set(w.id, w));
      } catch (e) { console.warn('[3] error:', e.message); }

      // الطريقة 4: جلب بـ asServiceRole مع فلتر owner_email
      try {
        const srByEmail = await base44.asServiceRole.entities.Workspace.filter({ owner_email: email });
        console.log(`[4] asServiceRole byOwnerEmail: ${srByEmail.length}`);
        srByEmail.forEach(w => combinedMap.set(w.id, w));
      } catch (e) { console.warn('[4] error:', e.message); }

      // الطريقة 5: جلب بـ asServiceRole مع فلتر owner_user_id
      try {
        const srByUserId = await base44.asServiceRole.entities.Workspace.filter({ owner_user_id: userId });
        console.log(`[5] asServiceRole byUserId: ${srByUserId.length}`);
        srByUserId.forEach(w => combinedMap.set(w.id, w));
      } catch (e) { console.warn('[5] error:', e.message); }

      console.log(`[client] combined owned: ${combinedMap.size} for ${email}`);

      // مساحات العضوية
      try {
        const memberships = await base44.entities.WorkspaceMember.filter({ member_email: email });
        const ownedIds = new Set(combinedMap.keys());
        for (const m of memberships) {
          if (m.workspace_id && !ownedIds.has(m.workspace_id)) {
            const wsArr = await base44.asServiceRole.entities.Workspace.filter({ id: m.workspace_id });
            if (wsArr.length > 0) combinedMap.set(wsArr[0].id, wsArr[0]);
          }
        }
      } catch (e) { console.warn('[memberships] error:', e.message); }

      workspaces = Array.from(combinedMap.values());
      console.log(`[client] final: ${workspaces.length}`);
    }

    // دمج logo_url من GeneralSettings (ws_brand) لكل workspace
    // هذا يضمن ظهور الشعار في القائمة الجانبية حتى لو لم يُحفظ في Workspace entity مباشرة
    if (workspaces.length > 0) {
      try {
        const wsIds = workspaces.map(w => w.id);
        // جلب إعدادات العلامة التجارية لكل مساحة
        const brandSettingsAll = await base44.asServiceRole.entities.GeneralSettings.filter({
          settings_type: "ws_brand"
        });
        // بناء map: workspace_id → light_logo_url
        const logoMap = {};
        for (const s of brandSettingsAll) {
          if (s.workspace_id && s.light_logo_url) {
            logoMap[s.workspace_id] = s.light_logo_url;
          }
        }
        // تحديث logo_url في كل workspace — GeneralSettings (ws_brand) تأخذ الأولوية دائماً
        workspaces = workspaces.map(w => ({
          ...w,
          logo_url: logoMap[w.id] || w.logo_url || null
        }));
      } catch (e) {
        console.warn('[getUserWorkspaces] brand merge error:', e.message);
      }
    }

    return Response.json({ workspaces });
  } catch (e) {
    console.error('[getUserWorkspaces] error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
});