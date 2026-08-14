import { Check } from "lucide-react";

export default function SelectionModeToggle({ selectionMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
        selectionMode
          ? "bg-primary text-white shadow-lg"
          : "bg-secondary/60 text-foreground hover:bg-secondary"
      }`}
      title="اضغط لتفعيل/تعطيل وضع التحديد"
    >
      <Check size={16} />
      تحديد
    </button>
  );
}