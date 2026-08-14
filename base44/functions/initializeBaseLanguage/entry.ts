import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if English (base language) already exists
    const languages = await base44.asServiceRole.entities.Language.list();
    const englishExists = languages.find(l => l.code === 'en' && l.is_base);

    if (englishExists) {
      return Response.json({ message: 'Base language already exists', id: englishExists.id });
    }

    // Create English as base language
    const baseLanguage = await base44.asServiceRole.entities.Language.create({
      name: 'English',
      code: 'en',
      flag: '🇺🇸',
      direction: 'LTR',
      is_base: true,
      is_default: true,
      is_active: true,
      sort_order: 0
    });

    return Response.json({ message: 'Base language created', id: baseLanguage.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});