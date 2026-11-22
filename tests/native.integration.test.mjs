import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';

// This test must never use a hosted project. Only an explicitly supplied local
// status file is accepted. It contains disposable local keys, never clinic keys.
const statusPath=process.env.CLINIC_NATIVE_STATUS;
assert.ok(statusPath,'Set CLINIC_NATIVE_STATUS to disposable local CLI status JSON');
const status=JSON.parse(await readFile(statusPath,'utf8'));
assert.equal(status.runtime,'native');assert.equal(status.readiness,'ready');
const env=status.env;
for(const key of ['API_URL','DB_URL'])assert.equal(new URL(env[key]).hostname,'127.0.0.1');
for(const service of status.services)for(const endpoint of Object.values(service.endpoints))assert.equal(endpoint.address,'127.0.0.1');
const database=new pg.Client({connectionString:env.DB_URL});await database.connect();
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const make=()=>createClient(env.API_URL,env.PUBLISHABLE_KEY,options);
const adminAPI=createClient(env.API_URL,env.SECRET_KEY,options);
const anon=make(),staff=make(),admin=make(),outsider=make(),inactive=make();
const clients=[anon,staff,admin,outsider,inactive,adminAPI];
let checks=0;const findings=[];const channels=[];
const ok=async(label,fn)=>{await fn();++checks;console.log('PASS',label);};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const eventually=async(fn,ms=10000)=>{const until=Date.now()+ms;let value;do{value=await fn();if(value)return value;await delay(150);}while(Date.now()<until);throw Error('Local condition timed out');};
const resultData=result=>{assert.equal(result.error,null,result.error?.message);return result.data;};
const identities={};
const signup=async(label,client)=>{
 const email=`clinic-native-${label}-${randomUUID()}@example.invalid`;
 const password=randomBytes(32).toString('base64url')+'aA9!';
 const created=resultData(await adminAPI.auth.admin.createUser({email,password,email_confirm:true}));
 identities[label]={id:created.user.id,email,password};
 const signed=resultData(await client.auth.signInWithPassword({email,password}));
 assert.equal(signed.user.id,created.user.id);return signed.session;
};
const rpc=(date,time,id=randomUUID(),client=anon,name='مريض اصطناعي محلي')=>client.rpc('book_appointment',{
 p_request_id:id,p_patient_name:name,p_patient_phone:'01000000000',p_date:date,p_time:time});
