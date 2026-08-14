import { useEffect, useState, useRef } from "react";
import { Crosshair, Loader2, Search, Plus, Minus, Maximize2, X, Move } from "lucide-react";
import { base44 } from "@/api/base44Client";

const inputClass = "w-full border border-border bg-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40";
const labelClass = "block text-xs font-semibold text-foreground mb-1.5 text-right";

// تحميل Google Maps Script مرة واحدة
let googleMapsLoaded = false;
let googleMapsCallbacks = [];
let googleMapsError = false;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve();
  }
  if (googleMapsLoaded && !googleMapsError) {
    return new Promise((resolve) => googleMapsCallbacks.push(resolve));
  }
  googleMapsLoaded = true;
  googleMapsError = false;
  return new Promise((resolve, reject) => {
    googleMapsCallbacks.push(resolve);
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.remove();
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ar&region=SA`;
    script.async = true;
    script.onload = () => {
      googleMapsCallbacks.forEach((cb) => cb());
      googleMapsCallbacks = [];
    };
    script.onerror = () => {
      googleMapsError = true;
      googleMapsLoaded = false;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
}

function MapContainer({ mapRef, onZoomIn, onZoomOut, onFullscreen, onCurrentLocation, geocoding, mapReady, isFullscreen, locating }) {


  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/20" style={{ height: isFullscreen ? "100%" : 320 }}>
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/40 z-10 gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
        </div>
      )}

      {/* div الخريطة */}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {mapReady && (
        <>
          {/* أزرار التكبير والتصغير — يسار */}
          <div className="absolute top-3 left-3 z-[10] flex flex-col gap-1">
            <button
              type="button"
              onClick={onZoomIn}
              title="تكبير"
              className="w-8 h-8 flex items-center justify-center bg-white border border-border rounded-md shadow hover:bg-secondary/60 transition-colors font-bold text-foreground"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              title="تصغير"
              className="w-8 h-8 flex items-center justify-center bg-white border border-border rounded-md shadow hover:bg-secondary/60 transition-colors font-bold text-foreground"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* زر تكبير الخريطة fullscreen — أعلى يمين */}
          <button
            type="button"
            onClick={onFullscreen}
            title={isFullscreen ? "إغلاق التكبير" : "تكبير الخريطة"}
            className="absolute top-3 right-3 z-[10] w-8 h-8 flex items-center justify-center bg-primary text-white rounded-md shadow hover:opacity-90 transition-colors"
          >
            {isFullscreen ? <X size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* زر موقعي الحالي — أسفل يسار */}
          <button
            type="button"
            onClick={onCurrentLocation}
            title="موقعي الحالي"
            disabled={locating}
            className="absolute bottom-3 left-3 z-[10] w-8 h-8 flex items-center justify-center bg-white border border-border rounded-md shadow hover:bg-secondary/60 transition-colors disabled:opacity-70"
          >
            {locating ? <Loader2 size={15} className="animate-spin text-primary" /> : <Crosshair size={16} className="text-primary" />}
          </button>


        </>
      )}

      {/* مؤشر جاري التحديد */}
      {geocoding && (
        <div className="absolute top-3 right-12 z-[10] bg-white border border-border rounded-lg px-3 py-1.5 shadow flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin text-primary" />
          جاري تحديد العنوان...
        </div>
      )}
    </div>
  );
}

export default function LocationSection({ form, setForm }) {
  const [geocoding, setGeocoding] = useState(false);
  const [shortSearching, setShortSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);
  const fullscreenMapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fullscreenMapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const fullscreenMarkerRef = useRef(null);
  const apiKeyRef = useRef(null);
  const loc = form.location_data || {};

  const updateLoc = (key, val) =>
    setForm((f) => ({ ...f, location_data: { ...f.location_data, [key]: val } }));

  // دالة reverse geocode
  const reverseGeocodeViaBackend = async (lat, lng) => {
    const res = await base44.functions.invoke("geocodeAddress", {
      address: `${lat},${lng}`,
    });
    return res.data;
  };

  // تحديث موقع الـ marker في كلتا الخريطتين
  const syncMarker = (lat, lng) => {
    const pos = { lat, lng };
    // الخريطة الرئيسية
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(pos);
      if (markerRef.current) {
        markerRef.current.setPosition(pos);
      } else {
        markerRef.current = new window.google.maps.Marker({ position: pos, map: mapInstanceRef.current, draggable: true });
        markerRef.current.addListener("dragend", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
      }
    }
    // الخريطة المكبّرة
    if (fullscreenMapInstanceRef.current) {
      fullscreenMapInstanceRef.current.panTo(pos);
      if (fullscreenMarkerRef.current) {
        fullscreenMarkerRef.current.setPosition(pos);
      } else {
        fullscreenMarkerRef.current = new window.google.maps.Marker({ position: pos, map: fullscreenMapInstanceRef.current, draggable: true });
        fullscreenMarkerRef.current.addListener("dragend", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
      }
    }
  };

  const handleMapClick = async (lat, lng) => {
    syncMarker(lat, lng);
    setGeocoding(true);
    try {
      const data = await reverseGeocodeViaBackend(lat, lng);
      if (data?.found) {
        setForm((f) => ({
          ...f,
          location_data: {
            ...f.location_data,
            lat,
            lng,
            country: data.country || "",
            region: data.region || "",
            city: data.city || "",
            neighborhood: data.neighborhood || "",
            street: data.street || "",
            address_description: data.address_description || "",
            ...(data.national_address_code ? { national_address_code: data.national_address_code } : {}),
          },
        }));
      } else {
        setForm((f) => ({ ...f, location_data: { ...f.location_data, lat, lng } }));
      }
    } catch (e) {
      console.error("Geocoding error:", e);
      setForm((f) => ({ ...f, location_data: { ...f.location_data, lat, lng } }));
    }
    setGeocoding(false);
  };

  // دالة إنشاء خريطة
  const createMap = (container, options = {}) => {
    const center = { lat: loc.lat || 24.7136, lng: loc.lng || 46.6753 };
    const map = new window.google.maps.Map(container, {
      center,
      zoom: loc.lat ? 15 : 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      rotateControl: false,
      scaleControl: false,
      panControl: false,
      gestureHandling: "greedy",
      ...options,
    });
    return map;
  };

  // تهيئة الخريطة الرئيسية
  useEffect(() => {
    base44.functions.invoke("getGoogleMapsKey", {}).then((res) => {
      const key = res.data?.key;
      if (!key) return;
      apiKeyRef.current = key;
      loadGoogleMaps(key).then(() => setMapReady(true)).catch(console.error);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = createMap(mapRef.current);
    mapInstanceRef.current = map;

    if (loc.lat && loc.lng) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng }, map, draggable: true,
      });
      markerRef.current.addListener("dragend", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
    }
    map.addListener("click", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
  }, [mapReady]);

  // تهيئة الخريطة المكبّرة عند فتح fullscreen
  useEffect(() => {
    if (!fullscreen || !mapReady || !fullscreenMapRef.current) return;

    setTimeout(() => {
      if (!fullscreenMapRef.current) return;
      const map = createMap(fullscreenMapRef.current, { zoom: loc.lat ? 15 : 6 });
      fullscreenMapInstanceRef.current = map;

      if (loc.lat && loc.lng) {
        fullscreenMarkerRef.current = new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng }, map, draggable: true,
        });
        fullscreenMarkerRef.current.addListener("dragend", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
      }
      map.addListener("click", (e) => handleMapClick(e.latLng.lat(), e.latLng.lng()));
    }, 100);

    return () => {
      fullscreenMapInstanceRef.current = null;
      fullscreenMarkerRef.current = null;
    };
  }, [fullscreen, mapReady]);

  // مزامنة موقع الـ marker عند تغير الإحداثيات
  useEffect(() => {
    if (!loc.lat || !loc.lng) return;
    syncMarker(loc.lat, loc.lng);
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom(15);
    if (fullscreenMapInstanceRef.current) fullscreenMapInstanceRef.current.setZoom(15);
  }, [loc.lat, loc.lng]);

  const handleZoomIn = (isFullscreenMap = false) => {
    const map = isFullscreenMap ? fullscreenMapInstanceRef.current : mapInstanceRef.current;
    if (map) map.setZoom(map.getZoom() + 1);
  };

  const handleZoomOut = (isFullscreenMap = false) => {
    const map = isFullscreenMap ? fullscreenMapInstanceRef.current : mapInstanceRef.current;
    if (map) map.setZoom(map.getZoom() - 1);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleMapClick(pos.coords.latitude, pos.coords.longitude).finally
          ? handleMapClick(pos.coords.latitude, pos.coords.longitude).finally(() => setLocating(false))
          : handleMapClick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const searchByShortAddress = async () => {
    const code = (loc.national_address_code || "").trim();
    if (!code || code.length < 4) return;
    setShortSearching(true);
    try {
      const res = await base44.functions.invoke("geocodeAddress", { address: `${code}, Saudi Arabia` });
      const data = res.data;
      if (data?.found) {
        setForm((f) => ({
          ...f,
          location_data: {
            ...f.location_data,
            lat: data.lat, lng: data.lng,
            country: data.country || "السعودية",
            region: data.region || "",
            city: data.city || "",
            neighborhood: data.neighborhood || "",
            street: data.street || "",
            address_description: data.address_description || "",
          },
        }));
      } else {
        alert("لم يتم العثور على العنوان المختصر، تأكد من صحته أو حدد الموقع يدوياً على الخريطة");
      }
    } catch (e) {
      alert("حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى");
    }
    setShortSearching(false);
  };

  const handleShortAddressChange = (val) => {
    setForm((f) => ({ ...f, location_data: { ...f.location_data, national_address_code: val.toUpperCase() } }));
  };

  return (
    <div className="space-y-1 -mt-3" dir="rtl">
      <style>{`
        .gm-bundled-control, .gm-bundled-control-on-bottom,
        .gmnoprint, .gm-style-cc, .gm-fullscreen-control,
        button[title="تكبير الخريطة"], button[title="تصغير الخريطة"],
        .gm-svpc, .gm-style-mtc {
          display: none !important;
        }
      `}</style>
      {/* الخريطة الرئيسية — فوق حقل العنوان المختصر */}
      <MapContainer
        mapRef={mapRef}
        onZoomIn={() => handleZoomIn(false)}
        onZoomOut={() => handleZoomOut(false)}
        onFullscreen={() => setFullscreen(true)}
        onCurrentLocation={handleGetCurrentLocation}
        geocoding={geocoding}
        mapReady={mapReady}
        isFullscreen={false}
        locating={locating}
      />

      {/* العنوان المختصر + الإحداثيات في صف واحد */}
      <div className="flex gap-2 items-end">
        <div className="w-56 flex-shrink-0">
          <label className={labelClass}>العنوان المختصر (Short Address)</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={loc.national_address_code || ""}
              onChange={(e) => handleShortAddressChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchByShortAddress(); } }}
              placeholder='أدخل العنوان المختصر ثم اضغط "بحث"، أو انقر على الخريطة مباشرة'
              className={inputClass}
              dir="ltr"
              maxLength={10}
            />
            <button
              type="button"
              onClick={searchByShortAddress}
              disabled={shortSearching || !loc.national_address_code}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap flex-shrink-0"
            >
              {shortSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              بحث
            </button>
          </div>
        </div>

        {/* الإحداثيات — يظهر دائماً */}
        <div className="flex-1">
          <label className={labelClass}>الإحداثيات</label>
          <div className="w-full border border-border bg-secondary/30 rounded-lg px-3 py-2 text-xs text-right text-muted-foreground" dir="ltr">
            {loc.lat && loc.lng
              ? `${parseFloat(loc.lat).toFixed(6)}, ${parseFloat(loc.lng).toFixed(6)}`
              : <span className="opacity-50">يُعبأ تلقائياً عند تحديد الموقع</span>
            }
          </div>
        </div>
      </div>

      {/* الصف الأول: الدولة والمنطقة والمدينة والحي والشارع */}
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className={labelClass}>الدولة</label>
          <input type="text" value={loc.country || ""} onChange={(e) => updateLoc("country", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>المنطقة</label>
          <input type="text" value={loc.region || ""} onChange={(e) => updateLoc("region", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>المدينة</label>
          <input type="text" value={loc.city || ""} onChange={(e) => updateLoc("city", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>الحي</label>
          <input type="text" value={loc.neighborhood || ""} onChange={(e) => updateLoc("neighborhood", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>الشارع</label>
          <input type="text" value={loc.street || ""} onChange={(e) => updateLoc("street", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
        </div>
      </div>

      {/* الصف الثاني: وصف العنوان الكامل */}
      <div>
        <label className={labelClass}>وصف العنوان الكامل</label>
        <input type="text" value={loc.address_description || ""} onChange={(e) => updateLoc("address_description", e.target.value)} placeholder="يُعبأ تلقائياً" className={inputClass} />
      </div>

      {/* Fullscreen Map Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border flex-shrink-0">
            <h3 className="text-base font-bold text-foreground">تحديد الموقع على الخريطة</h3>
            <div className="flex items-center gap-2">
              {loc.lat && loc.lng && (
                <span className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-1" dir="ltr">
                  {parseFloat(loc.lat).toFixed(5)}, {parseFloat(loc.lng).toFixed(5)}
                </span>
              )}
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
              >
                <X size={15} />
                إغلاق
              </button>
            </div>
          </div>

          {/* الخريطة المكبّرة */}
          <div className="flex-1 relative">
            <div ref={fullscreenMapRef} style={{ height: "100%", width: "100%" }} />

            {mapReady && (
              <>
                {/* أزرار + و - */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleZoomIn(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-border rounded-md shadow-lg hover:bg-secondary/60 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomOut(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-border rounded-md shadow-lg hover:bg-secondary/60 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                </div>

                {/* زر موقعي الحالي */}
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  title="موقعي الحالي"
                  className="absolute bottom-6 left-4 z-10 w-10 h-10 flex items-center justify-center bg-white border border-border rounded-md shadow-lg hover:bg-secondary/60 transition-colors"
                >
                  <Crosshair size={18} className="text-primary" />
                </button>
              </>
            )}

            {geocoding && (
              <div className="absolute top-4 right-4 z-10 bg-white border border-border rounded-lg px-3 py-2 shadow flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin text-primary" />
                جاري تحديد العنوان...
              </div>
            )}

            {/* معلومات العنوان المحدد */}
            {loc.city && (
              <div className="absolute bottom-6 right-4 z-10 bg-white border border-border rounded-xl px-4 py-3 shadow-lg max-w-xs text-sm">
                <p className="font-semibold text-foreground">{loc.city}{loc.neighborhood ? ` — ${loc.neighborhood}` : ""}</p>
                {loc.street && <p className="text-xs text-muted-foreground mt-0.5">{loc.street}</p>}
                {loc.national_address_code && (
                  <p className="text-xs text-primary font-bold mt-1" dir="ltr">{loc.national_address_code}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}