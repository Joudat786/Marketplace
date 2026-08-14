import React, { useState } from "react";
import { Package, Settings, ExternalLink, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppVideoPlayer } from "@/components/apps/AppVideoSection";

export default function AddonsTab({ addons, getAddonInstalled, onInstallAddon, onUninstallAddon, onSetup }) {
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showMenu, setShowMenu] = useState(false);

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "free", label: "المجانية فقط" }
  ];

  const sortOptions = [
    { value: "default", label: "الترتيب الافتراضي" },
    { value: "cheapest", label: "الأقل سعراً" },
    { value: "expensive", label: "الأعلى سعراً" },
    { value: "newest", label: "الأحدث" },
    { value: "popular", label: "الأكثر استخداماً" }
  ];

  const searched = addons.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const filtered = searched.filter((a) => {
    if (filterBy === "free") return !!a.is_free;
    return true;
  });

  const getEffectivePrice = (item) => {
    if (item.is_free) return 0;
    return typeof item.monthly_price === 'number' ? item.monthly_price : 0;
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "cheapest") return getEffectivePrice(a) - getEffectivePrice(b);
    if (sortBy === "expensive") return getEffectivePrice(b) - getEffectivePrice(a);
    if (sortBy === "newest") return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    if (sortBy === "popular") return (b.subscribers_count || 0) - (a.subscribers_count || 0);
    return 0;
  });

  const activeLabel = filterBy !== "all" ? filterOptions.find((f) => f.value === filterBy)?.label : sortBy !== "default" ? sortOptions.find((s) => s.value === sortBy)?.label : null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2.5 space-y-3">
      <div className="flex gap-2">
        <input type="text" placeholder="ابحث عن إضافة..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-1 py-0 text-[10px] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className={cn("flex items-center gap-1 px-3 py-2 border rounded-lg transition-colors text-xs font-semibold", activeLabel ? "bg-violet-100 border-violet-300 text-violet-700" : "bg-secondary border-border text-foreground hover:bg-secondary/80")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 12h8M12 18h4" /></svg>
            {activeLabel && <span className="max-w-[60px] truncate">{activeLabel}</span>}
          </button>

          {showMenu && <div className="absolute z-50 left-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-xl flex flex-col" style={{ maxHeight: "220px" }}>
            <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/40 border-b border-border flex-shrink-0">
              <span>تصفية</span>
              <button onClick={() => {setFilterBy("all"); setSortBy("default"); setShowMenu(false);}} className="text-red-600 hover:text-red-700 transition-colors text-xs" title="مسح الفلاتر والترتيب">🗑️</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {filterOptions.map((opt) => <button key={opt.value} onClick={() => {setFilterBy(opt.value); setShowMenu(false);}} className={cn("w-full text-right px-4 py-2 text-xs flex items-center justify-between transition-colors border-b border-border/30", filterBy === opt.value ? "bg-violet-50 text-primary font-semibold" : "hover:bg-secondary/40")}>{opt.label} {filterBy === opt.value && <span className="text-primary">✓</span>}</button>)}
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/40 border-b border-border">ترتيب</div>
              {sortOptions.map((opt) => <button key={opt.value} onClick={() => {setSortBy(opt.value); setShowMenu(false);}} className={cn("w-full text-right px-4 py-2 text-xs flex items-center justify-between transition-colors border-b border-border/30 last:border-0", sortBy === opt.value ? "bg-violet-50 text-primary font-semibold" : "hover:bg-secondary/40")}>{opt.label} {sortBy === opt.value && <span className="text-primary">✓</span>}</button>)}
            </div>
          </div>}
        </div>
      </div>

      {sorted.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">{filterBy === "free" ? "لا توجد إضافات مجانية" : search ? "لا توجد نتائج" : "لا توجد إضافات متاحة"}</p> :
      <div className="space-y-3">
        {sorted.map((addon) => <AddonCard key={addon.id} addon={addon} addonInstalled={getAddonInstalled(addon.id)} onInstallAddon={onInstallAddon} onUninstallAddon={onUninstallAddon} onSetup={onSetup} />)}
      </div>}
    </motion.div>
  );
}

function AddonCard({ addon, addonInstalled, onInstallAddon, onUninstallAddon, onSetup }) {
  const [pricingType, setPricingType] = useState('monthly');
  const [activeTab, setActiveTab] = useState(null);
  const isReady = addon.is_ready === true;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          {addon.icon_url ? <img src={addon.icon_url} alt={addon.name} className="w-7 h-7 object-contain" /> : <Package size={16} className="text-violet-600" />}
        </div>
        <div className="flex-1 mx-2 text-right">
          <h3 className="text-sm font-bold text-foreground">{addon.name}</h3>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0", isReady ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
          {isReady ? "جاهز" : "قريباً"}
        </span>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          {!addon.is_free && addon.yearly_price > 0 &&
          <div className="flex gap-1 bg-secondary/60 rounded-full p-0.5">
            <button onClick={() => setPricingType('monthly')} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all", pricingType === 'monthly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>شهري</button>
            <button onClick={() => setPricingType('yearly')} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all", pricingType === 'yearly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}>سنوي</button>
          </div>}
          <div className="text-sm font-bold text-primary">
            {addon.is_free ? "مجاناً" : `${pricingType === 'yearly' ? addon.yearly_price ?? 0 : addon.monthly_price ?? 0} ${addon.currency ?? ""}`}
          </div>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
          {['description', 'info'].map((tab) =>
          <button key={tab} onClick={() => setActiveTab(activeTab === tab ? null : tab)} className={cn("flex-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all text-center", activeTab === tab ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab === 'description' ? 'الوصف' : 'المعلومات'}
          </button>)}
        </div>

        {activeTab === 'description' && <div className="mt-2 space-y-2"><AppVideoPlayer videoUrl={addon.video_url} videoType={addon.video_type} /><p className="text-[10px] text-muted-foreground text-right leading-relaxed">{addon.description || addon.short_description || "لا توجد معلومات إضافية"}</p></div>}
        {activeTab === 'info' && <div className="mt-2 text-[10px] text-muted-foreground text-right space-y-1.5"><div className="flex justify-between"><span>ID</span><span className="font-semibold text-foreground font-mono text-[9px]">{addon.id}</span></div>{(addon.categories || []).length > 0 && <div className="border-t border-border pt-1.5 flex justify-between"><span>التصنيفات</span><span className="font-semibold text-foreground">{(addon.categories || []).join("، ")}</span></div>}</div>}
      </div>

      <div className="px-3 pb-3">
        {addonInstalled ? <div className="flex gap-2">
          {addon.app_type === 'ui' && addon.route && addonInstalled?.status === 'active' && <a href={addon.route} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:opacity-90 transition-opacity"><ExternalLink size={13} />فتح</a>}
          <button onClick={() => onUninstallAddon && onUninstallAddon(addonInstalled.id, addon.name)} className="flex-1 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors">إلغاء التثبيت</button>
          {(addon.integration_fields || []).length > 0 && onSetup && <button onClick={() => onSetup(addon, addonInstalled)} className="flex items-center justify-center px-3 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors"><Settings size={15} /></button>}
        </div> :
        <button onClick={() => onInstallAddon && onInstallAddon(addon)} disabled={!isReady} className={cn("w-full text-xs px-3 py-2 rounded-lg font-semibold transition-all", !isReady ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-violet-600 text-white hover:bg-violet-700")}>
          {!isReady ? "قريباً" : "تثبيت الإضافة"}
        </button>}
      </div>
    </div>
  );
}