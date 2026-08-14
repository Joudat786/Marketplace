import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const userEmail = user.email;

    // البحث عن الباقة الافتراضية
    const defaultPlan = await base44.asServiceRole.entities.Plan.filter({
      is_default: true,
      is_active: true
    });

    if (!defaultPlan || defaultPlan.length === 0) {
      return Response.json({ success: true, message: 'لا توجد باقة افتراضية' });
    }

    const plan = defaultPlan[0];

    // التحقق من أن المستخدم لم يكن مشتركاً في أي باقة نشطة
    const existingSubscriptions = await base44.asServiceRole.entities.SubscriptionRecord.filter({
      user_email: userEmail,
      status: 'active'
    });

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      return Response.json({ success: true, message: 'المستخدم مشترك بالفعل في باقة' });
    }

    // حساب تاريخ البداية والنهاية
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // سنة واحدة من الآن

    // إنشاء اشتراك جديد في الباقة الافتراضية
    await base44.asServiceRole.entities.SubscriptionRecord.create({
      user_email: userEmail,
      name: plan.name,
      type: 'plan',
      plan_id: plan.id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      amount: plan.is_free ? 0 : plan.monthly_price || 0,
      currency: 'SAR',
      billing_cycle: 'monthly',
      status: 'active',
      auto_renew: true
    });

    return Response.json({
      success: true,
      message: `تم اشتراك المستخدم في الباقة الافتراضية: ${plan.name}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});