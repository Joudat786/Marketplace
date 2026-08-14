import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // الخطوة 1: إنشاء workspace تجريبي
  const testEmail = `debugws_${Date.now()}@test.com`;
  const created = await base44.asServiceRole.entities.Workspace.create({
    name: 'مساحة اختبار كاملة',
    owner_email: testEmail,
    workspace_number: 999999,
    is_admin_workspace: false,
    workspace_owner_type: 'client',
    status: 'active',
    plan: 'free',
  });
  console.log(`[debug] created id: ${created?.id} email: ${testEmail}`);

  // الخطوة 2: انتظر 1 ثانية
  await new Promise(r => setTimeout(r, 1000));

  // الخطوة 3: فلتر بالـ owner_email
  const found = await base44.asServiceRole.entities.Workspace.filter({ owner_email: testEmail });
  console.log(`[debug] found by email: ${found.length}`);

  // الخطوة 4: عدد كل الـ workspaces
  const all = await base44.asServiceRole.entities.Workspace.list('-created_date', 200);
  console.log(`[debug] total workspaces: ${all.length}`);

  // الخطوة 5: تنظيف
  if (created?.id) {
    await base44.asServiceRole.entities.Workspace.delete(created.id);
    console.log(`[debug] deleted`);
  }

  // الخطوة 6: تحقق من workspaces الاختبارات السابقة وتنظيفها
  const testEmails = [
    'verifyjourney@test.com',
    'finaltest2026ok@test.com',
    'newuser_fulltest@test.com',
    'brandnew2026@test.com',
  ];
  let cleaned = 0;
  for (const email of testEmails) {
    const ws = await base44.asServiceRole.entities.Workspace.filter({ owner_email: email });
    const pc = await base44.asServiceRole.entities.PlatformClient.filter({ email });
    const members = await base44.asServiceRole.entities.WorkspaceMember.filter({ member_email: email });
    for (const r of members) { await base44.asServiceRole.entities.WorkspaceMember.delete(r.id); cleaned++; }
    for (const r of ws) { await base44.asServiceRole.entities.Workspace.delete(r.id); cleaned++; }
    for (const r of pc) { await base44.asServiceRole.entities.PlatformClient.delete(r.id); cleaned++; }
  }
  console.log(`[debug] cleaned test records: ${cleaned}`);

  return Response.json({
    created_id: created?.id,
    found_by_email: found.length,
    total: all.length,
    found_ids: found.map(w => w.id),
    cleaned_test_records: cleaned,
  });
});