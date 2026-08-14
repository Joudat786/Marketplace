import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // استخراج البيانات من automation payload
    // الـ automation يرسل: { event: {...}, data: {...app fields...}, old_data: {...previous fields...} }
    const appId = body.event?.entity_id || body.appId;
    const isFree = body.data?.is_free !== undefined ? body.data.is_free : body.isFree;
    const oldIsFree = body.old_data?.is_free !== undefined ? body.old_data.is_free : body.oldIsFree;

    console.log(`[updateInstalledAppsOnAppChange] 📥 Payload received:`, { appId, isFree, oldIsFree });

    // فقط إذا تحول من مجاني لمدفوع
    if (oldIsFree === true && isFree === false) {
      console.log(`[updateInstalledAppsOnAppChange] 🔄 التطبيق ${appId} تحول من مجاني لمدفوع`);

      // جلب جميع التثبيتات القديمة (بغض النظر عن حالة الدفع)
      const installedApps = await base44.asServiceRole.entities.InstalledApp.filter({
        app_id: appId
      });

      console.log(`[updateInstalledAppsOnAppChange] 📊 وجدنا ${installedApps.length} تثبيت قديم`);

      // تحديث جميعها فقط إذا كانت في حالة مجانية أو نشطة أو تجريبية
      for (const installed of installedApps) {
        if (installed.payment_status === 'free' || installed.payment_status === 'trial' || installed.status === 'active') {
          await base44.asServiceRole.entities.InstalledApp.update(installed.id, {
            payment_status: 'unpaid',
            status: 'pending_payment'
          });
          console.log(`[updateInstalledAppsOnAppChange] ✅ تم تحديث التثبيت ${installed.id}`);
        }
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
    console.error('[updateInstalledAppsOnAppChange] ❌ خطأ:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});