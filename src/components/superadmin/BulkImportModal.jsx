import { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, Check, AlertCircle } from "lucide-react";

/**
 * مكون استيراد العناصر بكميات كبيرة
 * يسمح بإضافة عناصر متعددة دفعة واحدة حسب مساحة العمل
 */
export default function BulkImportModal({ 
  apps, 
  items, 
  currentItems, 
  activePanel, 
  activeTab, 
  selectedWorkspace,
  onImport, 
  onClose 
}) {
  const [step, setStep] = useState("template"); // template, preview, importing
  const [importData, setImportData] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const generateTemplate = () => {
    const template = `# استيراد العناصر - اختر الصيغة المناسبة
# ────────────────────────────────────────

# صيغة 1: اسم العنصر فقط (يتم التوليد التلقائي للباقي)
# نموذج: اسم العنصر

إدارة المخازن
الموردين والمشتريات
العملاء والمبيعات
الموارد البشرية
إدارة المشاريع والمهام

# ────────────────────────────────────────
# صيغة 2: اسم|النوع|المسار|الأيقونة|الظهور|طريقة العرض
# نموذج: label|type|path|icon|visible|displayMode
# type: internal أو external
# icon: اسم الأيقونة (مثل: Home, Settings, Package)
# visible: true أو false
# displayMode: sidebar أو page

# لوحة التحكم|internal|/|Monitor|true|sidebar
# العملاء|internal|/clients|Users|true|sidebar`;
    
    setImportData(template);
  };

  const validateAndParse = () => {
    const newErrors = [];
    const parsed = [];

    const lines = importData
      .split("\n")
      .filter(line => line.trim() && !line.startsWith("#"));

    lines.forEach((line, idx) => {
      const parts = line.split("|").map(p => p.trim());
      
      // دعم صيغ مختلفة: اسم فقط، أو label|type|path، أو جميع الحقول
      let label, type, path, icon, visible, displayMode;
      
      if (parts.length === 1) {
        // صيغة مبسطة: اسم فقط
        label = parts[0];
        type = "internal";
        path = `/${label.toLowerCase().replace(/\s+/g, "-")}`;
        icon = "Package";
        visible = true;
        displayMode = "sidebar";
      } else if (parts.length >= 3) {
        // صيغة كاملة
        [label, type, path, icon, visible, displayMode] = parts;
        visible = visible === "true" || visible === "true" || visible === "1";
        displayMode = displayMode || "sidebar";
        icon = icon || "Package";
      } else {
        newErrors.push(`السطر ${idx + 1}: يجب أن يحتوي على اسم العنصر على الأقل`);
        return;
      }

      // التحقق من الصحة
      if (!label || !label.trim()) {
        newErrors.push(`السطر ${idx + 1}: اسم العنصر مطلوب`);
        return;
      }
      if (type && !["internal", "external"].includes(type)) {
        newErrors.push(`السطر ${idx + 1}: نوع الرابط يجب أن يكون internal أو external`);
        return;
      }
      if (!path || !path.trim()) {
        newErrors.push(`السطر ${idx + 1}: المسار مطلوب`);
        return;
      }

      parsed.push({
        label: label.trim(),
        type: type || "internal",
        path: path.trim(),
        icon: icon || "Package",
        visible: visible !== false,
        displayMode: displayMode || "sidebar",
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        children: []
      });
    });

    setErrors(newErrors);
    setParsedItems(parsed);
    
    if (newErrors.length === 0 && parsed.length > 0) {
      setStep("preview");
    } else if (parsed.length === 0 && newErrors.length === 0) {
      newErrors.push("لم يتم العثور على عناصر صحيحة");
      setErrors(newErrors);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // التحقق من عدم تكرار العناصر
      const existingLabels = new Set(currentItems.map(item => item.label));
      const newItems = parsedItems.filter(item => {
        if (existingLabels.has(item.label)) {
          setErrors(prev => [...prev, `تحذير: "${item.label}" موجود مسبقاً - تم تخطيه`]);
          return false;
        }
        return true;
      });

      // إضافة العناصر الجديدة
      const allItems = [...currentItems, ...newItems];
      onImport(allItems);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-foreground">استيراد العناصر - {selectedWorkspace?.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === "template" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Upload size={16} />
                    خطوات الاستيراد
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>انسخ القالب أدناه</li>
                    <li>عدّل الصفوف حسب احتياجاتك (أضف عناصرك)</li>
                    <li>الصق المحتوى المعدّل في مربع النص</li>
                    <li>تحقق من البيانات والاستيراد</li>
                  </ol>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                  <p className="font-semibold text-emerald-900 mb-2">✓ صيغ مدعومة:</p>
                  <ul className="text-emerald-800 space-y-1 text-xs">
                    <li><strong>صيغة مبسطة:</strong> اكتب اسم العنصر فقط (يتم التوليد التلقائي للباقي)</li>
                    <li><strong>صيغة كاملة:</strong> label|type|path|icon|visible|displayMode</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold">📋 القالب:</label>
                <textarea
                  value={importData}
                  onChange={e => setImportData(e.target.value)}
                  placeholder="سيظهر القالب هنا..."
                  className="w-full h-48 p-3 border border-border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateTemplate}
                    className="px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:opacity-90"
                  >
                    إنشاء قالب
                  </button>
                  <p className="text-xs text-muted-foreground">
                    ستجد تنسيق البيانات المطلوب في القالب
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={validateAndParse}
                  disabled={!importData.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  التالي: معاينة البيانات
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-lg hover:bg-secondary"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    الأخطاء ({errors.length})
                  </h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    {errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedItems.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">
                    ✓ العناصر الجاهزة للإضافة ({parsedItems.length})
                  </label>
                  <div className="border border-border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {parsedItems.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-secondary/40 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary w-6 text-center">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.path}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {item.type === "internal" ? "داخلي" : "خارجي"}
                          </span>
                          {item.visible && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700">
                              مرئي
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={parsedItems.length === 0 || isImporting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? "جارٍ الإضافة..." : (
                    <>
                      <Check size={16} />
                      استيراد الآن
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep("template")}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-lg hover:bg-secondary"
                >
                  رجوع
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}