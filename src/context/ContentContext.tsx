import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  // Notifications & Announcements Broadcast
  publishBroadcastNotification: (
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'alert' | 'special_offer',
    pinToBanner?: boolean
  ) => Promise<boolean>;
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
          .eq('key', 'main_settings')
          .maybeSingle();

        if (error) {
          console.warn('Supabase fetch notice:', error.message);
          setIsBackendSynced(false);
        } else if (!remoteData) {
          // If record does not exist yet, seed it with initial clinic content
          await client.from('clinic_settings').insert({
            key: 'main_settings',
            content: data,
            updated_at: new Date().toISOString()
          });
          setIsBackendSynced(true);
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

  // Dedicated refs to manage debounced non-blocking sync
  const latestDataRef = useRef<AppContentState>(data);
  const syncTimeoutRef = useRef<any>(null);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  // Non-blocking background flush with strict 3.5s timeout race
  const flushSyncToBackend = async (stateToSave: AppContentState): Promise<boolean> => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    if (!isSupabaseConfigured || !supabase) {
      return true;
    }

    const client = supabase;
    setIsSaving(true);

    try {
      const updatePromise = client
        .from('clinic_settings')
        .update({ content: stateToSave, updated_at: new Date().toISOString() })
        .eq('key', 'main_settings');

      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Background sync timeout')), 3500)
      );

      const result = (await Promise.race([updatePromise, timeoutPromise])) as any;

      if (result && result.error) {
        // Fallback to upsert if row did not exist
        await client
          .from('clinic_settings')
          .upsert(
            { key: 'main_settings', content: stateToSave, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
      }
      setIsBackendSynced(true);
      return true;
    } catch (err) {
      console.warn('Non-blocking cloud sync notice (locally saved 100%):', err);
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const syncUpdatedState = (
    updater: AppContentState | ((prev: AppContentState) => AppContentState)
  ) => {
    // 1. Instant synchronous UI and LocalStorage update (0ms lag)
    setData((prev) => {
      const nextState = typeof updater === 'function' ? updater(prev) : updater;
      latestDataRef.current = nextState;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextState));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return nextState;
    });

    // 2. Debounced background cloud sync (400ms debounce)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      flushSyncToBackend(latestDataRef.current);
    }, 400);
  };

  const saveToSupabase = async (contentToSave?: AppContentState): Promise<{ success: boolean; error?: string }> => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    const payload = contentToSave || latestDataRef.current || data;
    await flushSyncToBackend(payload);
    return { success: true };
  };

  const publishBroadcastNotification = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'alert' | 'special_offer' = 'info',
    pinToBanner: boolean = true
  ): Promise<boolean> => {
    try {
      // 1. If pinToBanner, immediately add to announcements in state so it appears in 0ms!
      if (pinToBanner) {
        const newAnnouncement: ClinicAnnouncement = {
          id: `ann-${Date.now()}`,
          title,
          content: message,
          type: type === 'special_offer' ? 'info' : type,
          isActive: true,
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
        };

        const existingList = latestDataRef.current.bookingSettings.announcements || [];
        const nextList = [newAnnouncement, ...existingList.filter((a) => a.title !== title)];

        syncUpdatedState((prev) => ({
          ...prev,
          bookingSettings: {
            ...prev.bookingSettings,
            announcements: nextList,
          },
        }));
      }

      // 2. Play chime and show local alert
      triggerLocalNotification({
        title,
        body: message,
        type: 'announcement',
      });

      // 3. Fire-and-forget Supabase Realtime broadcast (DO NOT AWAIT or BLOCK)
      if (isSupabaseConfigured && supabase) {
        try {
          const broadcastChannel = supabase.channel('realtime_clinic_settings');
          broadcastChannel.send({
            type: 'broadcast',
            event: 'new_announcement',
            payload: { title, message, type },
          }).catch(() => {});
        } catch (e) {
          console.warn('Broadcast realtime notice:', e);
        }
      }

      return true;
    } catch (e) {
      console.error('Error publishing broadcast notification:', e);
      return false;
    }
  };

  const updateDoctor = (doctorUpdate: Partial<DoctorInfo>) => {
    syncUpdatedState((prev) => ({
      ...prev,
      doctor: { ...prev.doctor, ...doctorUpdate },
    }));
  };

  const updateClinic = (clinicUpdate: Partial<ClinicInfo>) => {
    syncUpdatedState((prev) => ({
      ...prev,
      clinic: { ...prev.clinic, ...clinicUpdate },
    }));
  };

  const updateServices = (services: MedicalService[]) => {
    syncUpdatedState((prev) => ({ ...prev, services }));
  };

  const updateEquipment = (equipment: MedicalEquipment[]) => {
    syncUpdatedState((prev) => ({ ...prev, equipment }));
  };

  const updateFAQ = (faq: FAQItem[]) => {
    syncUpdatedState((prev) => ({ ...prev, faq }));
  };

  const updateSocial = (socialUpdate: Partial<SocialLinks>) => {
    syncUpdatedState((prev) => ({
      ...prev,
      social: { ...prev.social, ...socialUpdate },
    }));
  };

  const updateBookingSettings = (
    bookingUpdate: Partial<FutureBookingSettings>,
    clinicUpdate?: Partial<ClinicInfo>
  ) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: { ...prev.bookingSettings, ...bookingUpdate },
      clinic: clinicUpdate ? { ...prev.clinic, ...clinicUpdate } : prev.clinic,
    }));
  };

  const updateVisibility = (visibilityUpdate: Partial<WebsiteVisibilitySettings>) => {
    syncUpdatedState((prev) => ({
      ...prev,
      visibility: { ...prev.visibility, ...visibilityUpdate },
    }));
  };

  const updateGoogleApiSettings = (apiKey: string, placeId: string) => {
    syncUpdatedState({
      ...data,
      googlePlacesApiKey: apiKey,
      googlePlaceId: placeId,
    });
  };

  const updateSocialReviewImages = (images: SocialReviewImage[]) => {
    syncUpdatedState({
      ...data,
      socialReviewImages: images,
    });
  };

  const addSocialReviewImage = (image: Omit<SocialReviewImage, 'id'>) => {
    const newImage: SocialReviewImage = {
      ...image,
      id: `rev-img-${Date.now()}`,
    };
    syncUpdatedState({
      ...data,
      socialReviewImages: [newImage, ...(data.socialReviewImages || [])],
    });
  };

  const deleteSocialReviewImage = (id: string) => {
    syncUpdatedState({
      ...data,
      socialReviewImages: (data.socialReviewImages || []).filter((img) => img.id !== id),
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
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        isClosedToday: isClosed,
        closedTodayReason: reason !== undefined ? reason : prev.bookingSettings.closedTodayReason || '',
      },
    }));
  };

  const toggleCloseDate = (dateStr: string, isClosed: boolean) => {
    syncUpdatedState((prev) => {
      const currentClosedDates = prev.bookingSettings.closedDates || [];
      const updatedClosedDates = isClosed
        ? Array.from(new Set([...currentClosedDates, dateStr]))
        : currentClosedDates.filter((d) => d !== dateStr);
      return {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          closedDates: updatedClosedDates,
        },
      };
    });
  };

  const addHoliday = (holiday: Omit<ClinicHoliday, 'id' | 'createdAt'>) => {
    const newHoliday: ClinicHoliday = {
      ...holiday,
      id: `hol-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        holidays: [newHoliday, ...(prev.bookingSettings.holidays || [])],
      },
    }));
  };

  const updateHoliday = (id: string, update: Partial<ClinicHoliday>) => {
    syncUpdatedState((prev) => {
      const updatedHolidays = (prev.bookingSettings.holidays || []).map((h) =>
        h.id === id ? { ...h, ...update } : h
      );
      return {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          holidays: updatedHolidays,
        },
      };
    });
  };

  const deleteHoliday = (id: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        holidays: (prev.bookingSettings.holidays || []).filter((h) => h.id !== id),
      },
    }));
  };

  const addAnnouncement = (announcement: Omit<ClinicAnnouncement, 'id' | 'createdAt'>) => {
    const newAnnouncement: ClinicAnnouncement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        announcements: [newAnnouncement, ...(prev.bookingSettings.announcements || [])],
      },
    }));
  };

  const updateAnnouncement = (id: string, update: Partial<ClinicAnnouncement>) => {
    syncUpdatedState((prev) => {
      const updatedList = (prev.bookingSettings.announcements || []).map((a) =>
        a.id === id ? { ...a, ...update } : a
      );
      return {
        ...prev,
        bookingSettings: {
          ...prev.bookingSettings,
          announcements: updatedList,
        },
      };
    });
  };

  const deleteAnnouncement = (id: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        announcements: (prev.bookingSettings.announcements || []).filter((a) => a.id !== id),
      },
    }));
  };

  const addSecretaryAccount = (account: Omit<SecretaryAccount, 'id' | 'createdAt'>) => {
    const newAccount: SecretaryAccount = {
      ...account,
      id: `sec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    syncUpdatedState((prev) => ({
      ...prev,
      secretaryAccounts: [newAccount, ...(prev.secretaryAccounts || [])],
    }));
  };

  const updateSecretaryAccount = (id: string, update: Partial<SecretaryAccount>) => {
    syncUpdatedState((prev) => {
      const updatedList = (prev.secretaryAccounts || []).map((sec) =>
        sec.id === id ? { ...sec, ...update } : sec
      );
      return {
        ...prev,
        secretaryAccounts: updatedList,
      };
    });
  };

  const deleteSecretaryAccount = (id: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      secretaryAccounts: (prev.secretaryAccounts || []).filter((sec) => sec.id !== id),
    }));
  };

  const registerDeviceToken = (token: string, role: 'admin' | 'secretary', platform: 'web' | 'android' = 'web') => {
    syncUpdatedState((prev) => {
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
      return {
        ...prev,
        deviceTokens: updatedTokens,
      };
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
        publishBroadcastNotification,
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
