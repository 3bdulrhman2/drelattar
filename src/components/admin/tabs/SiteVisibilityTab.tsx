import React, { useState } from 'react';
import { Save, Check, Eye, EyeOff, AlertTriangle, RotateCcw, Bell } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';

export const SiteVisibilityTab: React.FC = () => {
  const { data, updateVisibility, resetToDefault } = useContent();
  const { visibility } = data;

  const [form, setForm] = useState({
    showReviewsSection: visibility.showReviewsSection,
    showEquipmentSection: visibility.showEquipmentSection,
    showFAQSection: visibility.showFAQSection,
    emergencyNoticeActive: visibility.emergencyNoticeActive,
    emergencyNoticeText: visibility.emergencyNoticeText,
    maintenanceMode: visibility.maintenanceMode,
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateVisibility(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleFactoryReset = () => {
    resetToDefault();
    setResetConfirm(false);
    window.location.reload();
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">إعدادات رؤية ومحتوى الموقع العام</h3>
          <p className="text-xs text-slate-400">إظهار أو إخفاء أقسام معينة، والتنبيهات العاجلة</p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ إعدادات الرؤية بنجاح.</span>
        </div>
      )}

      {/* Toggles List */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 space-y-4">
        
        {/* Reviews Section Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40">
          <div>
            <span className="block text-xs font-bold text-white">إظهار قسم آراء المرضى وتقييمات Google</span>
            <span className="block text-[11px] text-slate-400">التحكم في ظهور أو إخفاء مراجعات خرائط Google في الصفحة الرئيسية</span>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, showReviewsSection: !form.showReviewsSection })}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.showReviewsSection ? 'bg-brand-cyan' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${form.showReviewsSection ? 'right-1' : 'right-7'}`} />
          </button>
        </div>

        {/* Equipment Section Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40">
          <div>
            <span className="block text-xs font-bold text-white">إظهار قسم التجهيزات والتقنيات الطبية</span>
            <span className="block text-[11px] text-slate-400">عرض أجهزة الضغط، الأكسجين، السونار، وتخطيط رسم القلب ECG</span>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, showEquipmentSection: !form.showEquipmentSection })}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.showEquipmentSection ? 'bg-brand-cyan' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${form.showEquipmentSection ? 'right-1' : 'right-7'}`} />
          </button>
        </div>

        {/* FAQ Section Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40">
          <div>
            <span className="block text-xs font-bold text-white">إظهار قسم الأسئلة الشائعة (FAQ)</span>
            <span className="block text-[11px] text-slate-400">عرض الإجابات التفصيلية عن مواعيد وتخصصات وأجهزة العيادة</span>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, showFAQSection: !form.showFAQSection })}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.showFAQSection ? 'bg-brand-cyan' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${form.showFAQSection ? 'right-1' : 'right-7'}`} />
          </button>
        </div>

        {/* Emergency Announcement Banner Toggle */}
        <div className="pt-2 border-t border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>شريط إعلان وتنبيه عاجل في أعلى الموقع</span>
              </span>
              <span className="block text-[11px] text-slate-400">إشعار المرضى بمواعيد الأعياد أو إجازات الطبيب أو أي تنبيه هام</span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, emergencyNoticeActive: !form.emergencyNoticeActive })}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.emergencyNoticeActive ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${form.emergencyNoticeActive ? 'right-1' : 'right-7'}`} />
            </button>
          </div>

          {form.emergencyNoticeActive && (
            <div>
              <input
                type="text"
                value={form.emergencyNoticeText}
                onChange={(e) => setForm({ ...form, emergencyNoticeText: e.target.value })}
                placeholder="مثال: تنويه: تعمل العيادة بكامل طاقتها خلال إجازة عيد الفطر المبارك من الساعة 2 ظهراً"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>إعادة ضبط البيانات إلى الأصل الافتراضي المعتمد</span>
            </h4>
            <p className="text-[11px] text-slate-400">استعادة البيانات والمعلومات الموثقة الأصلية للدكتور والعيادة</p>
          </div>

          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFactoryReset}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                تأكيد الاستعادة
              </button>
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs"
              >
                تراجع
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetConfirm(true)}
              className="px-3 py-1.5 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة الضبط</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
