import { Truck } from "lucide-react";
import ServiceSettingsPage from "./ServiceSettingsPage";

export default function ShippingSettings() {
  return (
    <ServiceSettingsPage
      serviceType="shipping"
      title="إعدادات الشحن والتوصيل"
      icon={Truck}
      description="إدارة شركات الشحن المثبّتة وإعدادات الربط"
    />
  );
}