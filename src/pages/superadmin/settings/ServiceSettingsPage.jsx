import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import EmbeddedApps from "@/components/layout/EmbeddedApps";

export default function ServiceSettingsPage({ serviceType, title, icon: Icon, description, isClientView = false }) {
  const { toast } = useToast();





  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>



      {/* التطبيقات الفرعية المضمّنة من مصمم القائمة */}
      <EmbeddedApps 
        parentPath={isClientView ? `/settings/${serviceType}` : `/super-admin/settings/${serviceType}`}
        panelKey={isClientView ? "client" : "super_admin"}
      />
    </motion.div>
  );
}