import type { GooglePlacesRatingData } from '../types';

export const OFFICIAL_MAPS_LINK = 'https://maps.app.goo.gl/ST9qs3kYt1nFxiGn8';

export async function fetchGooglePlacesReviews(
  customApiKey?: string,
  customPlaceId?: string
): Promise<GooglePlacesRatingData> {
  const apiKey = customApiKey || import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
  const placeId = customPlaceId || import.meta.env.VITE_GOOGLE_PLACE_ID || '';

  // Graceful fallback when credentials are not yet supplied
  if (!apiKey || !placeId || apiKey.includes('YOUR_') || placeId.includes('YOUR_')) {
    return {
      averageRating: 0,
      totalRatings: 0,
      reviews: [],
      placeUrl: OFFICIAL_MAPS_LINK,
      isApiConfigured: false,
    };
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=rating,userRatingCount,reviews,googleMapsUri&languageCode=ar`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution,googleMapsUri',
      },
    });

    if (!response.ok) {
      console.warn('Google Places API responded with status:', response.status);
      return {
        averageRating: 0,
        totalRatings: 0,
        reviews: [],
        placeUrl: OFFICIAL_MAPS_LINK,
        isApiConfigured: false,
      };
    }

    const data = await response.json();
    
    const reviews = (data.reviews || []).slice(0, 5).map((rev: any, index: number) => ({
      id: rev.name || `review-${index}`,
      authorName: rev.authorAttribution?.displayName || 'مريض معتمد',
      authorPhotoUrl: rev.authorAttribution?.photoUri || '',
      rating: Number(rev.rating || 5),
      relativeTimeDescription: rev.relativePublishTimeDescription || 'مؤخراً',
      text: rev.text?.text || '',
      publishedAt: rev.publishTime,
    }));

    return {
      averageRating: Number(data.rating || 5),
      totalRatings: Number(data.userRatingCount || 0),
      reviews: reviews.filter((r: any) => r.text && r.text.trim().length > 0),
      placeUrl: data.googleMapsUri || OFFICIAL_MAPS_LINK,
      isApiConfigured: true,
    };
  } catch (err) {
    console.error('Error fetching Google Places reviews:', err);
    return {
      averageRating: 0,
      totalRatings: 0,
      reviews: [],
      placeUrl: OFFICIAL_MAPS_LINK,
      isApiConfigured: false,
    };
  }
}
