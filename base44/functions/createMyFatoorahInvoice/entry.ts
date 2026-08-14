import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, currency, customer_name, customer_email, description, reference_id, billing_cycle, workspace_id } = body;

    // جلب إعدادات ماي فاتورة
    const settings = await base44.asServiceRole.entities.MyFatoorahSettings.list();
    if (!settings || settings.length === 0) {
      return Response.json({ error: 'ماي فاتورة غير مُعدَّة بعد' }, { status: 400 });
    }
    const cfg = settings[0];
    if (!cfg.is_enabled) {
      return Response.json({ error: 'بوابة ماي فاتورة غير مفعّلة' }, { status: 400 });
    }
    if (!cfg.api_key) {
      return Response.json({ error: 'مفتاح API غير موجود' }, { status: 400 });
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://your-app.com';
    const successUrl = cfg.success_url || `${appUrl}/payment/success`;
    const errorUrl = cfg.error_url || `${appUrl}/payment/error`;

    const payload = {
      CustomerName: customer_name || user.full_name,
      NotificationOption: 'LNK',
      InvoiceValue: Number(amount),
      DisplayCurrencyIso: currency || cfg.default_currency || 'SAR',
      CustomerEmail: customer_email || user.email,
      CallBackUrl: successUrl,
      ErrorUrl: errorUrl,
      Language: 'ar',
      CustomerReference: reference_id || '',
      InvoiceItems: [
        {
          ItemName: description || 'اشتراك',
          Quantity: 1,
          UnitPrice: Number(amount)
        }
      ]
    };

    const res = await fetch(`${cfg.base_url}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.IsSuccess) {
      return Response.json({ error: data.Message || 'فشل إنشاء الفاتورة', details: data }, { status: 400 });
    }

    const invoiceData = data.Data;

    return Response.json({
      success: true,
      invoice_id: invoiceData.InvoiceId,
      invoice_url: invoiceData.InvoiceURL,
      invoice_key: invoiceData.InvoiceKey,
      data: invoiceData
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});