/**
 * قائمة أنواع الخدمات المربوطة بصفحات الإعدادات
 * service_type يُستخدم لربط التطبيقات تلقائياً بصفحات الإعدادات الصحيحة
 */

export const SETTINGS_SERVICE_TYPES = [
  { value: "general", label: "الإعدادات العامة", path: "/super-admin/settings/general", icon: "Settings" },
  { value: "notifications", label: "إعدادات الإشعارات", path: "/super-admin/settings/notifications", icon: "Bell" },
  { value: "messaging", label: "إعدادات الرسائل", path: "/super-admin/settings/sms", icon: "MessageSquare" },
  { value: "email", label: "إعدادات البريد", path: "/super-admin/settings/email", icon: "Mail" },
  { value: "payment", label: "إعدادات الدفع", path: "/super-admin/settings/payment", icon: "CreditCard" },
  { value: "shipping", label: "إعدادات الشحن", path: "/super-admin/settings/shipping", icon: "Truck" },
  { value: "languages", label: "إعدادات اللغات", path: "/super-admin/settings/languages", icon: "Globe" },
  { value: "currencies", label: "إعدادات العملات", path: "/super-admin/settings/currencies", icon: "DollarSign" },
  { value: "locations", label: "إعدادات المواقع الجغرافية", path: "/super-admin/settings/locations", icon: "MapPin" },
  { value: "required_fields", label: "الحقول الإجبارية", path: "/super-admin/settings/required-fields", icon: "CheckSquare" },
  { value: "forms", label: "مصمم النماذج والتقارير", path: "/super-admin/settings/form-designer", icon: "FileText" },
  { value: "subscription_mode", label: "إعدادات نمط الاشتراك", path: "/super-admin/settings/subscription-mode", icon: "ToggleRight" },
  { value: "archive", label: "إعدادات الأرشفة", path: "/super-admin/settings/archive", icon: "Archive" },
  { value: "sidebar", label: "مصمم القائمة الجانبية", path: "/super-admin/settings/sidebar-designer", icon: "Sliders" },
  { value: "users", label: "المستخدمين والاعتمادات", path: "/super-admin/settings/users", icon: "UserCheck" },
  { value: "backup", label: "النسخ الاحتياطي", path: "/super-admin/settings/backup", icon: "HardDrive" },
  { value: "apps", label: "مدير الباقات والتطبيقات", path: "/super-admin/app-manager", icon: "Package" },
  { value: "billing", label: "الاشتراكات والفواتير", path: "/super-admin/orders-subscriptions", icon: "CreditCard" },
];

export const getServiceTypeLabel = (value) => {
  const service = SETTINGS_SERVICE_TYPES.find(s => s.value === value);
  return service?.label || value;
};

export const getServiceTypePath = (value) => {
  const service = SETTINGS_SERVICE_TYPES.find(s => s.value === value);
  return service?.path || null;
};