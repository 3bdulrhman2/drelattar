// ========================================================
// Dr. Mohammed Elsayed Elattar Clinic
// Firebase Cloud Messaging Service Worker for Web Push
// ========================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Official Firebase config for Dr. Elattar Clinic project
const firebaseConfig = {
  apiKey: "AIzaSyB0CX4kNXIu_yKgcpQGcSVyNR4rfXWMhus",
  authDomain: "drelattarclinic.firebaseapp.com",
  projectId: "drelattarclinic",
  storageBucket: "drelattarclinic.firebasestorage.app",
  messagingSenderId: "75146239883",
  appId: "1:75146239883:web:9fb39ec1d616370d6bd98e",
  measurementId: "G-ST5XMXMVBT"
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
