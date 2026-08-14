import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    const settingsData = {
      date_format: data.dateFormat || 'YYYY/MM/DD',
      time_format: data.timeFormat || 'HH:mm:ss A',
      date_time_format: data.dateTimeFormat || 'YYYY/MM/DD - HH:mm:ss A',
      timezone: data.timezone || 'Asia/Riyadh',
      landing_page_enabled: data.landingPageEnabled === true,
      maintenance_mode_enabled: data.maintenanceModeEnabled === true,
      maintenance_text: data.maintenanceText || '',
      settings_type: 'system'
    };

    try {
      const existingSettings = await base44.asServiceRole.entities.GeneralSettings.filter({ settings_type: 'system' });
      
      let result;
      if (existingSettings && existingSettings.length > 0) {
        result = await base44.asServiceRole.entities.GeneralSettings.update(existingSettings[0].id, settingsData);
      } else {
        result = await base44.asServiceRole.entities.GeneralSettings.create(settingsData);
      }

      return Response.json({ 
        success: true, 
        message: 'تم حفظ إعدادات النظام بنجاح',
        data: result 
      });
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      return Response.json({ error: 'Failed to save settings: ' + dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('General error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});