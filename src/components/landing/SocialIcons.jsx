import {
  Twitter, Instagram, Facebook, Linkedin, Youtube,
  Music2, Ghost, MessageCircle, Send, AtSign,
  Bookmark, MessageSquare, Tv, Github, Mic,
  Radio, Volume2, Hash, Rss, Image, Globe,
  Mail, Phone, Smartphone, Printer, MapPin, Link,
  Bell, Briefcase, Building2, CreditCard, Home, Info,
  Shield, Lock, Unlock, Eye, Camera, Video, Headphones,
  Monitor, Tablet, Laptop, Wifi, Bluetooth, Battery, Zap,
  Power, Settings, Wrench, Scissors, Pen, Edit, Trash2,
  Archive, Download, Upload, Share2, Copy, Plus, Minus,
  Check, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Users, User, UserPlus, UserCheck, UserX, Calendar, Clock,
  Timer, AlarmClock, ShoppingCart, ShoppingBag, Package, Tag,
  Percent, DollarSign, Euro, TrendingUp, TrendingDown, BarChart2,
  PieChart, Activity, Target, Award, Trophy, Flag, Newspaper,
  Book, BookOpen, FileText, File, Folder, FolderOpen, Database,
  Cloud, CloudUpload, CloudDownload, Server, Cpu, Code, Terminal,
  GitBranch, Truck, Car, Plane, Ship, Coffee, Gift, Sun, Moon,
  Wind, Droplets, Umbrella, Map, Navigation, Compass, PlayCircle,
  PauseCircle, Layers, Layout, Grid, List, Bold, Italic, Type,
  Palette, Smile, Frown, ThumbsUp, ThumbsDown, AlertCircle,
  AlertTriangle, CheckCircle, XCircle, HelpCircle, Paperclip, Pin,
  Clipboard, ExternalLink, MoreHorizontal, Menu, RotateCcw, RefreshCw,
  Maximize, ZoomIn, ZoomOut, Sliders, ToggleLeft, ToggleRight,
  BellOff, VolumeX, Volume1, MicOff, Key, ShieldCheck, ShieldAlert,
  Fingerprint, QrCode, Barcode, ScanLine, Lightbulb, Flame, Snowflake,
  Leaf, MessagesSquare, PhoneOff, PhoneIncoming, PhoneCall, VideoOff,
  Route, Signal, Satellite
} from "lucide-react";

// Map platform value → Lucide icon
const platformIconMap = {
  twitter:    Twitter,
  instagram:  Instagram,
  facebook:   Facebook,
  linkedin:   Linkedin,
  youtube:    Youtube,
  tiktok:     Music2,
  snapchat:   Ghost,
  whatsapp:   MessageCircle,
  telegram:   Send,
  threads:    AtSign,
  pinterest:  Bookmark,
  reddit:     MessageSquare,
  discord:    Hash,
  behance:    Image,
  dribbble:   Tv,
  github:     Github,
  vimeo:      Tv,
  twitch:     Radio,
  medium:     Rss,
  soundcloud: Volume2,
  spotify:    Music2,
  clubhouse:  Mic,
  quora:      MessageSquare,
  tumblr:     Rss,
  flickr:     Image,
  other:      Globe,
};

// Map icon name string → Lucide component (shared with IconPickerPopover)
const iconNameMap = {
  Twitter, Instagram, Facebook, Linkedin, Youtube,
  Music2, Ghost, MessageCircle, Send, AtSign,
  Bookmark, MessageSquare, Tv, Github, Mic,
  Radio, Volume2, Hash, Rss, Image, Globe,
  Mail, Phone, Smartphone, Printer, MapPin, Link,
  Bell, Briefcase, Building2, CreditCard, Home, Info,
  Shield, Lock, Unlock, Eye, Camera, Video, Headphones,
  Monitor, Tablet, Laptop, Wifi, Bluetooth, Battery, Zap,
  Power, Settings, Wrench, Scissors, Pen, Edit, Trash2,
  Archive, Download, Upload, Share2, Copy, Plus, Minus,
  Check, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Users, User, UserPlus, UserCheck, UserX, Calendar, Clock,
  Timer, AlarmClock, ShoppingCart, ShoppingBag, Package, Tag,
  Percent, DollarSign, Euro, TrendingUp, TrendingDown, BarChart2,
  PieChart, Activity, Target, Award, Trophy, Flag, Newspaper,
  Book, BookOpen, FileText, File, Folder, FolderOpen, Database,
  Cloud, CloudUpload, CloudDownload, Server, Cpu, Code, Terminal,
  GitBranch, Truck, Car, Plane, Ship, Coffee, Gift, Sun, Moon,
  Wind, Droplets, Umbrella, Map, Navigation, Compass, PlayCircle,
  PauseCircle, Layers, Layout, Grid, List, Bold, Italic, Type,
  Palette, Smile, Frown, ThumbsUp, ThumbsDown, AlertCircle,
  AlertTriangle, CheckCircle, XCircle, HelpCircle, Paperclip, Pin,
  Clipboard, ExternalLink, MoreHorizontal, Menu, RotateCcw, RefreshCw,
  Maximize, ZoomIn, ZoomOut, Sliders, ToggleLeft, ToggleRight,
  BellOff, VolumeX, Volume1, MicOff, Key, ShieldCheck, ShieldAlert,
  Fingerprint, QrCode, Barcode, ScanLine, Lightbulb, Flame, Snowflake,
  Leaf, MessagesSquare, PhoneOff, PhoneIncoming, PhoneCall, VideoOff,
  Route, Signal, Satellite
};

export function getIconComponentByName(name) {
  return iconNameMap[name] || Globe;
}

export { getIconComponentByName as getIconByName };

export function getSocialIcon(platform) {
  return platformIconMap[platform] || Globe;
}

export default function SocialIconLink({ platform, url, size = 18, customIcon }) {
  const Icon = customIcon ? getIconComponentByName(customIcon) : getSocialIcon(platform);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={platform}
      className="w-9 h-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
    >
      <Icon size={size} />
    </a>
  );
}