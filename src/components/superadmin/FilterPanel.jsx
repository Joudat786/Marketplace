import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FilterPanel - لوح تصفية ينزلق من اليسار
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - title: string
 *  - children: JSX (حقول التصفية)
 *  - onReset: fn
 *  - onApply: fn
 */
export default function FilterPanel({ open, onClose, title = "تصفية البيانات", children, onReset, onApply }) {
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
            className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border shadow-2xl z-50 flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {children}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={onApply}
                style={{ backgroundColor: "hsl(var(--button-color))" }}
                className="flex-1 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                تطبيق التصفية
              </button>
              <button
                onClick={onReset}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary transition-colors text-foreground"
              >
                إعادة ضبط
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}