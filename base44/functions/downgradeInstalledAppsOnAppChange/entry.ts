import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // استخراج البيانات من automation payload
    const appId = body.event?.entity_id || body.appId;
    const isFree = body.data?.is_free !== undefined ? body.data.is_free : body.isFree;
    const oldIsFree = body.old_data?.is_free !== undefined ? body.old_data.is_free : body.oldIsFree;

    console.log(`[downgradeInstalledAppsOnAppChange] 📥 Payload received:`, { appId, isFree, oldIsFree });

    // فقط إذا تحول من مدفوع لمجاني
    if (oldIsFree === false && isFree === true) {
      console.log(`[downgradeInstalledAppsOnAppChange] 🔄 التطبيق ${appId} تحول من مدفوع لمجاني`);

      // جلب جميع التثبيتات المدفوعة/المعلقة
      const installedApps = await base44.asServiceRole.entities.InstalledApp.filter({
        app_id: appId,
        payment_status: 'unpaid'
      });

      console.log(`[downgradeInstalledAppsOnAppChange] 📊 وجدنا ${installedApps.length} تثبيت مدفوع`);

      // تحديث جميعها
      for (const installed of installedApps) {
        await base44.asServiceRole.entities.InstalledApp.update(installed.id, {
          payment_status: 'free',
          status: 'active'
        });
        console.log(`[downgradeInstalledAppsOnAppChange] ✅ تم تحديث التثبيت ${installed.id}`);
      }

      return Response.json({
        success: true,
        message: `تم تحديث ${installedApps.length} تثبيت`,
        updatedCount: installedApps.length
      });
    }

    return Response.json({
      success: true,
      message: 'لا يوجد تحديث مطلوب',
      updatedCount: 0
    });
  } catch (error) {
    console.error('[downgradeInstalledAppsOnAppChange] ❌ خطأ:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});