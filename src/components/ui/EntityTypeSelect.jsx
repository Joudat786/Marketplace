import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

const ENTITY_TYPES = [
  "مؤسسة فردية",
  "شركة ذات مسؤولية محدودة",
  "شركة مساهمة",
  "شركة مساهمة مبسطة",
  "شركة تضامن",
  "شركة توصية بسيطة",
];

export default function EntityTypeSelect({ value, onChange, placeholder = "-- اختر نوع الكيان القانوني --" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 200 });
  const ref = useRef(null);

  const filtered = ENTITY_TYPES.filter(t => t.includes(search));

  // احسب الموضع عند الفتح
  const calcPos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  };

  const handleOpen = () => {
    calcPos();
    setOpen(v => !v);
    setSearch("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    const onScroll = () => calcPos();
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      {/* زر الاختيار - نفس شكل SearchableSelect تماماً */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
      >
        <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 mr-1" />
        <span className={`flex-1 text-center truncate ${!value ? "text-muted-foreground" : "text-foreground"}`}>
          {value || placeholder}
        </span>
      </button>

      {/* القائمة - fixed لتجاوز overflow، لكن موضعها محسوب بدقة */}
      {open && (
        <div
          className="fixed z-[99999] bg-white border border-border rounded-xl shadow-xl overflow-hidden"
          dir="rtl"
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 220) }}
        >
          {/* حقل البحث */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="w-full text-xs border border-border rounded-md pr-6 pl-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-background text-right"
              />
            </div>
          </div>

          {/* الخيارات */}
          <div className="max-h-44 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-right px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {placeholder}
            </button>
            {filtered.length === 0 ? (
              <div className="text-center py-3 text-xs text-muted-foreground">لا توجد نتائج</div>
            ) : (
              filtered.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { onChange(type); setOpen(false); setSearch(""); }}
                  className={`w-full text-right px-3 py-2 text-xs hover:bg-primary/10 transition-colors ${value === type ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
                >
                  {type}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}