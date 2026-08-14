import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, amount, currency, customer_name, customer_email, description, reference_id, billing_cycle, workspace_id } = body;

    if (!session_id) return Response.json({ error: 'session_id مطلوب' }, { status: 400 });

    // جلب إعدادات ماي فاتورة
    const settings = await base44.asServiceRole.entities.MyFatoorahSettings.list('-updated_date', 1);
    if (!settings || settings.length === 0) {
      return Response.json({ error: 'ماي فاتورة غير مُعدَّة' }, { status: 400 });
    }
    const cfg = settings[0];
    if (!cfg.is_enabled || !cfg.api_key) {
      return Response.json({ error: 'بوابة ماي فاتورة غير مفعّلة' }, { status: 400 });
    }

    const baseUrl = (cfg.base_url || 'https://api.myfatoorah.com').replace(/\/$/, '');
    const appUrl = Deno.env.get('APP_URL') || 'https://your-app.com';
    const successUrl = cfg.success_url || `${appUrl}/payment/success`;
    const errorUrl = cfg.error_url || `${appUrl}/payment/error`;

    const payload = {
      SessionId: session_id,
      InvoiceValue: Number(amount),
      DisplayCurrencyIso: currency || cfg.default_currency || 'SAR',
      CustomerName: customer_name || user.full_name,
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

    const res = await fetch(`${baseUrl}/v2/ExecutePayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.api_key.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('ExecutePayment response:', JSON.stringify(data));

    if (!data.IsSuccess) {
      return Response.json({ error: data.Message || 'فشل تنفيذ الدفع', details: data }, { status: 400 });
    }

    const invoiceData = data.Data;

    return Response.json({
      success: true,
      invoice_id: invoiceData.InvoiceId,
      payment_url: invoiceData.PaymentURL,
      is_direct_payment: invoiceData.IsDirectPayment,
      data: invoiceData
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});