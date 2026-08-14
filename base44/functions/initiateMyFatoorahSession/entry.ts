import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { amount } = body;

    // جلب إعدادات ماي فاتورة
    const settings = await base44.asServiceRole.entities.MyFatoorahSettings.list('-updated_date', 1);
    if (!settings || settings.length === 0) {
      return Response.json({ error: 'ماي فاتورة غير مُعدَّة' }, { status: 400 });
    }
    const cfg = settings[0];
    if (!cfg.is_enabled || !cfg.api_key) {
      return Response.json({ error: 'بوابة ماي فاتورة غير مفعّلة أو مفتاح API مفقود' }, { status: 400 });
    }

    const baseUrl = (cfg.base_url || 'https://api.myfatoorah.com').replace(/\/$/, '');
    const apiKey = cfg.api_key.trim();

    // v3/sessions - COMPLETE_PAYMENT mode
    const sessionPayload = {
      PaymentMode: "COMPLETE_PAYMENT",
      Order: {
        Amount: Number(amount) || 1,
        Currency: cfg.default_currency || 'SAR'
      }
    };

    const res = await fetch(`${baseUrl}/v3/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sessionPayload)
    });

    const data = await res.json();
    console.log('v3/sessions response:', JSON.stringify(data));

    if (!data.IsSuccess) {
      return Response.json({ 
        error: data.Message || 'فشل إنشاء الجلسة', 
        details: data 
      }, { status: 400 });
    }

    // رابط CDN الرسمي لمكتبة MyFatoorah Embedded Payment
    // المصدر: https://docs.myfatoorah.com/docs/embedded-payment
    // الرابط الرسمي من وثائق MyFatoorah Embedded Payment
    const jsLibUrl = cfg.mode === 'live'
      ? 'https://portal.myfatoorah.com/sessions/v1/session.js'
      : 'https://demo.myfatoorah.com/sessions/v1/session.js';

    const sessionData = data.Data;

    // استخراج country code — من الحقل المحفوظ أولاً، ثم من base_url احتياطياً
    let countryCode = null;
    if (cfg.mode === 'live') {
      if (cfg.country_code) {
        countryCode = cfg.country_code; // SAU, ARE, QAT, EGY, KWT, BHR, OMN, JOR
      } else if (baseUrl.includes('api-sa')) countryCode = 'SAU';
      else if (baseUrl.includes('api-ae')) countryCode = 'ARE';
      else if (baseUrl.includes('api-qa')) countryCode = 'QAT';
      else if (baseUrl.includes('api-eg')) countryCode = 'EGY';
      else countryCode = 'SAU';
    }
    // في وضع test لا نمرر countryCode لتجنب "SessionId is not valid"

    return Response.json({
      success: true,
      session_id: sessionData.SessionId,
      encryption_key: sessionData.EncryptionKey,
      country_code: countryCode,
      currency: sessionData.Order?.Currency || cfg.default_currency || 'SAR',
      js_lib_url: jsLibUrl,
    });

  } catch (error) {
    console.error('initiateMyFatoorahSession error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});