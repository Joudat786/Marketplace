import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // البحث عن تطبيق OurSMS
    const apps = await base44.asServiceRole.entities.App.list();
    const ourSmsApp = apps.find(a => 
      a.name?.toLowerCase().includes('oursms') || 
      a.name?.toLowerCase().includes('رسائلنا') ||
      a.id === '69cefced09c089398032792a' // المعرّف المحذوف سابقاً
    );

    if (!ourSmsApp) {
      return Response.json({ success: true, message: 'لم يتم العثور على التطبيق' });
    }

    const appId = ourSmsApp.id;

    // 1. حذف جميع InstalledApp
    const installedApps = await base44.asServiceRole.entities.InstalledApp.filter({ app_id: appId });
    for (const ia of installedApps) {
      await base44.asServiceRole.entities.InstalledApp.delete(ia.id);
    }

    // 2. حذف من القائمة الجانبية
    const sidebarSettings = await base44.asServiceRole.entities.GeneralSettings.filter({ settings_type: "sidebar_config" });
    if (sidebarSettings && sidebarSettings.length > 0) {
      const config = sidebarSettings[0];
      const sidebar = JSON.parse(config.sidebar_items_json || '{}');

      for (const panelId in sidebar) {
        const panelData = sidebar[panelId];
        for (const tabId in panelData) {
          const items = Array.isArray(panelData[tabId]) ? panelData[tabId] : [];
          panelData[tabId] = items
            .filter(item => !(item.type === "app" && (item.appId === appId || item.path === appId)))
            .map(item => ({
              ...item,
              children: (item.children || []).filter(child => !(child.type === "app" && (child.appId === appId || child.path === appId)))
            }));
        }
      }

      await base44.asServiceRole.entities.GeneralSettings.update(config.id, {
        sidebar_items_json: JSON.stringify(sidebar)
      });
    }

    // 3. حذف التطبيق
    await base44.asServiceRole.entities.App.delete(appId);

    return Response.json({ 
      success: true, 
      message: 'تم حذف تطبيق OurSMS بنجاح من جميع الأماكن',
      app: {
        id: appId,
        name: ourSmsApp.name,
        installedAppsDeleted: installedApps.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});