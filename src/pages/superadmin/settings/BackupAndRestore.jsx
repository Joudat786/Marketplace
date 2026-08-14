import { motion } from "framer-motion";

export default function BackupAndRestore() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">النسخ الاحتياطي والاستعادة</h1>
        <p className="text-sm text-muted-foreground mt-1">قم بإدارة النسخ الاحتياطية واستعادة البيانات</p>
      </div>
      

    </motion.div>
  );
}