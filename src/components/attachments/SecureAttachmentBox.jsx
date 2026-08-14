import React, { useState, useCallback, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload, X, Download, Maximize2, Lock, Unlock, FileText,
  Image as ImageIcon, Film, File, Eye, History, Loader2,
  RefreshCw, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/components/utils/dateHelpers";

const getFileType = (url, type) => {
  if (type && typeof type === 'string') {
    if (type.startsWith('image/')) return 'image';
    if (type === 'audio/webm' || type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'pdf';
  }
  if (!url || typeof url !== 'string') return 'other';
  try {
    const ext = url.split('.').pop()?.toLowerCase().match(/^[a-z0-9]+/)?.[0];
    if (!ext) return 'other';
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'image';
    if (['mp4','webm','mov','avi'].includes(ext)) return 'video';
    if (['mp3','wav','ogg','m4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
  } catch {}
  return 'other';
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function SecureAttachmentBox({
  attachments = [],
  onChange,
  parentEntityType = "request",
  parentEntityId = "",
  permissionGroups = [],
  readOnly = false,
  allowRestrictionsManagement = false,
  showHistory = true,
  canAccessAttachment = null,
  currentUser = null,
  requestCreatorEmail = null,
  trackPlayback = true,
  userPermissionGroupIds = [],
  allowedViewerUsers = [],
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [settingsAttachment, setSettingsAttachment] = useState(null);
  const [historyAttachment, setHistoryAttachment] = useState(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDuration, setAudioDuration] = useState({});
  const [audioSpeed, setAudioSpeed] = useState({});
  const [audioVolume, setAudioVolume] = useState({});
  const [previousVolume, setPreviousVolume] = useState({});
  const audioRefs = useRef({});

  const { data: viewHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['attachment-view-history', historyAttachment?.url],
    queryFn: () => base44.entities.AttachmentViewHistory.filter({
      attachment_id: historyAttachment?.file_uri || historyAttachment?.url
    }, '-view_timestamp'),
    enabled: !!historyAttachment,
  });

  const checkAccess = useCallback((file) => {
    if (canAccessAttachment && typeof canAccessAttachment === 'function') return canAccessAttachment(file);
    if (!file.is_restricted) return true;
    if (currentUser?.role === 'admin') return true;
    if (requestCreatorEmail === currentUser?.email) return true;
    if (file.uploaded_by === currentUser?.email) return true;
    if (file.allowed_viewer_emails?.length > 0 && currentUser?.email) {
      if (file.allowed_viewer_emails.includes(currentUser.email)) return true;
    }
    if (file.allowed_permission_group_ids?.length > 0 && userPermissionGroupIds?.length > 0) {
      if (userPermissionGroupIds.some(gid => file.allowed_permission_group_ids.includes(gid))) return true;
    }
    return false;
  }, [canAccessAttachment, currentUser, requestCreatorEmail, userPermissionGroupIds]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const currentUserEmail = (await base44.auth.me()).email;
      const uploaded = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadPrivateFile({ file });
        const fileUri = result?.file_uri || result?.data?.file_uri;
        uploaded.push({
          name: file.name,
          url: fileUri,
          file_uri: fileUri,
          type: file.type,
          size: file.size,
          is_restricted: false,
          allowed_permission_group_ids: [],
          uploaded_by: currentUserEmail,
          uploaded_date: new Date().toISOString(),
        });
      }
      onChange([...attachments, ...uploaded]);
      toast({ title: "✓ تم رفع المرفقات بنجاح" });
    } catch (error) {
      toast({ title: "❌ خطأ في رفع الملفات", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleViewAttachment = async (attachment, actionType = 'magnified', canAccess = true) => {
    if (!canAccess) {
      toast({ title: "مرفق مقيد", description: "ليس لديك صلاحية للوصول", variant: "destructive" });
      return;
    }
    const effectiveFileUri = attachment.file_uri ||
      (attachment.url && (attachment.url.startsWith('mp/private/') || attachment.url.startsWith('/private/')) ? attachment.url : null);

    if (!effectiveFileUri) {
      if (actionType === 'downloaded') {
        const a = document.createElement('a');
        a.href = attachment.url; a.download = attachment.name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        setPreviewUrl(attachment.url);
        setPreviewAttachment(attachment);
      }
      return;
    }

    setLoadingPreview(true);
    try {
      const response = await base44.functions.invoke('getSecureAttachment', {
        file_uri: effectiveFileUri,
        attachment_name: attachment.name,
        parent_entity_type: parentEntityType,
        parent_entity_id: parentEntityId,
        allowed_permission_group_ids: attachment.allowed_permission_group_ids || [],
        is_restricted: attachment.is_restricted || false,
        action_type: trackPlayback && parentEntityId && actionType !== 'magnified' ? actionType : null,
      });
      if (response.data?.signed_url) {
        if (actionType === 'downloaded') {
          const a = document.createElement('a');
          a.href = response.data.signed_url; a.download = attachment.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } else {
          setPreviewUrl(response.data.signed_url);
          setPreviewAttachment(attachment);
        }
      }
    } catch (error) {
      toast({ title: "❌ خطأ في الوصول للمرفق", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUpdateRestriction = async (index, updates) => {
    const newAttachments = [...attachments];
    newAttachments[index] = { ...newAttachments[index], ...updates };
    try {
      onChange(newAttachments);
      setSettingsAttachment(null);
      toast({ title: "✓ تم تحديث إعدادات التقييد" });
    } catch (error) {
      toast({ title: "❌ خطأ في الحفظ", description: error.message, variant: "destructive" });
    }
  };

  const handlePlayPause = async (index, file) => {
    try {
      const audioElement = audioRefs.current[index];
      if (!audioElement) {
        const audio = new Audio();
        audioRefs.current[index] = audio;
        const directUrl = file?.url;
        if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
          audio.src = directUrl;
        } else if (file?.file_uri) {
          const response = await base44.functions.invoke('getSecureAttachment', {
            file_uri: file.file_uri,
            attachment_name: file?.name || 'audio',
            parent_entity_type: parentEntityType || 'task',
            parent_entity_id: parentEntityId || 'temp',
            allowed_permission_group_ids: file?.allowed_permission_group_ids || [],
            is_restricted: file?.is_restricted || false,
            action_type: null,
          });
          if (response?.data?.signed_url) audio.src = response.data.signed_url;
          else throw new Error("لم يتم الحصول على رابط الصوت");
        } else {
          toast({ title: "❌ لا يوجد مصدر للصوت", variant: "destructive" });
          return;
        }
        audio.addEventListener('loadedmetadata', () => {
          if (isFinite(audio.duration)) setAudioDuration(prev => ({ ...prev, [index]: audio.duration }));
        });
        audio.volume = (audioVolume[index] !== undefined ? audioVolume[index] : 100) / 100;
        audio.addEventListener('timeupdate', () => {
          if (isFinite(audio.currentTime)) setAudioProgress(prev => ({ ...prev, [index]: audio.currentTime }));
        });
        audio.addEventListener('ended', () => {
          setPlayingAudioIndex(null);
          setAudioProgress(prev => ({ ...prev, [index]: 0 }));
        });
        await audio.play();
        setPlayingAudioIndex(index);
      } else if (playingAudioIndex === index) {
        audioElement.pause();
        setPlayingAudioIndex(null);
      } else {
        Object.values(audioRefs.current).forEach(a => a?.pause());
        await audioElement.play();
        setPlayingAudioIndex(index);
      }
    } catch (error) {
      toast({ title: "❌ خطأ في التشغيل", description: error?.message, variant: "destructive" });
    }
  };

  const handleSkip = (index, seconds) => {
    const audio = audioRefs.current[index];
    if (audio && isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    }
  };

  const handleSeek = (index, value) => {
    const audio = audioRefs.current[index];
    if (audio) { audio.currentTime = value; setAudioProgress(prev => ({ ...prev, [index]: value })); }
  };

  const handleSpeedChange = (index) => {
    const audio = audioRefs.current[index];
    if (audio) {
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const cur = audioSpeed[index] || 1;
      const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
      audio.playbackRate = next;
      setAudioSpeed(prev => ({ ...prev, [index]: next }));
    }
  };

  const handleToggleMute = (index) => {
    const cur = audioVolume[index] !== undefined ? audioVolume[index] : 100;
    if (cur === 0) {
      const prev = previousVolume[index] || 100;
      setAudioVolume(p => ({ ...p, [index]: prev }));
      if (audioRefs.current[index]) audioRefs.current[index].volume = prev / 100;
    } else {
      setPreviousVolume(p => ({ ...p, [index]: cur }));
      setAudioVolume(p => ({ ...p, [index]: 0 }));
      if (audioRefs.current[index]) audioRefs.current[index].volume = 0;
    }
  };

  return (
    <div className="space-y-2" dir="rtl">
      {!readOnly && (
        <div className="flex justify-start">
          <input
            type="file" multiple className="hidden"
            id={`upload-${parentEntityType}-${parentEntityId}`}
            onChange={handleFileUpload} disabled={uploading} accept="*/*"
          />
          <label
            htmlFor={`upload-${parentEntityType}-${parentEntityId}`}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors shadow-md cursor-pointer"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            <span>{uploading ? "جاري الرفع..." : "إضافة مرفق"}</span>
          </label>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-teal-300 rounded-lg bg-white">
          <p className="text-sm">لا توجد مرفقات</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-teal-400 rounded-lg bg-white overflow-hidden">
          {attachments.map((attachment, index) => {
            if (!attachment?.name || (!attachment.url && !attachment.file_uri)) return null;
            const fileType = getFileType(attachment.url, attachment.type);
            const isRestricted = attachment.is_restricted && attachment.allowed_permission_group_ids?.length > 0;
            const canAccess = checkAccess(attachment);
            const ext = attachment.name?.split('.').pop()?.toUpperCase() || '---';
            const size = attachment.size || 0;
            const sizeText = size < 1024 ? `${size} B` : size < 1048576 ? `${(size/1024).toFixed(1)} KB` : `${(size/1048576).toFixed(1)} MB`;
            const canManage = !readOnly && (currentUser?.role === 'admin' || currentUser?.email === requestCreatorEmail);
            const canManageRestrict = canManage || allowRestrictionsManagement || attachment.uploaded_by === currentUser?.email;

            return (
              <React.Fragment key={index}>
                <div className={`${index > 0 ? 'border-t border-gray-300' : ''} ${isRestricted && !canAccess ? 'bg-red-50/50' : ''}`}>
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className="flex items-stretch flex-1">
                      {/* رقم */}
                      <div className="flex items-center justify-center p-3 border-l border-gray-300 bg-gray-50 min-w-[44px]">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      {/* قفل */}
                      <div className="flex items-center justify-center p-2 border-l border-gray-300 min-w-[44px]">
                        {canManageRestrict ? (
                          <button onClick={() => setSettingsAttachment({ ...attachment, index })}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105 ${isRestricted ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'}`}
                            title={isRestricted ? "مقيد" : "عام"}>
                            {isRestricted ? <Lock className="w-4 h-4 text-red-600" /> : <Unlock className="w-4 h-4 text-green-600" />}
                          </button>
                        ) : (
                          <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isRestricted ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isRestricted ? <Lock className="w-4 h-4 text-red-600" /> : <Unlock className="w-4 h-4 text-green-600" />}
                          </div>
                        )}
                      </div>
                      {/* اسم */}
                      <div className="flex items-center p-3 border-l border-gray-300 flex-1 min-w-0">
                        <span className="text-sm text-gray-700 truncate block w-full" title={attachment.name}>{attachment.name}</span>
                        {isRestricted && !canAccess && (
                          <span className="text-xs text-red-600 font-bold mr-2 whitespace-nowrap bg-red-50 px-2 py-0.5 rounded border border-red-200">لا صلاحية</span>
                        )}
                      </div>
                      {/* نوع */}
                      <div className="hidden md:flex items-center justify-center p-3 border-l border-gray-300 min-w-[70px]">
                        <span className="text-xs text-gray-500">{fileType === 'image' ? 'صورة' : fileType === 'video' ? 'فيديو' : fileType === 'pdf' ? 'PDF' : fileType === 'audio' ? 'صوت' : 'ملف'}</span>
                      </div>
                      {/* امتداد */}
                      <div className="hidden md:flex items-center justify-center p-3 border-l border-gray-300 min-w-[55px]">
                        <span className="text-xs text-gray-500 font-mono">{ext}</span>
                      </div>
                      {/* حجم */}
                      <div className="hidden md:flex items-center justify-center p-3 border-l border-gray-300 min-w-[75px]">
                        <span className="text-xs text-gray-500 font-mono">{sizeText}</span>
                      </div>
                    </div>

                    {/* أزرار */}
                    <div className="flex items-stretch border-t md:border-t-0 md:border-r border-gray-300">
                      {!readOnly && (
                        <div className="flex items-center justify-center p-3 hover:bg-teal-50 border-l border-gray-300 cursor-pointer" title="استبدال">
                          <label htmlFor={`replace-${parentEntityType}-${parentEntityId}-${index}`} className="cursor-pointer">
                            <RefreshCw className="w-5 h-5 text-teal-600" />
                          </label>
                          <input id={`replace-${parentEntityType}-${parentEntityId}-${index}`} type="file" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setUploading(true);
                              try {
                                const result = await base44.integrations.Core.UploadPrivateFile({ file });
                                const na = [...attachments];
                                na[index] = { ...na[index], name: file.name, url: result.file_uri, file_uri: result.file_uri, type: file.type, size: file.size };
                                onChange(na);
                                toast({ title: "✓ تم استبدال المرفق" });
                              } catch { toast({ title: "❌ خطأ في الاستبدال", variant: "destructive" }); }
                              finally { setUploading(false); }
                            }} />
                        </div>
                      )}
                      <button onClick={() => handleViewAttachment(attachment, 'magnified', canAccess)}
                        disabled={loadingPreview || (isRestricted && !canAccess)}
                        className="flex items-center justify-center p-3 hover:bg-gray-50 border-l border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title="تكبير">
                        {isRestricted && !canAccess ? <Lock className="w-5 h-5 text-red-400" /> : <Maximize2 className="w-5 h-5 text-gray-600" />}
                      </button>
                      <button onClick={() => handleViewAttachment(attachment, 'downloaded', canAccess)}
                        disabled={loadingPreview || (isRestricted && !canAccess)}
                        className="flex items-center justify-center p-3 hover:bg-gray-50 border-l border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title="تحميل">
                        {isRestricted && !canAccess ? <Lock className="w-5 h-5 text-red-400" /> : <Download className="w-5 h-5 text-gray-600" />}
                      </button>
                      {showHistory && (
                        <button onClick={() => setHistoryAttachment(attachment)}
                          className="flex items-center justify-center p-3 hover:bg-purple-50 border-l border-gray-300" title="السجل">
                          <History className="w-5 h-5 text-purple-600" />
                        </button>
                      )}
                      {!readOnly && (
                        <button onClick={() => onChange(attachments.filter((_, i) => i !== index))}
                          className="flex items-center justify-center p-3 hover:bg-red-50" title="حذف">
                          <X className="w-5 h-5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* مشغل الصوت */}
                {fileType === 'audio' && (
                  <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSpeedChange(index)} disabled={!audioRefs.current[index]}
                        className="px-2 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-700 disabled:opacity-30 min-w-[40px]">
                        {audioSpeed[index] || 1}×
                      </button>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" value={audioVolume[index] !== undefined ? audioVolume[index] : 100}
                          onChange={(e) => { const v = parseFloat(e.target.value); setAudioVolume(p => ({...p,[index]:v})); if(audioRefs.current[index]) audioRefs.current[index].volume = v/100; }}
                          dir="ltr" className="w-20 h-1.5 cursor-pointer accent-teal-500" />
                        <button onClick={() => handleToggleMute(index)} className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
                          {(audioVolume[index] ?? 100) === 0 ? <VolumeX className="w-4 h-4 text-gray-600" /> : <Volume2 className="w-4 h-4 text-gray-600" />}
                        </button>
                      </div>
                      <span className="text-xs text-gray-600 font-mono min-w-[40px] text-center">{formatTime(audioDuration[index] || 0)}</span>
                      <input type="range" min="0" max={audioDuration[index] || 100} value={audioProgress[index] || 0}
                        onChange={(e) => handleSeek(index, parseFloat(e.target.value))}
                        dir="ltr" className="flex-1 h-2 cursor-pointer accent-teal-500" disabled={!audioRefs.current[index]} />
                      <span className="text-xs text-gray-600 font-mono min-w-[40px] text-center">{formatTime(audioProgress[index] || 0)}</span>
                      <button onClick={() => handleSkip(index, -10)} disabled={!audioRefs.current[index]}
                        className="w-9 h-9 flex items-center justify-center rounded bg-white border border-gray-200 disabled:opacity-30 relative">
                        <RotateCcw className="w-5 h-5 text-gray-600" />
                        <span className="absolute text-[8px] font-bold">10</span>
                      </button>
                      <button onClick={() => handlePlayPause(index, attachment)}
                        className="w-10 h-10 rounded-lg bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors">
                        {playingAudioIndex === index ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                      </button>
                      <button onClick={() => handleSkip(index, 10)} disabled={!audioRefs.current[index]}
                        className="w-9 h-9 flex items-center justify-center rounded bg-white border border-gray-200 disabled:opacity-30 relative">
                        <RotateCw className="w-5 h-5 text-gray-600" />
                        <span className="absolute text-[8px] font-bold">10</span>
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* نافذة المعاينة */}
      <Dialog open={!!previewAttachment} onOpenChange={() => { setPreviewAttachment(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">{previewAttachment?.name}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center min-h-[400px] bg-gray-100 rounded-lg overflow-auto">
            {previewUrl && previewAttachment && (() => {
              const ft = getFileType(previewAttachment.name, previewAttachment.type);
              return (
                <>
                  {ft === 'image' && <img src={previewUrl} alt={previewAttachment.name} className="max-w-full max-h-[70vh] object-contain" />}
                  {ft === 'video' && <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />}
                  {ft === 'pdf' && <iframe src={previewUrl} className="w-full h-[70vh]" title={previewAttachment.name} />}
                  {ft === 'audio' && <audio src={previewUrl} controls className="w-full" />}
                  {ft === 'other' && (
                    <div className="text-center p-8">
                      <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">لا يمكن معاينة هذا الملف</p>
                      <Button onClick={() => handleViewAttachment(previewAttachment, 'downloaded')}>
                        <Download className="w-4 h-4 ml-2" /> تنزيل الملف
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إعدادات التقييد */}
      <Dialog open={!!settingsAttachment} onOpenChange={() => setSettingsAttachment(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إعدادات تقييد الوصول</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">تقييد الوصول</span>
              <Button variant={settingsAttachment?.is_restricted ? "destructive" : "outline"} size="sm"
                onClick={() => setSettingsAttachment({ ...settingsAttachment, is_restricted: !settingsAttachment?.is_restricted })}>
                {settingsAttachment?.is_restricted ? <><Lock className="w-4 h-4 ml-1" />مقيد</> : <><Unlock className="w-4 h-4 ml-1" />عام</>}
              </Button>
            </div>
            {settingsAttachment?.is_restricted && allowedViewerUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">المستخدمون المسموح لهم</p>
                <div className="max-h-52 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {allowedViewerUsers.map(({ user, roles }) => {
                    const emails = settingsAttachment?.allowed_viewer_emails || [];
                    const checked = emails.includes(user.email);
                    return (
                      <label key={user.email} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" checked={checked} className="rounded"
                          onChange={(e) => {
                            const cur = settingsAttachment?.allowed_viewer_emails || [];
                            setSettingsAttachment({ ...settingsAttachment, allowed_viewer_emails: e.target.checked ? [...cur, user.email] : cur.filter(em => em !== user.email) });
                          }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.display_name || user.full_name || user.email}</p>
                          <p className="text-xs text-gray-500 truncate">{Array.isArray(roles) ? roles.join(' • ') : roles}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleUpdateRestriction(settingsAttachment.index, {
                is_restricted: settingsAttachment.is_restricted,
                allowed_viewer_emails: settingsAttachment.allowed_viewer_emails || [],
                allowed_permission_group_ids: settingsAttachment.allowed_permission_group_ids || []
              })} className="flex-1">حفظ</Button>
              <Button variant="outline" onClick={() => setSettingsAttachment(null)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة سجل المشاهدات */}
      <Dialog open={!!historyAttachment} onOpenChange={() => setHistoryAttachment(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">سجل مشاهدات المرفق</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">{historyAttachment?.name}</p>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : viewHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>لا توجد مشاهدات مسجلة</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {viewHistory.map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-medium text-sm">{(record.viewer_name || record.viewer_email || '؟').charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.viewer_name || record.viewer_email}</p>
                      <p className="text-xs text-gray-500">{record.action_type === 'viewed' ? 'عرض' : record.action_type === 'downloaded' ? 'تنزيل' : 'تكبير'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{formatDateTime(record.view_timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}