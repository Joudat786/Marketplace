import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function HeroSection() {
  const handleStart = () => {
    base44.auth.redirectToLogin("/");
  };

  return (
    <section className="bg-gradient-to-b from-accent to-background py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            منصة متكاملة لإدارة عملك
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            نظام إدارة شامل يوفر لك جميع الأدوات التي تحتاجها لإدارة عملائك والشركاء والمبيعات بكفاءة عالية
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            ابدأ الآن مجاناً
            <ArrowLeft size={16} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}