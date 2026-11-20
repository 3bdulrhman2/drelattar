import React, { useState } from 'react';
import { Send, X, Bell, Sparkles, CheckCircle2, Megaphone } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastNotificationModal: React.FC<BroadcastNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { publishBroadcastNotification } = useContent();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'alert' | 'special_offer'>('info');
  const [pinToBanner, setPinToBanner] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [successSent, setSuccessSent] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('يرجى كتابة عنوان الإشعار ومحتواه أولاً');
      return;
    }

    setIsSending(true);
    try {
      const ok = await publishBroadcastNotification(
        title.trim(),
        message.trim(),
        type,
        pinToBanner
      );

      if (ok) {
        setSuccessSent(true);
        setTimeout(() => {
          setSuccessSent(false);
          setTitle('');
          setMessage('');
          onClose();
        }, 1800);
      } else {
        alert('حدث خطأ أثناء نشر الإشعار، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-brand-royal/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-royal/30 border border-brand-cyan/40 text-brand-cyan flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>إرسال ونشر إشعار لجميع المستخدمين</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  فوري
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يصل لجميع زوار الموقع، أجهزة الأندرويد، وشاشات المتصفح النشطة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successSent ? (
          <div className="py-10 text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">تم نشر الإشعار بنجاح! 🔔</h4>
            <p className="text-xs text-slate-300">
              تم بث الإشعار لحظياً لجميع الأجهزة والزوار وتحديث الشريط العلوي للموقع.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عنوان الإشعار الرئيسي <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تنويه هام بخصوص مواعيد العيادة / عرض الفحص الشامل"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-hidden focus:border-brand-cyan transition-colors"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نوع وطابع التنبيه
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-hidden focus:border-brand-cyan transition-colors"
              >
                <option value="info">إشعار إخباري عام (أزرق ملكي)</option>
                <option value="warning">تنبيه متوسط أو تغيير مواعيد (أصفر / كهرماني)</option>
                <option value="alert">تنبيه عاجل أو إغلاق طارئ (أحمر)</option>
                <option value="special_offer">عرض طبي خاص (أخضر زمردي)</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نص ورسالة الإشعار <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="اكتب تفاصيل التنبيه أو الإعلان الذي سيظهر لجميع الزوار فوراً..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-hidden focus:border-brand-cyan transition-colors resize-none"
                required
              />
            </div>

            {/* Pin to Top Banner Option */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  تثبيت الإشعار في الشريط العلوي للموقع
                </span>
                <span className="text-[11px] text-slate-400 block">
                  يظهر كشريط إعلان بارز أعلى الموقع لجميع الزوار فور دخولهم
                </span>
              </div>
              <input
                type="checkbox"
                checked={pinToBanner}
                onChange={(e) => setPinToBanner(e.target.checked)}
                className="w-4 h-4 accent-brand-cyan rounded cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-brand-royal via-brand-medical to-brand-cyan hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-royal/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'جاري النشر والبث...' : 'نشر الإشعار الآن لجميع المستخدمين 🚀'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
