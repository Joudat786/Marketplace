import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    const user = data;
    
    // تحقق من وجود العميل بالبريد الإلكتروني فقط (يشمل السجلات المنشأة بأي طريقة)
    const existingByEmail = await base44.asServiceRole.entities.PlatformClient.filter({ email: user.email });

    if (existingByEmail.length > 0) {
      console.log(`[addClient] العميل موجود مسبقاً بالبريد: ${user.email} — عدد السجلات: ${existingByEmail.length}`);
      return Response.json({ 
        success: false, 
        already_exists: true,
        message: 'هذا البريد الإلكتروني مسجل مسبقاً'
      }, { status: 409 });
    }

    console.log(`[addClient] إنشاء عميل جديد: ${user.email}`);
    // أضف المستخدم الجديد كعميل منصة
    await base44.asServiceRole.entities.PlatformClient.create({
      company_name: '',
      owner_name: user.full_name || '',
      email: user.email,
      phone: '',
      status: 'active'
    });

    return Response.json({ 
      success: true, 
      message: 'تم إضافة العميل الجديد بنجاح'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});