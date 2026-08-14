import { MessageCircle } from "lucide-react";
import ServiceSettingsPage from "./ServiceSettingsPage";

export default function MessagingSettings() {
  return (
    <ServiceSettingsPage
      serviceType="messaging"
      title="إعدادات الرسائل"
      icon={MessageCircle}
      description="إدارة مزودي خدمات الرسائل والـ SMS المثبّتين"
      isClientView={false}
    />
  );
}