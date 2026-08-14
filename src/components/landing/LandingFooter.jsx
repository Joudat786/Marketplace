import { Link } from "react-router-dom";
import { Mail, Phone, Globe, Hash, Smartphone, Printer } from "lucide-react";
import SocialIconLink from "./SocialIcons";
import { getIconComponentByName } from "@/components/superadmin/IconPickerPopover";

const contactTypeIconMap = {
  email: Mail,
  unified_number: Hash,
  phone: Phone,
  mobile: Smartphone,
  fax: Printer,
  other: Globe,
};

export default function LandingFooter({ brandSettings, contactSettings }) {
  return (
    <footer className="bg-foreground text-primary-foreground py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            {brandSettings?.footer_logo_url ? (
              <>
                <img 
                  src={brandSettings.footer_logo_url} 
                  alt="شعار" 
                  className="h-10 w-auto object-contain mb-4"
                />
                <p className="text-sm opacity-80">{brandSettings?.brand_name || "منصتنا"}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <span className="font-bold">{brandSettings?.brand_name || "منصتنا"}</span>
                </div>
                <p className="text-sm opacity-80">{brandSettings?.footer_text || "منصة متكاملة لإدارة عملك"}</p>
              </>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">الروابط</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">الرئيسية</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">المميزات</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">الأسعار</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">التوثيق</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">الشركة</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">من نحن</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">المدونة</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">الوظائف</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">اتصل بنا</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
          <h3 className="font-semibold mb-4">التواصل</h3>
          <div className="space-y-3 text-sm opacity-80">
            {contactSettings?.contact_items?.length > 0 ? (
              contactSettings.contact_items.map((item, idx) => {
                let Icon = Globe;
                if (item.icon) {
                  Icon = getIconComponentByName(item.icon);
                }
                return item.value ? (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon size={14} className="flex-shrink-0" />
                    <span>{item.value}</span>
                  </div>
                ) : null;
              })
            ) : null}
          </div>
            {/* Social Links - أسفل التواصل */}
            {contactSettings?.social_links?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap opacity-90">
                {contactSettings.social_links.map((link, idx) => (
                  link.url && <SocialIconLink key={idx} platform={link.platform} url={link.url} customIcon={link.icon} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between text-sm opacity-80">
          <p>{brandSettings?.footer_text || "&copy; 2026 منصتنا. جميع الحقوق محفوظة."}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:opacity-100 transition-opacity">سياسة الخصوصية</a>
            <a href="#" className="hover:opacity-100 transition-opacity">شروط الاستخدام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}