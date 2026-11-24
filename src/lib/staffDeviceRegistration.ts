import {initializeApp,getApps} from 'firebase/app';
import {getMessaging,getToken,deleteToken,isSupported,onMessage} from 'firebase/messaging';
import {supabase} from './supabase';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
// Public VAPID configuration, generated in clinic Firebase under approved setup.
const publicVapid='BM69UEhSEBgvPps_-hnkNweiz1BBgvKfFpkG_NENBcGWgt9qzgERN_XburrWzt2HIMQPQqitlb-Vy96QNh0X63o';
const tokenKey='clinic.staff.push.token';
let currentToken:string|null=null;
try{currentToken=localStorage.getItem(tokenKey);}catch{}
let stopForeground:(()=>void)|null=null;
const app=()=>getApps()[0]??initializeApp(config);
/** Call only from an authenticated staff user's explicit opt-in gesture. */
export async function enableStaffDevice():Promise<boolean>{
 if(!supabase||!await isSupported())return false;
 const {data:{user}}=await supabase.auth.getUser();if(!user)return false;
 const {data:member,error}=await supabase.from('clinic_staff').select('role,is_active').eq('user_id',user.id).maybeSingle();
 if(error||!member?.is_active||!['admin','secretary'].includes(member.role))return false;
 if(await Notification.requestPermission()!=='granted')return false;
 const registration=await navigator.serviceWorker.register('/firebase-messaging-sw.js');
 const token=await getToken(getMessaging(app()),{vapidKey:publicVapid,serviceWorkerRegistration:registration});if(!token)return false;
 const {error:failure}=await supabase.functions.invoke('staff-devices',{body:{action:'register',token,platform:'web'}});
 if(failure){try{await deleteToken(getMessaging(app()));}catch{}return false;}currentToken=token;localStorage.setItem(tokenKey,token);
 stopForeground?.();stopForeground=onMessage(getMessaging(app()),async(payload)=>{
   if(payload.data?.type!=='staff_manual')return;
   const {data:{user:current}}=await supabase!.auth.getUser();if(current?.id!==user.id)return;
   const {data:active}=await supabase!.from('clinic_staff').select('is_active,role').eq('user_id',user.id).maybeSingle();
   if(!active?.is_active||!['admin','secretary'].includes(active.role))return;
   await registration.showNotification(payload.notification?.title||'إشعار فريق العيادة',{body:payload.notification?.body||'',icon:'/brand/clinic-logo.png',dir:'rtl',lang:'ar'});
 });return true;
}
/** If false, show a logout error rather than silently leave another user registered. */
export async function disableStaffDeviceBeforeLogout():Promise<boolean>{
 if(!currentToken)return true;if(!supabase)return false;
 let removed=false,invalidated=false;
 try{const {error}=await supabase.functions.invoke('staff-devices',{body:{action:'unregister',token:currentToken}});removed=!error;}catch{}
 try{invalidated=await deleteToken(getMessaging(app()));}catch{}
 if(removed||invalidated){stopForeground?.();stopForeground=null;currentToken=null;localStorage.removeItem(tokenKey);return true;}return false;
}
