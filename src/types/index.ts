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
  service?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface ClinicHoliday {
  id: string;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  reason?: string;
  customMessage?: string;
  isActive: boolean;
  createdBy: 'admin' | 'secretary';
  createdAt: string;
}

export interface ClinicAnnouncement {
  id: string;
  title: string;
  content: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  type: 'info' | 'warning' | 'alert' | 'closure';
  createdBy: 'admin' | 'secretary';
  createdAt: string;
}

export interface SecretaryPermissions {
  canManageBookings: boolean;
  canCloseToday: boolean;
  canCloseSpecificDates: boolean;
  canScheduleHolidays: boolean;
  canPostAnnouncements: boolean;
}

export interface SecretaryAccount {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  phone?: string;
  isActive: boolean;
  permissions: SecretaryPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface DeviceTokenRecord {
  id: string;
  token: string;
  role: 'admin' | 'secretary' | 'all';
  userIdentifier?: string;
  devicePlatform: 'android' | 'web' | 'ios';
  lastActive: string;
  createdAt: string;
}

export interface FutureBookingSettings {
  isEnabled: boolean;
  allowedDays: string[]; // e.g. ['Saturday', 'Sunday', ...]
  startTime: string; // "13:00"
  endTime: string; // "21:00"
  startTimeFriday?: string; // "16:00"
  endTimeFriday?: string; // "22:00"
  slotDurationMinutes: number; // 60 for 1 slot per hour
  maxAdvanceDays?: number; // e.g. 7, 14, 21, 30 days open ahead for booking
  maxDailyBookings: number;
  instructionText: string;
  // Holiday and Closure Settings
  isClosedToday?: boolean;
  closedTodayReason?: string;
  closedDates?: string[]; // array of 'YYYY-MM-DD'
  holidays?: ClinicHoliday[];
  announcements?: ClinicAnnouncement[];
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
  title?: string;
  patientName?: string;
  platform?: 'whatsapp' | 'facebook' | 'instagram' | 'google' | 'other';
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
  secretaryAccounts?: SecretaryAccount[];
  deviceTokens?: DeviceTokenRecord[];
}
