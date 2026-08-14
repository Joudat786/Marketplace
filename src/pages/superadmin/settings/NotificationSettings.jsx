import { motion } from "framer-motion";

export default function NotificationSettings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات الإشعارات</h1>
        <p className="text-sm text-muted-foreground mt-1">قم بإدارة إعدادات الإشعارات والتنبيهات</p>
      </div>
      

    </motion.div>
  );
}