import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    console.log('MyFatoorah Webhook received:', JSON.stringify(body));

    // استخراج بيانات الدفع
    const { Data } = body;
    if (!Data) {
      return Response.json({ error: 'No data in webhook' }, { status: 400 });
    }

    const invoiceStatus = Data.InvoiceStatus; // 'Paid' | 'Failed' | 'Expired'
    const invoiceId = Data.InvoiceId;
    const referenceId = Data.CustomerReference; // reference_id الذي أرسلناه

    if (invoiceStatus !== 'Paid') {
      console.log(`Invoice ${invoiceId} status: ${invoiceStatus} — skipping`);
      return Response.json({ received: true, status: invoiceStatus });
    }

    // جلب إعدادات ماي فاتورة للتحقق من صحة الـ webhook
    const settings = await base44.asServiceRole.entities.MyFatoorahSettings.list();
    const cfg = settings?.[0];
    if (!cfg || !cfg.is_enabled) {
      return Response.json({ error: 'MyFatoorah not configured' }, { status: 400 });
    }

    // البحث عن PaymentTransaction مرتبط بـ referenceId
    // referenceId يكون بصيغة: installedAppId_workspaceId_timestamp أو ما يشبه ذلك
    console.log(`Payment successful for invoice ${invoiceId}, reference: ${referenceId}`);

    // إذا كان referenceId يحتوي على installedAppId:workspaceId
    if (referenceId && referenceId.includes(':')) {
      const [installedAppId, workspaceId] = referenceId.split(':');

      // جلب InstalledApp وتفعيله
      const installedApps = await base44.asServiceRole.entities.InstalledApp.filter({ id: installedAppId });
      if (installedApps && installedApps.length > 0) {
        const app = installedApps[0];
        const now = new Date();
        const billingCycle = app.billing_cycle || 'monthly';
        const endDate = new Date(now);
        if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        await base44.asServiceRole.entities.InstalledApp.update(installedAppId, {
          status: 'active',
          payment_status: 'paid',
          subscription_ends_at: endDate.toISOString().split('T')[0]
        });

        // إنشاء SubscriptionRecord
        await base44.asServiceRole.entities.SubscriptionRecord.create({
          user_email: app.created_by || '',
          workspace_id: workspaceId,
          name: app.app_name || 'اشتراك',
          type: 'app',
          app_id: app.app_id,
          subscription_source: 'addon',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          amount: Data.InvoiceValue || 0,
          currency: Data.Currency || 'SAR',
          billing_cycle: billingCycle,
          status: 'active',
          payment_id: String(invoiceId)
        });

        console.log(`InstalledApp ${installedAppId} activated successfully`);
      }
    }

    return Response.json({ received: true, status: 'processed' });

  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});