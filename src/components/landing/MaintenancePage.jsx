import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

export default function MaintenancePage({ brandSettings, maintenanceText }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Wrench size={32} className="text-primary" />
          </motion.div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-4">
          جارٍ الصيانة
        </h1>

        {/* Message */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          {maintenanceText || "نحن نعمل على تحسين الخدمة. يرجى العودة قريباً."}
        </p>

        {/* Brand Name */}
        {brandSettings?.brand_name && (
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandSettings.brand_name}
          </p>
        )}
      </motion.div>
    </div>
  );
}