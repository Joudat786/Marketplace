import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, GripVertical, ArrowRight, Save, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MultiLangInput from "@/components/ui/MultiLangInput";
import SlidePanel from "@/components/superadmin/SlidePanel";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "م" : "ص";
  const h = String(hours % 12 || 12).padStart(2, "0");
  return `${year}/${month}/${day} - ${h}:${minutes}:${seconds} ${ampm}`;
};

export default function AppCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newName, setNewName] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [editPanel, setEditPanel] = useState({ open: false, cat: null });
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editTargetAudience, setEditTargetAudience] = useState("all");
  const [newTargetAudience, setNewTargetAudience] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // 'new' | cat.id | null
  const [emojiSearch, setEmojiSearch] = useState("");

  const allEmojis = [
    { e: "📊", n: "مخطط بياني احصاء chart graph statistics" },
    { e: "📈", n: "رسم بياني صاعد chart growth" },
    { e: "📉", n: "رسم بياني هابط chart decline" },
    { e: "💰", n: "مال نقود money cash" },
    { e: "💵", n: "دولار ورقة نقدية dollar money" },
    { e: "💳", n: "بطاقة ائتمان دفع card payment credit" },
    { e: "🏦", n: "بنك مصرف bank finance" },
    { e: "🧾", n: "فاتورة وصل invoice receipt" },
    { e: "💹", n: "عملة بورصة stocks currency" },
    { e: "🪙", n: "عملة معدنية coin" },
    { e: "💎", n: "الماسة جوهرة diamond gem" },
    { e: "🏧", n: "صراف آلي atm" },
    { e: "📑", n: "مستند ورق document" },
    { e: "📄", n: "وثيقة ملف file document" },
    { e: "🤑", n: "مال ثروة money rich" },
    { e: "🛒", n: "عربة تسوق cart shopping" },
    { e: "🛍️", n: "حقيبة تسوق shopping bag" },
    { e: "🏪", n: "متجر دكان store shop" },
    { e: "🏬", n: "مول مجمع تجاري mall" },
    { e: "🏭", n: "مصنع factory" },
    { e: "🏢", n: "مبنى شركة office building company" },
    { e: "🏛️", n: "مبنى حكومي government building" },
    { e: "🏨", n: "فندق hotel" },
    { e: "🏫", n: "مدرسة school education" },
    { e: "🖥️", n: "شاشة كمبيوتر desktop computer screen" },
    { e: "💻", n: "لابتوب حاسوب laptop computer" },
    { e: "📱", n: "جوال هاتف mobile phone" },
    { e: "⌨️", n: "لوحة مفاتيح keyboard" },
    { e: "🖱️", n: "فأرة ماوس mouse" },
    { e: "🖨️", n: "طابعة printer" },
    { e: "📡", n: "هوائي اتصال antenna signal" },
    { e: "🔌", n: "قابس كهرباء plug power" },
    { e: "🔋", n: "بطارية battery" },
    { e: "💾", n: "قرص مرن تخزين storage disk" },
    { e: "💿", n: "قرص مضغوط cd disk" },
    { e: "📲", n: "هاتف اتصال phone call" },
    { e: "☎️", n: "تليفون هاتف telephone" },
    { e: "📞", n: "سماعة هاتف phone" },
    { e: "🤖", n: "روبوت ذكاء اصطناعي robot ai" },
    { e: "👥", n: "مجموعة أشخاص فريق team people group" },
    { e: "👤", n: "شخص مستخدم user person" },
    { e: "👔", n: "قميص رسمي موظف shirt employee" },
    { e: "🤝", n: "مصافحة اتفاق شراكة handshake partnership" },
    { e: "🏆", n: "كأس جائزة trophy award" },
    { e: "🎖️", n: "ميدالية medal award" },
    { e: "📋", n: "لوح قائمة clipboard list" },
    { e: "📌", n: "دبوس تثبيت pin" },
    { e: "📍", n: "موقع مكان location map pin" },
    { e: "🗂️", n: "ملفات مجلدات folders files" },
    { e: "🗃️", n: "صندوق ملفات file box" },
    { e: "🗄️", n: "خزانة أدراج cabinet drawer" },
    { e: "📦", n: "صندوق طرد شحن box package shipping" },
    { e: "🚚", n: "شاحنة توصيل delivery truck" },
    { e: "🚛", n: "شاحنة كبيرة truck" },
    { e: "✈️", n: "طائرة سفر airplane travel" },
    { e: "🚢", n: "سفينة شحن ship" },
    { e: "🚂", n: "قطار train" },
    { e: "📬", n: "صندوق بريد mailbox" },
    { e: "📧", n: "بريد إلكتروني email" },
    { e: "📤", n: "إرسال send outbox" },
    { e: "📥", n: "استقبال وارد inbox receive" },
    { e: "🛳️", n: "سفينة كبيرة ship" },
    { e: "⚓", n: "مرساة ميناء anchor port" },
    { e: "🔧", n: "مفتاح ربط أداة wrench tool" },
    { e: "🔨", n: "مطرقة hammer" },
    { e: "⚙️", n: "تروس إعدادات settings gear" },
    { e: "🛠️", n: "أدوات صيانة tools maintenance" },
    { e: "🔩", n: "صامولة مسمار bolt nut" },
    { e: "🪛", n: "مفك براغي screwdriver" },
    { e: "🔑", n: "مفتاح key" },
    { e: "🗝️", n: "مفتاح قديم key old" },
    { e: "🔐", n: "قفل مفتاح lock key" },
    { e: "🔒", n: "قفل مغلق أمان lock security" },
    { e: "🔓", n: "قفل مفتوح unlock" },
    { e: "🧲", n: "مغناطيس magnet" },
    { e: "📝", n: "قلم كتابة ملاحظة note write pen" },
    { e: "📖", n: "كتاب مفتوح book open" },
    { e: "📚", n: "كتب مكتبة books library" },
    { e: "📓", n: "دفتر ملاحظات notebook" },
    { e: "📜", n: "ورقة وثيقة scroll document" },
    { e: "📰", n: "جريدة أخبار newspaper news" },
    { e: "🖊️", n: "قلم حبر pen" },
    { e: "✒️", n: "قلم رسمي pen formal" },
    { e: "📏", n: "مسطرة قياس ruler" },
    { e: "📐", n: "مثلث قياس ruler triangle" },
    { e: "✂️", n: "مقص scissors" },
    { e: "🗒️", n: "دفتر notepad" },
    { e: "📢", n: "مكبر صوت إعلان announcement speaker" },
    { e: "📣", n: "بوق إعلان megaphone announce" },
    { e: "🔔", n: "جرس تنبيه bell notification" },
    { e: "💬", n: "رسالة محادثة message chat" },
    { e: "📨", n: "بريد مغلق mail envelope" },
    { e: "📩", n: "بريد مع سهم mail" },
    { e: "🎯", n: "هدف رمي target goal" },
    { e: "🎨", n: "لوحة رسم فن art paint" },
    { e: "🖼️", n: "صورة إطار picture frame" },
    { e: "📸", n: "كاميرا تصوير camera photo" },
    { e: "🎬", n: "تصوير فيلم film movie" },
    { e: "🎤", n: "ميكروفون microphone" },
    { e: "🏥", n: "مستشفى صحة hospital health" },
    { e: "💊", n: "دواء حبة medicine pill" },
    { e: "🩺", n: "سماعة طبيب stethoscope doctor" },
    { e: "🩹", n: "ضمادة علاج bandage" },
    { e: "🧬", n: "حمض نووي جينات dna" },
    { e: "🔬", n: "مجهر علم microscope science" },
    { e: "🧪", n: "أنبوب اختبار test tube lab" },
    { e: "💉", n: "حقنة طبية injection syringe" },
    { e: "🌡️", n: "ميزان حرارة thermometer" },
    { e: "🏋️", n: "رياضة تمرين gym fitness" },
    { e: "🧘", n: "يوغا تأمل yoga meditation" },
    { e: "⚕️", n: "رمز طبي صحة medical health" },
    { e: "🍽️", n: "طبق مطعم طعام plate restaurant food" },
    { e: "🍔", n: "برغر وجبة burger food" },
    { e: "☕", n: "قهوة مشروب coffee" },
    { e: "🥗", n: "سلطة صحية salad food" },
    { e: "👨‍🍳", n: "طباخ شيف chef cook" },
    { e: "🍱", n: "بنتو وجبة bento food" },
    { e: "🧁", n: "كعكة حلوى cake cupcake" },
    { e: "🎂", n: "تورتة عيد ميلاد birthday cake" },
    { e: "🍕", n: "بيتزا pizza food" },
    { e: "🏠", n: "بيت منزل house home" },
    { e: "🏡", n: "بيت حديقة house garden" },
    { e: "🏗️", n: "بناء إنشاء construction building" },
    { e: "🧱", n: "طوب بناء brick" },
    { e: "🪟", n: "نافذة window" },
    { e: "🚪", n: "باب door" },
    { e: "🛋️", n: "أريكة أثاث sofa furniture" },
    { e: "🏘️", n: "حي منطقة سكنية neighborhood" },
    { e: "🌍", n: "كرة أرضية عالم globe world earth" },
    { e: "🌱", n: "نبتة نمو plant growth" },
    { e: "🌿", n: "أوراق خضراء leaves green" },
    { e: "♻️", n: "إعادة تدوير بيئة recycle environment" },
    { e: "🌊", n: "موجة ماء wave water" },
    { e: "⚡", n: "كهرباء برق electricity lightning" },
    { e: "☀️", n: "شمس طاقة sun energy" },
    { e: "❄️", n: "ثلج برودة snow cold" },
    { e: "🔥", n: "نار حريق حرارة fire heat" },
    { e: "💧", n: "قطرة ماء water drop" },
    { e: "🌲", n: "شجرة غابة tree forest" },
    { e: "🌴", n: "نخلة palm tree" },
    { e: "⭐", n: "نجمة تقييم star rating" },
    { e: "🌟", n: "نجمة مضيئة star glowing" },
    { e: "✨", n: "بريق لمعان sparkle shine" },
    { e: "🎉", n: "احتفال حفلة party celebration" },
    { e: "🎊", n: "مفرقعات احتفال confetti party" },
    { e: "🎁", n: "هدية gift present" },
    { e: "🏅", n: "ميدالية رياضية medal" },
    { e: "🥇", n: "ذهب أول مركز gold first" },
    { e: "🎗️", n: "شريط جائزة ribbon award" },
    { e: "🔴", n: "دائرة حمراء red circle" },
    { e: "🟠", n: "دائرة برتقالية orange circle" },
    { e: "🟡", n: "دائرة صفراء yellow circle" },
    { e: "🟢", n: "دائرة خضراء green circle" },
    { e: "🔵", n: "دائرة زرقاء blue circle" },
    { e: "🟣", n: "دائرة بنفسجية purple circle" },
    { e: "💼", n: "حقيبة عمل أعمال briefcase business" },
    { e: "🗓️", n: "تقويم تاريخ calendar date" },
    { e: "⏰", n: "منبه ساعة alarm clock" },
    { e: "📅", n: "تقويم يومي calendar" },
    { e: "⌚", n: "ساعة يد watch" },
    { e: "🚀", n: "صاروخ إطلاق rocket launch" },
    { e: "🌐", n: "كرة عالم إنترنت globe internet" },
    { e: "🔗", n: "رابط وصلة link" },
    { e: "📎", n: "مشبك ورق مرفق paperclip attachment" },
    { e: "🗺️", n: "خريطة map" },
    { e: "🧭", n: "بوصلة اتجاه compass direction" },
    { e: "🎵", n: "موسيقى نغمة music note" },
    { e: "🎮", n: "ألعاب ترفيه games gaming" },
    { e: "🧩", n: "قطعة أحجية puzzle piece" },
    { e: "🚗", n: "سيارة مركبة car vehicle" },
    { e: "🚌", n: "باص حافلة bus" },
    { e: "🚑", n: "إسعاف طوارئ ambulance emergency" },
    { e: "⚖️", n: "ميزان عدالة قانون scale justice law" },
    { e: "🛡️", n: "درع حماية أمان shield protection security" },
    { e: "🪪", n: "بطاقة هوية id card identity" },
  ];
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [orderedCategories, setOrderedCategories] = useState([]);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => base44.entities.AppCategory.list()
  });

  // sync ordered list from server, sorted by sort_order
  useEffect(() => {
    const sorted = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedCategories(sorted);
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppCategory.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setNewName(""); setNewDesc(""); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppCategory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setEditPanel({ open: false, cat: null }); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppCategory.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["app-categories"]); setConfirmDelete(null); }
  });

  const audienceOptions = [
    { value: "all", label: "الجميع", color: "bg-blue-100 text-blue-700" },
    { value: "super_admin_only", label: "سوبر أدمن فقط", color: "bg-red-100 text-red-700" },
    { value: "clients_only", label: "العملاء فقط", color: "bg-green-100 text-green-700" },
    { value: "partners_only", label: "الشركاء فقط", color: "bg-purple-100 text-purple-700" },
  ];

  const handleAdd = () => {
    if (!newName.trim()) return;
    const nextOrder = orderedCategories.length;
    createMutation.mutate({ name: newName.trim(), name_en: newNameEn.trim(), description: newDesc.trim(), description_en: newDescEn.trim(), icon: newIcon, is_active: true, sort_order: nextOrder, target_audience: newTargetAudience });
    setNewIcon(""); setNewNameEn(""); setNewDescEn(""); setNewTargetAudience("all");
  };

  const startEdit = (cat) => {
    setEditName(cat.name);
    setEditNameEn(cat.name_en || "");
    setEditDesc(cat.description || "");
    setEditDescEn(cat.description_en || "");
    setEditIcon(cat.icon || "");
    setEditIsActive(cat.is_active ?? true);
    setEditTargetAudience(cat.target_audience || "all");
    setEditPanel({ open: true, cat });
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editPanel.cat.id, data: { name: editName.trim(), name_en: editNameEn.trim(), description: editDesc.trim(), description_en: editDescEn.trim(), icon: editIcon, is_active: editIsActive, target_audience: editTargetAudience } });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedCategories);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedCategories(items);
    // save new sort_order for each item
    items.forEach((cat, idx) => {
      if (cat.sort_order !== idx) {
        base44.entities.AppCategory.update(cat.id, { sort_order: idx });
      }
    });
    queryClient.invalidateQueries(["app-categories"]);
  };

  const filtered = orderedCategories.filter(cat => {
    const matchSearch = cat.name?.includes(search) || cat.description?.includes(search);
    const matchStatus = statusFilter === "all" || (statusFilter === "active" && cat.is_active) || (statusFilter === "inactive" && !cat.is_active);
    return matchSearch && matchStatus;
  });

  const handleExportCSV = () => {
    const headers = ["الرقم", "الأيقونة", "اسم التصنيف", "الوصف", "الحالة", "تاريخ الإنشاء"];
    const rows = filtered.map((cat, idx) => [
      idx + 1,
      cat.icon || "-",
      cat.name,
      cat.description || "-",
      cat.is_active ? "مفعّل" : "معطّل",
      formatDate(cat.created_date)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تصنيفات_التطبيقات_${new Date().toLocaleDateString('ar')}.csv`;
    link.click();
    toast({ title: "✓", description: `تم تصدير ${filtered.length} تصنيف` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">

      {/* Edit Slide Panel */}
      <SlidePanel open={editPanel.open} onClose={() => setEditPanel({ open: false, cat: null })}>
        <div className="flex flex-col h-full" dir="rtl">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
            <button onClick={() => setEditPanel({ open: false, cat: null })} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowRight size={18} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">تعديل التصنيف</h2>
              <p className="text-xs text-muted-foreground">{editPanel.cat?.name}</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium mb-2">الأيقونة</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(showEmojiPicker === "edit" ? null : "edit")}
                  className="border border-border rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-secondary transition-colors">
                  <span className="text-2xl">{editIcon || "😀"}</span>
                  <span className="text-muted-foreground">{editIcon ? "تغيير الأيقونة" : "اختر أيقونة"}</span>
                </button>
                {showEmojiPicker === "edit" && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-80">
                    <input
                      autoFocus
                      value={emojiSearch}
                      onChange={e => setEmojiSearch(e.target.value)}
                      placeholder="🔍 ابحث عن أيقونة..."
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
                    />
                    <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
                      {allEmojis.filter(item => !emojiSearch || item.n.toLowerCase().includes(emojiSearch.toLowerCase())).map(item => (
                        <button key={item.e} type="button" onClick={() => { setEditIcon(item.e); setShowEmojiPicker(null); setEmojiSearch(""); }}
                          title={item.n}
                          className="text-xl p-1.5 hover:bg-secondary rounded-lg transition-colors text-center">{item.e}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <MultiLangInput
              label="اسم التصنيف *"
              values={{ ar: editName, en: editNameEn }}
              onChange={(code, val) => { if (code === "ar") setEditName(val); else setEditNameEn(val); }}
              placeholder={{ ar: "اسم التصنيف بالعربية", en: "Category name in English" }}
            />

            {/* Description */}
            <MultiLangInput
              label="الوصف (اختياري)"
              values={{ ar: editDesc, en: editDescEn }}
              onChange={(code, val) => { if (code === "ar") setEditDesc(val); else setEditDescEn(val); }}
              placeholder={{ ar: "وصف التصنيف بالعربية", en: "Category description in English" }}
              multiline
              rows={3}
            />

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium mb-2">الجمهور المستهدف</label>
              <select
                value={editTargetAudience}
                onChange={e => setEditTargetAudience(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background">
                {audienceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {editTargetAudience === "super_admin_only" ? "⚠️ هذا التصنيف لن يظهر للعملاء أو الشركاء، للسوبر أدمن فقط" :
                 editTargetAudience === "clients_only" ? "يظهر للعملاء فقط" :
                 editTargetAudience === "partners_only" ? "يظهر للشركاء فقط" : "يظهر للجميع"}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/20">
              <div>
                <p className="text-sm font-medium">الحالة</p>
                <p className="text-xs text-muted-foreground mt-0.5">{editIsActive ? "التصنيف مفعّل ويظهر للمستخدمين" : "التصنيف معطّل ومخفي"}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditIsActive(v => !v)}
                dir="ltr"
                className={`relative w-11 h-6 rounded-full transition-colors ${editIsActive ? "bg-green-500" : "bg-muted"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editIsActive ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-3">
            <button onClick={() => setEditPanel({ open: false, cat: null })} className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">
              إلغاء
            </button>
            <button
              onClick={saveEdit}
              disabled={!editName.trim() || updateMutation.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Save size={15} />
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      </SlidePanel>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تصنيفات التطبيقات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة تصنيفات التطبيقات المتاحة في النظام</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-foreground">إضافة تصنيف جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          {/* Icon picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(showEmojiPicker === "new" ? null : "new")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center gap-2">
              <span className="text-xl">{newIcon || "😀"}</span>
              <span className="text-muted-foreground">{newIcon ? "تغيير الأيقونة" : "اختر أيقونة"}</span>
            </button>
            {showEmojiPicker === "new" && (
              <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-80">
                <input
                  autoFocus
                  value={emojiSearch}
                  onChange={e => setEmojiSearch(e.target.value)}
                  placeholder="🔍 ابحث عن أيقونة..."
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
                />
                <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
                  {allEmojis.filter(item => !emojiSearch || item.n.toLowerCase().includes(emojiSearch.toLowerCase())).map(item => (
                    <button key={item.e} type="button" onClick={() => { setNewIcon(item.e); setShowEmojiPicker(null); setEmojiSearch(""); }}
                      title={item.n}
                      className="text-xl p-1.5 hover:bg-secondary rounded-lg transition-colors text-center">{item.e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <MultiLangInput
              label="اسم التصنيف *"
              values={{ ar: newName, en: newNameEn }}
              onChange={(code, val) => { if (code === "ar") setNewName(val); else setNewNameEn(val); }}
              placeholder={{ ar: "اسم التصنيف بالعربية", en: "Category name in English" }}
            />
          </div>
          <div>
            <MultiLangInput
              label="الوصف (اختياري)"
              values={{ ar: newDesc, en: newDescEn }}
              onChange={(code, val) => { if (code === "ar") setNewDesc(val); else setNewDescEn(val); }}
              placeholder={{ ar: "وصف التصنيف بالعربية", en: "Category description in English" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">الجمهور المستهدف</label>
            <select
              value={newTargetAudience}
              onChange={e => setNewTargetAudience(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background">
              {audienceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || createMutation.isPending}
            className="flex items-center gap-2 bg-buttonColor text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            <Plus size={15} />
            إضافة تصنيف
          </button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">الكل</option>
            <option value="active">مفعّل</option>
            <option value="inactive">معطّل</option>
          </select>
          {!search && statusFilter === "all" && (
            <span className="text-xs text-muted-foreground">اسحب الصفوف لتغيير الترتيب</span>
          )}
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors">
          <Download size={16} />
          تصدير CSV
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-3 py-3 text-center font-semibold text-foreground border-l border-border w-10"></th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">#</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">الأيقونة</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">اسم التصنيف</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">الوصف</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">الجمهور</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">الحالة</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground border-l border-border">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground sticky left-0 bg-secondary/50">الإجراءات</th>
                </tr>
              </thead>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">لا توجد تصنيفات</td></tr>
                      ) : filtered.map((cat, idx) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border-b border-border transition-colors ${snapshot.isDragging ? "bg-primary/5 shadow-lg" : "hover:bg-secondary/20"}`}>
                              {/* Drag Handle */}
                              <td className="px-3 py-3 text-center border-l border-border" {...provided.dragHandleProps}>
                                <GripVertical size={16} className="text-muted-foreground cursor-grab active:cursor-grabbing mx-auto" />
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground border-l border-border">{idx + 1}</td>
                              {/* Icon cell */}
                              <td className="px-4 py-3 text-center border-l border-border">
                                <span className="text-2xl">{cat.icon || "-"}</span>
                              </td>
                              <td className="px-4 py-3 text-center border-l border-border">
                                <div>
                                  <span className="font-semibold text-foreground block">{cat.name}</span>
                                  {cat.name_en && <span className="text-xs text-muted-foreground" dir="ltr">{cat.name_en}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border-l border-border">
                                <div>
                                  <span className="text-muted-foreground block">{cat.description || "-"}</span>
                                  {cat.description_en && <span className="text-xs text-muted-foreground" dir="ltr">{cat.description_en}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border-l border-border">
                                {(() => {
                                  const opt = audienceOptions.find(o => o.value === (cat.target_audience || "all"));
                                  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${opt?.color || "bg-blue-100 text-blue-700"}`}>{opt?.label || "الجميع"}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center border-l border-border">
                                 {cat.is_active
                                   ? <span className="text-green-600 text-xs font-semibold">✓ مفعّل</span>
                                   : <span className="text-red-500 text-xs font-semibold">✗ معطّل</span>}
                               </td>
                              <td className="px-4 py-3 text-center text-xs text-muted-foreground border-l border-border whitespace-nowrap">{formatDate(cat.created_date)}</td>
                              <td className="px-4 py-3 text-center sticky left-0 bg-card">
                                {confirmDelete === cat.id ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground hover:text-foreground">إلغاء</button>
                                    <button onClick={() => deleteMutation.mutate(cat.id)} className="text-xs text-destructive font-semibold hover:opacity-70">تأكيد</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => startEdit(cat)} className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="تعديل">
                                      <Pencil size={15} />
                                    </button>
                                    <button onClick={() => setConfirmDelete(cat.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="حذف">
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}