import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // جلب إعدادات ماي فاتورة - آخر سجل محدَّث
    const settings = await base44.asServiceRole.entities.MyFatoorahSettings.list('-updated_date', 1);
    if (!settings || settings.length === 0) {
      return Response.json({ success: false, message: 'لم يتم حفظ الإعدادات بعد' }, { status: 400 });
    }

    const cfg = settings[0];
    if (!cfg.api_key) {
      return Response.json({ success: false, message: 'مفتاح API غير موجود — أدخله أولاً' }, { status: 400 });
    }

    const baseUrl = (cfg.base_url || 'https://api.myfatoorah.com').replace(/\/$/, '');
    const apiKey = cfg.api_key.trim();

    console.log('Testing MyFatoorah connection:', { baseUrl, keyPrefix: apiKey.substring(0, 15) });

    // استخدام InitiatePayment مع بيانات بسيطة للتحقق من صحة المفتاح
    const res = await fetch(`${baseUrl}/v2/InitiatePayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        InvoiceAmount: 1,
        CurrencyIso: cfg.default_currency || 'SAR'
      })
    });

    const text = await res.text();
    console.log('InitiatePayment status:', res.status, 'body preview:', text.substring(0, 500));

    let data = {};
    try { data = JSON.parse(text); } catch(_) {}

    if (res.status === 200) {
      if (data.IsSuccess === true) {
        const methodsCount = data.Data?.PaymentMethods?.length || 0;
        return Response.json({ 
          success: true, 
          message: `✅ الاتصال ناجح — مفتاح API صالح${methodsCount > 0 ? ` (${methodsCount} طريقة دفع)` : ''}` 
        });
      }
      if (data.IsSuccess === false) {
        const errMsg = data.Message || data.ValidationErrors?.map(e => e.Error)?.join(', ') || 'خطأ غير معروف';
        // بعض الأخطاء تعني أن المفتاح صالح لكن هناك مشكلة في البيانات
        if (errMsg.includes('Currency') || errMsg.includes('Amount') || errMsg.includes('Invalid')) {
          return Response.json({ success: true, message: '✅ الاتصال ناجح — مفتاح API صالح' });
        }
        return Response.json({ success: false, message: `❌ رد من ماي فاتورة: ${errMsg}` });
      }
      return Response.json({ success: true, message: '✅ الاتصال ناجح — مفتاح API صالح' });
    }

    if (res.status === 401 || res.status === 403) {
      return Response.json({ success: false, message: '❌ مفتاح API غير مصرح — تحقق من المفتاح في لوحة ماي فاتورة' });
    }

    if (res.status === 404) {
      return Response.json({ success: false, message: `❌ رابط API غير صحيح: ${baseUrl} — تأكد من رابط الـ API` });
    }

    if (res.status === 500) {
      const errMsg = data.Message || data.message || '';
      return Response.json({ 
        success: false, 
        message: `❌ خطأ من ماي فاتورة (500): ${errMsg || 'تحقق من صحة المفتاح في لوحة تحكم ماي فاتورة'}`
      });
    }

    const errMsg = data.Message || data.message || `HTTP ${res.status}`;
    return Response.json({ 
      success: false, 
      message: `❌ فشل الاتصال: ${errMsg}` 
    });

  } catch (error) {
    return Response.json({ success: false, message: `خطأ: ${error.message}` }, { status: 500 });
  }
});