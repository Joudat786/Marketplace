import { motion } from "framer-motion";

export default function RequiredFieldsSettings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الحقول الإجبارية</h1>
        <p className="text-sm text-muted-foreground mt-1">قم بإدارة الحقول الإجبارية في النماذج المختلفة</p>
      </div>
      

    </motion.div>
  );
}