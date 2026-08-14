import { MessageSquare } from 'lucide-react';
import ServiceSettingsPage from '../../../pages/superadmin/settings/ServiceSettingsPage';

export default function SMSSettings() {
  return (
    <ServiceSettingsPage
      serviceType="messaging"
      title="إعدادات الرسائل"
      icon={MessageSquare}
      description="إدارة خدمات الرسائل النصية المثبّتة وإعدادات الربط"
      isClientView={true}
    />
  );
}