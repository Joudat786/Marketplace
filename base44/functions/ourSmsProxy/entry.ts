import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE_URL = 'https://api.oursms.com';

async function callOurSms(endpoint, method, token, body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const text = await res.text();
  if (!text || text.trim() === '') return { _empty: true, _status: res.status };
  try { return JSON.parse(text); } catch { return { _raw: text, _status: res.status }; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    // ─── عرض الرصيد ───
    if (action === 'getCredits') {
      const { token } = payload;
      if (!token) return Response.json({ success: false, error: 'Token مطلوب' });

      const data = await callOurSms('/billing/credits', 'GET', token);
      if (data?._empty) return Response.json({ success: false, error: 'لم يتم استلام رد من الخادم' });
      if (data?.credits !== undefined) return Response.json({ success: true, credits: data.credits });
      return Response.json({ success: false, error: data?.message || data?.error || JSON.stringify(data) });
    }

    // ─── اختبار الاتصال ───
    if (action === 'testConnection') {
      const { token } = payload;
      if (!token) return Response.json({ success: false, error: 'Token مطلوب' });

      const data = await callOurSms('/billing/credits', 'GET', token);
      if (data?._empty) return Response.json({ success: false, error: 'لم يتم استلام رد من الخادم' });
      if (data?.credits !== undefined) return Response.json({ success: true, credits: data.credits });
      return Response.json({ success: false, error: data?.message || data?.error || JSON.stringify(data) });
    }

    // ─── إرسال رسالة تجريبية ───
    if (action === 'sendTestSms') {
      const { token, src, mobile, message } = payload;
      if (!token || !mobile || !message) {
        return Response.json({ success: false, error: 'جميع الحقول مطلوبة (token, mobile, message)' });
      }

      const smsBody = {
        src: src || 'OurSMS',
        dests: [mobile],
        body: message,
        priority: 0,
        delay: 0,
        validity: 0,
        maxParts: 0,
        dlr: false,
        prevDups: 0
      };

      const data = await callOurSms('/msgs/sms', 'POST', token, smsBody);

      if (data?._empty) return Response.json({ success: false, error: 'لم يتم استلام رد من الخادم' });

      if (data?.numSent > 0 || data?.jobId || data?.msgIds?.length > 0) {
        return Response.json({ success: true, message: `تم إرسال الرسالة بنجاح ✅ (${data.numSent ?? 1} رسالة)` });
      }

      return Response.json({ success: false, error: data?.message || data?.error || data?._raw || JSON.stringify(data) });
    }

    // ─── جلب عناوين المرسل المتاحة ───
    if (action === 'getSenders') {
      const { token } = payload;
      if (!token) return Response.json({ success: false, error: 'Token مطلوب' });

      try {
        const data = await callOurSms('/addresses/srcs', 'GET', token);
        if (data?._empty) return Response.json({ success: false, error: 'لم يتم استلام رد' });
        
        // محاولات متعددة لاستخراج البيانات
        let srcs = [];
        if (Array.isArray(data)) {
          srcs = data.filter(s => typeof s === 'string' && s.trim().length > 0);
        } else if (data?.data) {
          srcs = Array.isArray(data.data) ? data.data : [data.data];
        } else if (data?.addresses) {
          srcs = Array.isArray(data.addresses) ? data.addresses : [data.addresses];
        } else if (data?.srcs) {
          srcs = Array.isArray(data.srcs) ? data.srcs : [data.srcs];
        }
        
        if (!srcs || srcs.length === 0) {
          return Response.json({ success: true, senders: [] });
        }
        
        return Response.json({ success: true, senders: srcs });
      } catch (e) {
        return Response.json({ success: false, error: e.message });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});