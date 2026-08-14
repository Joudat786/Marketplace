import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

// خريطة رموز العملات للأعلام
const currencyFlags = {
  SAR: "🇸🇦", AED: "🇦🇪", EGP: "🇪🇬", KWD: "🇰🇼", QAR: "🇶🇦",
  OMR: "🇴🇲", BHD: "🇧🇭", JOD: "🇯🇴", LBP: "🇱🇧", SYP: "🇸🇾",
  IQD: "🇮🇶", YER: "🇾🇪", MAD: "🇲🇦", DZD: "🇩🇿", TND: "🇹🇳",
  LYD: "🇱🇾", SDG: "🇸🇩", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧",
  JPY: "🇯🇵", CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺", CNY: "🇨🇳",
  INR: "🇮🇳", TRY: "🇹🇷", RUB: "🇷🇺", KRW: "🇰🇷", SGD: "🇸🇬",
  HKD: "🇭🇰", NOK: "🇳🇴", SEK: "🇸🇪", DKK: "🇩🇰", NZD: "🇳🇿",
  MXN: "🇲🇽", BRL: "🇧🇷", ZAR: "🇿🇦", NGN: "🇳🇬", PKR: "🇵🇰",
};

export default function CurrencySelector({ currencies = [], selectedCurrencyId, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = currencies.find(c => c.id === selectedCurrencyId) || currencies[0];

  const filtered = currencies.filter(c =>
    c.name?.includes(search) ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol?.includes(search)
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (currencies.length <= 1) return null;

  return (
    <div className="relative" ref={ref} dir="rtl">
      {/* زر العملة المختارة */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors"
      >
        <span className="text-base">{currencyFlags[selected?.code] || "🌐"}</span>
        <span>{selected?.code}</span>
        <span className="text-muted-foreground text-xs">{selected?.symbol}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* بحث */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن عملة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full border border-border rounded-lg pr-9 pl-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* قائمة العملات */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
            ) : (
              filtered.map((currency) => (
                <button
                  key={currency.id}
                  onClick={() => { onCurrencyChange(currency.id); setIsOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 ${
                    selected?.id === currency.id ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="text-xl">{currencyFlags[currency.code] || "🌐"}</span>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-foreground">{currency.name}</p>
                    <p className="text-xs text-muted-foreground">{currency.code} · {currency.symbol}</p>
                  </div>
                  {selected?.id === currency.id && (
                    <Check size={14} className="text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}