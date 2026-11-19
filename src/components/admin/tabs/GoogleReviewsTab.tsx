import React, { useState, useRef } from 'react';
import {
  Save,
  Check,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  MessageCircle,
  Share2,
  Heart,
  Star,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Key,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { OFFICIAL_MAPS_LINK } from '../../../lib/googlePlaces';
import type { SocialReviewImage } from '../../../types';

export const GoogleReviewsTab: React.FC = () => {
  const {
    data,
    updateSocialReviewImages,
    addSocialReviewImage,
    deleteSocialReviewImage,
    updateGoogleApiSettings,
  } = useContent();

  const { socialReviewImages, googlePlacesApiKey, googlePlaceId } = data;

  // Add Form State
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [platform, setPlatform] = useState<SocialReviewImage['platform']>('whatsapp');
  const [date, setDate] = useState('');
  const [caption, setCaption] = useState('');
  const [addNotice, setAddNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google API Settings Form State
  const [apiKey, setApiKey] = useState(googlePlacesApiKey || '');
  const [placeId, setPlaceId] = useState(googlePlaceId || '');
  const [googleNotice, setGoogleNotice] = useState(false);

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Handle local file upload (converts to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 4 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('يرجى اختيار صورة أو إدخال رابط الصورة أولاً');
      return;
    }

    addSocialReviewImage({
      imageUrl,
      title: title.trim() || undefined,
      patientName: patientName.trim() || undefined,
      platform,
      date: date.trim() || undefined,
      caption: caption.trim() || undefined,
    });

    // Reset Form
    setImageUrl('');
    setTitle('');
    setPatientName('');
    setDate('');
    setCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setAddNotice(true);
    setTimeout(() => setAddNotice(false), 3000);
  };

  // Move review up / down in order
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const currentList = [...(socialReviewImages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    updateSocialReviewImages(currentList);
  };

  const handleSaveGoogleApi = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoogleApiSettings(apiKey, placeId);
    setGoogleNotice(true);
    setTimeout(() => setGoogleNotice(false), 3000);
  };

  const getPlatformLabel = (p: string) => {
    switch (p) {
      case 'whatsapp':
        return { label: 'واتساب', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'facebook':
        return { label: 'فيسبوك', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'instagram':
        return { label: 'إنستغرام', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
      case 'google':
        return { label: 'خرائط Google', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'تقييم عام', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="space-y-8 text-right max-w-4xl">
      
      {/* Tab Header */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-cyan" />
          <span>إدارة آراء المرضى وصور محادثات التواصل الاجتماعي</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          إضافة صور ومحادثات الواتساب وتوصيات فيسبوك وإنستغرام لتظهر في شريط متحرك تلقائياً للزوار بالموقع الرئيسي
        </p>
      </div>

      {/* Image Size Guidance Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-royal/20 via-slate-800 to-brand-cyan/10 border border-brand-cyan/30 text-xs space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <Sparkles className="w-4 h-4 text-brand-cyan" />
          <span>دليل المقاس المثالي لصور الآراء لتظهر دائماً مرتبة وبأعلى جودة:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <p className="font-bold text-emerald-400">📱 صور سكرين شوت الموبايل (واتساب وإنستغرام):</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • النسبة: <strong className="text-white">9:16</strong> (أبعاد شاشات الهواتف الطبيعية).<br />
              • الدقة المثالية: <strong className="text-white">1080 × 1920 بكسل</strong> (أو سكرين شوت الموبايل العادي).<br />
              • نصيحة: قص شريط البطارية والإشعارات وشريط التنقل السفلي لتبدو المحادثة نقية كالمحترفين.
            </p>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <p className="font-bold text-blue-400">🖼️ منشورات وتوصيات فيسبوك المربعة:</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • النسبة: <strong className="text-white">1:1</strong> (مربع) أو <strong className="text-white">4:5</strong>.<br />
              • الدقة المثالية: <strong className="text-white">1080 × 1080 بكسل</strong>.<br />
              • الموقع يحافظ تلقائياً على أبعاد الصورة الأصلية بدون أي قص أو مط في منتصف الشاشة.
            </p>
          </div>
        </div>
      </div>

      {addNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>تمت إضافة الصورة بنجاح إلى شريط آراء وسائل التواصل وحفظها سحابياً.</span>
        </div>
      )}

      {/* SECTION 1: Add New Review Image Form */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-cyan" />
            <span>إضافة رأي أو محادثة جديدة</span>
          </h4>

          {/* Toggle between File Upload and URL */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeMode === 'upload'
                  ? 'bg-brand-royal text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>رفع من الجهاز</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeMode === 'url'
                  ? 'bg-brand-royal text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>رابط مباشر</span>
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleAddReview} className="space-y-4">
          
          {/* Image Input */}
          {activeMode === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اختر صورة السكرين شوت من جهازك (واتساب / فيسبوك / إنستغرام)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="review-image-upload"
                />
                <label
                  htmlFor="review-image-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all border border-slate-600"
                >
                  <Upload className="w-4 h-4 text-brand-cyan" />
                  <span>تصفح واختيار صورة...</span>
                </label>

                {imageUrl && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم تحديد الصورة بنجاح</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رابط الصورة المباشر (Image URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/screenshot.jpg"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>
          )}

          {/* Image Thumbnail Preview */}
          {imageUrl && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center gap-4">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-20 h-24 object-cover rounded-lg border border-slate-700"
              />
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">معاينة الصورة المحددة</p>
                <p className="text-slate-400">ستظهر هذه الصورة في شريط الآراء للزوار</p>
                <button
                  type="button"
                  onClick={() => setPreviewImage(imageUrl)}
                  className="text-brand-cyan hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>تكبير الصورة</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان أو وصف مختصر للرأي (اختياري)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اختياري (يمكنك تركه فارغاً)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المنصة (Platform)
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialReviewImage['platform'])}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-brand-cyan"
              >
                <option value="whatsapp">محادثة واتساب (WhatsApp)</option>
                <option value="facebook">توصية فيسبوك (Facebook)</option>
                <option value="instagram">رسائل إنستغرام (Instagram)</option>
                <option value="google">خرائط Google</option>
                <option value="other">منصة أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المريض أو المرافق (اختياري)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="مثال: أ / أحمد عبد الله (مرافق مريض)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تاريخ أو توقيت التقييم (اختياري)
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="مثال: منذ يومين / الأسبوع الماضي"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              مقتطف أو ملاحظة من الرسالة (اختياري)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="مثال: الحمد لله حالته مستقرة جداً وبقى يتنفس طبيعي"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-cyan"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة الصورة إلى شريط الآراء الآن</span>
            </button>
          </div>

        </form>
      </div>

      {/* SECTION 2: List of Current Review Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-lime" />
            <span>الصور الحالية المعروضة في شريط الموقع ({socialReviewImages?.length || 0})</span>
          </h4>
          <span className="text-xs text-slate-400">تتحرك تلقائياً وتنزلق بسلاسة للزوار</span>
        </div>

        {socialReviewImages && socialReviewImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {socialReviewImages.map((item, idx) => {
              const badge = getPlatformLabel(item.platform || 'other');
              return (
                <div
                  key={item.id || idx}
                  className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 flex gap-4 items-start justify-between"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => setPreviewImage(item.imageUrl)}
                    className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 cursor-pointer group"
                    title="انقر للتكبير"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {item.date && (
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-white truncate">
                      {item.title}
                    </h5>

                    {item.patientName && (
                      <p className="text-[11px] text-brand-cyan truncate">
                        {item.patientName}
                      </p>
                    )}

                    {item.caption && (
                      <p className="text-[11px] text-slate-400 truncate">
                        "{item.caption}"
                      </p>
                    )}
                  </div>

                  {/* Actions (Move & Delete) */}
                  <div className="flex flex-col gap-1 items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === socialReviewImages.length - 1}
                      className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف صورة "${item.title}"؟`)) {
                          deleteSocialReviewImage(item.id);
                        }
                      }}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors mt-1"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            لا توجد صور تقييمات حالياً. أضف أول صورة باستخدام النموذج أعلاه.
          </div>
        )}
      </div>

      {/* SECTION 3: Google Places API Integration (Preserved Settings) */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>إعدادات متقدمة: ربط Google Places API الرسمي</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              اختياري: لجلب أحدث التقييمات التلقائية المكتوبة على Google Maps بالإضافة لصور وسائل التواصل
            </p>
          </div>

          <a
            href={OFFICIAL_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-cyan hover:underline flex items-center gap-1"
          >
            <span>رابط صفحة Google</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {googleNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>تم حفظ إعدادات Google API بنجاح.</span>
          </div>
        )}

        <form onSubmit={handleSaveGoogleApi} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Google Places API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Google Place ID
              </label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="ChIJ..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-brand-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ مفاتيح Google API</span>
          </button>
        </form>
      </div>

      {/* Lightbox / Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-slate-900 rounded-2xl p-2 border border-slate-700 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
