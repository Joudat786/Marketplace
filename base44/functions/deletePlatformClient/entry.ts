import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'clientId is required' }, { status: 400 });
    }

    // جلب البريد الإلكتروني للعميل - جلب الكل ثم فلترة يدوية
    const allClients = await base44.asServiceRole.entities.PlatformClient.list();
    const clientRecord = (allClients || []).find(c => c.id === clientId);
    const clientEmail = clientRecord?.email;

    // حذف جميع البيانات المرتبطة بالعميل
    if (clientEmail) {
      const workspaces = await base44.asServiceRole.entities.Workspace.filter({ owner_email: clientEmail });

      if (workspaces && workspaces.length > 0) {
        for (const ws of workspaces) {
          // 1. حذف التطبيقات المثبتة لهذه المساحة
          const installedApps = await base44.asServiceRole.entities.InstalledApp.filter({ workspace_id: ws.id });
          for (const app of installedApps || []) {
            await base44.asServiceRole.entities.InstalledApp.delete(app.id);
          }

          // 2. حذف أعضاء مساحة العمل (WorkspaceMembers)
          const members = await base44.asServiceRole.entities.WorkspaceMember.filter({ workspace_id: ws.id });
          for (const member of members || []) {
            await base44.asServiceRole.entities.WorkspaceMember.delete(member.id);
          }

          // 3. حذف طلبات الانضمام (JoinRequests)
          const joinReqs = await base44.asServiceRole.entities.JoinRequest.filter({ workspace_id: ws.id });
          for (const req of joinReqs || []) {
            await base44.asServiceRole.entities.JoinRequest.delete(req.id);
          }

          // 4. حذف سجلات الاشتراكات (SubscriptionRecords)
          const subs = await base44.asServiceRole.entities.SubscriptionRecord.filter({ workspace_id: ws.id });
          for (const sub of subs || []) {
            await base44.asServiceRole.entities.SubscriptionRecord.delete(sub.id);
          }

          // 5. حذف الإعدادات العامة المرتبطة بالمساحة (GeneralSettings)
          const settings = await base44.asServiceRole.entities.GeneralSettings.filter({ workspace_id: ws.id });
          for (const s of settings || []) {
            await base44.asServiceRole.entities.GeneralSettings.delete(s.id);
          }

          // 6. حذف مساحة العمل نفسها
          await base44.asServiceRole.entities.Workspace.delete(ws.id);
        }
      }

      // حذف اشتراكات العميل المرتبطة بالـ email مباشرة
      const clientSubs = await base44.asServiceRole.entities.SubscriptionRecord.filter({ user_email: clientEmail });
      for (const sub of clientSubs || []) {
        await base44.asServiceRole.entities.SubscriptionRecord.delete(sub.id);
      }

      // حذف طلبات الانضمام المرسلة من العميل
      const sentReqs = await base44.asServiceRole.entities.JoinRequest.filter({ requester_email: clientEmail });
      for (const req of sentReqs || []) {
        await base44.asServiceRole.entities.JoinRequest.delete(req.id);
      }

      // ملاحظة: لا يمكن حذف المستخدمين من User entity عبر SDK - يتم تجاهل هذه الخطوة
    }

    // حذف العميل من PlatformClient - بدون asServiceRole لتجاوز مشكلة RLS
    await base44.entities.PlatformClient.delete(clientId);

    return Response.json({ 
      success: true, 
      message: 'تم حذف العميل وجميع بياناته والتطبيقات المثبتة بنجاح'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});