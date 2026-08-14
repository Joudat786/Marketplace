import { useState } from "react";
import { Bell, Search, ChevronDown, ChevronUp, User, LogOut, Building2, Settings, Menu, X, Globe, Lock, HelpCircle, CreditCard, IdCard, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function AppHeader({ sidebarWidth = 72, onToggleSidebar, searchValue = "", onSearchChange }) {
  // نحدد isAdmin من بيانات المستخدم مباشرة بدلاً من الـ prop
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'super_admin';

  const { data: brandSettings } = useQuery({
    queryKey: ['generalSettings'],
    queryFn: async () => {
      const settings = await base44.entities.GeneralSettings.filter({ settings_type: "brand" });
      return settings && settings.length > 0 ? settings[0] : null;
    }
  });

  const initials = user?.full_name ?
  user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2) :
  '؟';

  return (
    <header
      className="h-14 bg-white border-b border-border flex items-center justify-between px-4 z-20 transition-all duration-300">
      
      {/* Right section: Search */}
       <div className="flex items-center gap-4">
         <div className="w-80 hidden md:block">
           <div className="relative">
             <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input
               type="text"
               value={searchValue}
               onChange={(e) => onSearchChange?.(e.target.value)}
               placeholder="ابحث عن تطبيق، باقة، خدمة..."
               className="w-full bg-muted/60 border border-border rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all" />
           </div>
         </div>
         </div>

      {/* Left section: User info + Notifications */}
      <div className="flex items-center gap-2">
        {/* Search mobile */}
        <button className="md:hidden w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button className="bg-[#f5f5f7] text-muted-foreground rounded-lg relative w-9 h-9 hover:bg-muted flex items-center justify-center transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        {isAdmin &&
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] hidden sm:flex">
            سوبر آدمن
          </Badge>
        }
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-[#f5f5f7] px-2 py-1.5 rounded-lg flex items-center gap-2.5 hover:bg-muted transition-colors">
              <ChevronDown size={14} className="text-muted-foreground" />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-tight">{user?.full_name || 'المستخدم'}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{user?.email || ''}</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-64" style={{direction:"rtl"}}>
            {/* User Info */}
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />

            {/* حسابي */}
            <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <IdCard size={15} className="text-muted-foreground" />
              <span>حسابي</span>
            </DropdownMenuItem>

            {/* بيانات الشركة */}
            <DropdownMenuItem asChild>
              <Link to="/company-profile" className="flex items-center gap-2 px-3 py-2 cursor-pointer w-full">
                <FileText size={15} className="text-muted-foreground" />
                <span>بيانات الشركة</span>
              </Link>
            </DropdownMenuItem>

            {/* اللغة - قابل للتوسيع */}
            <div>
              <button
                onClick={(e) => { e.preventDefault(); setLangOpen(v => !v); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                style={{direction:"rtl"}}
              >
                <Globe size={15} className="text-muted-foreground" />
                <span>اللغة</span>
                <span className="mr-auto">{langOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}</span>
              </button>

              {langOpen && (
                <div className="mx-2 mb-2 rounded-xl overflow-hidden border border-primary/20 shadow-sm">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors bg-primary/10" style={{direction:"rtl"}}>
                    <span className="text-lg">🇸🇦</span>
                    <span className="font-semibold text-primary flex-1 text-right">العربية</span>
                    <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5">✓</span>
                  </button>
                  <div className="border-t border-border/50" />
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors text-muted-foreground" style={{direction:"ltr"}}>
                    <span className="text-lg">🇺🇸</span>
                    <span className="flex-1 text-left">English</span>
                  </button>
                </div>
              )}
            </div>

            {/* الاشتراكات والفواتير */}
            <DropdownMenuItem asChild>
              <Link to={isAdmin ? "/super-admin/subscriptions" : "/subscriptions"} className="flex items-center gap-2 px-3 py-2 cursor-pointer w-full">
                <CreditCard size={15} className="text-muted-foreground" />
                <span>الاشتراكات والفواتير</span>
              </Link>
            </DropdownMenuItem>

            {/* تغيير كلمة المرور */}
            <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <Lock size={15} className="text-muted-foreground" />
              <span>تغيير كلمة المرور</span>
            </DropdownMenuItem>

            {/* مركز المساعدة */}
            <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <HelpCircle size={15} className="text-muted-foreground" />
              <span>مركز المساعدة</span>
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-purple-600 flex items-center gap-2 px-3 py-2 cursor-pointer">
                  <Building2 size={15} />
                  <span>لوحة السوبر آدمن</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive flex items-center gap-2 px-3 py-2 cursor-pointer"
              onClick={() => base44.auth.logout()}>
              <LogOut size={15} />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>);


}