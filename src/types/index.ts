export interface DoctorInfo {
  nameAr: string;
  nameEn: string;
  title: string;
  specialties: string[];
  experienceYears: number;
  education: string;
  credentials: string[];
  bio: string;
  avatarNeutral: string;
  avatarMedical: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  landmark: string;
  city: string;
  governorate: string;
  country: string;
  branchesCount: number;
  phoneDoctor: string;
  phoneClinic: string;
  hoursRegular: string;
  hoursFriday: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl?: string;
}

export interface MedicalService {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'chronic' | 'general' | 'sessions';
  icon: string;
  featured?: boolean;
}

export interface MedicalEquipment {
  id: string;
  name: string;
  description: string;
  icon: string;
  importance: string;
}

export interface GoogleReview {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  publishedAt?: string;
}

export interface GooglePlacesRatingData {
  averageRating: number;
  totalRatings: number;
  reviews: GoogleReview[];
  placeUrl: string;
  isApiConfigured: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsappClinic: string;
  whatsappDoctor: string;
}

export interface BookingAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface FutureBookingSettings {
  isEnabled: boolean;
  allowedDays: string[]; // e.g. ['Saturday', 'Sunday', ...]
  startTime: string; // "13:00"
  endTime: string; // "21:00"
  slotDurationMinutes: number; // 30
  maxDailyBookings: number;
  instructionText: string;
}

export interface WebsiteVisibilitySettings {
  showReviewsSection: boolean;
  showEquipmentSection: boolean;
  showFAQSection: boolean;
  emergencyNoticeActive: boolean;
  emergencyNoticeText: string;
  maintenanceMode: boolean;
}

export interface SocialReviewImage {
  id: string;
  imageUrl: string;
  title: string;
  patientName?: string;
  platform: 'whatsapp' | 'facebook' | 'instagram' | 'google' | 'other';
  date?: string;
  caption?: string;
}

export interface AppContentState {
  doctor: DoctorInfo;
  clinic: ClinicInfo;
  services: MedicalService[];
  equipment: MedicalEquipment[];
  faq: FAQItem[];
  social: SocialLinks;
  bookingSettings: FutureBookingSettings;
  bookings: BookingAppointment[];
  visibility: WebsiteVisibilitySettings;
  googlePlacesApiKey: string;
  googlePlaceId: string;
  socialReviewImages: SocialReviewImage[];
}
