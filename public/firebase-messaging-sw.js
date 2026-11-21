// ========================================================
// Dr. Mohammed Elsayed Elattar Clinic
// Firebase Cloud Messaging Service Worker for Web Push
// ========================================================
// NOTE: Firebase config values are injected at build time
// by the Vite plugin (inject-firebase-sw-config) in vite.config.ts.
// The __VITE_FIREBASE_*__ placeholders below are replaced with
// the actual Vercel Environment Variable values during `vite build`.
// Never put real API keys here — this file is committed to GitHub.
// ========================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config — values injected at build time from Vercel env vars
const firebaseConfig = {
  apiKey:            "__VITE_FIREBASE_API_KEY__",
  authDomain:        "__VITE_FIREBASE_AUTH_DOMAIN__",
  projectId:         "__VITE_FIREBASE_PROJECT_ID__",
  storageBucket:     "__VITE_FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  appId:             "__VITE_FIREBASE_APP_ID__",
  measurementId:     "__VITE_FIREBASE_MEASUREMENT_ID__",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد من عيادة د. محمد السيد العطار';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'لديك موعد حجز جديد بالعيادة.',
      icon: '/brand/clinic-logo.png',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      data: payload.data || {},
      actions: [
        { action: 'open_booking', title: 'عرض الحجز' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[firebase-messaging-sw.js] Firebase SW initialization notice:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
