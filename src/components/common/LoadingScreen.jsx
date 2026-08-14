export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">م</span>
        </div>
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    </div>
  );
}