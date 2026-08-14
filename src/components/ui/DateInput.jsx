import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_AR = ["أح","إث","ثل","أر","خم","جم","سب"];

export default function DateInput({ value, onChange, className = "", placeholder = "YYYY/MM/DD", disabled = false }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [pickerMode, setPickerMode] = useState("day"); // "day" | "month" | "year"
  const wrapRef = useRef(null);

  const today = new Date();
  const initDate = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const toDisplay = (v) => v ? v.replace(/-/g, "/") : "";

  useEffect(() => {
    setInputVal(toDisplay(value));
    if (value) {
      const d = new Date(value);
      if (!isNaN(d)) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    }
  }, [value]);

  // إغلاق عند النقر خارج المكون
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, [open]);

  const handleTextChange = (e) => {
    let raw = e.target.value.replace(/[^\d/]/g, "");
    setInputVal(raw);
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) onChange(raw.replace(/\//g, "-"));
    else if (raw === "") onChange("");
  };

  const goNext = (e) => { e.stopPropagation();
    if (pickerMode === "year") { setViewYear(y => y + 12); return; }
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goPrev = (e) => { e.stopPropagation();
    if (pickerMode === "year") { setViewYear(y => y - 12); return; }
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const handleHeaderClick = (e) => {
    e.stopPropagation();
    if (pickerMode === "day") setPickerMode("month");
    else if (pickerMode === "month") setPickerMode("year");
    else setPickerMode("day");
  };

  const selectMonth = (e, idx) => {
    e.stopPropagation();
    setViewMonth(idx);
    setPickerMode("day");
  };

  const selectYear = (e, yr) => {
    e.stopPropagation();
    setViewYear(yr);
    setPickerMode("month");
  };

  // نطاق السنوات: 12 سنة تبدأ من مضاعف 12
  const yearStart = Math.floor(viewYear / 12) * 12;

  const selectDay = (e, d) => {
    e.stopPropagation();
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setInputVal(`${viewYear}/${mm}/${dd}`);
    setOpen(false);
  };

  const selectToday = (e) => { e.stopPropagation();
    const t = new Date();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    setViewYear(t.getFullYear()); setViewMonth(t.getMonth());
    onChange(`${t.getFullYear()}-${mm}-${dd}`);
    setInputVal(`${t.getFullYear()}/${mm}/${dd}`);
    setOpen(false);
  };

  const selected = value ? new Date(value) : null;
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isSelected = (d) => selected &&
    selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday = (d) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      dir="rtl"
      style={{ isolation: "auto" }}
    >
      {/* حقل الإدخال */}
      <div style={{ display:"flex", alignItems:"center", border:"1px solid hsl(var(--border))", borderRadius:"0.5rem", background:"#fff", direction:"rtl" }}>
        {/* التاريخ — يمتد ليملأ المساحة */}
        <input
          type="text"
          value={inputVal}
          onChange={handleTextChange}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          dir="rtl"
          maxLength={10}
          style={{
            flex:1, padding:"8px 12px",
            fontSize:14, background:"transparent", outline:"none", textAlign:"right", border:"none",
            minWidth:0,
          }}
        />
        {/* زر المسح — بجانب التاريخ مباشرة */}
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); setInputVal(""); setOpen(false); }}
            title="مسح التاريخ"
            style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              width:20, height:20, flexShrink:0, marginLeft:4,
              background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:"4px",
              cursor:"pointer", color:"#ef4444",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#fee2e2"; }}
          >
            <X size={11} />
          </button>
        )}
        {/* أيقونة التقويم — أقصى اليسار */}
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(v => !v); }}
          style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            width:38, height:38, flexShrink:0,
            background:"hsl(var(--primary)/0.08)",
            borderRight:"1px solid hsl(var(--border))",
            borderLeft:"none", borderTop:"none", borderBottom:"none",
            borderRadius:"0 0.5rem 0.5rem 0",
            cursor:"pointer",
            color:"hsl(var(--primary))",
          }}
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* التقويم */}
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: (wrapRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
            right: window.innerWidth - (wrapRef.current?.getBoundingClientRect().right ?? 0),
            zIndex: 99999,
            backgroundColor: "#fff",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            padding: "12px",
            width: "260px",
            direction: "rtl",
          }}
        >
          {/* رأس الشهر */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <button type="button" onClick={goNext}
              style={{ padding:"6px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <ChevronRight size={14} />
            </button>
            <button type="button" onClick={handleHeaderClick}
              style={{ fontSize:14, fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:"4px 10px", borderRadius:8 }}
              onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {pickerMode === "year"
                ? `${yearStart} - ${yearStart + 11}`
                : pickerMode === "month"
                ? viewYear
                : `${MONTHS_AR[viewMonth]} ${viewYear}`}
            </button>
            <button type="button" onClick={goPrev}
              style={{ padding:"6px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* وضع اختيار السنة */}
          {pickerMode === "year" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map(yr => (
                <button key={yr} type="button" onClick={(e) => selectYear(e, yr)}
                  style={{
                    padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                    background: yr === viewYear ? "hsl(var(--primary))" : "transparent",
                    color: yr === viewYear ? "#fff" : "#111",
                  }}
                  onMouseEnter={e => { if (yr !== viewYear) e.currentTarget.style.background="#f1f5f9"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = yr === viewYear ? "hsl(var(--primary))" : "transparent"; }}>
                  {yr}
                </button>
              ))}
            </div>
          )}

          {/* وضع اختيار الشهر */}
          {pickerMode === "month" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
              {MONTHS_AR.map((m, idx) => (
                <button key={m} type="button" onClick={(e) => selectMonth(e, idx)}
                  style={{
                    padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                    background: idx === viewMonth ? "hsl(var(--primary))" : "transparent",
                    color: idx === viewMonth ? "#fff" : "#111",
                  }}
                  onMouseEnter={e => { if (idx !== viewMonth) e.currentTarget.style.background="#f1f5f9"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = idx === viewMonth ? "hsl(var(--primary))" : "transparent"; }}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* وضع اختيار اليوم */}
          {pickerMode === "day" && (<>
          {/* أيام الأسبوع */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
            {DAYS_AR.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:"#9ca3af", padding:"4px 0" }}>{d}</div>
            ))}
          </div>

          {/* الأيام */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {cells.map((d, i) => d === null ? (
              <div key={`e-${i}`} />
            ) : (
              <button
                key={d}
                type="button"
                onClick={(e) => selectDay(e, d)}
                style={{
                  textAlign:"center",
                  fontSize:12,
                  padding:"6px 2px",
                  borderRadius:8,
                  border:"none",
                  cursor:"pointer",
                  fontWeight: isSelected(d) || isToday(d) ? 700 : 500,
                  background: isSelected(d) ? "hsl(var(--primary))" : isToday(d) ? "hsl(var(--primary)/0.1)" : "transparent",
                  color: isSelected(d) ? "#fff" : isToday(d) ? "hsl(var(--primary))" : "#111",
                }}
                onMouseEnter={e => { if (!isSelected(d)) e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected(d) ? "hsl(var(--primary))" : isToday(d) ? "hsl(var(--primary)/0.1)" : "transparent"; }}
              >
                {d}
              </button>
            ))}
          </div>
          </>)}

          {/* زر اليوم */}
          <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid hsl(var(--border))" }}>
            <button type="button" onClick={selectToday}
              style={{ width:"100%", fontSize:12, color:"hsl(var(--primary))", background:"none", border:"none", cursor:"pointer", padding:"6px", borderRadius:8, fontWeight:600 }}
              onMouseEnter={e=>e.target.style.background="#f5f3ff"}
              onMouseLeave={e=>e.target.style.background="none"}>
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}