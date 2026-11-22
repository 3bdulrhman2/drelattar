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
import { useAuth } from './AuthContext';
import { publicContent, persistBooking } from '../lib/clinicSecurity';
import type { BookingReceipt } from '../lib/clinicSecurity';

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
  addBookingAppointment: (appointment: Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>, requestId: string) => Promise<BookingReceipt>;
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
  const {user} = useAuth();
  const cleanInitial = (): AppContentState => ({...initialClinicData, bookings:[], secretaryAccounts:[], deviceTokens:[]});
  const [data, setData] = useState<AppContentState>(cleanInitial);
  const [isBackendSynced, setIsBackendSynced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState('');
  const latestDataRef = useRef(data);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staffVersion = useRef(0);
  const contentRevision = useRef(0);
  const contentDirty = useRef(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const reloadBookings = async () => {
    const version = staffVersion.current;
    if (!supabase || !user) return;
    const {data: rows, error} = await supabase.from('appointments')
      .select('id,patient_name,patient_phone,appointment_date,appointment_time,status,created_at')
      .order('created_at', {ascending:false});
    if (version !== staffVersion.current) return;
    if (error) {setLastError('تعذر تحميل الحجوزات المحمية.'); return;}
    setData(prev=>({...prev,bookings:(rows||[]).map(a=>({id:a.id,patientName:a.patient_name,
      patientPhone:a.patient_phone,appointmentDate:a.appointment_date,appointmentTime:a.appointment_time,
      status:a.status,createdAt:a.created_at}))}));
  };
  useEffect(() => {
    const version = ++staffVersion.current;
    ++contentRevision.current;contentDirty.current=false;
    let active = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setData(prev=>({...prev,bookings:[],secretaryAccounts:[],deviceTokens:[]}));
    const loadPublic = async () => {
      if (!supabase) {setIsBackendSynced(false);return;}
      const revision = contentRevision.current;
      const {data: row,error} = await supabase.from('clinic_settings').select('content')
        .eq('key','main_settings').maybeSingle();
      if (!active || version !== staffVersion.current || contentDirty.current || revision !== contentRevision.current) return;
      if (error || !row) {setIsBackendSynced(false);return;}
      const safe = publicContent(row.content || {});
      setData(prev=>({...cleanInitial(),...safe,
        doctor:{...initialClinicData.doctor,...safe.doctor},clinic:{...initialClinicData.clinic,...safe.clinic},
        social:{...initialClinicData.social,...safe.social},visibility:{...initialClinicData.visibility,...safe.visibility},
        bookingSettings:{...initialClinicData.bookingSettings,...safe.bookingSettings},bookings:prev.bookings}));
      setIsBackendSynced(true);
    };
    void loadPublic();
    if (!supabase) return () => {active=false;};
    if (user) void reloadBookings();
    const channel = supabase.channel('clinic-review-'+(user?.id||'public'))
      .on('postgres_changes',{event:'*',schema:'public',table:'clinic_settings'},()=>{void loadPublic();});
    if (user) channel.on('postgres_changes',{event:'*',schema:'public',table:'clinic_booking_sync'},()=>{void reloadBookings();});
    let catchUp:ReturnType<typeof setTimeout>|undefined;
    channel.subscribe(status=>{if(status==='SUBSCRIBED'){void loadPublic();if(user)void reloadBookings();if(catchUp)clearTimeout(catchUp);catchUp=setTimeout(()=>{void loadPublic();if(user)void reloadBookings();},1500);}});
    const refreshVisible = () => {if(document.visibilityState==='visible'){void loadPublic();if(user)void reloadBookings();}};
    window.addEventListener('focus',refreshVisible);document.addEventListener('visibilitychange',refreshVisible);
    return () => {if(catchUp)clearTimeout(catchUp);window.removeEventListener('focus',refreshVisible);document.removeEventListener('visibilitychange',refreshVisible);active=false;++staffVersion.current;if(syncTimeoutRef.current)clearTimeout(syncTimeoutRef.current);void supabase?.removeChannel(channel);};
  }, [user?.id,user?.role]);
  useEffect(()=>{latestDataRef.current=data;},[data]);
  const flushSyncToBackend = (next: AppContentState): Promise<boolean> => {
    if (!supabase || user?.role!=='admin') {setLastError('لم يتم الحفظ: يلزم اتصال وحساب إدارة مخول.');return Promise.resolve(false);}
    const client=supabase, revision=contentRevision.current, staff=staffVersion.current;
    const content=publicContent(next);
    ++pendingSaves.current;setIsSaving(true);
    const operation=saveQueue.current.then(async()=>{
      try {
        if(staff!==staffVersion.current)return false;
        const {data:saved,error}=await client.from('clinic_settings')
          .update({content,updated_at:new Date().toISOString()})
          .eq('key','main_settings').select('key').single();
        if(error||!saved)throw error||new Error('No saved row');
        if(staff===staffVersion.current&&revision===contentRevision.current){contentDirty.current=false;setLastError('');setIsBackendSynced(true);}
        return true;
      } catch {
        if(staff===staffVersion.current){setLastError('لم يتم حفظ التغييرات. لا تعتمد عليها قبل نجاح الحفظ.');setIsBackendSynced(false);}
        return false;
      } finally {if(--pendingSaves.current===0)setIsSaving(false);}
    });
    saveQueue.current=operation;
    return operation;
  };
  const syncUpdatedState = (updater: AppContentState | ((prev:AppContentState)=>AppContentState), immediate=false) => {
    if (user?.role!=='admin') {setLastError('لا تملك صلاحية تعديل إعدادات الموقع.');return;}
    const next=typeof updater==='function'?updater(latestDataRef.current):updater;
    ++contentRevision.current;contentDirty.current=true;
    latestDataRef.current=next;setData(next);setIsBackendSynced(false);
    if(syncTimeoutRef.current)clearTimeout(syncTimeoutRef.current);
    if(immediate)void flushSyncToBackend(next);
    else syncTimeoutRef.current=setTimeout(()=>{void flushSyncToBackend(latestDataRef.current);},200);
  };
  const saveToSupabase = async (content?:AppContentState) => {
    if(syncTimeoutRef.current)clearTimeout(syncTimeoutRef.current);
    const success=await flushSyncToBackend(content||latestDataRef.current);
    return {success,error:success?undefined:'لم يتم الحفظ'};
  };
  const publishBroadcastNotification = async (title:string,message:string,type:'info'|'warning'|'alert'|'special_offer'='info',pin=true) => {
    if(user?.role!=='admin'||!pin)return false;
    const prev=latestDataRef.current;
    const next:AppContentState={...prev,bookingSettings:{...prev.bookingSettings,announcements:[{
      id:crypto.randomUUID(),title,content:message,type:type==='special_offer'?'info':type,
      isActive:true,createdBy:'admin',createdAt:new Date().toISOString(),
    },...(prev.bookingSettings.announcements||[])]}};
    const ok=await flushSyncToBackend(next);
    if(ok){latestDataRef.current=next;setData(next);}return ok;
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
    }), true);
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

  const addBookingAppointment = async (
    appointment: Omit<BookingAppointment,'id'|'createdAt'|'status'>, requestId:string
  ):Promise<BookingReceipt> => {
    // No optimistic patient record, localStorage write, or temporary booking reference.
    const receipt=await persistBooking(supabase,appointment,requestId);
    if(user)void reloadBookings();
    return receipt;
  };
  const updateBookingStatus = async (id:string,status:BookingAppointment['status']) => {
    if(!supabase||!user){setLastError('يلزم تسجيل دخول مخول.');return;}
    const {data:saved,error}=await supabase.from('appointments').update({status}).eq('id',id).select('id').single();
    if(error||!saved){setLastError('لم تتغير حالة الحجز. أعد المحاولة.');return;}
    setLastError('');setData(prev=>({...prev,bookings:prev.bookings.map(b=>b.id===id?{...b,status}:b)}));
  };
  const deleteBookingAppointment = async (id:string) => {
    if(!supabase||user?.role!=='admin'){setLastError('يلزم حساب إدارة مخول.');return;}
    const {data:saved,error}=await supabase.from('appointments').delete().eq('id',id).select('id').single();
    if(error||!saved){setLastError('لم يتم حذف الحجز.');return;}
    setLastError('');setData(prev=>({...prev,bookings:prev.bookings.filter(b=>b.id!==id)}));
  };

  const toggleCloseToday = (isClosed: boolean, reason?: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        isClosedToday: isClosed,
        closedTodayReason: reason !== undefined ? reason : prev.bookingSettings.closedTodayReason || '',
      },
    }), true);
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
    }, true);
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
    }), true);
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
    }, true);
  };

  const deleteHoliday = (id: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        holidays: (prev.bookingSettings.holidays || []).filter((h) => h.id !== id),
      },
    }), true);
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
    }), true);
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
    }, true);
  };

  const deleteAnnouncement = (id: string) => {
    syncUpdatedState((prev) => ({
      ...prev,
      bookingSettings: {
        ...prev.bookingSettings,
        announcements: (prev.bookingSettings.announcements || []).filter((a) => a.id !== id),
      },
    }), true);
  };

  const privateManagementUnavailable = (..._args:unknown[]) => {setLastError('هذه العملية تحتاج مساراً محمياً منفصلاً. لم تُحفظ بيانات خاصة داخل محتوى الموقع.');};
  const addSecretaryAccount=privateManagementUnavailable;
  const updateSecretaryAccount=privateManagementUnavailable;
  const deleteSecretaryAccount=privateManagementUnavailable;
  const registerDeviceToken=privateManagementUnavailable;
  const resetToDefault=()=>{syncUpdatedState(cleanInitial());};

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
      {lastError && <div role="alert" dir="rtl" className="fixed top-0 inset-x-0 z-[100] bg-red-900 text-white p-3 text-center">{lastError}</div>}
      {import.meta.env.MODE==='isolated' && <div role="note" dir="rtl" className="bg-amber-200 text-black p-2 text-center font-bold">نسخة اختبار محلية معزولة. بيانات وهمية فقط، لا رسائل ولا حجوزات حقيقية.</div>}
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
