import React from 'react';
import { Phone, MessageCircle, Clock, MapPin, ExternalLink, Share2, HeartPulse, Stethoscope, ChevronLeft } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const ContactSection: React.FC = () => {
  const { data } = useContent();
  const { clinic, doctor, social } = data;

  const socialChannels = [
    {
      name: 'Facebook',
      nameAr: 'فيسبوك',
      url: social.facebook,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
      badge: 'الصفحة الرسمية',
    },
    {
      name: 'Instagram',
      nameAr: 'إنستغرام',
      url: social.instagram,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      bg: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white',
      badge: 'محتوى توعوي',
    },
    {
      name: 'TikTok',
      nameAr: 'تيك توك',
      url: social.tiktok,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      bg: 'hover:bg-black hover:text-white hover:border-black',
      badge: 'فيديوهات طبية',
    },
  ];

  return (
    <section id="contact" className="py-16 lg:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-cyan-light text-brand-royal text-xs font-semibold">
            <Phone className="w-3.5 h-3.5 text-brand-medical" />
            <span>قنوات الاتصال المباشرة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            تواصل مع عيادة الدكتور محمد السيد العطار
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            فريق العيادة جاهز للرد على استفساراتكم وترتيب حضوركم ومتابعة حالاتكم الصحية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Direct Call Card */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-gradient-to-br from-brand-royal via-brand-royal-light to-brand-medical text-white rounded-3xl p-6 sm:p-8 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6 text-right">
                <div>
                  <span className="inline-block text-xs font-semibold text-brand-cyan bg-white/10 px-3 py-1 rounded-full mb-3">
                    متاح خلال مواعيد العمل الرسمية
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">
                    الاتصال الهاتفي المباشر بالعيادة
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-md">
                    يمكنكم الاتصال مباشرة لترتيب موعد الكشف، الاستفسار عن التحاليل، أو متابعة الحالات الحرجة.
                  </p>
                </div>

                {/* Primary Call Box - Clinic */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-white/70">رقم العيادة الأساسي</span>
                    <span className="block text-xl sm:text-2xl font-black tracking-wide" dir="ltr">
                      {clinic.phoneClinic}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${clinic.phoneClinic}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-brand-lime text-brand-royal font-bold px-5 py-2.5 rounded-xl hover:brightness-105 active:scale-95 transition-all text-sm shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال الآن</span>
                    </a>

                    <a
                      href={social.whatsappClinic}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold p-2.5 sm:px-4 sm:py-2.5 rounded-xl hover:bg-emerald-600 transition-all text-sm shadow-md"
                      title="مراسلة عبر واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Secondary Call Box - Doctor direct */}
                <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-white/70">هاتف الدكتور محمد السيد العطار</span>
                    <span className="block text-lg sm:text-xl font-bold tracking-wide" dir="ltr">
                      {clinic.phoneDoctor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${clinic.phoneDoctor}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white text-brand-royal font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition-all text-xs sm:text-sm shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-medical" />
                      <span>اتصال بالطبيب</span>
                    </a>

                    <a
                      href={social.whatsappDoctor}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500/90 text-white font-bold p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs sm:text-sm"
                      title="مراسلة الطبيب عبر واتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Working hours reminder */}
                <div className="pt-2 flex items-center gap-3 text-xs text-white/90">
                  <Clock className="w-4 h-4 text-brand-lime shrink-0" />
                  <span>
                    السبت – الخميس: 1:00 م حتى 9:00 م | الجمعة: 4:00 م حتى 10:00 م
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Social Channels and Clinic Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Social Media Links Card */}
            <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border/70 space-y-4 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-medical bg-white px-3 py-1 rounded-full border border-brand-border">
                  تواصل تفاعلي
                </span>
                <h4 className="text-base font-bold text-brand-dark flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-brand-royal" />
                  <span>الصفحات الطبية الرسمية</span>
                </h4>
              </div>

              <p className="text-xs text-brand-muted">
                تابع الدكتور محمد السيد العطار للاطلاع على النصائح الطبية والتوعية الصحية بأمراض الباطنة والوقاية:
              </p>

              <div className="space-y-3 pt-1">
                {socialChannels.map((item) => (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3.5 bg-white rounded-2xl border border-brand-border transition-all duration-200 group ${item.bg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-dark group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-brand-dark group-hover:text-inherit">
                          {item.nameAr}
                        </span>
                        <span className="block text-[11px] text-brand-muted group-hover:text-inherit/80">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* In-Person Visit Reminder */}
            <div className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-soft text-right space-y-2">
              <h5 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-cyan" />
                <span>الزيارة المباشرة للعيادة:</span>
              </h5>
              <p className="text-xs text-brand-muted leading-relaxed">
                لا يتطلب الكشف حجزا مسبقا إلزامياً؛ نرحب بزيارتكم مباشرة في كوبري واحد الصالحية، أمام موقف السيارات، بحر البقر، مركز الحسينية.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
