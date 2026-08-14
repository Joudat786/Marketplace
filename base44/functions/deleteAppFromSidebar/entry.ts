import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await req.json();
    
    if (!appId) {
      return Response.json({ error: 'appId is required' }, { status: 400 });
    }

    // جلب إعدادات القائمة الجانبية
    const settings = await base44.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
    
    if (!settings || settings.length === 0) {
      return Response.json({ success: true, message: 'No sidebar config found' });
    }

    const sidebarConfig = settings[0];
    const sidebar = JSON.parse(sidebarConfig.sidebar_items_json || '{}');

    // حذف التطبيق من جميع الأنظمة والتبويبات
    for (const panelId in sidebar) {
      const panelData = sidebar[panelId];
      
      for (const tabId in panelData) {
        const items = Array.isArray(panelData[tabId]) ? panelData[tabId] : [];
        
        // حذف التطبيق من العناصر الرئيسية
        panelData[tabId] = items
          .filter(item => !(item.type === "app" && (item.appId === appId || item.path === appId)))
          .map(item => ({
            ...item,
            // حذف التطبيق من العناصر الفرعية
            children: (item.children || []).filter(child => !(child.type === "app" && (child.appId === appId || child.path === appId)))
          }));
      }
    }

    // حفظ الإعدادات المحدثة
    await base44.entities.GeneralSettings.update(sidebarConfig.id, {
      sidebar_items_json: JSON.stringify(sidebar)
    });

    return Response.json({ success: true, message: 'App removed from sidebar successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});