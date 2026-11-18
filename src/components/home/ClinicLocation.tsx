import React from 'react';
import { MapPin, Navigation, ExternalLink, Phone, Clock, Landmark, Compass } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const ClinicLocation: React.FC = () => {
  const { data } = useContent();
  const { clinic } = data;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    'عيادة الدكتور محمد السيد العطار كوبري واحد الصالحية بحر البقر الحسينية الشرقية'
  )}`;

  return (
    <section id="location" className="py-16 lg:py-24 bg-brand-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-royal/10 text-brand-royal text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-brand-medical" />
            <span>المقر والموقع الجغرافي</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            موقع عيادة الدكتور محمد السيد العطار
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            سهولة الوصول وموقع متميز أمام موقف السيارات عند كوبري واحد الصالحية، بحر البقر، مركز الحسينية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Location Information Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-brand-border/70 flex flex-col justify-between space-y-6">
            
            <div className="space-y-6 text-right">
              
              {/* Address detail */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-royal font-bold text-sm">
                  <Landmark className="w-4 h-4 text-brand-cyan" />
                  <span>العنوان التفصيلي:</span>
                </div>
                <p className="text-base font-bold text-brand-dark leading-relaxed pr-6 border-r-2 border-brand-royal">
                  {clinic.address}
                </p>
                <p className="text-xs text-brand-muted pr-6">
                  علامة مميزة: {clinic.landmark} (فرع واحد مجهز).
                </p>
              </div>

              {/* Working Hours */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-brand-royal font-bold text-sm">
                  <Clock className="w-4 h-4 text-brand-lime-dark" />
                  <span>مواعيد العمل الرسمية:</span>
                </div>
                <div className="bg-brand-bg rounded-xl p-3.5 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-dark">السبت إلى الخميس:</span>
                    <span className="text-brand-royal font-bold">1:00 م – 9:00 م</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="font-semibold text-brand-dark">يوم الجمعة:</span>
                    <span className="text-brand-medical font-bold">4:00 م – 10:00 م</span>
                  </div>
                </div>
              </div>

              {/* Both Phone numbers */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-brand-royal font-bold text-sm">
                  <Phone className="w-4 h-4 text-brand-medical" />
                  <span>أرقام التواصل المباشرة:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href={`tel:${clinic.phoneClinic}`}
                    className="p-3 rounded-xl bg-brand-cyan-light/60 border border-brand-cyan/30 text-right hover:bg-brand-cyan-light transition-colors"
                  >
                    <span className="block text-[11px] text-brand-muted">هاتف العيادة والحجز</span>
                    <span className="block text-sm font-bold text-brand-royal" dir="ltr">
                      {clinic.phoneClinic}
                    </span>
                  </a>

                  <a
                    href={`tel:${clinic.phoneDoctor}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right hover:bg-slate-100 transition-colors"
                  >
                    <span className="block text-[11px] text-brand-muted">هاتف الدكتور المباشر</span>
                    <span className="block text-sm font-bold text-brand-dark" dir="ltr">
                      {clinic.phoneDoctor}
                    </span>
                  </a>
                </div>
              </div>

            </div>

            {/* Google Maps Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <a
                href={clinic.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-royal text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-brand-medical shadow-soft transition-all"
              >
                <span>فتح في خرائط Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-brand-royal border-2 border-brand-royal/20 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm hover:border-brand-royal hover:bg-slate-50 transition-all"
              >
                <span>الاتجاهات إلى العيادة</span>
                <Navigation className="w-4 h-4 text-brand-medical" />
              </a>
            </div>

          </div>

          {/* Interactive Map Embed */}
          <div className="lg:col-span-7 bg-white rounded-3xl overflow-hidden shadow-soft border border-brand-border/70 flex flex-col min-h-[360px] lg:min-h-full">
            <div className="relative w-full h-full min-h-[380px] bg-slate-100">
              <iframe
                title="موقع عيادة الدكتور محمد السيد العطار"
                src={clinic.googleMapsEmbedUrl || "https://maps.google.com/maps?q=30.8542,31.9547&hl=ar&z=14&output=embed"}
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Map floating overlay tag */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-brand-border text-right text-xs">
                <p className="font-bold text-brand-royal flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                  {clinic.name}
                </p>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  {clinic.landmark}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
