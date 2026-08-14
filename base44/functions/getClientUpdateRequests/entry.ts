import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // جلب طلبات التحديث المرتبطة بهذا المستخدم
    // نجلب بـ client_email و created_by معاً لضمان الحصول على كل الطلبات
    const [byEmail, byCreator] = await Promise.all([
      base44.asServiceRole.entities.ClientUpdateRequest.filter({ client_email: user.email }),
      base44.asServiceRole.entities.ClientUpdateRequest.filter({ created_by: user.email }),
    ]);
    const map = new Map();
    [...(byEmail || []), ...(byCreator || [])].forEach(r => map.set(r.id, r));
    const allRequests = Array.from(map.values());

    const sorted = (allRequests || []).sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );

    return Response.json({ requests: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});