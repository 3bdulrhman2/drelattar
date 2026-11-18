import React from 'react';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const QuickCallFloating: React.FC = () => {
  const { data } = useContent();
  const { clinic, social } = data;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-brand-border/80 p-2.5 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Direct Call Button */}
        <a
          href={`tel:${clinic.phoneClinic}`}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-royal text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4 text-brand-lime" />
          <span>اتصال بالعيادة</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={social.whatsappClinic}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>واتساب</span>
        </a>

        {/* Location Button */}
        <a
          href={clinic.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="الموقع على الخريطة"
          className="p-2.5 bg-slate-100 text-brand-royal rounded-xl border border-slate-200 active:scale-95 transition-all"
        >
          <MapPin className="w-4 h-4 text-brand-medical" />
        </a>
      </div>
    </div>
  );
};