const query=async(sql,values=[])=>database.query(sql,values);
const listen=async(client,label,events,requireSubscribed=true,table='clinic_booking_sync')=>{
 const channel=client.channel('native-test-'+label+'-'+randomUUID()).on('postgres_changes',{
  event:'*',schema:'public',table},payload=>events.push(payload));
 channels.push([client,channel]);
 // Realtime can acknowledge the channel before its database subscription is
 // active. This local readiness pause is followed by an actual event assertion.
 const joined=await new Promise(resolve=>{
  const timer=setTimeout(()=>resolve('TIMEOUT'),5000);
  channel.subscribe(state=>{if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state)){clearTimeout(timer);resolve(state);}});
 });
 if(requireSubscribed)assert.equal(joined,'SUBSCRIBED');return joined;
};
try{
 // Explicitly reset only this already-verified disposable loopback fixture.
 if(process.env.CLINIC_NATIVE_RESET==='1') {
  const existing=await query("SELECT to_regclass('public.appointments') present");
  if(existing.rows[0].present)assert.equal((await query("SELECT count(*)::int n FROM appointments WHERE patient_phone<>'01000000000' OR patient_name<>'مريض اصطناعي محلي'")).rows[0].n,0);
  await query('DROP TABLE IF EXISTS appointments,clinic_settings,clinic_staff,clinic_booking_sync CASCADE');
 }
 await database.query(await readFile(new URL('../review/clinic-security.sql',import.meta.url),'utf8'));
 const settings={doctor:{nameAr:'عيادة اختبار محلية'},clinic:{address:'عنوان اختبار محلي'},bookingSettings:{
 isEnabled:true,allowedDays:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
 startTime:'09:00',endTime:'23:00',startTimeFriday:'09:00',endTimeFriday:'23:00',slotDurationMinutes:60,
 maxAdvanceDays:14,maxDailyBookings:25,closedDates:[],holidays:[]}};
 await query('INSERT INTO clinic_settings(key,content) VALUES($1,$2)',['main_settings',settings]);
 const {rows:[dates]}=await query(`SELECT ((now() AT TIME ZONE 'Africa/Cairo')::date+1)::text tomorrow,((now() AT TIME ZONE 'Africa/Cairo')::date+2)::text later`);
 const date=dates.tomorrow;
 await query(`NOTIFY pgrst,'reload schema'`);
 await eventually(async()=>!(await anon.from('clinic_settings').select('content')).error);
 await ok('real PostgreSQL migration, PostgREST schema and loopback-only endpoints are ready',async()=>{
  assert.equal((await query('SELECT version()')).rows.length,1);assert.equal(resultData(await anon.from('clinic_settings').select('content')).length,1);
 });
 let staffSession;
 await ok('real local Auth admin-provisions confirmed synthetic users without signup or email',async()=>{
  staffSession=await signup('secretary',staff);await signup('admin',admin);await signup('outsider',outsider);await signup('inactive',inactive);
 });
 await query(`INSERT INTO clinic_staff(user_id,role,name,is_active) VALUES($1,'secretary','synthetic secretary',true),($2,'admin','synthetic admin',true),($3,'secretary','synthetic inactive',false)`,[identities.secretary.id,identities.admin.id,identities.inactive.id]);
 await ok('real Auth identity resolves to server-owned active staff membership',async()=>{
  const rows=resultData(await staff.from('clinic_staff').select('role').eq('user_id',identities.secretary.id));assert.equal(rows[0].role,'secretary');
  assert.equal(resultData(await inactive.from('clinic_staff').select('role')).length,0);
 });
 await ok('anonymous direct patient reads and inserts are denied through real HTTP API',async()=>{
  assert.ok((await anon.from('appointments').select('*')).error);
  assert.ok((await anon.from('appointments').insert({patient_name:'synthetic',patient_phone:'01000000000',appointment_date:date,appointment_time:'11:00'})).error);
 });
 let receipt;
 await ok('real anonymous booking RPC persists a UUID and idempotent retry returns it',async()=>{
  const id=randomUUID();receipt=resultData(await rpc(date,'11:00',id))[0];assert.match(receipt.booking_id,/^[0-9a-f-]{36}$/);
  assert.equal(resultData(await rpc(date,'11:00',id))[0].booking_id,receipt.booking_id);
  assert.equal((await query('SELECT count(*)::int n FROM appointments WHERE request_id=$1',[id])).rows[0].n,1);
 });
 await ok('ordinary authenticated and inactive users receive no protected patient rows',async()=>{
  assert.deepEqual(resultData(await outsider.from('appointments').select('*')),[]);assert.deepEqual(resultData(await inactive.from('appointments').select('*')),[]);
 });
 await ok('active staff can read and status-update the saved row, but not rewrite patient details',async()=>{
  assert.equal(resultData(await staff.from('appointments').select('id')).length,1);
  assert.equal(resultData(await staff.from('appointments').update({status:'confirmed'}).eq('id',receipt.booking_id).select('id').single()).id,receipt.booking_id);
  assert.ok((await staff.from('appointments').update({patient_name:'tamper'}).eq('id',receipt.booking_id)).error);
 });
 await ok('RLS-denied settings update is not mistaken for a saved row',async()=>{
  assert.ok((await staff.from('clinic_settings').update({updated_at:new Date().toISOString()}).eq('key','main_settings').select('key').single()).error);
  assert.equal(resultData(await admin.from('clinic_settings').update({updated_at:new Date().toISOString()}).eq('key','main_settings').select('key').single()).key,'main_settings');
  assert.ok((await admin.from('clinic_settings').update({content:{...settings,bookings:[{synthetic:true}]}}).eq('key','main_settings')).error);
 });
 await ok('real concurrent same-slot requests create exactly one stored booking',async()=>{
  const results=await Promise.all(Array.from({length:8},()=>rpc(date,'14:00')));
  assert.equal(results.filter(x=>!x.error).length,1);
  assert.equal((await query(`SELECT count(*)::int n FROM appointments WHERE appointment_date=$1 AND appointment_time='14:00'`,[date])).rows[0].n,1);
 });
 await ok('real concurrent daily-cap decisions allow only the configured capacity',async()=>{
  await query(`UPDATE clinic_settings SET content=jsonb_set(content,'{bookingSettings,maxDailyBookings}','2')`);
  const results=await Promise.all(['09:00','10:00','11:00','12:00','13:00','14:00'].map(t=>rpc(dates.later,t)));
  assert.equal(results.filter(x=>!x.error).length,2);
  assert.equal((await query('SELECT count(*)::int n FROM appointments WHERE appointment_date=$1',[dates.later])).rows[0].n,2);
  await query(`UPDATE clinic_settings SET content=jsonb_set(content,'{bookingSettings,maxDailyBookings}','25')`);
 });
 const staffEvents=[],outsiderEvents=[],anonEvents=[],patientLeakEvents=[],anonPatientEvents=[];
 let anonJoin;
 await ok('actual Realtime accepts active staff subscription; outsider control is connected',async()=>{
  await staff.realtime.setAuth(staffSession.access_token);
  await listen(staff,'staff',staffEvents);await listen(outsider,'outsider',outsiderEvents);
  anonJoin=await listen(anon,'anon',anonEvents,false);
  await listen(outsider,'outsider-patient-table',patientLeakEvents,false,'appointments');
  await listen(anon,'anon-patient-table',anonPatientEvents,false,'appointments');
  await delay(1500);
 });
 let realtimeReceipt;
 await ok('actual Realtime sends staff only a patient-free revision; outsiders receive no row data',async()=>{
  const revision=Number((await query('SELECT revision FROM clinic_booking_sync')).rows[0].revision);
  realtimeReceipt=resultData(await rpc(date,'15:00'))[0];
  await eventually(()=>staffEvents.some(x=>x.eventType==='UPDATE'&&Number(x.new.revision)>revision));
  for(const event of staffEvents){assert.ok(Object.keys(event.new||{}).every(k=>['id','revision','changed_at'].includes(k)));}
  await delay(800);assert.equal(outsiderEvents.length,0);
  assert.equal(anonEvents.some(e=>Object.keys(e.new||{}).length>0||Object.keys(e.old||{}).length>0),false);
  if(anonEvents.length)findings.push({kind:'anonymous-empty-authorization-envelopes',count:anonEvents.length,patientFields:false});
 });
 await ok('server membership revocation blocks the still-valid staff JWT on subsequent reads and writes',async()=>{
  await query('UPDATE clinic_staff SET is_active=false WHERE user_id=$1',[identities.secretary.id]);
  assert.deepEqual(resultData(await staff.from('appointments').select('*')),[]);
  assert.ok((await staff.from('appointments').update({status:'completed'}).eq('id',receipt.booking_id).select('id').single()).error);
 });
 await ok('already-connected Realtime staff channel receives no new patient row after membership revocation',async()=>{
  const before=staffEvents.length;resultData(await rpc(date,'16:00'));await delay(1500);assert.equal(staffEvents.length,before);
 });
 await ok('local Auth global logout clears client session and revokes its refresh token',async()=>{
  assert.equal((await staff.auth.signOut({scope:'global'})).error,null);
  assert.equal(resultData(await staff.auth.getSession()).session,null);
  const separate=make();clients.push(separate);
  assert.ok((await separate.auth.refreshSession({refresh_token:staffSession.refresh_token})).error);
 });
 await ok('public availability response contains only occupied times, no patient columns',async()=>{
  const rows=resultData(await anon.rpc('get_booked_slots',{p_date:date}));assert.ok(rows.length>0);
  for(const row of rows)assert.deepEqual(Object.keys(row),['appointment_time']);
 });
 await ok('patient table is unpublished and real DELETE exposes no receipt ID to non-staff',async()=>{
  assert.equal((await query("SELECT count(*)::int n FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointments'")).rows[0].n,0);
  resultData(await admin.from('appointments').delete().eq('id',realtimeReceipt.booking_id).select('id').single());
  await delay(1500);
  for(const event of [...patientLeakEvents,...anonPatientEvents]){
   assert.deepEqual(Object.keys(event.new||{}),[]);assert.deepEqual(Object.keys(event.old||{}),[]);
  }
 });
 if(process.env.CLINIC_NATIVE_BROWSER_FIXTURE)await writeFile(process.env.CLINIC_NATIVE_BROWSER_FIXTURE,JSON.stringify({admin:identities.admin,outsider:identities.outsider})+'\n',{mode:0o600});
 await writeFile(new URL('../review/native-validation.json',import.meta.url),JSON.stringify({checks,syntheticOnly:true,actualServices:['PostgreSQL','Auth','PostgREST','Realtime'],anonSubscription:anonJoin,findings},null,2)+'\n');
 console.log(`Actual local Supabase checks: ${checks} passed. Findings: ${findings.length}. Synthetic data only.`);
}finally{
 for(const [client,channel] of channels)await client.removeChannel(channel);
 for(const client of clients)await client.removeAllChannels();
 await database.end();
}
