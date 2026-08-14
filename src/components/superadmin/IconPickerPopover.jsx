import { useState, useRef, useEffect } from "react";
import {
  Mail, Phone, Hash, Smartphone, Printer, Globe,
  MapPin, Link, MessageCircle, AtSign, Send, Bell,
  Briefcase, Building2, CreditCard, Home, Info,
  Twitter, Instagram, Facebook, Linkedin, Youtube,
  Music2, Ghost, Bookmark, MessageSquare, Tv, Github,
  Mic, Radio, Volume2, Rss, Image, Search, X,
  Heart, Star, Shield, Lock, Unlock, Eye,
  Camera, Video, Headphones, Monitor, Tablet, Laptop,
  Wifi, Bluetooth, Battery, Zap, Power,
  Settings, Wrench, Scissors, Pen, Edit,
  Trash2, Archive, Download, Upload, Share2, Copy,
  Plus, Minus, Check,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Users, User, UserPlus, UserCheck, UserX,
  Calendar, Clock, Timer, AlarmClock,
  ShoppingCart, ShoppingBag, Package, Tag, Percent,
  DollarSign, Euro, TrendingUp, TrendingDown, BarChart2,
  PieChart, Activity, Target, Award, Trophy,
  Flag, Newspaper, Book, BookOpen,
  FileText, File, Folder, FolderOpen, Database,
  Cloud, CloudUpload, CloudDownload, Server, Cpu,
  Code, Terminal, GitBranch,
  Truck, Car, Plane, Ship,
  Coffee, Gift,
  Sun, Moon, Wind, Droplets, Umbrella,
  Map, Navigation, Compass,
  Music, PlayCircle, PauseCircle,
  Layers, Layout, Grid, List,
  Bold, Italic, Type, Palette,
  Smile, Frown, ThumbsUp, ThumbsDown,
  AlertCircle, AlertTriangle, CheckCircle, XCircle, HelpCircle,
  Paperclip, Pin, Clipboard,
  ExternalLink, MoreHorizontal, Menu,
  RotateCcw, RefreshCw,
  Maximize, ZoomIn, ZoomOut,
  Sliders, ToggleLeft, ToggleRight,
  BellOff, VolumeX, Volume1,
  MicOff,
  Key, ShieldCheck, ShieldAlert,
  Fingerprint, QrCode, Barcode, ScanLine,
  Lightbulb, Flame, Snowflake, Leaf,
  MessagesSquare, PhoneOff, PhoneIncoming, PhoneCall,
  VideoOff,
  Route, Signal, Satellite,
  Factory, Hotel, UtensilsCrossed,
} from "lucide-react";

// تصنيفات النظام المخصصة مع أيقونات محددة
export const SYSTEM_CATEGORY_ICONS = {
  "المحاسبة": "BarChart2",
  "إدارة الأصول": "Building2",
  "إدارة المخازن": "Package",
  "الموردين والمشتريات": "Truck",
  "العملاء والمبيعات": "Users",
  "الموارد البشرية": "UserCheck",
  "إدارة المشاريع والمهام": "CheckCircle",
  "التجارة الإلكترونية": "ShoppingCart",
  "التسويق ونشر المحتوى": "Target",
  "الاتصالات والمحادثات والرسائل": "MessageSquare",
  "أنظمة المطاعم": "Coffee",
  "الأنظمة الصحية": "Heart",
  "أنظمة التعليم": "BookOpen",
  "الأنظمة الصناعية": "Factory",
  "أنظمة الفندقة والسياحة": "Hotel",
  "أنظمة الصيانة": "Wrench",
  "طرق وشركات الدفع": "CreditCard",
  "الشحن والتوصيل": "Truck",
  "الأرشيف": "Archive",
  "الإعدادات": "Settings",
  "تطبيقات وخدمات أخرى": "Zap"
};

