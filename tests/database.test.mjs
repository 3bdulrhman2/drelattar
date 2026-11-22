import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
export async function makeDatabase() {
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;
 CREATE TABLE clinic_settings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),key text UNIQUE NOT NULL,content jsonb NOT NULL,updated_at timestamptz DEFAULT now());
 `);
 await db.query(`INSERT INTO clinic_settings(key,content) VALUES('main_settings',$1)`,[JSON.stringify({
   bookingSettings:{isEnabled:true,allowedDays:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
   startTime:'09:00',endTime:'23:00',startTimeFriday:'09:00',endTimeFriday:'23:00',slotDurationMinutes:60,maxAdvanceDays:14,maxDailyBookings:25,closedDates:[],holidays:[]},
   doctor:{nameAr:'عيادة اختبار محلية'},bookings:[{syntheticPrivate:true}],secretaryAccounts:[{syntheticPrivate:true}],deviceTokens:[{syntheticPrivate:true}],
 })]);
 const migration=await readFile(new URL('../review/clinic-security.sql',import.meta.url),'utf8');
 let legacyGuardVerified=false;
 try {await db.exec(migration);throw Error('Expected private-array migration guard');}
 catch(e){
   await db.exec('ROLLBACK');
   assert.match(e.message,/Legacy private arrays/);
   const before=(await db.query('SELECT content FROM clinic_settings')).rows[0].content;
   assert.equal(before.bookings.length,1);legacyGuardVerified=true;
   // Test-only stand-in for a separately reviewed data migration. No live data.
   await db.exec(`UPDATE clinic_settings SET content=content-'bookings'-'secretaryAccounts'-'deviceTokens'`);
 }
 await db.exec(migration);
 const [{d}]= (await db.query(`SELECT ((now() AT TIME ZONE 'Africa/Cairo')::date+1)::text d`)).rows;
 return {db,date:d,legacyGuardVerified};
}
export async function role(db,name,sub,fn){
 await db.exec(`RESET ROLE; SET ROLE ${name}`);
 await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false)`,[sub||'']);
 try{return await fn();}finally{await db.exec('RESET ROLE');}
}
export const callBooking=(db,date,time,id=randomUUID(),name='مريض اختبار محلي',phone='01000000000')=>
 db.query('SELECT * FROM public.book_appointment($1,$2,$3,$4::date,$5)',[id,name,phone,date,time]);

