import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
const migration=await readFile(new URL('../review/clinic-security.sql',import.meta.url),'utf8');
const prefix=await readFile(new URL('../review/clinic-preservation-prefix.sql',import.meta.url),'utf8');
const inner=migration.replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
const checksum=`select md5(jsonb_build_object('appointments',(select jsonb_agg(to_jsonb(a) order by id) from appointments a),'clinic_settings',(select jsonb_agg(to_jsonb(c) order by id) from clinic_settings c))::text) hash`;
let checks=0;const ok=async(label,fn)=>{await fn();checks++;console.log('PASS',label);};
try {
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table appointments(id uuid primary key default gen_random_uuid(),patient_name text not null,patient_phone text not null,appointment_date date not null,appointment_time text not null,notes text,status text not null,created_at timestamptz not null default now());create table clinic_settings(id uuid primary key default gen_random_uuid(),key text unique not null,content jsonb not null,updated_at timestamptz not null default now());`);
 await db.query(`insert into clinic_settings(key,content) values('main_settings',$1)`,[JSON.stringify({doctor:{nameAr:'synthetic'},bookingSettings:{isEnabled:false},bookings:[{id:'synthetic',status:'pending',service:'synthetic extra',notes:'synthetic notes'}],secretaryAccounts:[],deviceTokens:[{token:'synthetic-not-a-real-token'}]})]);
 await db.exec(`insert into appointments(patient_name,patient_phone,appointment_date,appointment_time,notes,status) values('synthetic','01000000000','2030-01-01','11:00','synthetic clinical note','pending'),('synthetic second','01000000000','2030-01-01','11:00','synthetic second note','confirmed');`);
 const original=(await db.query(checksum)).rows[0].hash;
 await ok('missing verified export refuses preservation transaction without changes',async()=>{
 await assert.rejects(()=>db.exec(prefix+inner+'COMMIT;'),/Verified export/);await db.exec('rollback');assert.equal((await db.query(checksum)).rows[0].hash,original);
 });
 await db.query(`select set_config('clinic_repair.expected_checksum',$1,false)`,[original]);
 await db.exec(prefix+inner+'COMMIT;');
 await ok('full original data checkpoint exactly matches verified export',async()=>assert.equal((await db.query('select md5(snapshot::text) hash from clinic_repair_private.checkpoints')).rows[0].hash,original));
 await ok('all original conflicting appointments and clinical notes remain unchanged',async()=>{
 const {rows}=await db.query(`select count(*)::int n,count(*) filter(where notes like 'synthetic%')::int notes from appointments where appointment_date='2030-01-01' and appointment_time='11:00'`);assert.deepEqual(rows[0],{n:2,notes:2});
 });
 await ok('original legacy versions and extra fields remain only in protected checkpoint',async()=>{
 const {rows}=await db.query(`select snapshot->'clinic_settings'->0->'content' legacy from clinic_repair_private.checkpoints`);assert.equal(rows[0].legacy.bookings[0].service,'synthetic extra');assert.equal(rows[0].legacy.deviceTokens.length,1);
 const content=(await db.query('select content from clinic_settings')).rows[0].content;for(const key of ['bookings','deviceTokens','secretaryAccounts'])assert.equal(key in content,false);assert.equal(content.bookingSettings.isEnabled,false);
 });
 await ok('anonymous and authenticated API roles cannot access preservation storage',async()=>{
 for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(()=>db.query('select * from clinic_repair_private.checkpoints'));await db.exec('reset role');}
 });
 await ok('new occupation of a conflicting slot is rejected',async()=>{
 await assert.rejects(()=>db.exec(`insert into appointments(patient_name,patient_phone,appointment_date,appointment_time,status) values('synthetic third','01000000000','2030-01-01','11:00','pending')`),e=>e.code==='23505');
 });
 await ok('existing conflicting rows can change status without data cleanup',async()=>{
 await db.exec(`update appointments set status='completed' where appointment_date='2030-01-01'`);assert.equal((await db.query(`select count(*)::int n from appointments where status='completed'`)).rows[0].n,2);
 });
 await ok('cancelled duplicate cannot be reactivated into a still-occupied slot',async()=>{
 const id=(await db.query('select id from appointments limit 1')).rows[0].id;await db.query(`update appointments set status='cancelled' where id=$1`,[id]);await assert.rejects(()=>db.query(`update appointments set status='pending' where id=$1`,[id]),e=>e.code==='23505');
 });
 console.log(`Preservation checks: ${checks} passed. Synthetic data only.`);
}finally{await db.close();}
