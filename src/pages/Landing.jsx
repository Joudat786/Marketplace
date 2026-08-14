import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import StepsSection from "@/components/landing/StepsSection";
import LandingFooter from "@/components/landing/LandingFooter";
import MaintenancePage from "@/components/landing/MaintenancePage";

export default function Landing() {
  const { data: publicData = {} } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPublicPlans', {});
      return res.data || {};
    }
  });

  const { data: brandSettings } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "brand" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "system" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const { data: contactSettings } = useQuery({
    queryKey: ['contactSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "contact" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const currencies = useMemo(() => publicData?.currencies || [], [publicData]);
  const defaultCurrency = useMemo(() => {
    return currencies.find(c => c.is_default) || currencies.find(c => c.code === "SAR") || currencies[0] || null;
  }, [currencies]);

  const [selectedCurrencyId, setSelectedCurrencyId] = useState(null);
  const selectedCurrency = useMemo(() => {
    if (selectedCurrencyId) return currencies.find(c => c.id === selectedCurrencyId) || defaultCurrency;
    return defaultCurrency;
  }, [selectedCurrencyId, currencies, defaultCurrency]);

  const isMaintenanceMode = systemSettings?.maintenance_mode_enabled === true;
  const isLandingPageDisabled = systemSettings?.landing_page_enabled === false;

  if (isLandingPageDisabled) {
    base44.auth.redirectToLogin();
    return null;
  }

  if (isMaintenanceMode) {
    return <MaintenancePage brandSettings={brandSettings} maintenanceText={systemSettings?.maintenance_text} />;
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <LandingNavbar
        currencies={currencies}
        selectedCurrencyId={selectedCurrencyId || defaultCurrency?.id}
        onCurrencyChange={setSelectedCurrencyId}
        brandSettings={brandSettings}
      />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <HeroSection />
        <FeaturesSection />
        <PricingSection publicData={publicData} selectedCurrency={selectedCurrency} />
        <StepsSection />
      </motion.main>

      <LandingFooter brandSettings={brandSettings} contactSettings={contactSettings} />
    </div>
  );
}