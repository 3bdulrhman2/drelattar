import {initializeApp,getApps} from 'firebase/app';
import {getMessaging,getToken,isSupported} from 'firebase/messaging';
import {supabase} from './supabase';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
// Public web push key (same one the staff registration uses).
const publicVapid='BM69UEhSEBgvPps_-hnkNweiz1BBgvKfFpkG_NENBcGWgt9qzgERN_XburrWzt2HIMQPQqitlb-Vy96QNh0X63o';
const stampKey='clinic.visitor.push.registeredAt';
const weekMs=7*24*60*60*1000;
/** Call only after the visitor allowed notifications. Saves the device so the clinic can broadcast to it. */
export async function enableVisitorPush(force=false):Promise<boolean>{
 try{
  if(!supabase||typeof Notification==='undefined'||Notification.permission!=='granted'||!await isSupported())return false;
  if(!force){const last=Number(localStorage.getItem(stampKey)||0);if(last&&Date.now()-last<weekMs)return true;}
  const registration=await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const app=getApps()[0]??initializeApp(config);
  const token=await getToken(getMessaging(app),{vapidKey:publicVapid,serviceWorkerRegistration:registration});
  if(!token)return false;
  const {error}=await supabase.functions.invoke('visitor-push-register',{body:{action:'register',token}});
  if(error)return false;
  localStorage.setItem(stampKey,String(Date.now()));return true;
 }catch(e){console.warn('Visitor push registration failed:',e);return false;}
}
