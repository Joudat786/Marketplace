import { Check, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

function buildFormatNumber(currency, convertPrice) {
  return (price) => {
    if (price === undefined || price === null) return '';
    const c = currency || { decimal_places: 2, thousands_separator: ',', decimal_separator: '.', symbol: 'ر.س' };
    const converted = convertPrice ? convertPrice(price) : Number(price);
    const parts = Number(converted).toFixed(c.decimal_places ?? 2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    const thousands = c.thousands_separator ?? ',';
    if (thousands) integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    const decimal = c.decimal_separator ?? '.';
    return decimalPart ? `${integerPart}${decimal}${decimalPart}` : integerPart;
  };
}

function buildRenderPrice(currency, convertPrice) {
  const formatNumber = buildFormatNumber(currency, convertPrice);
  return (price) => {
    if (price === undefined || price === null) return null;
    const c = currency || { symbol_position: 'right', symbol_space: false, symbol: 'ر.س' };
    const sym = c.symbol || '';
    const space = c.symbol_space ? ' ' : '';
    const num = formatNumber(price);
    if (c.symbol_position === 'left') {
      return (
        <span style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'baseline', gap: space ? '4px' : '0', direction: 'ltr', unicodeBidi: 'isolate'}}>
          <span>{sym}</span><span>{num}</span>
        </span>
      );
    } else {
      return (
        <span style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'baseline', gap: space ? '4px' : '0', direction: 'ltr', unicodeBidi: 'isolate'}}>
          <span>{num}</span><span>{sym}</span>
        </span>
      );
    }
  };
}

export default function PlanComparisonTable({ plans, features, defaultCurrency, getBilling, convertPrice }) {
  const [isOpen, setIsOpen] = useState(false);

  const renderPrice = useMemo(() => buildRenderPrice(defaultCurrency, convertPrice), [defaultCurrency, convertPrice]);

  if (!features || features.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-16"
      dir="rtl"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-secondary/60 rounded-t-xl border border-border border-b-0 hover:bg-secondary transition-colors"
      >
        <ChevronDown
          size={20}
          className={`text-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        <h3 className="text-xl font-bold text-foreground">مقارنة تفصيلية بين الباقات</h3>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-b-xl border border-t-0 border-border"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="px-5 py-4 text-right font-bold text-foreground border-l border-border min-w-[180px]">
                الميزة
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={`px-5 py-4 text-center font-bold border-l border-border min-w-[130px] ${
                    plan.popular ? "bg-primary/10 text-primary" : "text-foreground"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {plan.popular && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                        {plan.popular_label || "الأكثر شيوعاً"}
                      </span>
                    )}
                    <span>{plan.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {plan.is_free
                        ? "مجاني"
                        : renderPrice(getBilling(plan.id) === "monthly" ? plan.monthly_price : plan.yearly_price)}
                      {!plan.is_free && ` / ${getBilling(plan.id) === "monthly" ? "شهري" : "سنوي"}`}
                    </span>
                  </div>
                </th>
              ))}
              </tr>
              </thead>
              <tbody>
            {features.map((feature, idx) => (
              <tr
                key={feature.id}
                className={`border-b border-border transition-colors hover:bg-secondary/20 ${
                  idx % 2 === 0 ? "bg-card" : "bg-secondary/10"
                }`}
              >
                <td className="px-5 py-3 text-right border-l border-border">
                  <div>
                    <p className="font-medium text-foreground">{feature.name}</p>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    )}
                  </div>
                </td>
                {plans.map((plan) => {
                  const included = (plan.included_features || []).includes(feature.id);
                  return (
                    <td
                      key={plan.id}
                      className={`px-5 py-3 text-center border-l border-border ${
                        plan.popular ? "bg-primary/5" : ""
                      }`}
                    >
                      {included ? (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check size={14} className="text-green-600 font-bold" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            <X size={14} className="text-muted-foreground" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            </tbody>
            </table>
            </div>
            </motion.div>
    </motion.div>
  );
}