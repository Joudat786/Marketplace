import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ArrowUpDown, Check, Package, Settings } from "lucide-react";

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const h = dt.getHours();
  const hours = String(h % 12 || 12).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  const seconds = String(dt.getSeconds()).padStart(2, "0");
  const ampm = h >= 12 ? "م" : "ص";
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds} ${ampm}`;
};

// ── تبويب الإضافات ──
function AddonsTab({ addons, renderPrice, handleStart }) {
  const [search, setSearch] = useState("");
  const filtered = addons.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
      {addons.length > 0 && (
        <input
          type="text"
          placeholder="ابحث في الإضافات..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-[10px] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
        />
      )}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          {search ? "لا توجد نتائج" : "لا توجد إضافات"}
        </p>
      ) : filtered.map((addon, i) => (
        <AddonMiniCard key={addon.id} addon={addon} renderPrice={renderPrice} handleStart={handleStart} />
      ))}
    </motion.div>
  );
}

// ── بطاقة إضافة مصغرة ──
function AddonMiniCard({ addon, renderPrice, handleStart }) {
  const [billing, setBilling] = useState("monthly");
  const [tab, setTab] = useState(null);
  const isFree = addon.is_free || (!addon.monthly_price && !addon.yearly_price);
  const hasYearly = !addon.is_free && (addon.yearly_price > 0);
  const currentPrice = billing === "monthly" ? addon.monthly_price : addon.yearly_price;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="p-2.5 flex items-center gap-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          {addon.icon_url
            ? <img src={addon.icon_url} alt={addon.name} className="w-6 h-6 object-contain rounded" />
            : <Package size={14} className="text-violet-600" />}
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs font-bold text-foreground leading-tight">{addon.name}</p>
          <p className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5 ${addon.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {addon.is_ready ? "✓ جاهز" : "قريباً"}
          </p>
        </div>
        <div className="text-sm font-bold text-primary flex-shrink-0">
          {isFree ? <span className="text-emerald-600 text-xs">مجاناً</span> : renderPrice
            ? renderPrice(currentPrice || 0, "text-xs font-bold text-foreground")
            : <span className="text-xs">{currentPrice}</span>}
        </div>
      </div>
      {/* Tabs */}
      <div className="px-2 py-1.5">
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
          {["description", "info"].map(t => (
            <button key={t} onClick={() => setTab(tab === t ? null : t)}
              className={`flex-1 text-[10px] font-semibold px-1 py-1.5 rounded-md transition-all text-center ${tab === t ? "bg-tabsActive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "description" ? "الوصف" : "معلومات"}
            </button>
          ))}
        </div>
        {tab === "description" && (
          <p className="mt-2 text-[10px] text-muted-foreground text-right leading-relaxed">
            {addon.description || addon.short_description || "لا يوجد وصف"}
          </p>
        )}
        {tab === "info" && (
          <div className="mt-2 text-[10px] space-y-1" dir="rtl">
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">النوع</span><span className="font-semibold">{addon.is_free ? "مجاني" : "مدفوع"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإضافة</span><span className="font-semibold">{formatDate(addon.created_date)}</span></div>
          </div>
        )}
      </div>
      {/* Action */}
      <div className="px-2.5 pb-2.5">
        <button onClick={() => handleStart(addon)}
          className="w-full py-1.5 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
          اختر الإضافة
        </button>
      </div>
    </div>
  );
}

