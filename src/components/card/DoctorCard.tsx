import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Globe,
  UserPlus,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const DoctorCard: React.FC = () => {
  const { data } = useContent();
  const { doctor, clinic, social } = data;

  const [copiedVoda, setCopiedVoda] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const instapayUrl = 'https://ipn.eg/S/elattar94/instapay/3gRexf';
  const vodafoneCashUrl = 'https://vf.eg/vfcash?id=mt&qrId=QYBgiQ';
  const vodafoneCashNumber = '01007347945';

  const copyVodafoneCash = () => {
    navigator.clipboard.writeText(vodafoneCashNumber);
    setCopiedVoda(true);
    setTimeout(() => setCopiedVoda(false), 2500);
  };

  const copyCardLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${doctor.nameAr} - كارت التواصل وطرق الدفع`,
          text: `كارت التواصل المباشر وطرق الدفع (إنستاباي وفودافون كاش) لعيادة ${doctor.nameAr}`,
          url: window.location.href,
        });
      } catch (err) {
        copyCardLink();
      }
    } else {
      copyCardLink();
    }
  };

  const downloadVCard = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:${doctor.nameAr}
N;CHARSET=UTF-8:العطار;محمد;السيد;;د.
TITLE;CHARSET=UTF-8:${doctor.title}
ORG;CHARSET=UTF-8:${clinic.name}
TEL;TYPE=WORK,VOICE:+201060918977
TEL;TYPE=CELL,VOICE:+201007347945
ADR;TYPE=WORK;CHARSET=UTF-8:;;${clinic.address};الحسينية;الشرقية;;مصر
URL:${window.location.origin}
NOTE;CHARSET=UTF-8:فودافون كاش: 01007347945 | إنستاباي: elattar94@instapay
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Dr-Mohammed-Elattar.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const socialLinks = [
    {
      name: 'Facebook',
      nameAr: 'فيسبوك (الصفحة الرسمية)',
      desc: 'متابعة المقالات والتوعية الطبية',
      url: social.facebook,
      color: 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600 hover:text-white',
      badge: 'متابعة',
      icon: (
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      nameAr: 'إنستغرام (Instagram)',
      desc: 'فيديوهات تثقيفية واستشارات',
      url: social.instagram,
      color: 'bg-pink-600/20 text-pink-400 border-pink-500/30 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white',
      badge: '@muhammed.elattar',
      icon: (
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      nameAr: 'تيك توك (TikTok)',
      desc: 'فيديوهات طبية وتوعية سريعة',
      url: social.tiktok,
      color: 'bg-slate-700/40 text-slate-200 border-slate-600 hover:bg-black hover:text-white',
      badge: '@dr.mohammed.elattar',
      icon: (
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 py-10 relative overflow-hidden" dir="rtl">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-brand-royal/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-7 relative z-10 space-y-6">
        
        {/* Top Actions: Save Contact & Share */}
        <div className="flex items-center justify-between text-xs pb-1">
          <button
            onClick={downloadVCard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-lime" />
            <span>حفظ جهة الاتصال</span>
          </button>

          <button
            onClick={shareCard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-royal/50 hover:bg-brand-royal text-brand-cyan font-semibold transition-colors border border-brand-cyan/30 shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم نسخ الرابط' : 'مشاركة الكارت'}</span>
          </button>
        </div>

        {/* Doctor Identity Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-brand-cyan/50 shadow-xl mx-auto bg-slate-800">
              <img
                src="/brand/dr-elattar-medical.jpg"
                alt={doctor.nameAr}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-md" title="متاح">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {doctor.nameAr}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-brand-cyan mt-1">
              {doctor.title}
            </p>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] mt-1.5">
              <MapPin className="w-3 h-3 text-brand-lime" />
              <span>كوبري واحد الصالحية – مركز الحسينية</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Quick Payment Methods (Official InstaPay & Vodafone Cash Logos) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-cyan" />
              <span>طرق الدفع والتحويل السريع (كشف / استشارة)</span>
            </span>
            <span className="text-[10px] text-brand-lime font-mono">INSTANT PAY</span>
          </div>

          {/* 1. InstaPay Button with Official Logo */}
          <a
            href={instapayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 border border-purple-500/40 text-white hover:brightness-110 active:scale-98 transition-all shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/brand/instapay-logo.png"
                  alt="InstaPay إنستاباي"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold leading-tight">الدفع عبر تطبيق إنستاباي (InstaPay)</span>
                <span className="block text-[11px] text-purple-200 mt-0.5">تحويل مباشر ولحظي لحساب الطبيب</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-purple-200 group-hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>

          {/* 2. Vodafone Cash Button with Official Logo & Direct Link */}
          <a
            href={vodafoneCashUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border border-red-500/40 text-white hover:brightness-110 active:scale-98 transition-all shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/brand/vodafone-cash-logo.png"
                  alt="فودافون كاش Vodafone Cash"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold leading-tight">الدفع عبر فودافون كاش (Vodafone Cash)</span>
                <span className="block text-[11px] text-red-200 mt-0.5 font-mono" dir="ltr">
                  {vodafoneCashNumber}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-red-200 group-hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* SECTION 2: Direct WhatsApp Chats */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>محادثات الواتساب المباشرة</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={social.whatsappClinic}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>واتساب العيادة</span>
            </a>

            <a
              href={social.whatsappDoctor}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>واتساب الطبيب</span>
            </a>
          </div>
        </div>

        {/* SECTION 3: Direct Phone Calls */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-brand-lime" />
            <span>الاتصال الهاتفي المباشر</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${clinic.phoneClinic}`}
              className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-brand-royal transition-all text-right group"
            >
              <span className="block text-[10px] text-slate-400">هاتف العيادة</span>
              <span className="block text-xs font-bold text-brand-cyan font-mono" dir="ltr">
                {clinic.phoneClinic}
              </span>
            </a>

            <a
              href={`tel:${clinic.phoneDoctor}`}
              className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-brand-royal transition-all text-right group"
            >
              <span className="block text-[10px] text-slate-400">هاتف الطبيب</span>
              <span className="block text-xs font-bold text-white font-mono" dir="ltr">
                {clinic.phoneDoctor}
              </span>
            </a>
          </div>
        </div>

        {/* SECTION 4: Social Media Official Channels */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 px-1 flex items-center justify-between">
            <span>منصات التواصل الاجتماعي الرسمية</span>
            <span className="text-[10px] text-brand-cyan">توعية طبية</span>
          </div>

          <div className="space-y-2">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${item.color}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div className="text-right">
                    <span className="block text-xs font-bold">{item.nameAr}</span>
                    <span className="block text-[10px] opacity-80">{item.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="opacity-70 group-hover:opacity-100">{item.badge}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>

          {/* Google Maps Location */}
          <a
            href={clinic.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-cyan" />
              <span>موقع العيادة على خرائط Google</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        {/* SECTION 5: Link to Full Website */}
        <div className="pt-2">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-royal/40 hover:bg-brand-royal/60 border border-brand-royal/50 text-white text-xs font-bold transition-all"
          >
            <Globe className="w-4 h-4 text-brand-cyan" />
            <span>زيارة الموقع الطبي الكامل للعيادة</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

      </div>

    </div>
  );
};
