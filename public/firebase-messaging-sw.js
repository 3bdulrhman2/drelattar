// ========================================================
// Dr. Mohammed Elsayed Elattar Clinic
// Firebase Cloud Messaging Service Worker for Web Push
// ========================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Standard Firebase config placeholder (populated from environment or Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY",
  authDomain: "drelattar-clinic.firebaseapp.com",
  projectId: "drelattar-clinic",
  storageBucket: "drelattar-clinic.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
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
