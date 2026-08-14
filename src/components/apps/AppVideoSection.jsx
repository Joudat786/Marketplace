import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Youtube, X, Loader2, Link, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * استخراج معرف يوتيوب من أي رابط
 */
function extractYoutubeId(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /v=([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * مكوّن قسم الفيديو التوضيحي - حقل موحّد
 * يكتشف تلقائياً نوع الفيديو (يوتيوب / مباشر / مرفوع)
 */
export function AppVideoEditor({ videoUrl, videoType, onVideoUrlChange, onVideoTypeChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  // وضع الإدخال: "link" أو "upload"
  const [mode, setMode] = useState(videoType === "uploaded" ? "upload" : "link");

  const handleUrlChange = (val) => {
    onVideoUrlChange(val);
    // كشف تلقائي للنوع
    if (val) {
      const ytId = extractYoutubeId(val);
      onVideoTypeChange(ytId ? "youtube" : "url");
    }
  };

  const handleSwitchToUpload = () => {
    setMode("upload");
    // مسح الرابط عند الانتقال لرفع فيديو
    onVideoUrlChange("");
    onVideoTypeChange("uploaded");
  };

  const handleSwitchToLink = () => {
    setMode("link");
    onVideoUrlChange("");
    onVideoTypeChange("youtube");
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!validVideoTypes.includes(file.type)) {
      toast({ title: "خطأ", description: "نوع الملف غير مدعوم. الرجاء استخدام MP4 أو WebM أو OGG", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الفيديو يجب أن يكون أقل من 100MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onVideoUrlChange(res.file_url);
      onVideoTypeChange("uploaded");
      toast({ title: "✓", description: "تم رفع الفيديو بنجاح" });
    } catch (error) {
      toast({ title: "خطأ", description: error.message || "فشل رفع الفيديو", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const youtubeId = (mode === "link" && videoUrl) ? extractYoutubeId(videoUrl) : null;
  const isYoutube = !!youtubeId;
  const isDirectUrl = mode === "link" && videoUrl && !isYoutube;
  const isUploaded = mode === "upload" && videoType === "uploaded" && videoUrl;

  return (
    <div className="space-y-4">
      {/* اختيار الوضع */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSwitchToLink}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
            mode === "link" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Link size={16} />
          رابط فيديو (يوتيوب أو مباشر)
        </button>
        <button
          type="button"
          onClick={handleSwitchToUpload}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
            mode === "upload" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Upload size={16} />
          رفع فيديو من جهازك
        </button>
      </div>

      {/* وضع الرابط */}
      {mode === "link" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              رابط الفيديو
              <span className="text-muted-foreground font-normal mr-2">(يوتيوب أو رابط MP4 مباشر)</span>
            </label>
            <p className="text-[11px] text-muted-foreground mb-2">
              أمثلة: <span dir="ltr" className="font-mono bg-secondary px-1 rounded">https://youtu.be/xxxxx</span> أو <span dir="ltr" className="font-mono bg-secondary px-1 rounded">https://example.com/video.mp4</span>
            </p>
            <div className="relative">
              <input
                type="url"
                value={videoUrl || ""}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://..."
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
              {videoUrl && (
                <button type="button" onClick={() => { onVideoUrlChange(""); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive">
                  <X size={15} />
                </button>
              )}
            </div>
            {/* مؤشر نوع الرابط */}
            {videoUrl && (
              <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${isYoutube ? "text-red-600" : "text-blue-600"}`}>
                {isYoutube ? <Youtube size={13} /> : <Play size={13} />}
                {isYoutube ? "رابط يوتيوب — سيتم استخراج المعرف تلقائياً" : "رابط فيديو مباشر"}
              </div>
            )}
          </div>

          {/* معاينة يوتيوب */}
          {isYoutube && (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border border-border aspect-video bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&fs=1&controls=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title="معاينة الفيديو"
                />
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <span>⚠</span>
                <span>إذا ظهرت شاشة سوداء أو خطأ 153، فهذا يعني أن صاحب الفيديو أغلق خاصية التضمين.</span>
              </div>
            </div>
          )}

          {/* معاينة رابط مباشر */}
          {isDirectUrl && (
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full max-h-52"
                onError={(e) => {
                  e.target.parentElement.innerHTML = '<p class="text-white text-xs text-center p-4">⚠ لا يمكن تحميل الفيديو — تأكد من صحة الرابط</p>';
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* وضع الرفع */}
      {mode === "upload" && (
        <div>
          {isUploaded ? (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border border-border bg-black">
                <video src={videoUrl} controls className="w-full max-h-52" />
              </div>
              <button
                type="button"
                onClick={() => { onVideoUrlChange(""); onVideoTypeChange("uploaded"); }}
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X size={13} /> حذف الفيديو
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/30"}`}>
              {uploading ? (
                <><Loader2 size={28} className="text-primary animate-spin" /><span className="text-sm text-muted-foreground">جارٍ الرفع...</span></>
              ) : (
                <>
                  <Upload size={28} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">اضغط لرفع فيديو</span>
                  <span className="text-xs text-muted-foreground">MP4, WebM (أقل من 100MB)</span>
                </>
              )}
              <input type="file" accept="video/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * مكوّن عرض الفيديو في متجر التطبيقات
 */
export function AppVideoPlayer({ videoUrl, videoType }) {
  if (!videoUrl || !videoType) return null;

  const youtubeId = (videoType === "youtube") ? extractYoutubeId(videoUrl) : null;

  if (videoType === "youtube" && youtubeId) {
    return (
      <div className="space-y-2 mb-2.5">
        <div className="rounded-lg overflow-hidden border border-border aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&fs=1&controls=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title="فيديو شرح التطبيق"
          />
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-red-600 hover:underline"
        >
          <Youtube size={14} />
          مشاهدة الفيديو على يوتيوب مباشرة
        </a>
      </div>
    );
  }

  if ((videoType === "uploaded" || videoType === "url") && videoUrl) {
    return (
      <div className="rounded-lg overflow-hidden border border-border mb-2.5 bg-black">
        <video src={videoUrl} controls className="w-full max-h-48" />
      </div>
    );
  }

  return null;
}