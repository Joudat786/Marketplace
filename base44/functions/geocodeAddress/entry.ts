import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address } = await req.json();
    if (!address) {
      return Response.json({ error: 'address is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=ar&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return Response.json({ found: false });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const components = result.address_components || [];

    const get = (type) => {
      const c = components.find(c => c.types.includes(type));
      return c ? c.long_name : "";
    };

    // استخراج العنوان المختصر السعودي (plus_code أو postal_code)
    const plusCode = result.plus_code?.compound_code || result.plus_code?.global_code || "";
    const postalCode = get("postal_code");
    
    // محاولة الحصول على العنوان المختصر من plus_code أو من نتائج أخرى
    let nationalAddressCode = "";
    // البحث في المكونات عن premise أو plus_code
    const premiseComponent = components.find(c => c.types.includes("premise"));
    if (premiseComponent) {
      nationalAddressCode = premiseComponent.long_name;
    } else if (postalCode) {
      nationalAddressCode = postalCode;
    }

    // إذا كان plus_code يحتوي على نمط العنوان المختصر السعودي (4 أحرف + 4 أرقام)
    const saAddressMatch = plusCode.match(/\b([A-Z]{4}\d{4})\b/) || 
                           result.formatted_address?.match(/\b([A-Z]{4}\d{4})\b/);
    if (saAddressMatch) {
      nationalAddressCode = saAddressMatch[1];
    }

    return Response.json({
      found: true,
      lat,
      lng,
      country: get("country"),
      region: get("administrative_area_level_1"),
      city: get("locality") || get("administrative_area_level_2"),
      neighborhood: get("sublocality_level_1") || get("sublocality") || get("neighborhood"),
      street: get("route"),
      address_description: result.formatted_address || "",
      national_address_code: nationalAddressCode,
      plus_code: plusCode,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});