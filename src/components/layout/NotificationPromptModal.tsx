import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, Sparkles } from 'lucide-react';
import {
  requestWebNotificationPermission,
  triggerLocalNotification,
  registerWebPushServiceWorker,
} from '../../lib/pushNotifications';

const PROMPT_DISMISSED_KEY = 'drelattar_notification_prompt_dismissed_until';

export const NotificationPromptModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  useEffect(() => {
    // Only check in browser
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // If permission already granted or denied permanently, do not show
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    // Check if user dismissed recently
    try {
      const dismissedUntil = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }
    } catch {
      // Ignore storage error
    }

    // Show after a gentle 1.8s delay upon entering the site
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      // Dismiss for 7 days
      const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(PROMPT_DISMISSED_KEY, sevenDays.toString());
    } catch {
      // Ignore storage error
    }
  };

  const handleEnable = async () => {
    setIsActivating(true);
    try {
      const permission = await requestWebNotificationPermission();
      if (permission === 'granted') {
        setActivatedSuccess(true);
        registerWebPushServiceWorker();
        triggerLocalNotification({
          title: 'مرحباً بك! تم تفعيل الإشعارات بنجاح 🔔',
          body: 'ستصلك تنبيهات فورية بمواعيد وتأكيدات الحجوزات وأحدث التنويهات من عيادة د. محمد السيد العطار.',
          type: 'announcement',
        });
        setTimeout(() => {
          setIsVisible(false);
        }, 2200);
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      setIsVisible(false);
    } finally {
      setIsActivating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slideUp"
    >
      <div className="bg-slate-900/95 text-slate-100 rounded-3xl p-5 shadow-2xl border border-brand-royal/40 backdrop-blur-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-royal/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3.5 left-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {activatedSuccess ? (
          <div className="text-center py-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-white">تم تفعيل التنبيهات بنجاح!</h4>
            <p className="text-xs text-slate-300">شكراً لك، ستصلك التنبيهات والتحديثات الطبية فوراً.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-royal/30 border border-brand-cyan/40 text-brand-cyan flex items-center justify-center shrink-0 shadow-inner">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    تفعيل إشعارات وتنبيهات العيادة
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                    <Sparkles className="w-2.5 h-2.5" /> فوري
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  احصل على تنبيهات فورية ومباشرة بمواعيد حجزك، وإعلانات العيادة والعروض الطبية المعتمدة من د. محمد السيد العطار.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleEnable}
                disabled={isActivating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-royal to-brand-medical text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isActivating ? 'جاري التفعيل...' : 'تفعيل الإشعارات الآن 🔔'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
