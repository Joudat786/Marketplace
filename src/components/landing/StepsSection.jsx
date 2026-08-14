import { motion } from "framer-motion";
import { UserPlus, Settings, BarChart3, Zap } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "أنشئ حسابك",
    description: "سجل مجاناً وابدأ في دقائق"
  },
  {
    icon: Settings,
    title: "أضف بياناتك",
    description: "أضف عملاءك والشركاء والمنتجات"
  },
  {
    icon: BarChart3,
    title: "راقب الأداء",
    description: "تابع التقارير والإحصائيات"
  },
  {
    icon: Zap,
    title: "اعظم النتائج",
    description: "طور عملك بناءً على البيانات"
  }
];

export default function StepsSection() {
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">كيفية البدء</h2>
          <p className="text-muted-foreground">4 خطوات بسيطة للبدء معنا</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative">
              <div className="bg-background rounded-xl p-6 border border-border h-full text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon size={24} className="text-primary" />
                </div>
                <div className="absolute -top-4 right-1/2 transform translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-border"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}