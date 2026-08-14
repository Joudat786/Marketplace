import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

/**
 * MultiLangInput — حقل نصي متعدد اللغات
 * 
 * Props:
 *  - label: string — تسمية الحقل
 *  - required: boolean
 *  - values: { ar: string, en: string, [code]: string } — قيم لكل لغة
 *  - onChange: (lang_code, value) => void
 *  - placeholder: string | { [code]: string } — placeholder لكل لغة
 *  - multiline: boolean — textarea أم input
 *  - rows: number — عدد الصفوف عند multiline
 *  - className: string
 */
export default function MultiLangInput({
  label,
  required = false,
  values = {},
  onChange,
  placeholder = "",
  multiline = false,
  rows = 3,
  className = "",
}) {
  const [activeLang, setActiveLang] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // جلب اللغات المفعّلة
  const { data: languages = [] } = useQuery({
    queryKey: ["languages-active"],
    queryFn: () => base44.entities.Language.list(),
    select: (data) =>
      data
        .filter((l) => l.is_active)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    staleTime: 60000,
  });

  // تعيين اللغة الافتراضية عند التحميل
  useEffect(() => {
    if (languages.length > 0 && !activeLang) {
      const defaultLang =
        languages.find((l) => l.is_default) || languages[0];
      setActiveLang(defaultLang);
    }
  }, [languages, activeLang]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (languages.length === 0 || !activeLang) {
    // fallback بسيط إذا لم تُحمَّل اللغات بعد
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium mb-1">
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        {multiline ? (
          <Textarea
            value={values["ar"] || ""}
            onChange={(e) => onChange?.("ar", e.target.value)}
            placeholder={
              typeof placeholder === "string" ? placeholder : placeholder["ar"] || ""
            }
            rows={rows}
          />
        ) : (
          <Input
            value={values["ar"] || ""}
            onChange={(e) => onChange?.("ar", e.target.value)}
            placeholder={
              typeof placeholder === "string" ? placeholder : placeholder["ar"] || ""
            }
          />
        )}
      </div>
    );
  }

  const currentValue = values[activeLang.code] || "";
  const currentPlaceholder =
    typeof placeholder === "string"
      ? placeholder
      : placeholder[activeLang.code] || "";

  const isRTL = activeLang.direction === "RTL";

  return (
    <div className={className} dir="rtl">
      {label && (
        <label className="block text-sm font-medium mb-1 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <div className="relative flex items-stretch border border-border rounded-lg overflow-visible focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 bg-white">
        {/* حقل الإدخال — على اليسار */}
        {multiline ? (
          <textarea
            value={currentValue}
            onChange={(e) => onChange?.(activeLang.code, e.target.value)}
            placeholder={currentPlaceholder}
            rows={rows}
            dir={isRTL ? "rtl" : "ltr"}
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none resize-none"
          />
        ) : (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange?.(activeLang.code, e.target.value)}
            placeholder={currentPlaceholder}
            dir={isRTL ? "rtl" : "ltr"}
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none min-w-0 text-right"
          />
        )}

        {/* زر اللغة — على اليمين */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1 px-3 h-full text-xs font-semibold text-foreground bg-secondary/60 hover:bg-secondary transition-colors border-r border-input rounded-l-none rounded-r-md"
            style={{ minWidth: 56 }}
          >
            <span>{activeLang.code.toUpperCase()}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-border rounded-xl shadow-xl overflow-hidden min-w-max">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setActiveLang(lang);
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm text-right transition-colors hover:bg-secondary/40 whitespace-nowrap ${
                    activeLang.code === lang.code
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground"
                  }`}
                >
                  {activeLang.code === lang.code && (
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                  {activeLang.code !== lang.code && (
                    <span className="w-3 flex-shrink-0" />
                  )}
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}