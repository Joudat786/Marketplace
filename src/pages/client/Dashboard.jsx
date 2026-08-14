import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ClientDashboard() {
  const { selectedWorkspace } = useWorkspace();

  return (
    <div dir="rtl" className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">نظرة عامة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedWorkspace?.name}
        </p>
      </div>

      {/* Empty content placeholder */}
      <div className="flex items-center justify-center min-h-96 bg-card border border-dashed border-border rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground">سيتم إضافة محتوى لاحقاً</p>
        </div>
      </div>
    </div>
  );
}