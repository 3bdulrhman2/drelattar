// ========================================================
// Dr. Mohammed Elsayed Elattar Clinic
// Web & Mobile Push Notification Infrastructure
// ========================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  bookingId?: string;
  patientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  type?: 'new_booking' | 'status_change' | 'announcement';
}

/**
 * Registers browser service worker for web push if supported.
 */
export const registerWebPushServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Push service worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Request notification permission from the user in browser.
 */
export const requestWebNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Records device token in Supabase for broadcast.
 */
export const saveDeviceTokenToSupabase = async (
  token: string,
  role: 'admin' | 'secretary' | 'all' = 'admin',
  platform: 'web' | 'android' = 'web'
): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    // 1. Fetch current settings
    const { data: currentSettings } = await supabase
      .from('clinic_settings')
      .select('content')
      .eq('key', 'main_settings')
      .single();

    if (currentSettings?.content) {
      const content = currentSettings.content;
      const existingTokens = content.deviceTokens || [];
      const updatedTokens = [
        {
          id: `tok-${Date.now()}`,
          token,
          role,
          devicePlatform: platform,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        ...existingTokens.filter((t: any) => t.token !== token),
      ];

      await supabase
        .from('clinic_settings')
        .update({
          content: { ...content, deviceTokens: updatedTokens },
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'main_settings');

      return true;
    }
  } catch (e) {
    console.warn('Failed to save device token in Supabase:', e);
  }

  return false;
};

/**
 * Plays a soft, high-fidelity medical clinic notification chime using Web Audio API.
 * Does not depend on external MP3 files and works seamlessly across all modern browsers.
 */
export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic Note 1: 659.25 Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // ramp to A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Harmonic Note 2: 1318.51 Hz (E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.14);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.28, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.log('Audio chime not available or suspended:', e);
  }
};

/**
 * Dispatches an in-browser local notification and plays pleasant chime alert.
 */
export const triggerLocalNotification = (payload: PushNotificationPayload) => {
  // Always trigger audio chime
  playNotificationSound();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/brand/clinic-logo.png',
        badge: '/favicon.svg',
        dir: 'rtl',
        lang: 'ar',
      });
    } catch (e) {
      console.log('Local notification display note:', e);
    }
  }
};
