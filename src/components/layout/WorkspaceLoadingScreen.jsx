import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function WorkspaceLoadingScreen({ onRetry }) {
  const [elapsed, setElapsed] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= 45) setShowRetry(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // تأثير النقاط المتحركة
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const getMessage = () => {
    if (elapsed < 5) return 'جارٍ إعداد حسابك';
    if (elapsed < 15) return 'جارٍ إنشاء مساحة العمل';
    if (elapsed < 30) return 'يُرجى الانتظار قليلاً';
    return 'جارٍ إتمام الإعداد';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
        {/* الشعار */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">م</span>
        </div>

        {!showRetry ? (
          <>
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <div>
              <p className="text-foreground font-semibold text-base">
                {getMessage()}{dots}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {elapsed < 10
                  ? 'يتم إعداد حسابك لأول مرة'
                  : 'قد يستغرق الإعداد الأولي بضع ثوانٍ'}
              </p>
            </div>
            {/* شريط تقدم بصري */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((elapsed / 40) * 100, 95)}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <p className="text-foreground font-semibold">استغرق الإعداد وقتاً طويلاً</p>
              <p className="text-muted-foreground text-sm">انقر على إعادة المحاولة للمتابعة</p>
            </div>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
          </>
        )}
      </div>
    </div>
  );
}