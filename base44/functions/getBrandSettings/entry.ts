import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // استخدام asServiceRole لأن هذه الإعدادات عامة لا تتطلب مصادقة المستخدم
    const settings = await base44.asServiceRole.entities.GeneralSettings.filter({ settings_type: "brand" });
    const brandSettings = settings && settings.length > 0 ? settings[0] : null;

    return Response.json({
      favicon_url: brandSettings?.favicon_url || null,
      brand_name: brandSettings?.brand_name || null,
      light_logo_url: brandSettings?.light_logo_url || null
    });
  } catch (error) {
    // إرجاع قيم فارغة بدلاً من خطأ حتى لا يعطل تحميل الصفحة
    return Response.json({
      favicon_url: null,
      brand_name: null,
      light_logo_url: null
    });
  }
});