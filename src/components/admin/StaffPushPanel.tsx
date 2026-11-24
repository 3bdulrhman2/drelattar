import React,{useState,useRef,useEffect} from 'react';
import {useAuth} from '../../context/AuthContext';
import {supabase} from '../../lib/supabase';
import {enableStaffDevice} from '../../lib/staffDeviceRegistration';
export const StaffPushPanel:React.FC=()=>{
 const {user}=useAuth();const [title,setTitle]=useState(''),[body,setBody]=useState(''),[result,setResult]=useState(''),[busy,setBusy]=useState(false);
 const attempt=useRef<{text:string,id:string}|null>(null);
 const [ready,setReady]=useState(false);useEffect(()=>{supabase?.functions.invoke('staff-manual-push',{body:{action:'status'}}).then(r=>setReady(!r.error&&r.data?.sendingReady===true)).catch(()=>setReady(false));},[]);
 const enable=async()=>{setBusy(true);try{setResult(await enableStaffDevice()?'تم تسجيل هذا الجهاز لاستقبال إشعارات الفريق':'لم يتم تسجيل الجهاز. راجع إذن المتصفح واتصال الإنترنت');}catch{setResult('تعذر تأكيد تسجيل الجهاز');}finally{setBusy(false)}};
 const send=async()=>{if(!ready||busy||user?.role!=='admin'||!title.trim()||!body.trim())return;
  if(!confirm('إرسال إلى أجهزة الدكتور والسكرتارية المسجلة فقط؟\n\n'+title.trim()+'\n'+body.trim()))return;
  const text=title.trim()+'\n'+body.trim();if(attempt.current?.text!==text)attempt.current={text,id:crypto.randomUUID()};
  setBusy(true);try{const r=await supabase!.functions.invoke('staff-manual-push',{body:{request_id:attempt.current!.id,action:'send',title:title.trim(),body:body.trim()}});if(r.error)throw r.error;setResult(`قبلت خدمة الإشعارات ${r.data.accepted??0} جهاز. تعذر ${r.data.failed??0}. القبول ليس تأكيد وصول.`);}catch{setResult('تعذر تأكيد الإرسال. لا تعاود الإرسال قبل المراجعة لتجنب التكرار.');}finally{setBusy(false)}
 };
 return <section dir="rtl" className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-white space-y-4"><h2 className="font-bold">إشعارات فريق العيادة</h2><p className="text-sm text-slate-300">إشعارات يدوية للدكتور والسكرتارية فقط. لا تُرسل للمرضى ولا تُنشر على الموقع.</p>
 {!ready&&<p className="text-amber-300 text-sm">الإرسال غير مفعّل حاليًا. يمكنك تفعيل الاستقبال على هذا المتصفح.</p>}
 <button disabled={busy} onClick={enable} className="rounded-lg border p-3 disabled:opacity-50">تفعيل الاستقبال على هذا المتصفح</button>
 {user?.role==='admin'&&<div className="space-y-3"><input aria-label="عنوان إشعار الفريق" className="w-full p-3 rounded-lg bg-slate-800" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان الإشعار"/><textarea aria-label="نص إشعار الفريق" className="w-full p-3 rounded-lg bg-slate-800" rows={4} maxLength={500} value={body} onChange={e=>setBody(e.target.value)} placeholder="نص الإشعار"/><button disabled={!ready||busy} onClick={send} className="rounded-lg border p-3 disabled:opacity-50">مراجعة وإرسال للفريق</button></div>}
 {result&&<p role="status">{result}</p>}</section>
};
