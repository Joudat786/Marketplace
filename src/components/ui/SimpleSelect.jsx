import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * SimpleSelect — قائمة منسدلة مخصصة موحدة التصميم مع EntityTypeSelect
 * Props:
 *  - value: string
 *  - onChange: (val) => void
 *  - options: [{ value, label }]
 *  - placeholder: string
 */
export default function SimpleSelect({ value, onChange, options = [], placeholder = "-- اختر --" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={containerRef} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 border border-border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 hover:border-primary/40 transition-colors"
      >
        <span className={`flex-1 text-right truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="fixed z-[99999] bg-white border border-border rounded-xl shadow-xl overflow-hidden"
          style={{
            width: containerRef.current?.offsetWidth,
            top: (containerRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
            right: window.innerWidth - (containerRef.current?.getBoundingClientRect().right ?? 0),
          }}
        >
          <div className="max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-secondary/50 block ${
                  value === opt.value ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}