import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { app_id, app_name, app_description } = await req.json();

    if (!app_id || !app_name) {
      return Response.json({ error: 'app_id and app_name are required' }, { status: 400 });
    }

    // بناء prompt احترافي لتوليد أيقونة التطبيق
    const appDescription = app_description || app_name;
    
    const prompt = `Professional mobile app icon for a business software application called "${app_name}". 
    Description: ${appDescription}.
    Style: Modern, flat design, clean vector illustration, vibrant colors, suitable for enterprise SaaS platform.
    The icon should be:
    - Square format with rounded corners
    - Simple recognizable symbol that represents the app's function
    - Professional color palette (blues, greens, or purples for finance/accounting apps)
    - No text, just the visual symbol
    - High contrast, clear at small sizes
    - Similar to modern app store icons`;

    // توليد الصورة عبر integration
    const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: prompt
    });

    if (!imageResult || !imageResult.url) {
      return Response.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    const imageUrl = imageResult.url;

    // تحديث التطبيق بالأيقونة الجديدة
    await base44.asServiceRole.entities.App.update(app_id, {
      icon_url: imageUrl
    });

    return Response.json({
      success: true,
      app_id,
      app_name,
      icon_url: imageUrl,
      message: `تم توليد وتحديث أيقونة "${app_name}" بنجاح`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});