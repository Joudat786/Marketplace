import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

/**
 * مكوّن الشاشة المنزلقة العام
 * تنزلق من اليسار بعرض 90% من الشاشة
 */
export default function SlidePanel({ open, onClose, children }) {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }} modal={false}>
      <SheetContent
        side="left"
        className="w-full p-0 overflow-y-auto border-r border-border"
        style={{ maxWidth: "90vw" }}
        onInteractOutside={() => onClose()}
        onPointerDownOutside={() => onClose()}
      >
        <SheetTitle className="sr-only">Panel</SheetTitle>
        <SheetDescription className="sr-only">Content panel</SheetDescription>
        <div className="min-h-full" dir="rtl">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}