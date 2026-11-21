import React, { useState } from 'react';
import { Save, Check, Plus, Trash2, HeartPulse, Edit2 } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { MedicalService } from '../../../types';

export const ServicesTab: React.FC = () => {
  const { data, updateServices } = useContent();
  const [servicesList, setServicesList] = useState<MedicalService[]>([...data.services]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    updateServices(servicesList);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleUpdateItem = (id: string, updates: Partial<MedicalService>) => {
    setServicesList(prev => {
      const next = prev.map(item => (item.id === id ? { ...item, ...updates } : item));
      updateServices(next);
      return next;
    });
  };

  return (
    <div className="space-y-6 text-right max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>إدارة الخدمات الطبية ({servicesList.length})</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              يُحفظ تلقائياً ✓
            </span>
          </h3>
          <p className="text-xs text-slate-400">تعديل نصوص وتفاصيل الخدمات المعروضة للمرضى</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>تأكيد الحفظ ✓</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم حفظ تحديثات الخدمات الطبية بنجاح.</span>
        </div>
      )}

      <div className="space-y-3">
        {servicesList.map((service, index) => {
          const isEditing = editingId === service.id;
          return (
            <div
              key={service.id}
              className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-royal/20 text-brand-cyan flex items-center justify-center text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) => handleUpdateItem(service.id, { title: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-brand-cyan w-64 sm:w-80"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : service.id)}
                  className="text-xs text-slate-400 hover:text-brand-cyan flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'إغلاق التفاصيل' : 'تعديل الوصف'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                  <label className="block text-[11px] text-slate-400 mb-1">وصف الخدمة الطبي الموجه للمريض</label>
                  <textarea
                    rows={2}
                    value={service.description}
                    onChange={(e) => handleUpdateItem(service.id, { description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed pr-10">
                  {service.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
