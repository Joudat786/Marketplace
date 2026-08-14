import { motion } from "framer-motion";
import { Users, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "إدارة العملاء",
    description: "تابع جميع عملائك وتفاعلاتهم في مكان واحد"
  },
  {
    icon: BarChart3,
    title: "تقارير متقدمة",
    description: "احصل على رؤى عميقة حول أداء عملك"
  },
  {
    icon: Shield,
    title: "أمان عالي",
    description: "بيانات آمنة وموثوقة مع تشفير عالي المستوى"
  },
  {
    icon: Zap,
    title: "سهولة الاستخدام",
    description: "واجهة بديهية تجعل الإدارة أسهل وأسرع"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">المميزات الرئيسية</h2>
          <p className="text-muted-foreground">كل ما تحتاجه لإدارة عملك بكفاءة</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-background rounded-xl p-6 border border-border hover:border-primary/40 transition-colors">
              <feature.icon size={32} className="text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}