import { X, BarChart3, TrendingUp, Users, Package, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ReportsPanel - لوح التقارير ينزلق من اليسار
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - title: string
 *  - stats: array of { label, value, icon, color }
 *  - onExport: fn (تصدير التقرير)
 *  - children: JSX إضافي (مخططات أو جداول)
 */
export default function ReportsPanel({ open, onClose, title = "التقارير والإحصائيات", stats = [], onExport, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Panel - ينزلق من اليسار */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 h-full w-96 bg-card border-r border-border shadow-2xl z-50 flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <h2 className="text-base font-bold text-foreground">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Stats Cards */}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon || TrendingUp;
                    return (
                      <div key={i} className="bg-secondary/40 border border-border rounded-xl p-4 text-center">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color || "bg-primary/10"}`}>
                          <Icon size={16} className={stat.iconColor || "text-primary"} />
                        </div>
                        <div className="text-xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custom content */}
              {children}
            </div>

            {/* Footer */}
            {onExport && (
              <div className="px-5 py-4 border-t border-border flex-shrink-0">
                <button
                  onClick={onExport}
                  style={{ backgroundColor: "hsl(var(--button-color))" }}
                  className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download size={16} />
                  تصدير التقرير
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}