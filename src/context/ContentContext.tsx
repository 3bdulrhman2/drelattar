import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  AppContentState,
  DoctorInfo,
  ClinicInfo,
  MedicalService,
  MedicalEquipment,
  FAQItem,
  SocialLinks,
  FutureBookingSettings,
  WebsiteVisibilitySettings,
  BookingAppointment,
} from '../types';
import { initialClinicData } from '../data/clinicData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ContentContextType {
  data: AppContentState;
  isBackendSynced: boolean;
  updateDoctor: (doctor: Partial<DoctorInfo>) => void;
  updateClinic: (clinic: Partial<ClinicInfo>) => void;
  updateServices: (services: MedicalService[]) => void;
  updateEquipment: (equipment: MedicalEquipment[]) => void;
  updateFAQ: (faq: FAQItem[]) => void;
  updateSocial: (social: Partial<SocialLinks>) => void;
  updateBookingSettings: (settings: Partial<FutureBookingSettings>) => void;
  updateVisibility: (visibility: Partial<WebsiteVisibilitySettings>) => void;
  updateGoogleApiSettings: (apiKey: string, placeId: string) => void;
  addBookingAppointment: (appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>) => boolean;
  updateBookingStatus: (id: string, status: BookingAppointment['status']) => void;
  resetToDefault: () => void;
}

const LOCAL_STORAGE_KEY = 'drelattar_clinic_content_v1';

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppContentState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialClinicData,
          ...parsed,
          doctor: { ...initialClinicData.doctor, ...(parsed.doctor || {}) },
          clinic: { ...initialClinicData.clinic, ...(parsed.clinic || {}) },
          social: { ...initialClinicData.social, ...(parsed.social || {}) },
          bookingSettings: { ...initialClinicData.bookingSettings, ...(parsed.bookingSettings || {}) },
          visibility: { ...initialClinicData.visibility, ...(parsed.visibility || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not load cached content from localStorage:', e);
    }
    return initialClinicData;
  });

  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(isSupabaseConfigured);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [data]);

  // If Supabase is configured, attempt to load remote settings
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setIsBackendSynced(false);
      return;
    }

    const loadRemote = async () => {
      try {
        const { data: remoteData, error } = await client
          .from('clinic_settings')
          .select('*')
          .single();

        if (error) {
          console.warn('Supabase fetch notice (table may need schema):', error.message);
          setIsBackendSynced(false);
        } else if (remoteData && remoteData.content) {
          setData(remoteData.content);
          setIsBackendSynced(true);
        }
      } catch (err) {
        console.warn('Could not connect to remote Supabase database:', err);
        setIsBackendSynced(false);
      }
    };

    loadRemote();
  }, []);

  const updateDoctor = (doctorUpdate: Partial<DoctorInfo>) => {
    setData((prev) => ({
      ...prev,
      doctor: { ...prev.doctor, ...doctorUpdate },
    }));
  };

  const updateClinic = (clinicUpdate: Partial<ClinicInfo>) => {
    setData((prev) => ({
      ...prev,
      clinic: { ...prev.clinic, ...clinicUpdate },
    }));
  };

  const updateServices = (services: MedicalService[]) => {
    setData((prev) => ({ ...prev, services }));
  };

  const updateEquipment = (equipment: MedicalEquipment[]) => {
    setData((prev) => ({ ...prev, equipment }));
  };

  const updateFAQ = (faq: FAQItem[]) => {
    setData((prev) => ({ ...prev, faq }));
  };

  const updateSocial = (socialUpdate: Partial<SocialLinks>) => {
    setData((prev) => ({
      ...prev,
      social: { ...prev.social, ...socialUpdate },
    }));
  };

  const updateBookingSettings = (bookingUpdate: Partial<FutureBookingSettings>) => {
    setData((prev) => ({
      ...prev,
      bookingSettings: { ...prev.bookingSettings, ...bookingUpdate },
    }));
  };

  const updateVisibility = (visibilityUpdate: Partial<WebsiteVisibilitySettings>) => {
    setData((prev) => ({
      ...prev,
      visibility: { ...prev.visibility, ...visibilityUpdate },
    }));
  };

  const updateGoogleApiSettings = (apiKey: string, placeId: string) => {
    setData((prev) => ({
      ...prev,
      googlePlacesApiKey: apiKey,
      googlePlaceId: placeId,
    }));
  };

  const addBookingAppointment = (
    appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>
  ): boolean => {
    const newAppointment: BookingAppointment = {
      ...appointment,
      id: `booking-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      bookings: [newAppointment, ...prev.bookings],
    }));

    return true;
  };

  const updateBookingStatus = (id: string, status: BookingAppointment['status']) => {
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  };

  const resetToDefault = () => {
    setData(initialClinicData);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <ContentContext.Provider
      value={{
        data,
        isBackendSynced,
        updateDoctor,
        updateClinic,
        updateServices,
        updateEquipment,
        updateFAQ,
        updateSocial,
        updateBookingSettings,
        updateVisibility,
        updateGoogleApiSettings,
        addBookingAppointment,
        updateBookingStatus,
        resetToDefault,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
