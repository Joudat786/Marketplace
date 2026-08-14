import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberEmail, memberName, workspaceName, ownerName, role } = await req.json();

    if (!memberEmail || !workspaceName) {
      return Response.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const roleLabel = role === 'admin' ? 'مشرف' : 'عضو';

    const emailBody = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .body p { color: #374151; line-height: 1.7; font-size: 15px; }
    .info-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; color: #4338ca; font-weight: 600; }
    .info-box span { color: #374151; font-weight: 400; }
    .btn { display: inline-block; background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 دعوة للانضمام</h1>
      <p>تمت دعوتك للانضمام إلى مساحة عمل</p>
    </div>
    <div class="body">
      <p>مرحباً ${memberName || 'بك'}،</p>
      <p>
        لقد قام <strong>${ownerName || user.full_name || 'مدير المساحة'}</strong> بدعوتك للانضمام إلى مساحة العمل:
      </p>
      <div class="info-box">
        <p>مساحة العمل: <span>${workspaceName}</span></p>
        <p>الدور الممنوح لك: <span>${roleLabel}</span></p>
        <p>البريد الإلكتروني: <span>${memberEmail}</span></p>
      </div>
      <p>
        لبدء العمل، قم بتسجيل الدخول أو إنشاء حساب جديد باستخدام هذا البريد الإلكتروني.
        بعد تسجيل الدخول، ستجد مساحة العمل متاحة لك تلقائياً.
      </p>
      <p style="color: #6b7280; font-size: 13px;">
        إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد.
      </p>
    </div>
    <div class="footer">
      <p>تم إرسال هذه الدعوة عبر منظومة إدارة مساحات العمل</p>
    </div>
  </div>
</body>
</html>
    `;

    await base44.integrations.Core.SendEmail({
      to: memberEmail,
      subject: `دعوة للانضمام إلى مساحة العمل: ${workspaceName}`,
      body: emailBody,
      from_name: ownerName || user.full_name || workspaceName
    });

    return Response.json({ success: true, message: 'تم إرسال الدعوة بنجاح' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});