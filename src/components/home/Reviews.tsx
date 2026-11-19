import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  X,
  Share2,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { OFFICIAL_MAPS_LINK } from '../../lib/googlePlaces';
import type { SocialReviewImage } from '../../types';

export const Reviews: React.FC = () => {
  const { data } = useContent();
  const { visibility, socialReviewImages, social } = data;

  const images = socialReviewImages && socialReviewImages.length > 0 ? socialReviewImages : [];

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SocialReviewImage | null>(null);
  const [itemsPerView, setItemsPerView] = useState(3);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Responsive itemsPerView
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // Mobile: 1 card + peek
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 cards
      } else {
        setItemsPerView(3); // Desktop: 3 cards
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, images.length - itemsPerView);

  // Auto-play interval: moves automatically and seamlessly
  useEffect(() => {
    if (isPaused || images.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);

    return () => clearInterval(interval);
  }, [isPaused, maxIndex, images.length, itemsPerView]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    // RTL direction consideration: swipe right is prev, swipe left is next
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!visibility.showReviewsSection) {
    return null;
  }

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            واتساب موثق
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            توصية فيسبوك
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            إنستغرام
          </span>
        );
      case 'google':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            خرائط Google
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-brand-cyan" />
            تقييم موثق
          </span>
        );
    }
  };

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-gradient-to-b from-brand-bg via-slate-50/50 to-white relative overflow-hidden">
      
      {/* Subtle decorative background circles */}
      <div className="absolute top-10 right-5 w-72 h-72 rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-5 w-80 h-80 rounded-full bg-brand-royal/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading & Trust Badges */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-border text-brand-royal text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>آراء وتجارب المرضى الحقيقية 100%</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-dark leading-tight">
            آراء حقيقية 100% عبر وسائل التواصل الاجتماعي
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-brand-muted leading-relaxed max-w-2xl mx-auto">
            محادثات ورسائل شكر حقيقية يشاركها معنا مرضانا الكرام عبر صفحاتنا على منصات التواصل ومحادثات الواتساب تقديراً لدقة التشخيص والرعاية الطبية بأعلى درجات الأمانة.
          </p>

          {/* Social Platforms Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <MessageCircle className="w-3.5 h-3.5" />
              محادثات واتساب
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-700 border border-blue-500/20">
              <Share2 className="w-3.5 h-3.5" />
              توصيات فيسبوك
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/10 text-pink-700 border border-pink-500/20">
              <Heart className="w-3.5 h-3.5" />
              إنستغرام
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              خرائط Google
            </span>
          </div>

        </div>

        {/* Carousel Container */}
        {images.length > 0 ? (
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            
            {/* Navigation Arrows */}
            <div className="hidden sm:flex items-center justify-between absolute -top-14 left-0 right-0 px-2 pointer-events-none">
              <div className="text-xs font-bold text-slate-500">
                عرض {currentIndex + 1} إلى {Math.min(currentIndex + itemsPerView, images.length)} من {images.length} تقييم
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-white border border-brand-border shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-brand-royal transition-all"
                  aria-label="التالي"
                  title="التالي"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-white border border-brand-border shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-brand-royal transition-all"
                  aria-label="السابق"
                  title="السابق"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slider track with continuous peek from sides */}
            <div className="overflow-hidden py-4 -mx-2 px-2">
              <div
                className="flex transition-transform duration-700 ease-out gap-4 sm:gap-6"
                style={{
                  transform: `translateX(${currentIndex * (100 / itemsPerView)}%)`,
                }}
              >
                {images.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] transition-all duration-300"
                  >
                    <div
                      onClick={() => setSelectedImage(item)}
                      className="group bg-white rounded-2xl sm:rounded-3xl border border-brand-border/80 shadow-soft hover:shadow-xl hover:border-brand-royal/40 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer h-full text-right"
                    >
                      {/* Image Preview Box */}
                      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover sm:object-contain group-hover:scale-[1.02] transition-transform duration-500"
                          loading="eager"
                        />

                        {/* Hover Overlay with Zoom Icon */}
                        <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-brand-dark text-xs font-bold shadow-lg">
                            <ZoomIn className="w-4 h-4 text-brand-royal" />
                            <span>تكبير الصورة والقراءة</span>
                          </span>
                        </div>

                        {/* Platform Badge on image */}
                        <div className="absolute top-3 right-3 shadow-sm">
                          {getPlatformBadge(item.platform)}
                        </div>

                        {/* Verified badge */}
                        {item.date && (
                          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white">
                            {item.date}
                          </div>
                        )}
                      </div>

                      {/* Card Content & Caption */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          {item.patientName && (
                            <p className="text-xs font-bold text-brand-royal mb-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-royal" />
                              <span>{item.patientName}</span>
                            </p>
                          )}
                          <h4 className="text-sm font-bold text-brand-dark leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                        </div>

                        {item.caption && (
                          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed pt-1 border-t border-slate-50">
                            "{item.caption}"
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation Buttons & Dots Indicator */}
            <div className="flex flex-col items-center gap-3 mt-4 sm:mt-6">
              
              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === dotIdx
                        ? 'w-6 bg-brand-royal'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`انتقال للشريحة ${dotIdx + 1}`}
                  />
                ))}
              </div>

              {/* Mobile Arrows */}
              <div className="flex sm:hidden items-center gap-3 pt-1">
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-xl bg-white border border-brand-border text-xs font-bold text-slate-700 flex items-center gap-1 shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>التالي</span>
                </button>
                <button
                  onClick={handlePrev}
                  className="px-4 py-1.5 rounded-xl bg-white border border-brand-border text-xs font-bold text-slate-700 flex items-center gap-1 shadow-xs"
                >
                  <span>السابق</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* Fallback if no images are added yet */
          <div className="text-center py-12 bg-white rounded-3xl border border-brand-border p-8 max-w-xl mx-auto space-y-3">
            <ShieldCheck className="w-12 h-12 text-brand-cyan mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">
              جاري تحديث آراء ومشاركات المرضى
            </h3>
            <p className="text-xs text-brand-muted">
              يمكن لإدارة العيادة إضافة وتحديث صور محادثات الواتساب وتوصيات فيسبوك بسهولة من لوحة الإدارة.
            </p>
          </div>
        )}

        {/* Action Callout Bar */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
          
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center justify-center md:justify-start gap-2 text-brand-royal font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span>رأيك محل اهتمامنا وتجربتك تهمنا دائماً</span>
            </div>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              يسعدنا دائماً تلقي تقييماتكم واستفساراتكم، ومشاركة تجاربكم في العيادة عبر الواتساب أو صفحة العيادة على خرائط Google.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto shrink-0">
            {social.whatsappClinic && (
              <a
                href={social.whatsappClinic}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>شاركنا تجربتك على واتساب</span>
              </a>
            )}

            <a
              href={OFFICIAL_MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all border border-slate-200"
            >
              <span>تقييمات خرائط Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>

      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-700 max-w-3xl w-full max-h-[92vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 text-right">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
                {getPlatformBadge(selectedImage.platform)}
              </div>

              <div className="text-right">
                <h3 className="text-sm font-bold text-white">
                  {selectedImage.title}
                </h3>
                {selectedImage.patientName && (
                  <p className="text-xs text-brand-cyan">
                    {selectedImage.patientName} {selectedImage.date ? `• ${selectedImage.date}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-950 max-h-[75vh]">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md"
              />
            </div>

            {/* Modal Footer Caption */}
            {selectedImage.caption && (
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-300">
                "{selectedImage.caption}"
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
};
