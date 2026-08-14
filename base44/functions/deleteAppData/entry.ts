import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// خريطة التطبيقات وبياناتها المرتبطة
const APP_DATA_MAP = {
  // نظام الموافقات المالية - جميع IDs المحتملة
  "6a17aefc576503004ffd5268": ["Request", "Approval", "ApprovalSettings", "RequestType", "Comment", "Notification", "AccountingDocument", "NotificationTemplate", "AttachmentViewHistory"],
  "6a17aefc576503004ffd526b": ["RequestType", "ApprovalSettings", "AccountingDocument", "NotificationTemplate"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, workspaceId } = await req.json();

    if (!appId || !workspaceId) {
      return Response.json({ error: 'appId and workspaceId are required' }, { status: 400 });
    }

    const entitiesToDelete = APP_DATA_MAP[appId];
    if (!entitiesToDelete || entitiesToDelete.length === 0) {
      return Response.json({ success: true, message: 'No data to delete for this app' });
    }

    const results = {};

    for (const entityName of entitiesToDelete) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({ workspace_id: workspaceId });
        let deletedCount = 0;
        for (const record of records) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
          deletedCount++;
        }
        results[entityName] = { deleted: deletedCount };
      } catch (err) {
        results[entityName] = { error: err.message };
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});