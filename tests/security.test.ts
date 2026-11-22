import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicContent,assertBackendTarget,persistBooking} from '../src/lib/clinicSecurity.ts';
const input={patientName:'  Synthetic Test  ',patientPhone:'01000000000',appointmentDate:'2026-12-01',appointmentTime:'13:00'};
test('public content allowlist strips all private top-level fields and does not mutate source',()=>{
 const source:any={doctor:{nameAr:'test'},bookingSettings:{isEnabled:false},bookings:[{patientName:'synthetic'}],secretaryAccounts:[{}],deviceTokens:[{}],unknownSecret:'test'};
 const safe=publicContent(source);assert.deepEqual(Object.keys(safe).sort(),['bookingSettings','doctor']);
 (safe.doctor as any).nameAr='changed';assert.equal(source.doctor.nameAr,'test');
});
test('isolated mode accepts only loopback and rejects a real remote URL before a client exists',()=>{
 for(const host of ['https://real.example','https://project.supabase.co','http://127.0.0.1.attacker.invalid'])assert.throws(()=>assertBackendTarget('isolated',host),/ISOLATION_GUARD/);
 for(const host of ['http://127.0.0.1:54321','http://localhost:54321',''])assert.doesNotThrow(()=>assertBackendTarget('isolated',host));
});
test('disconnected booking never reports success',async()=>{await assert.rejects(()=>persistBooking(null,input,'test'));});
test('booking waits for the database receipt and returns its server ID',async()=>{
 let release:any;let completed=false;const gate=new Promise<any>(r=>{release=r;});
 const result=persistBooking({rpc:()=>gate},input,'request-test').then(x=>{completed=true;return x;});
 await new Promise(r=>setTimeout(r,10));assert.equal(completed,false);
 release({data:[{booking_id:'server-id',created_at:'2026-11-22T00:00:00Z'}],error:null});
 assert.equal((await result).id,'server-id');
});
test('database errors and missing receipts cannot produce success',async()=>{
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'23505'}})},input,'test'),/اختر/);
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'network'}})},input,'test'));
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:[],error:null})},input,'test'));
});
test('RPC sends logistics only with the stable retry ID',async()=>{
 let sent:any;
 await persistBooking({rpc:async(name,args)=>{sent={name,args};return {data:[{booking_id:'id',created_at:'now'}],error:null};}}, {...input,notes:'do not send',service:'do not send'},'stable-id');
 assert.equal(sent.name,'book_appointment');assert.equal(sent.args.p_request_id,'stable-id');assert.equal(sent.args.p_patient_name,'Synthetic Test');
 assert.equal('notes' in sent.args,false);assert.equal('service' in sent.args,false);
});
