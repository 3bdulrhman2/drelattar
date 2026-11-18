import React, { useState } from 'react';
import { Save, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { MedicalEquipment } from '../../../types';

export const EquipmentTab: React.FC = () => {
  const { data, updateEquipment } = useContent();
  const [equipmentList, setEquipmentList] = useState<MedicalEquipment[]>([...data.equipment]);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    updateEquipment(equipmentList);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleUpdate = (id: string, updates: Partial<MedicalEquipment>) => {
    setEquipmentList(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <div className="space-y-6 text-right max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">إدارة الأجهزة والتجهيزات الطبية</h3>
          <p className="text-xs text-slate-400">تعديل مواصفات وأهمية الأجهزة التشخيصية المعتمدة</p>
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
          <span>تم حفظ تحديثات الأجهزة الطبية بنجاح.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipmentList.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 space-y-3"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">اسم الجهاز</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdate(item.id, { name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">الوصف والوظيفة</label>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => handleUpdate(item.id, { description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">الأهمية الإكلينيكية</label>
              <input
                type="text"
                value={item.importance}
                onChange={(e) => handleUpdate(item.id, { importance: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-cyan"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
