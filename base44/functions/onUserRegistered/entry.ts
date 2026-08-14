import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // قراءة الـ payload
  let email = null, fullName = '', role = 'user';
  try {
    const body = await req.text();
    if (body) {
      const p = JSON.parse(body);
      email = p?.data?.email || p?.email || null;
      fullName = p?.data?.full_name || p?.full_name || '';
      role = p?.data?.role || p?.role || 'user';
    }
  } catch (_) {}

  if (!email) {
    try {
      const u = await base44.auth.me();
      email = u?.email || null;
      fullName = u?.full_name || '';
      role = u?.role || 'user';
    } catch (_) {}
  }

  if (!email) return Response.json({ error: 'No email' }, { status: 400 });

  console.log(`[reg] ${email} role=${role}`);

  // الخطوة 1: جلب user ID الحقيقي + فحص PlatformClient + فحص Workspace بالتوازي
  const [usersResult, existingClientsByEmail, existingClientsByCreator, existingWs] = await Promise.all([
    base44.asServiceRole.entities.User.filter({ email }),
    base44.asServiceRole.entities.PlatformClient.filter({ email }),
    base44.asServiceRole.entities.PlatformClient.filter({ created_by: email }),
    base44.asServiceRole.entities.Workspace.filter({ owner_email: email }),
  ]);
  // دمج النتائج وإزالة التكرار
  const clientMap = new Map();
  [...existingClientsByEmail, ...existingClientsByCreator].forEach(c => clientMap.set(c.id, c));
  const existingClients = Array.from(clientMap.values());

  // استخراج user_id الحقيقي من جدول Users
  const userId = usersResult?.[0]?.id || email; // fallback للـ email إن لم يوجد
  console.log(`[reg] userId=${userId} PC=${existingClients.length} WS=${existingWs.length}`);

  // الخطوة 2: PlatformClient إذا لم يكن موجوداً (منع التكرار بصرامة)
  if (existingClients.length === 0) {
    await base44.asServiceRole.entities.PlatformClient.create({
      email,
      owner_name: fullName,
      company_name: '',
      phone: '',
      status: 'active',
    });
    console.log(`[reg] PC created`);
  } else if (existingClients.length > 1) {
    // حذف المكررات والإبقاء على الأحدث
    const sorted = [...existingClients].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    for (let i = 1; i < sorted.length; i++) {
      await base44.asServiceRole.entities.PlatformClient.delete(sorted[i].id);
    }
    console.log(`[reg] PC duplicates removed, kept ${sorted[0].id}`);
  } else {
    console.log(`[reg] PC already exists, skipping`);
  }

  // الخطوة 3: Workspace للسوبر أدمن
  if (role === 'super_admin') {
    // فحص بشكل أشمل: أي workspace للسوبر أدمن بهذا الإيميل (سواء is_admin_workspace أو workspace_number=1)
    const adminWs = existingWs.filter(w => w.is_admin_workspace || w.workspace_number === 1 || w.workspace_owner_type === 'super_admin');
    if (adminWs.length === 0) {
      const newAdminWs = await base44.asServiceRole.entities.Workspace.create({
        name: 'مساحة العمل الإدارية',
        owner_user_id: userId,
        owner_email: email,
        workspace_number: 1,
        is_admin_workspace: true,
        is_protected: true,
        workspace_owner_type: 'super_admin',
        status: 'active',
        plan: 'enterprise',
      });
      console.log(`[reg] admin WS created id=${newAdminWs?.id}`);
    }
    return Response.json({ success: true });
  }

  // العملاء: تنظيف مكررات
  if (existingWs.length > 1) {
    const sorted = [...existingWs].sort((a, b) => (a.workspace_number || 999999) - (b.workspace_number || 999999));
    for (let i = 1; i < sorted.length; i++) {
      await base44.asServiceRole.entities.Workspace.delete(sorted[i].id);
    }
    console.log(`[reg] removed ${existingWs.length - 1} dups`);
    return Response.json({ success: true, workspace_id: sorted[0].id });
  }

  if (existingWs.length === 1) {
    console.log(`[reg] WS exists ok id=${existingWs[0].id}`);
    return Response.json({ success: true, workspace_id: existingWs[0].id });
  }

  // لا يوجد workspace — أنشئ واحداً جديداً
  // احسب الرقم من DB مباشرة لضمان عدم التكرار
  const allClientWs = await base44.asServiceRole.entities.Workspace.filter({ workspace_owner_type: 'client' });
  const maxNum = allClientWs.reduce((max, w) => Math.max(max, w.workspace_number || 100000000), 100000000);
  const nextNum = maxNum + 1;
  const wsName = fullName ? `مساحة ${fullName}` : 'مساحة العمل الافتراضية';

  const newWs = await base44.asServiceRole.entities.Workspace.create({
    name: wsName,
    owner_user_id: userId,
    owner_email: email,
    workspace_number: nextNum,
    is_admin_workspace: false,
    is_protected: false,
    workspace_owner_type: 'client',
    status: 'active',
    plan: 'free',
  });

  console.log(`[reg] WS created id=${newWs?.id}`);

  if (newWs?.id) {
    await base44.asServiceRole.entities.WorkspaceMember.create({
      workspace_id: newWs.id,
      workspace_name: newWs.name,
      owner_email: email,
      member_email: email,
      member_name: fullName,
      join_method: 'owner',
      join_date: new Date().toISOString(),
      role: 'owner',
      is_default: true,
    });
    console.log(`[reg] Member created. DONE`);

    // انتظر قليلاً لضمان اكتمال الكتابة في DB قبل إرسال الرد
    await new Promise(r => setTimeout(r, 1500));

    return Response.json({ success: true, workspace_id: newWs.id });
  }

  return Response.json({ success: false, error: 'workspace_create_failed' }, { status: 500 });
});