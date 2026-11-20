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
  ClinicHoliday,
  ClinicAnnouncement,
  SecretaryAccount,
  DeviceTokenRecord,
} from '../types';
import { initialClinicData } from '../data/clinicData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { triggerLocalNotification } from '../lib/pushNotifications';

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
  updateBookingSettings: (settings: Partial<FutureBookingSettings>, clinicUpdate?: Partial<ClinicInfo>) => void;
  updateVisibility: (visibility: Partial<WebsiteVisibilitySettings>) => void;
  updateGoogleApiSettings: (apiKey: string, placeId: string) => void;
  updateSocialReviewImages: (images: SocialReviewImage[]) => void;
  addSocialReviewImage: (image: Omit<SocialReviewImage, 'id'>) => void;
  deleteSocialReviewImage: (id: string) => void;
  addBookingAppointment: (appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>) => boolean;
  updateBookingStatus: (id: string, status: BookingAppointment['status']) => void;
  deleteBookingAppointment: (id: string) => void;
  // Holiday and Closure Management
  toggleCloseToday: (isClosed: boolean, reason?: string) => void;
  toggleCloseDate: (dateStr: string, isClosed: boolean) => void;
  addHoliday: (holiday: Omit<ClinicHoliday, 'id' | 'createdAt'>) => void;
  updateHoliday: (id: string, update: Partial<ClinicHoliday>) => void;
  deleteHoliday: (id: string) => void;
  // Announcements
  addAnnouncement: (announcement: Omit<ClinicAnnouncement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, update: Partial<ClinicAnnouncement>) => void;
  deleteAnnouncement: (id: string) => void;
  // Secretary Management
  addSecretaryAccount: (account: Omit<SecretaryAccount, 'id' | 'createdAt'>) => void;
  updateSecretaryAccount: (id: string, update: Partial<SecretaryAccount>) => void;
  deleteSecretaryAccount: (id: string) => void;
  // Notifications
  registerDeviceToken: (token: string, role: 'admin' | 'secretary', platform?: 'web' | 'android') => void;
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
          const remote = remoteData.content;
          setData((prev) => ({
            ...initialClinicData,
            ...remote,
            doctor: { ...initialClinicData.doctor, ...(remote.doctor || {}) },
            clinic: { ...initialClinicData.clinic, ...(remote.clinic || {}) },
            social: { ...initialClinicData.social, ...(remote.social || {}) },
            bookingSettings: { ...initialClinicData.bookingSettings, ...(remote.bookingSettings || {}) },
            visibility: { ...initialClinicData.visibility, ...(remote.visibility || {}) },
            socialReviewImages: Array.isArray(remote.socialReviewImages)
              ? remote.socialReviewImages
              : initialClinicData.socialReviewImages,
            bookings: Array.isArray(remote.bookings) && remote.bookings.length > 0
              ? remote.bookings
              : prev.bookings,
          }));
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

    // Setup Supabase Realtime channel so all open devices sync instantly
    const channel = client
      .channel('realtime_clinic_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_settings' },
        (payload) => {
          if (payload.new && (payload.new as any).content) {
            const newContent = (payload.new as any).content;
            setData((prev) => ({
              ...prev,
              ...newContent,
              bookingSettings: { ...prev.bookingSettings, ...(newContent.bookingSettings || {}) },
              socialReviewImages: Array.isArray(newContent.socialReviewImages)
                ? newContent.socialReviewImages
                : prev.socialReviewImages,
              secretaryAccounts: Array.isArray(newContent.secretaryAccounts)
                ? newContent.secretaryAccounts
                : prev.secretaryAccounts,
              deviceTokens: Array.isArray(newContent.deviceTokens)
                ? newContent.deviceTokens
                : prev.deviceTokens,
            }));
            setIsBackendSynced(true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        async (payload: any) => {
          // Play audio chime and trigger notification on new appointment
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            const patientName = payload.new.patient_name || 'مريض جديد';
            const apptDate = payload.new.appointment_date || '';
            const apptTime = payload.new.appointment_time || '';
            triggerLocalNotification({
              title: 'حجز كشف جديد بالعيادة! 🔔',
              body: `المريض: ${patientName} - الموعد: ${apptDate} (${apptTime})`,
              patientName,
              appointmentDate: apptDate,
              appointmentTime: apptTime,
              type: 'new_booking',
            });
          }

          try {
            const { data: updatedApts, error: err } = await client
              .from('appointments')
              .select('*')
              .order('created_at', { ascending: false });
            if (!err && updatedApts && Array.isArray(updatedApts)) {
              const mapped: BookingAppointment[] = updatedApts.map((a: any) => ({
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
              setData((prev) => ({ ...prev, bookings: mapped }));
            }
          } catch (e) {
            console.warn('Realtime appointments fetch error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const saveToSupabase = async (contentToSave?: AppContentState): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase غير مهيأ' };
    }
    try {
      setIsSaving(true);
      const payload = contentToSave || data;

      // Update existing main_settings row
      const { data: updateData, error: updateError } = await supabase
        .from('clinic_settings')
        .update({ content: payload, updated_at: new Date().toISOString() })
        .eq('key', 'main_settings')
        .select();

      if (updateError || !updateData || updateData.length === 0) {
        // If row does not exist, insert it
        const { error: insertError } = await supabase
          .from('clinic_settings')
          .insert({ key: 'main_settings', content: payload, updated_at: new Date().toISOString() });

        if (insertError) {
          console.error('Supabase save error:', insertError);
          setIsBackendSynced(false);
          setIsSaving(false);
          return { success: false, error: insertError.message };
        }
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

  const updateBookingSettings = (
    bookingUpdate: Partial<FutureBookingSettings>,
    clinicUpdate?: Partial<ClinicInfo>
  ) => {
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: { ...prev.bookingSettings, ...bookingUpdate },
        clinic: clinicUpdate ? { ...prev.clinic, ...clinicUpdate } : prev.clinic,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateVisibility = (visibilityUpdate: Partial<WebsiteVisibilitySettings>) => {
    setData((prev) => {
      const updated = {
        ...prev,
        visibility: { ...prev.visibility, ...visibilityUpdate },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateGoogleApiSettings = (apiKey: string, placeId: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        googlePlacesApiKey: apiKey,
        googlePlaceId: placeId,
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateSocialReviewImages = (images: SocialReviewImage[]) => {
    setData((prev) => {
      const updated = {
        ...prev,
        socialReviewImages: images,
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const addSocialReviewImage = (image: Omit<SocialReviewImage, 'id'>) => {
    const newImage: SocialReviewImage = {
      ...image,
      id: `rev-img-${Date.now()}`,
    };
    setData((prev) => {
      const updated = {
        ...prev,
        socialReviewImages: [newImage, ...(prev.socialReviewImages || [])],
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const deleteSocialReviewImage = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        socialReviewImages: (prev.socialReviewImages || []).filter((img) => img.id !== id),
      };
      saveToSupabase(updated);
      return updated;
    });
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

  const toggleCloseToday = (isClosed: boolean, reason?: string) => {
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          isClosedToday: isClosed,
          closedTodayReason: reason !== undefined ? reason : prev.bookingSettings.closedTodayReason || '',
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const toggleCloseDate = (dateStr: string, isClosed: boolean) => {
    setData((prev) => {
      const currentClosedDates = prev.bookingSettings.closedDates || [];
      const updatedClosedDates = isClosed
        ? Array.from(new Set([...currentClosedDates, dateStr]))
        : currentClosedDates.filter((d) => d !== dateStr);
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          closedDates: updatedClosedDates,
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const addHoliday = (holiday: Omit<ClinicHoliday, 'id' | 'createdAt'>) => {
    const newHoliday: ClinicHoliday = {
      ...holiday,
      id: `hol-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          holidays: [newHoliday, ...(prev.bookingSettings.holidays || [])],
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateHoliday = (id: string, update: Partial<ClinicHoliday>) => {
    setData((prev) => {
      const updatedHolidays = (prev.bookingSettings.holidays || []).map((h) =>
        h.id === id ? { ...h, ...update } : h
      );
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          holidays: updatedHolidays,
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const deleteHoliday = (id: string) => {
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          holidays: (prev.bookingSettings.holidays || []).filter((h) => h.id !== id),
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const addAnnouncement = (announcement: Omit<ClinicAnnouncement, 'id' | 'createdAt'>) => {
    const newAnnouncement: ClinicAnnouncement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          announcements: [newAnnouncement, ...(prev.bookingSettings.announcements || [])],
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateAnnouncement = (id: string, update: Partial<ClinicAnnouncement>) => {
    setData((prev) => {
      const updatedList = (prev.bookingSettings.announcements || []).map((a) =>
        a.id === id ? { ...a, ...update } : a
      );
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          announcements: updatedList,
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          announcements: (prev.bookingSettings.announcements || []).filter((a) => a.id !== id),
        },
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const addSecretaryAccount = (account: Omit<SecretaryAccount, 'id' | 'createdAt'>) => {
    const newAccount: SecretaryAccount = {
      ...account,
      id: `sec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        secretaryAccounts: [newAccount, ...(prev.secretaryAccounts || [])],
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const updateSecretaryAccount = (id: string, update: Partial<SecretaryAccount>) => {
    setData((prev) => {
      const updatedList = (prev.secretaryAccounts || []).map((sec) =>
        sec.id === id ? { ...sec, ...update } : sec
      );
      const updated: AppContentState = {
        ...prev,
        secretaryAccounts: updatedList,
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const deleteSecretaryAccount = (id: string) => {
    setData((prev) => {
      const updated: AppContentState = {
        ...prev,
        secretaryAccounts: (prev.secretaryAccounts || []).filter((sec) => sec.id !== id),
      };
      saveToSupabase(updated);
      return updated;
    });
  };

  const registerDeviceToken = (token: string, role: 'admin' | 'secretary', platform: 'web' | 'android' = 'web') => {
    setData((prev) => {
      const existing = prev.deviceTokens || [];
      const updatedTokens = [
        {
          id: `tok-${Date.now()}`,
          token,
          role,
          devicePlatform: platform,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        ...existing.filter((t) => t.token !== token),
      ];
      const updated: AppContentState = {
        ...prev,
        deviceTokens: updatedTokens,
      };
      saveToSupabase(updated);
      return updated;
    });
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
        toggleCloseToday,
        toggleCloseDate,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addSecretaryAccount,
        updateSecretaryAccount,
        deleteSecretaryAccount,
        registerDeviceToken,
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
