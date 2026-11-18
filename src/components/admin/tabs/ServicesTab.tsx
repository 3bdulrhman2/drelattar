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
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleUpdateItem = (id: string, updates: Partial<MedicalService>) => {
    setServicesList(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <div className="space-y-6 text-right max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">إدارة الخدمات الطبية ({servicesList.length})</h3>
          <p className="text-xs text-slate-400">تعديل نصوص وتفاصيل الخدمات المعروضة للمرضى</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-brand-royal hover:bg-brand-medical text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
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
              className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{service.title}</h4>
                    <span className="text-[11px] text-brand-cyan">تصنيف: {service.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : service.id)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'إغلاق' : 'تعديل الوصف'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">عنوان الخدمة</label>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => handleUpdateItem(service.id, { title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">الوصف التوضيحي للمريض</label>
                    <textarea
                      rows={2}
                      value={service.description}
                      onChange={(e) => handleUpdateItem(service.id, { description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
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
