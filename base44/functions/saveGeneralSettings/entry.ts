import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    // Get or create the brand settings record
    const existingSettings = await base44.asServiceRole.entities.GeneralSettings.filter({ settings_type: 'brand' });
    
    const settingsData = {
      brand_name: data.brandName,
      footer_text: data.footerText,
      light_logo_url: data.lightLogo,
      dark_logo_url: data.darkLogo,
      favicon_url: data.favicon,
      loading_icon_url: data.loadingIcon,
      footer_logo_url: data.footerLogo,
      primary_color: data.primaryColor,
      button_color: data.buttonColor,
      tabs_active_color: data.tabsActiveColor,
      tabs_inactive_color: data.tabsInactiveColor,
      table_header_bg_color: data.tableHeaderBgColor,
      table_header_text_color: data.tableHeaderTextColor,
      settings_type: 'brand'
    };

    let result;
    if (existingSettings && existingSettings.length > 0) {
      // Update existing record
      result = await base44.asServiceRole.entities.GeneralSettings.update(existingSettings[0].id, settingsData);
    } else {
      // Create new record
      result = await base44.asServiceRole.entities.GeneralSettings.create(settingsData);
    }

    return Response.json({ 
      success: true, 
      message: 'تم حفظ الإعدادات بنجاح',
      data: result 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});