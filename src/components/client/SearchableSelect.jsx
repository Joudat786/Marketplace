import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({ value, onChange, options, placeholder = "اختر...", className = "" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center justify-between border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
      >
        <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 mr-1" />
        <span className={`flex-1 text-center truncate ${!selected ? "text-muted-foreground" : "text-foreground"}`}>
          {selected ? selected.label : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 w-48 bg-white border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
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
          {/* القائمة */}
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
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                  className={`w-full text-right px-3 py-2 text-xs hover:bg-primary/10 transition-colors ${value === o.value ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}