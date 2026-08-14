import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const currencySymbols = [
  // الدول العربية
  { code: "SAR", name: "الريال السعودي", symbol: "﷼", group: "الدول العربية" },
  { code: "AED", name: "الدرهم الإماراتي", symbol: "د.إ", group: "الدول العربية" },
  { code: "EGP", name: "الجنيه المصري", symbol: "ج.م", group: "الدول العربية" },
  { code: "KWD", name: "الدينار الكويتي", symbol: "د.ك", group: "الدول العربية" },
  { code: "JOD", name: "الدينار الأردني", symbol: "د.ا", group: "الدول العربية" },
  { code: "LBP", name: "الليرة اللبنانية", symbol: "ل.ل", group: "الدول العربية" },
  { code: "QAR", name: "الريال القطري", symbol: "ر.ق", group: "الدول العربية" },
  { code: "OMR", name: "الريال العماني", symbol: "ر.ع.", group: "الدول العربية" },
  { code: "BHD", name: "الدينار البحريني", symbol: "د.ب", group: "الدول العربية" },
  { code: "SYP", name: "الليرة السورية", symbol: "£", group: "الدول العربية" },
  { code: "TND", name: "الدينار التونسي", symbol: "د.ت", group: "الدول العربية" },
  { code: "DZD", name: "الدينار الجزائري", symbol: "د.ج", group: "الدول العربية" },
  { code: "MAD", name: "الدرهم المغربي", symbol: "د.م.", group: "الدول العربية" },
  { code: "IQD", name: "الدينار العراقي", symbol: "ع.د", group: "الدول العربية" },
  { code: "ILS", name: "الشيقل الإسرائيلي", symbol: "₪", group: "الدول العربية" },
  { code: "YER", name: "الريال اليمني", symbol: "﷼", group: "الدول العربية" },
  { code: "MRU", name: "الأوقية الموريتانية", symbol: "UM", group: "الدول العربية" },
  { code: "SOS", name: "الشلن الصومالي", symbol: "Sh", group: "الدول العربية" },
  { code: "SDG", name: "الجنيه السوداني", symbol: "ج.س", group: "الدول العربية" },
  { code: "ERN", name: "الناكفا الإريترية", symbol: "Nfk", group: "الدول العربية" },
  { code: "DJF", name: "الفرنك الجيبوتي", symbol: "Fdj", group: "الدول العربية" },
  { code: "KMF", name: "الفرنك القمري", symbol: "CF", group: "الدول العربية" },
  
  // العملات الدولية الرئيسية
  { code: "USD", name: "الدولار الأمريكي", symbol: "$", group: "العملات الدولية" },
  { code: "EUR", name: "اليورو", symbol: "€", group: "العملات الدولية" },
  { code: "GBP", name: "الجنيه الإسترليني", symbol: "£", group: "العملات الدولية" },
  { code: "JPY", name: "الين الياباني", symbol: "¥", group: "العملات الدولية" },
  { code: "CHF", name: "الفرنك السويسري", symbol: "CHF", group: "العملات الدولية" },
  { code: "CAD", name: "الدولار الكندي", symbol: "C$", group: "العملات الدولية" },
  { code: "AUD", name: "الدولار الأسترالي", symbol: "A$", group: "العملات الدولية" },
  { code: "NZD", name: "الدولار النيوزيلندي", symbol: "NZ$", group: "العملات الدولية" },
  { code: "SGD", name: "الدولار السنغافوري", symbol: "S$", group: "العملات الدولية" },
  { code: "HKD", name: "الدولار الهونج كونجي", symbol: "HK$", group: "العملات الدولية" },
  { code: "NOK", name: "الكرونة النرويجية", symbol: "kr", group: "العملات الدولية" },
  { code: "SEK", name: "الكرونة السويدية", symbol: "kr", group: "العملات الدولية" },
  { code: "DKK", name: "الكرونة الدانماركية", symbol: "kr", group: "العملات الدولية" },
  { code: "PLN", name: "الزلوتي البولندي", symbol: "zł", group: "العملات الدولية" },
  { code: "CZK", name: "الكرونة التشيكية", symbol: "Kč", group: "العملات الدولية" },
  { code: "HUF", name: "الفورنت الهنغاري", symbol: "Ft", group: "العملات الدولية" },
  { code: "RON", name: "الليو الروماني", symbol: "lei", group: "العملات الدولية" },
  { code: "BGN", name: "الليفا البلغاري", symbol: "лв", group: "العملات الدولية" },
  { code: "RUB", name: "الروبل الروسي", symbol: "₽", group: "العملات الدولية" },
  { code: "TRY", name: "الليرة التركية", symbol: "₺", group: "العملات الدولية" },
  { code: "UAH", name: "الهريفنيا الأوكرانية", symbol: "₴", group: "العملات الدولية" },
  { code: "BYN", name: "الروبل البيلاروسي", symbol: "Br", group: "العملات الدولية" },
  
  // العملات الآسيوية
  { code: "CNY", name: "اليوان الصيني", symbol: "¥", group: "العملات الآسيوية" },
  { code: "INR", name: "الروبية الهندية", symbol: "₹", group: "العملات الآسيوية" },
  { code: "IDR", name: "الروبية الإندونيسية", symbol: "Rp", group: "العملات الآسيوية" },
  { code: "MYR", name: "الرينجت الماليزي", symbol: "RM", group: "العملات الآسيوية" },
  { code: "PHP", name: "البيزو الفلبيني", symbol: "₱", group: "العملات الآسيوية" },
  { code: "THB", name: "الباث التايلاندي", symbol: "฿", group: "العملات الآسيوية" },
  { code: "VND", name: "الدونج الفيتنامي", symbol: "₫", group: "العملات الآسيوية" },
  { code: "KRW", name: "الوون الكوري", symbol: "₩", group: "العملات الآسيوية" },
  { code: "TWD", name: "الدولار التايواني", symbol: "NT$", group: "العملات الآسيوية" },
  { code: "PKR", name: "الروبية الباكستانية", symbol: "₨", group: "العملات الآسيوية" },
  { code: "BDT", name: "التاكا البنغلاديشية", symbol: "Tk", group: "العملات الآسيوية" },
  { code: "LKR", name: "الروبية السريلانكية", symbol: "Rs", group: "العملات الآسيوية" },
  { code: "NPR", name: "الروبية النيبالية", symbol: "₨", group: "العملات الآسيوية" },
  { code: "MMK", name: "الكيات الميانماري", symbol: "K", group: "العملات الآسيوية" },
  
  // العملات الأفريقية
  { code: "ZAR", name: "الراند الجنوب أفريقي", symbol: "R", group: "العملات الأفريقية" },
  { code: "NGN", name: "النيرة النيجيرية", symbol: "₦", group: "العملات الأفريقية" },
  { code: "GHS", name: "السيدي الغاني", symbol: "GH₵", group: "العملات الأفريقية" },
  { code: "KES", name: "الشلن الكيني", symbol: "KSh", group: "العملات الأفريقية" },
  { code: "UGX", name: "الشلن الأوغندي", symbol: "USh", group: "العملات الأفريقية" },
  { code: "ETB", name: "البير الإثيوبي", symbol: "Br", group: "العملات الأفريقية" },
  { code: "GIP", name: "جنيه جبل طارق", symbol: "£", group: "العملات الأفريقية" },
  { code: "MUR", name: "روبية موريشيوس", symbol: "₨", group: "العملات الأفريقية" },
  { code: "SCR", name: "روبية سيشل", symbol: "₨", group: "العملات الأفريقية" },
  { code: "BWP", name: "بولا بوتسوانا", symbol: "P", group: "العملات الأفريقية" },
  { code: "NAD", name: "دولار ناميبيا", symbol: "N$", group: "العملات الأفريقية" },
  
  // العملات الأمريكية
  { code: "MXN", name: "البيزو المكسيكي", symbol: "$", group: "العملات الأمريكية" },
  { code: "BRL", name: "الريال البرازيلي", symbol: "R$", group: "العملات الأمريكية" },
  { code: "ARS", name: "البيزو الأرجنتيني", symbol: "$", group: "العملات الأمريكية" },
  { code: "CLP", name: "البيزو التشيلي", symbol: "$", group: "العملات الأمريكية" },
  { code: "COP", name: "البيزو الكولومبي", symbol: "$", group: "العملات الأمريكية" },
  { code: "PEN", name: "السول البيروفي", symbol: "S/", group: "العملات الأمريكية" },
  { code: "VES", name: "البوليفار الفنزويلي", symbol: "Bs.", group: "العملات الأمريكية" },
  { code: "UYU", name: "البيزو الأوروجوايي", symbol: "$U", group: "العملات الأمريكية" },
  { code: "BOB", name: "البوليفيانو البوليفي", symbol: "Bs.", group: "العملات الأمريكية" },
  { code: "PYG", name: "الجواراني الباراجوايي", symbol: "₲", group: "العملات الأمريكية" },
];

export default function CurrencySymbolSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const filtered = currencySymbols.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const selected = currencySymbols.find(item => item.symbol === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const groupedItems = filtered.reduce((acc, item) => {
    const groupIndex = acc.findIndex(g => g.group === item.group);
    if (groupIndex > -1) {
      acc[groupIndex].items.push(item);
    } else {
      acc.push({ group: item.group, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-between bg-white hover:bg-secondary/30 transition-colors"
      >
        <span className="text-muted-foreground">
          {selected ? `${selected.symbol} - ${selected.code}` : "اختر الرمز"}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full bg-white border border-border rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-border sticky top-0 bg-white">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن رمز أو عملة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {groupedItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                لا توجد نتائج
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.group}>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-secondary/30">
                    {group.group}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={`${item.code}-${item.symbol}`}
                      type="button"
                      onClick={() => {
                        onChange(item.symbol);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full px-3 py-2.5 text-right text-sm hover:bg-primary/10 transition-colors flex items-center justify-between border-b border-border last:border-b-0",
                        selected?.symbol === item.symbol && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">{item.code}</span>
                        <span className="text-lg font-bold text-foreground">{item.symbol}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}