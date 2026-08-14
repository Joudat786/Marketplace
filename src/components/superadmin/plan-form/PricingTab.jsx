import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function PricingTab({ form, setForm }) {
  const [selectedCurrency, setSelectedCurrency] = useState("SAR");

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => base44.entities.Currency.list()
  });

  const defaultCurrency = currencies.find(c => c.is_default) || currencies.find(c => c.code === "SAR");
  
  useEffect(() => {
    if (defaultCurrency) {
      setSelectedCurrency(defaultCurrency.code);
    }
  }, [defaultCurrency]);

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || defaultCurrency;

  const formatPrice = (price) => {
    if (!currentCurrency || !price) return price;
    
    const parts = price.toFixed(currentCurrency.decimal_places || 2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    
    const thousands = currentCurrency.thousands_separator || ',';
    if (thousands) {
      integerPart = integerPart.split('').reverse().reduce((acc, char, i) => {
        if (i > 0 && i % 3 === 0) {
          return thousands + acc;
        }
        return char + acc;
      }, '');
    }
    
    const space = currentCurrency.symbol_space ? ' ' : '';
    const decimal = currentCurrency.decimal_separator || '.';
    const formatted = decimalPart ? `${integerPart}${decimal}${decimalPart}` : integerPart;
    
    if (currentCurrency.symbol_position === 'right') {
      return `${formatted}${space}${currentCurrency.symbol}`;
    } else {
      return `${currentCurrency.symbol}${space}${formatted}`;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">التسعير</h2>
        
        {!form.is_free && currencies.length > 0 && (
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {currencies.map(c => (
              <option key={c.id} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-semibold", form.is_free ? "text-green-600" : "text-muted-foreground")}>
          {form.is_free ? "باقة مجانية" : "باقة مدفوعة"}
        </span>
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, is_free: !p.is_free }))}
          className={cn("w-12 h-6 rounded-full transition-all relative", form.is_free ? "bg-green-500" : "bg-gray-300")}
        >
          <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.is_free ? "right-0.5" : "left-0.5")} />
        </button>
      </div>

      {!form.is_free && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">السعر الشهري ({selectedCurrency}) *</label>
            <input
              type="number" min="0" required value={form.monthly_price}
              onChange={e => setForm(p => ({ ...p, monthly_price: Number(e.target.value) }))}
              placeholder="0"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">{formatPrice(form.monthly_price)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">السعر السنوي ({selectedCurrency}) *</label>
            <input
              type="number" min="0" required value={form.yearly_price}
              onChange={e => setForm(p => ({ ...p, yearly_price: Number(e.target.value) }))}
              placeholder="0"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">{formatPrice(form.yearly_price)}</p>
          </div>
        </div>
      )}
    </div>
  );
}