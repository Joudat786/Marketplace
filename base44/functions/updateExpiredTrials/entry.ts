import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const allApps = await base44.asServiceRole.entities.InstalledApp.list();
    const today = new Date();
    const updates = [];

    for (const app of allApps) {
      const trialEndsAt = app.trial_ends_at;
      const subscriptionEndsAt = app.subscription_ends_at;
      const currentStatus = app.status;
      const currentPaymentStatus = app.payment_status;

      // normalize: إضافة Z إذا لم يكن موجوداً لضمان تفسير UTC صحيح
      const normalizeDate = (v) => {
        if (!v) return null;
        if (typeof v === "string" && !/Z|[+-]\d{2}:?\d{2}$/.test(v.trim())) return new Date(v.trim() + "Z");
        return new Date(v);
      };

      // فحص انتهاء الفترة التجريبية
      if (trialEndsAt && today > normalizeDate(trialEndsAt) && currentStatus !== 'expired') {
        // إذا كان تجريبياً فقط، غيّر الحالة إلى منتهي
        if (currentPaymentStatus === 'trial') {
          await base44.asServiceRole.entities.InstalledApp.update(app.id, {
            status: 'expired',
            payment_status: 'unpaid'
          });

          updates.push({
            id: app.id,
            app_id: app.app_id,
            reason: 'trial_expired',
            expired_date: trialEndsAt
          });
        }
      }

      // فحص انتهاء الاشتراك المدفوع
      if (subscriptionEndsAt && today > normalizeDate(subscriptionEndsAt) && currentStatus !== 'expired') {
        // إذا كان مدفوعاً، غيّر الحالة إلى منتهي
        if (currentPaymentStatus === 'paid') {
          await base44.asServiceRole.entities.InstalledApp.update(app.id, {
            status: 'expired',
            payment_status: 'unpaid'
          });

          updates.push({
            id: app.id,
            app_id: app.app_id,
            reason: 'subscription_expired',
            expired_date: subscriptionEndsAt
          });
        }
      }
    }

    return Response.json({
      success: true,
      total_checked: allApps.length,
      total_updated: updates.length,
      updates
    });
  } catch (error) {
    console.error('Error updating expired subscriptions:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});