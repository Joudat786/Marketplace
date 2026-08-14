import { MessageSquare } from "lucide-react";
import ServiceSettingsPage from "./ServiceSettingsPage";

export default function SMSSettings() {
  return (
    <ServiceSettingsPage
      serviceType="messaging"
      title="إعدادات الرسائل"
      icon={MessageSquare}
      description="إدارة مزودي الرسائل النصية والواتساب المثبّتين"
    />
  );
}