import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const [plans, features, settings, currencies, apps] = await Promise.all([
      base44.asServiceRole.entities.Plan.list(),
      base44.asServiceRole.entities.PlanFeature.list(),
      base44.asServiceRole.entities.SubscriptionSettings.list(),
      base44.asServiceRole.entities.Currency.list(),
      base44.asServiceRole.entities.App.list()
    ]);
    const activePlans = plans.filter(p => p.is_active === true)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const activeFeatures = features.filter(f => f.is_active === true)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const activeCurrencies = currencies.filter(c => c.is_active === true)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const activeApps = apps.filter(a => a.is_active === true)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    
    const subscriptionMode = settings && settings.length > 0 ? settings[0]?.subscription_mode : "plans_only";
    
    return Response.json({ 
      plans: activePlans, 
      features: activeFeatures,
      subscription_mode: subscriptionMode,
      currencies: activeCurrencies,
      apps: activeApps
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});