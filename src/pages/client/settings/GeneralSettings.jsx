import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/lib/WorkspaceContext";

/**
 * تمت إعادة توجيه هذه الصفحة إلى WorkspaceSettings
 * حيث تم دمج الإعدادات العامة مع إعدادات مساحة العمل
 */
export default function ClientGeneralSettings() {
  const navigate = useNavigate();
  const { selectedWorkspace } = useWorkspace();

  useEffect(() => {
    if (selectedWorkspace?.id) {
      navigate(`/workspaces/${selectedWorkspace.id}`, { replace: true });
    }
  }, [selectedWorkspace?.id]);

  return (
    <div dir="rtl" className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}