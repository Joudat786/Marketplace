import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

/**
 * قسم تخصيص اسم وأيقونة التطبيق من قِبَل العميل
 * يُستخدم في AppSetupPanel و TabbySetupPanel
 */
export default function AppCustomizationSection({
  app,
  customName,
  customIconUrl,
  onCustomNameChange,
  onCustomIconChange,
}) {
  const { toast } = useToast();
  const [uploadingIcon, setUploadingIcon] = useState(false);

  if (!app?.allow_custom_name && !app?.allow_custom_icon) return null;

  return (
    <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">تخصيص التطبيق</p>
        <p className="text-xs text-muted-foreground mt-0.5">يمكنك تخصيص اسم وأيقونة التطبيق الظاهرة لعملائك</p>
      </div>

      {app?.allow_custom_name && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            الاسم المخصص
            <span className="text-xs font-normal text-muted-foreground mr-2">(يُعرض بدلاً من: {app.name})</span>
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder={app.name}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
            dir="rtl"
          />
        </div>
      )}

      {app?.allow_custom_icon && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            الأيقونة المخصصة
          </label>
          <div className="flex items-center gap-3">
            {customIconUrl && (
              <div className="relative flex-shrink-0">
                <img
                  src={customIconUrl}
                  alt="أيقونة مخصصة"
                  className="w-12 h-12 rounded-lg object-contain border border-border p-1"
                />
                <button
                  type="button"
                  onClick={() => onCustomIconChange("")}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                >✕</button>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer bg-secondary border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors">
              {uploadingIcon ? (
                <><span className="animate-spin inline-block">⏳</span> جارٍ الرفع...</>
              ) : (
                <><span>📤</span> رفع صورة</>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingIcon}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingIcon(true);
                  try {
                    const res = await base44.integrations.Core.UploadFile({ file });
                    onCustomIconChange(res.file_url);
                  } catch {
                    toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
                  } finally {
                    setUploadingIcon(false);
                  }
                }}
              />
            </label>
            {!customIconUrl && (
              <span className="text-xs text-muted-foreground">PNG, JPG (أقل من 2MB)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}