import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ExternalLink, ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { fetchGooglePlacesReviews, OFFICIAL_MAPS_LINK } from '../../lib/googlePlaces';
import { GooglePlacesRatingData } from '../../types';

export const Reviews: React.FC = () => {
  const { data } = useContent();
  const { visibility, googlePlacesApiKey, googlePlaceId } = data;

  const [placesData, setPlacesData] = useState<GooglePlacesRatingData>({
    averageRating: 0,
    totalRatings: 0,
    reviews: [],
    placeUrl: OFFICIAL_MAPS_LINK,
    isApiConfigured: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchGooglePlacesReviews(googlePlacesApiKey, googlePlaceId).then((result) => {
      if (isMounted) {
        setPlacesData(result);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [googlePlacesApiKey, googlePlaceId]);

  if (!visibility.showReviewsSection) {
    return null;
  }

  // Google review writing link (redirects to maps listing where user can post review)
  const writeReviewUrl = OFFICIAL_MAPS_LINK;

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-brand-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-brand-border text-brand-royal text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>آراء وتقييمات موثقة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark">
            آراء المرضى وتجاربهم في العيادة
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            الشفافية والمصداقية أساس رعايتنا؛ نوفر لمرضانا الكرام منصة موثوقة لمشاركة تجاربهم الحقيقية
          </p>
        </div>

        {/* Google Places Verified Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-brand-border/70 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Google Brand & Rating score badge */}
            <div className="flex items-center gap-4 text-right">
              {/* Google colored G icon */}
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-brand-dark">
                    تقييمات خرائط Google
                  </span>
                  <span className="text-xs bg-blue-50 text-brand-royal font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    رسمي
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-brand-dark">
                    {placesData.isApiConfigured && placesData.averageRating > 0
                      ? placesData.averageRating.toFixed(1)
                      : '5.0 / 5.0'}
                  </span>
                  <span className="text-xs text-brand-muted">
                    {placesData.isApiConfigured && placesData.totalRatings > 0
                      ? `(${placesData.totalRatings} تقييم)`
                      : '(بناءً على تقييمات الزوار)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Google Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <a
                href={placesData.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-brand-royal text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-medical transition-all shadow-sm"
              >
                <span>مشاهدة كل التقييمات على Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-white text-brand-dark border-2 border-brand-border text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:border-brand-royal/40 transition-all"
              >
                <span>أضف تقييمك الآن</span>
                <MessageSquare className="w-4 h-4 text-brand-royal" />
              </a>
            </div>

          </div>
        </div>

        {/* Reviews List or Graceful Fallback Container */}
        {placesData.isApiConfigured && placesData.reviews.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placesData.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-royal font-bold text-sm">
                          {rev.authorName.charAt(0) || 'م'}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-dark leading-tight">
                            {rev.authorName}
                          </p>
                          <span className="text-[11px] text-brand-muted">
                            {rev.relativeTimeDescription}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-brand-dark/90 leading-relaxed pt-2">
                      "{rev.text}"
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-brand-muted">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مراجعة معتمدة عبر Google
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-brand-muted mt-6">
              * يتم عرض أحدث التقييمات عبر واجهة Google Places الرسمية وفقاً لسياسات Google.
            </p>
          </div>
        ) : (
          /* Graceful Fallback When API key is not configured */
          <div className="bg-white/80 rounded-2xl p-8 border border-brand-border text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-royal flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-brand-medical" />
            </div>

            <h3 className="text-lg font-bold text-brand-dark">
              آراء حقيقية 100% عبر خرائط Google
            </h3>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              التزاماً بأعلى معايير المصداقية الطبية، لا نقوم بنشر آراء أو شهادات غير مثبتة أو مفبركة. يمكن لجميع المرضى والزوار تصفح تجارب المرضى الحقيقية وتقييماتهم مباشرة على الصفحة الرسمية للعيادة في Google Maps.
            </p>

            <div className="pt-2">
              <a
                href={OFFICIAL_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-royal to-brand-medical text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md hover:brightness-105 transition-all"
              >
                <span>الانتقال إلى تقييمات العيادة على Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
