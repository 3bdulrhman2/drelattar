// Staff manual push only. Public Firebase client configuration is injected by Vite.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
const firebaseConfig={apiKey:'__VITE_FIREBASE_API_KEY__',authDomain:'__VITE_FIREBASE_AUTH_DOMAIN__',projectId:'__VITE_FIREBASE_PROJECT_ID__',storageBucket:'__VITE_FIREBASE_STORAGE_BUCKET__',messagingSenderId:'__VITE_FIREBASE_MESSAGING_SENDER_ID__',appId:'__VITE_FIREBASE_APP_ID__'};
try{firebase.initializeApp(firebaseConfig);const messaging=firebase.messaging();
// Notification payloads are displayed by Firebase. Do not show a duplicate.
messaging.onBackgroundMessage((payload)=>{if(payload.notification||payload.data?.type!=='staff_manual')return;self.registration.showNotification(payload.data.title||'إشعار فريق العيادة',{body:payload.data.body||'',icon:'/brand/clinic-logo.png',dir:'rtl',lang:'ar',data:{url:'/admin'}});});
}catch{/* Invalid or absent public configuration means no registration. */}
self.addEventListener('notificationclick',(event)=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async(windows)=>{const target=new URL('/admin',self.location.origin).href;const existing=windows.find(c=>c.url===target);if(existing)return existing.focus();return clients.openWindow(target);}));});