export const ALL_ICONS = [
  // ── التواصل الاجتماعي Social Media ──
  { name: "Twitter",        label: "تويتر / X",              labelEn: "Twitter / X",        Icon: Twitter,        category: "social" },
  { name: "Instagram",      label: "إنستغرام",               labelEn: "Instagram",           Icon: Instagram,      category: "social" },
  { name: "Facebook",       label: "فيسبوك",                 labelEn: "Facebook",            Icon: Facebook,       category: "social" },
  { name: "Linkedin",       label: "لينكدإن",                labelEn: "LinkedIn",            Icon: Linkedin,       category: "social" },
  { name: "Youtube",        label: "يوتيوب",                 labelEn: "YouTube",             Icon: Youtube,        category: "social" },
  { name: "Music2",         label: "تيك توك",                labelEn: "TikTok",              Icon: Music2,         category: "social" },
  { name: "Ghost",          label: "سناب شات",               labelEn: "Snapchat",            Icon: Ghost,          category: "social" },
  { name: "MessageCircle",  label: "واتساب",                 labelEn: "WhatsApp",            Icon: MessageCircle,  category: "social" },
  { name: "Send",           label: "تيليغرام",               labelEn: "Telegram",            Icon: Send,           category: "social" },
  { name: "AtSign",         label: "ثريدز",                  labelEn: "Threads",             Icon: AtSign,         category: "social" },
  { name: "Bookmark",       label: "بينتيريست",              labelEn: "Pinterest",           Icon: Bookmark,       category: "social" },
  { name: "MessageSquare",  label: "ريديت",                  labelEn: "Reddit",              Icon: MessageSquare,  category: "social" },
  { name: "Hash",           label: "ديسكورد",                labelEn: "Discord",             Icon: Hash,           category: "social" },
  { name: "Image",          label: "بيهانس / فليكر",         labelEn: "Behance / Flickr",    Icon: Image,          category: "social" },
  { name: "Tv",             label: "دريبل / فيميو",          labelEn: "Dribbble / Vimeo",    Icon: Tv,             category: "social" },
  { name: "Github",         label: "جيت هاب",                labelEn: "GitHub",              Icon: Github,         category: "social" },
  { name: "Radio",          label: "تويتش",                  labelEn: "Twitch",              Icon: Radio,          category: "social" },
  { name: "Rss",            label: "ميديوم / مدونة",         labelEn: "Medium / Blog",       Icon: Rss,            category: "social" },
  { name: "Volume2",        label: "ساوند كلاود",            labelEn: "SoundCloud",          Icon: Volume2,        category: "social" },
  { name: "Mic",            label: "كلوب هاوس / بودكاست",   labelEn: "Clubhouse / Podcast", Icon: Mic,            category: "social" },
  { name: "MessagesSquare", label: "كورا",                   labelEn: "Quora",               Icon: MessagesSquare, category: "social" },
  { name: "PlayCircle",     label: "سبوتيفاي",               labelEn: "Spotify",             Icon: PlayCircle,     category: "social" },
  { name: "Code",           label: "جيت لاب",                labelEn: "GitLab",              Icon: Code,           category: "social" },
  { name: "Layers",         label: "ستاك أوفر فلو",          labelEn: "Stack Overflow",      Icon: Layers,         category: "social" },
  { name: "Star",           label: "GitHub Stars",           labelEn: "Stars",               Icon: Star,           category: "social" },
  { name: "GitBranch",      label: "مستودع كود",             labelEn: "Code Repository",     Icon: GitBranch,      category: "social" },

  // ── التواصل Contact ──
  { name: "Mail",           label: "بريد إلكتروني",          labelEn: "Email",               Icon: Mail,           category: "contact" },
  { name: "Phone",          label: "هاتف",                   labelEn: "Phone",               Icon: Phone,          category: "contact" },
  { name: "PhoneCall",      label: "مكالمة هاتفية",          labelEn: "Phone Call",          Icon: PhoneCall,      category: "contact" },
  { name: "PhoneIncoming",  label: "مكالمة واردة",           labelEn: "Incoming Call",       Icon: PhoneIncoming,  category: "contact" },
  { name: "PhoneOff",       label: "هاتف مغلق",              labelEn: "Phone Off",           Icon: PhoneOff,       category: "contact" },
  { name: "Smartphone",     label: "جوال",                   labelEn: "Mobile",              Icon: Smartphone,     category: "contact" },
  { name: "Printer",        label: "فاكس",                   labelEn: "Fax / Printer",       Icon: Printer,        category: "contact" },
  { name: "Globe",          label: "موقع إلكتروني",          labelEn: "Website",             Icon: Globe,          category: "contact" },
  { name: "MapPin",         label: "موقع جغرافي",            labelEn: "Location",            Icon: MapPin,         category: "contact" },
  { name: "Link",           label: "رابط",                   labelEn: "Link / URL",          Icon: Link,           category: "contact" },
  { name: "Bell",           label: "تنبيه / إشعار",          labelEn: "Notification",        Icon: Bell,           category: "contact" },
  { name: "Video",          label: "مكالمة مرئية",           labelEn: "Video Call",          Icon: Video,          category: "contact" },
  { name: "Headphones",     label: "سماعات / دعم",           labelEn: "Headphones / Support",Icon: Headphones,     category: "contact" },
  { name: "ExternalLink",   label: "رابط خارجي",             labelEn: "External Link",       Icon: ExternalLink,   category: "contact" },
  { name: "Navigation",     label: "ملاحة / اتجاه",          labelEn: "Navigation",          Icon: Navigation,     category: "contact" },
  { name: "Route",          label: "طريق / مسار",            labelEn: "Route",               Icon: Route,          category: "contact" },
  { name: "Map",            label: "خريطة",                  labelEn: "Map",                 Icon: Map,            category: "contact" },
  { name: "Compass",        label: "بوصلة",                  labelEn: "Compass",             Icon: Compass,        category: "contact" },

  // ── الأعمال Business ──
  { name: "Briefcase",      label: "حقيبة أعمال",            labelEn: "Briefcase",           Icon: Briefcase,      category: "business" },
  { name: "Building2",      label: "شركة / مبنى",            labelEn: "Company / Building",  Icon: Building2,      category: "business" },
  { name: "CreditCard",     label: "بطاقة ائتمان",           labelEn: "Credit Card",         Icon: CreditCard,     category: "business" },
  { name: "DollarSign",     label: "دولار / مال",            labelEn: "Dollar / Money",      Icon: DollarSign,     category: "business" },
  { name: "Euro",           label: "يورو",                   labelEn: "Euro",                Icon: Euro,           category: "business" },
  { name: "ShoppingCart",   label: "سلة تسوق",               labelEn: "Shopping Cart",       Icon: ShoppingCart,   category: "business" },
  { name: "ShoppingBag",    label: "حقيبة تسوق",             labelEn: "Shopping Bag",        Icon: ShoppingBag,    category: "business" },
  { name: "Package",        label: "طرد / منتج",             labelEn: "Package",             Icon: Package,        category: "business" },
  { name: "Tag",            label: "وسم / سعر",              labelEn: "Tag / Price",         Icon: Tag,            category: "business" },
  { name: "Percent",        label: "خصم / نسبة",             labelEn: "Discount / Percent",  Icon: Percent,        category: "business" },
  { name: "TrendingUp",     label: "ارتفاع / نمو",           labelEn: "Trending Up",         Icon: TrendingUp,     category: "business" },
  { name: "TrendingDown",   label: "انخفاض",                 labelEn: "Trending Down",       Icon: TrendingDown,   category: "business" },
  { name: "BarChart2",      label: "مخطط أعمدة",             labelEn: "Bar Chart",           Icon: BarChart2,      category: "business" },
  { name: "PieChart",       label: "مخطط دائري",             labelEn: "Pie Chart",           Icon: PieChart,       category: "business" },
  { name: "Activity",       label: "نشاط / إحصائيات",        labelEn: "Activity",            Icon: Activity,       category: "business" },
  { name: "Target",         label: "هدف",                   labelEn: "Target / Goal",        Icon: Target,         category: "business" },
  { name: "Award",          label: "جائزة",                  labelEn: "Award",               Icon: Award,          category: "business" },
  { name: "Trophy",         label: "كأس / بطولة",            labelEn: "Trophy",              Icon: Trophy,         category: "business" },
  { name: "Truck",          label: "شحن / توصيل",            labelEn: "Shipping / Delivery", Icon: Truck,          category: "business" },
  { name: "Gift",           label: "هدية",                   labelEn: "Gift",                Icon: Gift,           category: "business" },
  { name: "Archive",        label: "أرشيف",                  labelEn: "Archive",             Icon: Archive,        category: "business" },
  { name: "FileText",       label: "مستند",                  labelEn: "Document",            Icon: FileText,       category: "business" },
  { name: "Clipboard",      label: "لوحة مهام",              labelEn: "Clipboard / Tasks",   Icon: Clipboard,      category: "business" },

  // ── المستخدمون Users ──
  { name: "User",           label: "مستخدم",                 labelEn: "User / Person",       Icon: User,           category: "users" },
  { name: "Users",          label: "مجموعة مستخدمين",        labelEn: "Users / Group",       Icon: Users,          category: "users" },
  { name: "UserPlus",       label: "إضافة مستخدم",           labelEn: "Add User",            Icon: UserPlus,       category: "users" },
  { name: "Heart",          label: "قلب / إعجاب",            labelEn: "Heart / Like",        Icon: Heart,          category: "users" },
  { name: "ThumbsUp",       label: "إعجاب",                  labelEn: "Like",                Icon: ThumbsUp,       category: "users" },
  { name: "ThumbsDown",     label: "عدم إعجاب",              labelEn: "Dislike",             Icon: ThumbsDown,     category: "users" },
  { name: "Smile",          label: "ابتسامة",                labelEn: "Smile",               Icon: Smile,          category: "users" },
  { name: "Frown",          label: "حزن",                    labelEn: "Frown / Sad",         Icon: Frown,          category: "users" },

  // ── التقنية Technology ──
  { name: "Monitor",        label: "شاشة / حاسوب",           labelEn: "Monitor / Computer",  Icon: Monitor,        category: "tech" },
  { name: "Tablet",         label: "تابلت",                  labelEn: "Tablet",              Icon: Tablet,         category: "tech" },
  { name: "Laptop",         label: "حاسوب محمول",            labelEn: "Laptop",              Icon: Laptop,         category: "tech" },
  { name: "Wifi",           label: "واي فاي",                labelEn: "WiFi",                Icon: Wifi,           category: "tech" },
  { name: "Bluetooth",      label: "بلوتوث",                 labelEn: "Bluetooth",           Icon: Bluetooth,      category: "tech" },
  { name: "Server",         label: "خادم",                   labelEn: "Server",              Icon: Server,         category: "tech" },
  { name: "Database",       label: "قاعدة بيانات",           labelEn: "Database",            Icon: Database,       category: "tech" },
  { name: "Cloud",          label: "سحابة",                  labelEn: "Cloud",               Icon: Cloud,          category: "tech" },
  { name: "Cpu",            label: "معالج",                  labelEn: "CPU / Processor",     Icon: Cpu,            category: "tech" },
  { name: "Terminal",       label: "طرفية / أوامر",          labelEn: "Terminal",            Icon: Terminal,       category: "tech" },
  { name: "Satellite",      label: "قمر اصطناعي",            labelEn: "Satellite",           Icon: Satellite,      category: "tech" },
  { name: "Signal",         label: "إشارة",                  labelEn: "Signal",              Icon: Signal,         category: "tech" },
  { name: "QrCode",         label: "QR كود",                 labelEn: "QR Code",             Icon: QrCode,         category: "tech" },
  { name: "Barcode",        label: "باركود",                 labelEn: "Barcode",             Icon: Barcode,        category: "tech" },
  { name: "Battery",        label: "بطارية",                 labelEn: "Battery",             Icon: Battery,        category: "tech" },
  { name: "Zap",            label: "برق / سرعة",             labelEn: "Lightning / Speed",   Icon: Zap,            category: "tech" },
  // ── الأمان Security ──
  { name: "Shield",         label: "درع / حماية",            labelEn: "Shield / Protection", Icon: Shield,         category: "security" },
  { name: "Lock",           label: "قفل",                    labelEn: "Lock / Secure",       Icon: Lock,           category: "security" },
  { name: "Unlock",         label: "فتح قفل",                labelEn: "Unlock",              Icon: Unlock,         category: "security" },
  { name: "Key",            label: "مفتاح",                  labelEn: "Key",                 Icon: Key,            category: "security" },
  { name: "ShieldCheck",    label: "حماية مكتملة",           labelEn: "Shield Check",        Icon: ShieldCheck,    category: "security" },
  { name: "ShieldAlert",    label: "تنبيه أمني",             labelEn: "Security Alert",      Icon: ShieldAlert,    category: "security" },
  { name: "Fingerprint",    label: "بصمة إصبع",              labelEn: "Fingerprint",         Icon: Fingerprint,    category: "security" },
  { name: "Eye",            label: "مشاهدة",                 labelEn: "View / Eye",          Icon: Eye,            category: "security" },

  // ── العام General ──
  { name: "Home",           label: "الرئيسية / منزل",        labelEn: "Home",                Icon: Home,           category: "general" },
  { name: "Info",           label: "معلومات",                labelEn: "Information",         Icon: Info,           category: "general" },
  { name: "Settings",       label: "إعدادات",                labelEn: "Settings",            Icon: Settings,       category: "general" },
  { name: "Search",         label: "بحث",                    labelEn: "Search",              Icon: Search,         category: "general" },
  { name: "Palette",        label: "ألوان / تصميم",          labelEn: "Colors / Design",     Icon: Palette,        category: "general" },
  { name: "Calendar",       label: "تقويم",                  labelEn: "Calendar",            Icon: Calendar,       category: "general" },
  { name: "Clock",          label: "ساعة / وقت",             labelEn: "Clock / Time",        Icon: Clock,          category: "general" },
  { name: "Lightbulb",      label: "فكرة / مصباح",           labelEn: "Idea / Lightbulb",    Icon: Lightbulb,      category: "general" },
  { name: "Flag",           label: "علم",                    labelEn: "Flag",                Icon: Flag,           category: "general" },
  { name: "Newspaper",      label: "أخبار / صحيفة",          labelEn: "News / Newspaper",    Icon: Newspaper,      category: "general" },
  { name: "Book",           label: "كتاب",                   labelEn: "Book",                Icon: Book,           category: "general" },
  { name: "Wrench",         label: "أداة / صيانة",           labelEn: "Tool / Maintenance",  Icon: Wrench,         category: "general" },
  { name: "Flame",          label: "نار / شعبية",            labelEn: "Fire / Popular / Hot",Icon: Flame,          category: "general" },
  { name: "Folder",         label: "مجلد",                   labelEn: "Folder",              Icon: Folder,         category: "general" },
  { name: "Sliders",        label: "تحكم / ضبط",             labelEn: "Sliders / Controls",  Icon: Sliders,        category: "general" },
  { name: "Leaf",           label: "طبيعة / بيئة",           labelEn: "Nature / Leaf",       Icon: Leaf,           category: "general" },
  { name: "Sun",            label: "شمس / نهار",             labelEn: "Sun / Day",           Icon: Sun,            category: "general" },
  { name: "Moon",           label: "قمر / ليل",              labelEn: "Moon / Night",        Icon: Moon,           category: "general" },
  { name: "Snowflake",      label: "ثلج / برودة",            labelEn: "Snow / Cold",         Icon: Snowflake,      category: "general" },
  { name: "Coffee",         label: "قهوة",                   labelEn: "Coffee",              Icon: Coffee,         category: "general" },
  { name: "Plane",          label: "طيارة / سفر",            labelEn: "Airplane / Travel",   Icon: Plane,          category: "general" },
  { name: "Car",            label: "سيارة",                  labelEn: "Car / Vehicle",       Icon: Car,            category: "general" },
  { name: "Hotel",          label: "فندق / سياحة",           labelEn: "Hotel / Tourism",     Icon: Hotel,          category: "general" },
  { name: "Factory",        label: "مصنع / صناعة",           labelEn: "Factory / Industry",  Icon: Factory,        category: "general" },
  { name: "AlertCircle",    label: "تنبيه دائري",            labelEn: "Alert Circle",        Icon: AlertCircle,    category: "general" },
  { name: "HelpCircle",     label: "مساعدة",                 labelEn: "Help",                Icon: HelpCircle,     category: "general" },
  { name: "CheckCircle",    label: "تأكيد / صح",             labelEn: "Confirm / Check",     Icon: CheckCircle,    category: "general" },
];

