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
  SocialReviewImage,
} from '../types';
import { initialClinicData } from '../data/clinicData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ContentContextType {
  data: AppContentState;
  isBackendSynced: boolean;
  isSaving: boolean;
  saveToSupabase: (content?: AppContentState) => Promise<{ success: boolean; error?: string }>;
  updateDoctor: (doctor: Partial<DoctorInfo>) => void;
  updateClinic: (clinic: Partial<ClinicInfo>) => void;
  updateServices: (services: MedicalService[]) => void;
  updateEquipment: (equipment: MedicalEquipment[]) => void;
  updateFAQ: (faq: FAQItem[]) => void;
  updateSocial: (social: Partial<SocialLinks>) => void;
  updateBookingSettings: (settings: Partial<FutureBookingSettings>) => void;
  updateVisibility: (visibility: Partial<WebsiteVisibilitySettings>) => void;
  updateGoogleApiSettings: (apiKey: string, placeId: string) => void;
  updateSocialReviewImages: (images: SocialReviewImage[]) => void;
  addSocialReviewImage: (image: Omit<SocialReviewImage, 'id'>) => void;
  deleteSocialReviewImage: (id: string) => void;
  addBookingAppointment: (appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>) => boolean;
  updateBookingStatus: (id: string, status: BookingAppointment['status']) => void;
  deleteBookingAppointment: (id: string) => void;
  resetToDefault: () => void;
}

const LOCAL_STORAGE_KEY = 'drelattar_clinic_content_v2';

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
          socialReviewImages: Array.isArray(parsed.socialReviewImages) && parsed.socialReviewImages.length > 0
            ? parsed.socialReviewImages
            : initialClinicData.socialReviewImages,
        };
      }
    } catch (e) {
      console.warn('Could not load cached content from localStorage:', e);
    }
    return initialClinicData;
  });

  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(isSupabaseConfigured);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [initialRemoteFetchDone, setInitialRemoteFetchDone] = useState<boolean>(false);

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
      setInitialRemoteFetchDone(true);
      return;
    }

    const loadRemote = async () => {
      try {
        const { data: remoteData, error } = await client
          .from('clinic_settings')
          .select('*')
          .single();

        if (error) {
          // If table is empty (PGRST116), seed it with initial clinic content
          if (error.code === 'PGRST116') {
            await client.from('clinic_settings').insert({
              key: 'main_settings',
              content: data,
              updated_at: new Date().toISOString()
            });
            setIsBackendSynced(true);
          } else {
            console.warn('Supabase fetch notice (table may need schema):', error.message);
            setIsBackendSynced(false);
          }
        } else if (remoteData && remoteData.content) {
          setData(remoteData.content);
          setIsBackendSynced(true);
        }

        // Also fetch remote appointments from Supabase if table exists
        try {
          const { data: remoteAppointments, error: aptError } = await client
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!aptError && remoteAppointments && Array.isArray(remoteAppointments)) {
            const mappedBookings: BookingAppointment[] = remoteAppointments.map((a: any) => ({
              id: a.id,
              patientName: a.patient_name,
              patientPhone: a.patient_phone,
              appointmentDate: a.appointment_date,
              appointmentTime: a.appointment_time,
              service: a.notes?.includes('الخدمة:') ? a.notes.split('|')[0].replace('الخدمة:', '').trim() : undefined,
              notes: a.notes,
              status: a.status || 'pending',
              createdAt: a.created_at,
            }));
            setData((prev) => ({
              ...prev,
              bookings: mappedBookings,
            }));
          }
        } catch (aptErr) {
          console.warn('Could not load remote appointments:', aptErr);
        }
      } catch (err) {
        console.warn('Could not connect to remote Supabase database:', err);
        setIsBackendSynced(false);
      } finally {
        setInitialRemoteFetchDone(true);
      }
    };

    loadRemote();
  }, []);

  const saveToSupabase = async (contentToSave?: AppContentState): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase غير مهيأ' };
    }
    try {
      setIsSaving(true);
      const payload = contentToSave || data;
      const { error } = await supabase
        .from('clinic_settings')
        .upsert(
          { key: 'main_settings', content: payload, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Supabase save error:', error);
        setIsBackendSynced(false);
        setIsSaving(false);
        return { success: false, error: error.message };
      }
      setIsBackendSynced(true);
      setIsSaving(false);
      return { success: true };
    } catch (err: any) {
      console.error('Supabase save exception:', err);
      setIsBackendSynced(false);
      setIsSaving(false);
      return { success: false, error: err.message || 'حدث خطأ أثناء الحفظ' };
    }
  };

  // Debounced auto-save to Supabase when data changes after initial load
  useEffect(() => {
    if (!initialRemoteFetchDone || !isSupabaseConfigured || !supabase) return;

    const timeout = setTimeout(() => {
      saveToSupabase(data);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [data, initialRemoteFetchDone]);

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

  const updateSocialReviewImages = (images: SocialReviewImage[]) => {
    setData((prev) => ({
      ...prev,
      socialReviewImages: images,
    }));
  };

  const addSocialReviewImage = (image: Omit<SocialReviewImage, 'id'>) => {
    const newImage: SocialReviewImage = {
      ...image,
      id: `rev-img-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      socialReviewImages: [newImage, ...(prev.socialReviewImages || [])],
    }));
  };

  const deleteSocialReviewImage = (id: string) => {
    setData((prev) => ({
      ...prev,
      socialReviewImages: (prev.socialReviewImages || []).filter((img) => img.id !== id),
    }));
  };

  const addBookingAppointment = (
    appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>
  ): boolean => {
    const tempId = `booking-${Date.now()}`;
    const newAppointment: BookingAppointment = {
      ...appointment,
      id: tempId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      bookings: [newAppointment, ...prev.bookings],
    }));

    // Insert into Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase.from('appointments').insert({
        patient_name: appointment.patientName,
        patient_phone: appointment.patientPhone,
        appointment_date: appointment.appointmentDate,
        appointment_time: appointment.appointmentTime,
        notes: appointment.service ? `الخدمة: ${appointment.service} | ${appointment.notes || ''}` : appointment.notes || '',
        status: 'pending',
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to insert appointment into Supabase:', error.message);
        }
      });
    }

    return true;
  };

  const updateBookingStatus = (id: string, status: BookingAppointment['status']) => {
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));

    if (isSupabaseConfigured && supabase) {
      supabase.from('appointments').update({ status }).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update appointment in Supabase:', error);
      });
    }
  };

  const deleteBookingAppointment = (id: string) => {
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.filter((b) => b.id !== id),
    }));

    if (isSupabaseConfigured && supabase) {
      supabase.from('appointments').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete appointment in Supabase:', error);
      });
    }
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
        isSaving,
        saveToSupabase,
        updateDoctor,
        updateClinic,
        updateServices,
        updateEquipment,
        updateFAQ,
        updateSocial,
        updateBookingSettings,
        updateVisibility,
        updateGoogleApiSettings,
        updateSocialReviewImages,
        addSocialReviewImage,
        deleteSocialReviewImage,
        addBookingAppointment,
        updateBookingStatus,
        deleteBookingAppointment,
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
