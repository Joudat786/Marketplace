import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Globe } from "lucide-react";
import CurrencySelector from "./CurrencySelector";

export default function LandingNavbar({ currencies = [], selectedCurrencyId, onCurrencyChange, brandSettings }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin("/");
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {brandSettings?.light_logo_url ? (
            <img 
              src={brandSettings.light_logo_url} 
              alt="شعار" 
              className="h-10 w-auto object-contain max-w-[120px]"
            />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Globe size={20} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground hidden sm:inline">منصتنا</span>
            </>
          )}
        </Link>

        {/* Right side: Currency selector + Auth Buttons */}
        <div className="flex items-center gap-3">
          <CurrencySelector
            currencies={currencies}
            selectedCurrencyId={selectedCurrencyId}
            onCurrencyChange={onCurrencyChange}
          />

          <button
            onClick={handleLogin}
            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors">
            تسجيل الدخول
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity">
            ابدأ مجاناً
          </button>
        </div>
      </div>
    </nav>
  );
}