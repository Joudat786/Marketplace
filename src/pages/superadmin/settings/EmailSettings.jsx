import { Mail } from "lucide-react";
import ServiceSettingsPage from "./ServiceSettingsPage";

export default function EmailSettings() {
  return (
    <ServiceSettingsPage
      serviceType="email"
      title="إعدادات البريد الإلكتروني"
      icon={Mail}
      description="إدارة مزودي البريد الإلكتروني والـ SMTP المثبّتين"
    />
  );
}