// ── مشغل فيديو يوتيوب ──
function extractYoutubeId(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /v=([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function VideoPlayer({ videoUrl, videoType }) {
  if (!videoUrl) return null;
  const youtubeId = extractYoutubeId(videoUrl);
  if (youtubeId) {
    return (
      <div className="rounded-lg overflow-hidden border border-border aspect-video bg-black mb-2">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen title="شرح التطبيق"
        />
      </div>
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-border mb-2 bg-black">
      <video src={videoUrl} controls className="w-full max-h-40" />
    </div>
  );
}

// ── البطاقة الرئيسية ──
function AppCard({ app, index, renderPrice, handleStart, allApps = [] }) {
  const [billing, setBilling] = useState("monthly");
  const [activeTab, setActiveTab] = useState(null);

  const isFree = app.is_free || (!app.monthly_price && !app.yearly_price);
  const hasYearly = !app.is_free && (app.yearly_price > 0);
  const currentPrice = billing === "monthly" ? app.monthly_price : app.yearly_price;

  // الإضافات المرتبطة بهذا التطبيق
  const addons = allApps.filter(a =>
    a.is_addon &&
    ((a.parent_app_ids && a.parent_app_ids.includes(app.id)) ||
     a.parent_app_id === app.id)
  );

  const tabs = ["description", "info", "addons"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-primary/30"
    >
      {/* Header: Icon + Name */}
      <div className="p-3 flex items-center gap-2 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {app.icon_url
            ? <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain rounded-lg" />
            : <Package size={20} className="text-primary" />}
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-sm font-bold text-foreground leading-tight">{app.name}</h3>
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.is_ready ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
              {app.is_ready ? "✓ جاهز" : "قريباً"}
            </span>
            {app.is_addon && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700">🧩 إضافة</span>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          {!isFree && hasYearly && (
            <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
              <button onClick={() => setBilling("monthly")} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${billing === "monthly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>شهري</button>
              <button onClick={() => setBilling("yearly")} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${billing === "yearly" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>سنوي</button>
            </div>
          )}
          <div className="text-base font-bold text-primary mr-auto">
            {isFree
              ? <span className="text-emerald-600">مجاناً</span>
              : renderPrice
                ? <span className="flex items-baseline gap-1">{renderPrice(currentPrice || 0, "text-base font-bold text-foreground")}<span className="text-xs text-muted-foreground">/ {billing === "monthly" ? "شهري" : "سنوي"}</span></span>
                : <span>{currentPrice}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2.5">
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              className={`flex-1 text-[11px] font-semibold px-1 py-2 rounded-lg transition-all text-center relative ${activeTab === tab ? "bg-tabsActive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "description" ? "الوصف" : tab === "info" ? "المعلومات" : (
                <span className="flex items-center justify-center gap-1.5">
                  الإضافات
                  {addons.length > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold ${activeTab === "addons" ? "bg-white text-tabsActive" : "bg-violet-500 text-white"}`}>
                      {addons.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Description */}
        {activeTab === "description" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-2">
            <VideoPlayer videoUrl={app.video_url} videoType={app.video_type} />
            <p className="text-xs text-muted-foreground leading-relaxed text-right">
              {app.description || app.short_description || "لا يوجد وصف"}
            </p>
          </motion.div>
        )}

        {/* Info */}
        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-[11px] text-muted-foreground space-y-2" dir="rtl">
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">التصنيف الرئيسي</span>
              <span>{app.primary_category || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">نوع الترخيص</span>
              <span>{app.is_free ? "مجاني" : "مدفوع"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-foreground font-semibold">تاريخ الإضافة</span>
              <span>{formatDate(app.created_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground font-semibold">آخر تحديث</span>
              <span>{formatDate(app.updated_date)}</span>
            </div>
          </motion.div>
        )}

        {/* Addons */}
        {activeTab === "addons" && (
          <AddonsTab addons={addons} renderPrice={renderPrice} handleStart={handleStart} />
        )}
      </div>

      {/* Action Button */}
      {activeTab !== "addons" && (
        <div className="px-3 pb-3 mt-auto">
          <button
            onClick={() => handleStart(app)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            اختر التطبيق
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function PayPerUseApps({ apps = [], dbCategories = [], renderPrice, handleStart, allApps = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortOption, setSortOption] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | free | paid
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterPrimaryCategory, setFilterPrimaryCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  // وضع عرض الإضافات: false = مخفية (الافتراضي)، true = تظهر كبطاقات مستقلة
  const [showAddonsStandalone, setShowAddonsStandalone] = useState(false);

  // جميع التطبيقات النشطة (بما فيها الإضافات)
  const allActiveApps = (allApps.length > 0 ? allApps : apps).filter(a => a.is_active !== false);
  // التطبيقات الرئيسية فقط (بدون إضافات)
  const activeApps = allActiveApps.filter(a => !a.is_addon);
  // القائمة المعروضة: إما الكل أو الرئيسية فقط
  const displayApps = showAddonsStandalone ? allActiveApps : activeApps;

  // دالة مساعدة: هل ينتمي تطبيق لتصنيف معين (بالاسم أو الـ ID)
  // تعتمد على dbCategories لتحويل IDs إلى أسماء
  const appMatchesCat = useCallback((app, catName) => {
    return (app.categories || []).some(c => {
      // مطابقة مباشرة بالاسم
      if (c === catName) return true;
      // مطابقة عن طريق ID → ابحث عن الاسم في قائمة التصنيفات
      const found = dbCategories.find(dc => dc.id === c);
      if (found?.name === catName) return true;
      return false;
    }) || (app.primary_category === catName);
  }, [dbCategories]);

  const categories = useMemo(() => {
    if (dbCategories.length === 0) return [{ id: "all", name: "الكل", icon: null, count: allActiveApps.length }];

    const catList = dbCategories
      .filter(c => c.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || null,
        count: allActiveApps.filter(a => appMatchesCat(a, cat.name)).length
      }));

    return [
      { id: "all", name: "الكل", icon: null, count: allActiveApps.length },
      ...catList
    ];
  }, [dbCategories, allActiveApps, appMatchesCat]);

  const hasActiveFilter = filterType !== "all" || filterPriceMax !== "" || filterOwner !== "" || filterPrimaryCategory !== "" || filterDateFrom !== "" || filterDateTo !== "";

  const resetFilters = () => {
    setFilterType("all");
    setFilterPriceMax("");
    setFilterOwner("");
    setFilterPrimaryCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const applySort = (arr) => {
    if (!sortOption) return arr;
    const sorted = [...arr];
    if (sortOption === "newest") sorted.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    else if (sortOption === "oldest") sorted.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
    else if (sortOption === "name_asc") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
    else if (sortOption === "name_desc") sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "ar"));
    else if (sortOption === "price_asc") sorted.sort((a, b) => (a.is_free ? 0 : a.monthly_price || 0) - (b.is_free ? 0 : b.monthly_price || 0));
    else if (sortOption === "price_desc") sorted.sort((a, b) => (b.is_free ? 0 : b.monthly_price || 0) - (a.is_free ? 0 : a.monthly_price || 0));
    else if (sortOption === "updated") sorted.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
    return sorted;
  };

  const filteredApps = useMemo(() => {
    // عند اختيار تصنيف، ابحث عن اسمه من الـ id
    const selectedCatObj = categories.find(c => c.id === selectedCategory);
    const selectedCatName = selectedCatObj?.name || selectedCategory;
    let result = selectedCategory === "all" ? displayApps : displayApps.filter(a => appMatchesCat(a, selectedCatName));
    if (searchQuery.trim()) {
      result = result.filter(a => a.name?.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    }
    if (filterType === "free") result = result.filter(a => a.is_free);
    if (filterType === "paid") result = result.filter(a => !a.is_free);
    if (filterPriceMax !== "" && !isNaN(Number(filterPriceMax))) {
      result = result.filter(a => a.is_free || (a.monthly_price ?? 0) <= Number(filterPriceMax));
    }
    if (filterOwner.trim()) {
      result = result.filter(a => (a.owner || "").toLowerCase().includes(filterOwner.trim().toLowerCase()));
    }
    if (filterPrimaryCategory.trim()) {
      result = result.filter(a => (a.primary_category || "") === filterPrimaryCategory);
    }
    if (filterDateFrom) {
      result = result.filter(a => a.created_date && new Date(a.created_date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      result = result.filter(a => a.created_date && new Date(a.created_date) <= new Date(filterDateTo + "T23:59:59"));
    }
    return applySort(result);
  }, [displayApps, selectedCategory, searchQuery, filterType, filterPriceMax, filterOwner, filterPrimaryCategory, filterDateFrom, filterDateTo, sortOption, categories, appMatchesCat]);

  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== "all" || searchQuery.trim() || hasActiveFilter) return null;
    const activeCats = categories.filter(c => c.id !== "all");
    const groups = [];
    const usedIds = new Set();

    activeCats.forEach(cat => {
      const catApps = applySort(displayApps.filter(a => appMatchesCat(a, cat.name)));
      if (catApps.length > 0) {
        groups.push({ category: cat, apps: catApps });
        catApps.forEach(a => usedIds.add(a.id));
      }
    });

    const uncategorized = applySort(displayApps.filter(a => !usedIds.has(a.id)));
    if (uncategorized.length > 0) {
      groups.push({ category: { id: "other", name: "أخرى", icon: null }, apps: uncategorized });
    }

    return groups;
  }, [selectedCategory, displayApps, categories, searchQuery, hasActiveFilter, sortOption, showAddonsStandalone, appMatchesCat]);

  const AppGrid = ({ appsList }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
      {appsList.map((app, i) => (
        <AppCard key={app.id} app={app} index={i} renderPrice={renderPrice} handleStart={handleStart} allApps={allApps.length > 0 ? allApps : apps} />
      ))}
    </div>
  );

  return (
    <div dir="rtl" className="flex gap-6 items-start min-h-screen">
      {/* القائمة الجانبية - تظهر دائماً */}
      <div className="w-[280px] flex-shrink-0 bg-card border border-border rounded-xl p-4 self-start sticky top-[79px] max-h-[calc(100vh-100px)] flex flex-col">
        <h3 className="font-bold text-foreground mb-3 text-sm flex-shrink-0">التصنيفات</h3>
        {dbCategories.length === 0 ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto scrollbar-hide flex-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-right text-xs ${
                  selectedCategory === cat.id
                    ? "bg-primary/10 border border-primary text-primary font-semibold"
                    : "border border-transparent text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat.icon && <span>{cat.icon}</span>}
                  <span className="font-medium">{cat.name}</span>
                </div>
                <span className={`min-w-[28px] h-6 flex items-center justify-center rounded-md border text-xs font-semibold flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "border-primary/30 bg-white text-primary"
                    : "border-border bg-secondary text-muted-foreground"
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* منطقة التطبيقات */}
      <div className="flex-1 min-w-0">
        {/* حقل البحث + زر التصفية - ثابت عند التمرير */}
      <div className="sticky top-[72px] z-10 bg-background pb-3 pt-2 mb-1 flex items-center gap-2 border-b border-border">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تطبيق..."
            className="w-full border border-border rounded-lg pr-9 pl-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card"
            dir="rtl"
          />
        </div>
        {/* زر تبديل عرض الإضافات */}
        <button
          onClick={() => setShowAddonsStandalone(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all flex-shrink-0 ${
            showAddonsStandalone
              ? "bg-violet-600 text-white border-violet-600"
              : "bg-card border-border text-foreground hover:bg-secondary"
          }`}
          title={showAddonsStandalone ? "إخفاء الإضافات المستقلة" : "عرض الإضافات كتطبيقات مستقلة"}
        >
          🧩 {showAddonsStandalone ? "إخفاء الإضافات" : "عرض الإضافات"}
        </button>

        {/* زر الفرز */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSort(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
              sortOption
                ? "bg-primary text-white border-primary"
                : "bg-card border-border text-foreground hover:bg-secondary"
            }`}
          >
            <ArrowUpDown size={15} />
            فرز
            {sortOption && <span className="w-5 h-5 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">✓</span>}
          </button>

          <AnimatePresence>
            {showSort && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowSort(false)} className="fixed inset-0 z-40" />
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                  dir="rtl"
                >
                  {[
                    { value: "", label: "افتراضي" },
                    { value: "newest", label: "الأحدث أولاً" },
                    { value: "oldest", label: "الأقدم أولاً" },
                    { value: "name_asc", label: "الاسم أ ← ي" },
                    { value: "name_desc", label: "الاسم ي ← أ" },
                    { value: "price_asc", label: "السعر: الأقل أولاً" },
                    { value: "price_desc", label: "السعر: الأعلى أولاً" },
                    { value: "updated", label: "آخر تحديث" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => { setSortOption(opt.value); setShowSort(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-right transition-colors hover:bg-secondary/60 ${sortOption === opt.value ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}>
                      <span>{opt.label}</span>
                      {sortOption === opt.value && <Check size={14} className="text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* زر التصفية */}
        <button
          onClick={() => setShowFilter(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all flex-shrink-0 ${
            hasActiveFilter
              ? "bg-primary text-white border-primary"
              : "bg-card border-border text-foreground hover:bg-secondary"
          }`}
        >
          <SlidersHorizontal size={15} />
          تصفية
          {hasActiveFilter && <span className="w-5 h-5 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">✓</span>}
        </button>
      </div>

      {/* لوحة التصفية الجانبية */}
      <AnimatePresence>
        {showFilter && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilter(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30 flex-shrink-0">
                <h2 className="text-base font-bold text-foreground">تصفية التطبيقات</h2>
                <button onClick={() => setShowFilter(false)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* نوع التطبيق */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">نوع التطبيق</label>
                  <div className="flex gap-2">
                    {[{ value: "all", label: "الكل" }, { value: "free", label: "مجاني" }, { value: "paid", label: "مدفوع" }].map(opt => (
                      <button key={opt.value} onClick={() => setFilterType(opt.value)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${filterType === opt.value ? "bg-primary text-white border-primary" : "border-border text-foreground hover:bg-secondary"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* التصنيف الرئيسي */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">التصنيف الرئيسي</label>
                  <select
                    value={filterPrimaryCategory}
                    onChange={e => setFilterPrimaryCategory(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">الكل</option>
                    {[...new Set(activeApps.map(a => a.primary_category).filter(Boolean))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* الحد الأقصى للسعر الشهري */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">الحد الأقصى للسعر الشهري</label>
                  <input
                    type="number" min="0" value={filterPriceMax}
                    onChange={e => setFilterPriceMax(e.target.value)}
                    placeholder="مثال: 100"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* المالك */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">المالك</label>
                  <input
                    type="text" value={filterOwner}
                    onChange={e => setFilterOwner(e.target.value)}
                    placeholder="اسم المالك..."
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* تاريخ الإنشاء من */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">تاريخ الإنشاء (من)</label>
                  <input
                    type="date" value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* تاريخ الإنشاء إلى */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2">تاريخ الإنشاء (إلى)</label>
                  <input
                    type="date" value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowFilter(false)}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  تطبيق التصفية
                </button>
                {hasActiveFilter && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2.5 border border-destructive/40 text-destructive text-sm font-semibold rounded-lg hover:bg-destructive/5 transition-colors"
                  >
                    إعادة تعيين
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedCategory === "all" && groupedByCategory ? (
          <div className="space-y-8">
            {groupedByCategory.map(({ category, apps: catApps }) => (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-4">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  <h3 className="text-base font-bold text-foreground">{category.name}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{catApps.length}</span>
                  <div className="flex-1 h-px bg-border mr-2" />
                </div>
                <AppGrid appsList={catApps} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <AppGrid appsList={filteredApps} />
            {filteredApps.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {searchQuery.trim() ? `لا توجد تطبيقات تطابق "${searchQuery}"` : "لا توجد تطبيقات في هذا التصنيف"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}