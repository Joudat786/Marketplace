import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, data } = await req.json();
    if (!workspace_id) return Response.json({ error: 'workspace_id required' }, { status: 400 });

    // جلب مساحة العمل بـ service role للتحقق من الصلاحية
    const workspaces = await base44.asServiceRole.entities.Workspace.filter({ id: workspace_id });
    const workspace = workspaces?.[0];

    if (!workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // التحقق من الصلاحية
    const isSuperAdmin = user.role === 'super_admin';
    const isOwnerByEmail = workspace.owner_email === user.email;
    const isOwnerByUserId = workspace.owner_user_id === user.id;
    const isCreatedBy = workspace.created_by === user.email;

    if (!isSuperAdmin && !isOwnerByEmail && !isOwnerByUserId && !isCreatedBy) {
      // تحقق إضافي: هل هو عضو بدور owner/admin في مساحة العمل
      const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
        workspace_id,
        member_email: user.email
      });
      const isMemberOwner = members.some(m => m.role === 'owner' || m.role === 'admin');
      if (!isMemberOwner) {
        return Response.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    // الحقول المسموح بتحديثها فقط
    const ALLOWED_FIELDS = [
      'name', 'slug', 'owner_email', 'owner_user_id', 'logo_url',
      'status', 'plan', 'plan_expires_at', 'billing_cycle',
      'currency', 'timezone', 'language',
      'owner_name', 'owner_mobile', 'owner_nationality',
      'owner_identity_type', 'owner_identity_number',
      'owners',
      'company_name', 'unified_national_number',
      'commercial_register_number', 'commercial_register_issue_date', 'commercial_register_expiry_date',
      'tax_number', 'tax_registration_expiry_date',
      'activity_type',
      'country', 'city', 'location_data',
      'footer_text',
      'commercial_register_attachment', 'founding_contract_attachment',
      'tax_certificate_attachment', 'identity_attachment',
      'national_address_attachment',
      'settings',
    ];

    const filteredData = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in data) {
        filteredData[key] = data[key];
      }
    }

    // التحديث بـ service role لتجاوز قيود RLS
    const updated = await base44.asServiceRole.entities.Workspace.update(workspace_id, filteredData);
    return Response.json({ success: true, workspace: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});