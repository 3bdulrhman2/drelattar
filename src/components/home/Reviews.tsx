import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Star,
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
  const totalImages = images.length;
  const isLoopable = totalImages > 1;

  // Infinite Circular Slider: Clone last slide at start and first slide at end
  const slides: SocialReviewImage[] = useMemo(() => {
    if (!isLoopable) return images;
    return [images[totalImages - 1], ...images, images[0]];
  }, [images, isLoopable, totalImages]);

  // Carousel State: Single centered card slider (index 1 is the first real image when loopable)
  const [currentIndex, setCurrentIndex] = useState(isLoopable ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SocialReviewImage | null>(null);
  const isJumping = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync index if images list changes
  useEffect(() => {
    setCurrentIndex(isLoopable ? 1 : 0);
    setWithTransition(true);
    isJumping.current = false;
  }, [images.length, isLoopable]);

  // Re-enable CSS transitions after an instant boundary snap
  useEffect(() => {
    if (!withTransition) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setWithTransition(true);
          isJumping.current = false;
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [withTransition]);

  // Real active index for pagination dots and counter
  const activeRealIndex = useMemo(() => {
    if (!isLoopable) return 0;
    if (currentIndex === 0) return totalImages - 1;
    if (currentIndex === totalImages + 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, isLoopable, totalImages]);

  const handleNext = () => {
    if (!isLoopable || isJumping.current || currentIndex > totalImages) return;
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isLoopable || isJumping.current || currentIndex < 1) return;
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Seamless boundary crossing on transition end
  const handleTransitionEnd = () => {
    if (!isLoopable) return;

    if (currentIndex === totalImages + 1) {
      // Reached cloned first slide at end -> snap instantly to real first slide (index 1)
      isJumping.current = true;
      setWithTransition(false);
      setCurrentIndex(1);
    } else if (currentIndex === 0) {
      // Reached cloned last slide at start -> snap instantly to real last slide (index totalImages)
      isJumping.current = true;
      setWithTransition(false);
      setCurrentIndex(totalImages);
    }
  };

  // Auto-play timer: resets and counts a fresh 5 seconds on EVERY slide change or swipe
  useEffect(() => {
    if (isPaused || !isLoopable || !withTransition) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, isLoopable, withTransition]);

  // Touch swipe: follows natural finger direction
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isLoopable) return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isLoopable) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || !isLoopable) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    // Swipe left (finger moved right-to-left): advance to next image
    if (diff > minSwipeDistance) {
      handleNext();
    }
    // Swipe right (finger moved left-to-right): back to previous image
    else if (diff < -minSwipeDistance) {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            واتساب موثق
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            توصية فيسبوك
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            إنستغرام
          </span>
        );
      case 'google':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            خرائط Google
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-brand-cyan" />
            تقييم موثق
          </span>
        );
    }
  };

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-gradient-to-b from-brand-bg via-slate-50/60 to-white relative overflow-hidden">
      
      {/* Decorative background blurs */}
      <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-brand-royal/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-border text-brand-royal text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>آراء وتجارب المرضى الحقيقية 100%</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-dark leading-tight">
            آراء حقيقية 100% عبر وسائل التواصل الاجتماعي
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-brand-muted leading-relaxed">
            محادثات ورسائل شكر حقيقية يشاركها معنا مرضانا الكرام عبر صفحاتنا على منصات التواصل ومحادثات الواتساب تقديراً لدقة التشخيص والرعاية الطبية بأعلى درجات الأمانة.
          </p>

          {/* Social Platform Badges */}
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

        {/* SINGLE CENTERED IMAGE CAROUSEL (NOTHING VISIBLE FROM SIDES) */}
        {totalImages > 0 ? (
          <div
            className="relative max-w-sm sm:max-w-md md:max-w-lg mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            
            {/* Desktop / Tablet Floating Side Navigation Buttons */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={handleNext}
                  className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border border-brand-border shadow-md hover:shadow-lg text-slate-700 hover:text-brand-royal hover:scale-105 items-center justify-center transition-all z-10"
                  aria-label="الصورة التالية"
                  title="التالي"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <button
                  onClick={handlePrev}
                  className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border border-brand-border shadow-md hover:shadow-lg text-slate-700 hover:text-brand-royal hover:scale-105 items-center justify-center transition-all z-10"
                  aria-label="الصورة السابقة"
                  title="السابق"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Single Centered Card Frame */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-brand-border/90 shadow-soft">
              
              {/* Slider Track (Direction: ltr for perfectly synced swipe and slide) */}
              <div
                onTransitionEnd={handleTransitionEnd}
                className={`flex ${withTransition ? 'transition-transform duration-500 ease-out' : ''}`}
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                  direction: 'ltr',
                }}
              >
                {slides.map((item, index) => (
                  <div
                    key={`${item.id || 'review'}-${index}`}
                    className="w-full shrink-0 flex flex-col"
                    style={{ direction: 'rtl' }}
                  >
                    {/* Image Preview Box - PRESERVES NATURAL SIZE, NO CROPPING */}
                    <div
                      onClick={() => setSelectedImage(item)}
                      className="relative bg-slate-50/70 p-3 sm:p-4 flex items-center justify-center cursor-pointer group select-none min-h-[380px] max-h-[560px]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title || 'رأي مريض موثق'}
                        className="max-h-[500px] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain shadow-xs group-hover:scale-[1.01] transition-transform duration-300"
                        loading="eager"
                      />

                      {/* Hover Zoom Icon Overlay */}
                      <div className="absolute inset-0 bg-brand-dark/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2 backdrop-blur-[2px] m-2">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-brand-dark text-xs font-bold shadow-lg">
                          <ZoomIn className="w-4 h-4 text-brand-royal" />
                          <span>انقر لتكبير وقراءة الصورة بوضوح</span>
                        </span>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-4 right-4 z-10">
                        {getPlatformBadge(item.platform)}
                      </div>

                      {item.date && (
                        <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-medium text-white z-10">
                          {item.date}
                        </div>
                      )}
                    </div>

                    {/* Card Content (Only shown if title, patientName, or caption exists) */}
                    {(item.title || item.patientName || item.caption) && (
                      <div className="p-4 sm:p-5 border-t border-slate-100 text-right space-y-2">
                        {item.patientName && (
                          <p className="text-xs font-bold text-brand-royal flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-royal" />
                            <span>{item.patientName}</span>
                          </p>
                        )}

                        {item.title && (
                          <h4 className="text-sm sm:text-base font-bold text-brand-dark leading-snug">
                            {item.title}
                          </h4>
                        )}

                        {item.caption && (
                          <p className="text-xs text-brand-muted leading-relaxed">
                            "{item.caption}"
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>

            {/* Navigation Dots & Counter Below Centered Card */}
            <div className="flex flex-col items-center gap-3 mt-4">
              
              {/* Image Counter & Pagination Dots */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">
                  {activeRealIndex + 1} من {totalImages}
                </span>

                <div className="flex items-center justify-center gap-1.5">
                  {images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => {
                        if (isJumping.current) return;
                        setWithTransition(true);
                        setCurrentIndex(dotIdx + 1);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeRealIndex === dotIdx
                          ? 'w-6 bg-brand-royal'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`انتقال للصورة ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-brand-border p-8 max-w-md mx-auto space-y-3">
            <ShieldCheck className="w-12 h-12 text-brand-cyan mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">
              جاري إضافة محادثات وآراء المرضى
            </h3>
            <p className="text-xs text-brand-muted">
              يمكن لإدارة العيادة إضافة صور سكرين شوت المحادثات بسهولة من لوحة التحكم.
            </p>
          </div>
        )}

        {/* Action Callout Bar */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right max-w-4xl mx-auto">
          
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-700 max-w-2xl w-full max-h-[94vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
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
                {selectedImage.title && (
                  <h3 className="text-sm font-bold text-white">
                    {selectedImage.title}
                  </h3>
                )}
                {selectedImage.patientName && (
                  <p className="text-xs text-brand-cyan">
                    {selectedImage.patientName} {selectedImage.date ? `• ${selectedImage.date}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Image Display - UNTOUCHED ORIGINAL PROPORTIONS */}
            <div className="p-3 sm:p-4 overflow-y-auto flex items-center justify-center bg-slate-950 max-h-[78vh]">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title || 'رأي مريض'}
                className="max-h-[74vh] w-auto max-w-full rounded-xl object-contain shadow-md"
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
