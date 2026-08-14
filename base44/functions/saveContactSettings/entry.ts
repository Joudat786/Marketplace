import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    const existingSettings = await base44.asServiceRole.entities.GeneralSettings.filter({ settings_type: 'contact' });
    
    const settingsData = {
      contact_items: data.contact_items || [],
      social_links: data.social_links || [],
      settings_type: 'contact'
    };

    let result;
    if (existingSettings && existingSettings.length > 0) {
      result = await base44.asServiceRole.entities.GeneralSettings.update(existingSettings[0].id, settingsData);
    } else {
      result = await base44.asServiceRole.entities.GeneralSettings.create(settingsData);
    }

    return Response.json({ 
      success: true, 
      message: 'تم حفظ إعدادات التواصل بنجاح',
      data: result 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});