if(process.argv[1]===new URL(import.meta.url).pathname){
 const {db,date,legacyGuardVerified}=await makeDatabase();let checks=0;
 const ok=async(label,fn)=>{await fn();++checks;console.log('PASS',label);};
 const denied=async(sql,params=[])=>assert.rejects(()=>db.query(sql,params));
 const admin=randomUUID(),secretary=randomUUID(),outsider=randomUUID(),inactive=randomUUID();
 try{
 await db.query('INSERT INTO auth.users(id) SELECT unnest($1::uuid[])',[[admin,secretary,outsider,inactive]]);
 await db.query(`INSERT INTO clinic_staff(user_id,role,name,is_active) VALUES($1,'admin','test admin',true),($2,'secretary','test staff',true),($3,'admin','inactive',false)`,[admin,secretary,inactive]);
 await ok('legacy private arrays stop migration without discarding data',async()=>assert.equal(legacyGuardVerified,true));
 await ok('public settings contain no booking, staff or token arrays',async()=>{
  const {rows}=await role(db,'anon',null,()=>db.query('SELECT content FROM clinic_settings'));
  for(const key of ['bookings','secretaryAccounts','deviceTokens'])assert.equal(key in rows[0].content,false);
 });
 await ok('anonymous cannot read patient rows',()=>role(db,'anon',null,()=>denied('SELECT * FROM appointments')));
 await ok('anonymous cannot directly insert patient rows',()=>role(db,'anon',null,()=>denied(`INSERT INTO appointments(patient_name,patient_phone,appointment_date,appointment_time) VALUES('test','01000000000',$1,'11:00')`,[date])));
 await ok('anonymous cannot modify settings',()=>role(db,'anon',null,()=>denied(`UPDATE clinic_settings SET content='{}'`)));
 await ok('book RPC persists and returns the actual server UUID',async()=>{
  const {rows}=await role(db,'anon',null,()=>callBooking(db,date,'11:00'));
  assert.match(rows[0].booking_id,/^[0-9a-f-]{36}$/);assert.ok(rows[0].created_at);
 });
 await ok('duplicate active slot is rejected atomically',()=>role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,date,'11:00'),e=>e.code==='23505')));
 await ok('same request retry returns one identical receipt',async()=>{
  const id=randomUUID();const a=await role(db,'anon',null,()=>callBooking(db,date,'12:00',id));
  const b=await role(db,'anon',null,()=>callBooking(db,date,'12:00',id));assert.equal(a.rows[0].booking_id,b.rows[0].booking_id);
  assert.equal((await db.query('SELECT count(*)::int n FROM appointments WHERE request_id=$1',[id])).rows[0].n,1);
  await role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,date,'13:00',id)));
 });
 await ok('public availability returns times only',async()=>{
  const {rows}=await role(db,'anon',null,()=>db.query('SELECT * FROM get_booked_slots($1::date)',[date]));
  assert.deepEqual(Object.keys(rows[0]),['appointment_time']);
 });
 await ok('ordinary authenticated user sees no bookings',async()=>{
  const {rows}=await role(db,'authenticated',outsider,()=>db.query('SELECT * FROM appointments'));assert.equal(rows.length,0);
 });
 await ok('inactive staff sees no bookings',async()=>{
  const {rows}=await role(db,'authenticated',inactive,()=>db.query('SELECT * FROM appointments'));assert.equal(rows.length,0);
 });
 await ok('active staff can read and change booking status',async()=>{
  const {rows}=await role(db,'authenticated',secretary,()=>db.query(`UPDATE appointments SET status='confirmed' WHERE appointment_time='11:00' RETURNING id`));assert.equal(rows.length,1);
 });
 await ok('private revision signal has no patient fields and cannot be written by non-staff',async()=>{
  await role(db,'anon',null,()=>denied('SELECT * FROM clinic_booking_sync'));
  assert.deepEqual((await role(db,'authenticated',outsider,()=>db.query('SELECT * FROM clinic_booking_sync'))).rows,[]);
  const {rows}=await role(db,'authenticated',secretary,()=>db.query('SELECT * FROM clinic_booking_sync'));
  assert.deepEqual(Object.keys(rows[0]).sort(),['changed_at','id','revision']);assert.equal(rows[0].id,true);
  const before=rows[0].revision;
  await role(db,'authenticated',outsider,()=>db.query("UPDATE appointments SET status='completed' WHERE false"));
  assert.equal((await db.query('SELECT revision FROM clinic_booking_sync')).rows[0].revision,before);
  await role(db,'authenticated',outsider,()=>denied('UPDATE clinic_booking_sync SET revision=0'));
 });
 await ok('staff cannot rewrite patient details',()=>role(db,'authenticated',secretary,()=>denied(`UPDATE appointments SET patient_name='tamper'`)));
 await ok('staff cannot assign membership to themselves',()=>role(db,'authenticated',outsider,()=>denied(`INSERT INTO clinic_staff(user_id,role,name,is_active) VALUES($1,'admin','test',true)`,[outsider])));
 await ok('secretary cannot update public settings',async()=>{
  const {rows}=await role(db,'authenticated',secretary,()=>db.query(`UPDATE clinic_settings SET updated_at=now() RETURNING key`));assert.equal(rows.length,0);
 });
 await ok('admin can update sanitized settings, private fields rejected',async()=>{
  const {rows}=await role(db,'authenticated',admin,()=>db.query(`UPDATE clinic_settings SET updated_at=now() RETURNING key`));assert.equal(rows.length,1);
  await role(db,'authenticated',admin,()=>denied(`UPDATE clinic_settings SET content=content||'{"bookings":["test"]}'::jsonb`));
 });
 await ok('invalid phone, grid, hours, advance date rejected server-side',async()=>{
  for(const [t,n,ph] of [['13:30','test','01000000000'],['01:00','test','01000000000'],['13:00','test','invalid']])
   await role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,date,t,randomUUID(),n,ph)));
  await role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,'2000-01-01','13:00')));
 });
 await ok('disabled booking and daily cap enforced server-side',async()=>{
  await db.exec(`UPDATE clinic_settings SET content=jsonb_set(content,'{bookingSettings,isEnabled}','false')`);
  await role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,date,'13:00')));
  await db.exec(`UPDATE clinic_settings SET content=jsonb_set(jsonb_set(content,'{bookingSettings,isEnabled}','true'),'{bookingSettings,maxDailyBookings}','2')`);
  await role(db,'anon',null,()=>assert.rejects(()=>callBooking(db,date,'13:00'),e=>e.code==='23505'));
 });
 await ok('configured advance window above 31 days is preserved for booking and availability',async()=>{
  await db.exec(`UPDATE clinic_settings SET content=jsonb_set(content,'{bookingSettings,maxAdvanceDays}','60')`);
  const far=(await db.query(`SELECT ((now() AT TIME ZONE 'Africa/Cairo')::date+50)::text d`)).rows[0].d;
  await role(db,'anon',null,()=>callBooking(db,far,'11:00'));
  const {rows}=await role(db,'anon',null,()=>db.query('SELECT * FROM get_booked_slots($1::date)',[far]));
  assert.equal(rows[0].appointment_time,'11:00');
 });
 await ok('review migration can be rerun safely on reconciled synthetic schema',async()=>{await db.exec(await readFile(new URL('../review/clinic-security.sql',import.meta.url),'utf8'));});
 console.log(`PostgreSQL security/persistence checks: ${checks} passed. Synthetic data only.`);
 }finally{await db.close();}
}