const CATEGORIES = [
  { id: "all",      label: "الكل"       },
  { id: "social",   label: "اجتماعي"   },
  { id: "contact",  label: "تواصل"     },
  { id: "business", label: "أعمال"     },
  { id: "users",    label: "مستخدمون"  },
  { id: "tech",     label: "تقنية"     },
  { id: "security", label: "أمان"      },
  { id: "general",  label: "عام"       },
  { id: "system",   label: "تصنيفات النظام" },
];

// إضافة أيقونات التصنيفات لـ ALL_ICONS
const SYSTEM_CATEGORY_ITEMS = Object.entries(SYSTEM_CATEGORY_ICONS).map(([categoryName, iconName]) => {
  const foundIcon = ALL_ICONS.find(i => i.name === iconName);
  return {
    name: iconName, // استخدام اسم الأيقونة الفعلي وليس اسم التصنيف
    label: categoryName,
    labelEn: categoryName,
    Icon: foundIcon?.Icon || Globe,
    category: "system"
  };
});

export function getIconByName(name) {
  const found = ALL_ICONS.find(i => i.name === name);
  return found ? found.Icon : Globe;
}

export { getIconByName as getIconComponentByName };

export default function IconPickerPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [popoverStyle, setPopoverStyle] = useState({ top: "calc(100% + 8px)", right: 0 });
  const ref = useRef(null);
  const buttonRef = useRef(null);

  const CurrentIcon = getIconByName(value);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setPopoverStyle({ 
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      });
    }
  }, [open]);

  const allIconsWithSystem = [...ALL_ICONS, ...SYSTEM_CATEGORY_ITEMS];
  
  const filtered = allIconsWithSystem.filter(({ name, label, labelEn, category }) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || label.includes(q)
      || labelEn.toLowerCase().includes(q)
      || name.toLowerCase().includes(q);
    const matchCat = activeCategory === "all" || category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); setActiveCategory("all"); }}
        title="اضغط لتغيير الأيقونة"
        className="w-8 h-8 rounded-lg border border-border bg-secondary/40 hover:bg-primary/10 hover:border-primary/40 flex items-center justify-center transition-colors cursor-pointer"
      >
        <CurrentIcon size={16} className="text-primary" />
      </button>

      {open && (
        <div
          className="fixed z-[9999] bg-white border border-border rounded-xl shadow-2xl flex flex-col"
          style={{ ...popoverStyle, width: 340, maxHeight: "65vh" }}
          dir="rtl"
        >
          {/* Search */}
          <div className="p-2 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2 py-1.5">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالعربي أو English..."
                className="flex-1 bg-transparent text-xs outline-none text-right placeholder:text-muted-foreground"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1 p-2 pb-1 overflow-x-auto flex-shrink-0 border-b border-border scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Icons Grid */}
          <div className="overflow-y-auto flex-1 p-2">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">لا توجد نتائج للبحث</div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filtered.map(({ name, label, labelEn, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    title={`${label} | ${labelEn}`}
                    onClick={() => { onChange(name); setOpen(false); }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-primary/10 ${
                      value === name ? "bg-primary/20 border border-primary" : "border border-transparent"
                    }`}
                  >
                    <Icon size={15} className={value === name ? "text-primary" : "text-foreground"} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
           <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground flex-shrink-0 text-center">
            {filtered.length} أيقونة من أصل {allIconsWithSystem.length}
           </div>
        </div>
      )}
    </div>
  );
}