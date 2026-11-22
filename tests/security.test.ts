import {isDateClosed,getCairoTodayString} from '../src/lib/cairoTime.ts';
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
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'23505',message:'Appointment slot already occupied'}})},input,'test'),/اختر/);
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'network'}})},input,'test'));
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:[],error:null})},input,'test'));
});
test('RPC sends logistics only with the stable retry ID',async()=>{
 let sent:any;
 await persistBooking({rpc:async(name,args)=>{sent={name,args};return {data:[{booking_id:'id',created_at:'now'}],error:null};}}, {...input,notes:'do not send',service:'do not send'},'stable-id');
 assert.equal(sent.name,'book_appointment');assert.equal(sent.args.p_request_id,'stable-id');assert.equal(sent.args.p_patient_name,'Synthetic Test');
 assert.equal('notes' in sent.args,false);assert.equal('service' in sent.args,false);
});

test('known server validation rejects are clear, not uncertain saves',async()=>{
 for(const message of ['Booking closed','Clinic closed on this date','Outside booking window','Invalid appointment time','Invalid interval','Invalid booking input']) {
  await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'22023',message}})},input,'stable-id'),e=>e instanceof Error && !e.message.includes('لم نتأكد'));
 }
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'23505',message:'Daily capacity reached'}})},input,'stable-id'),/عدد الحجوزات/);
});
test('request conflicts preserve uncertainty about the previous request',async()=>{
 await assert.rejects(()=>persistBooking({rpc:async()=>({data:null,error:{code:'22023',message:'Request ID reused with different details'}})},input,'stable-id'),/بيانات سابقة/);
});
test('transport rejection, unknown errors, and unknown unique violations remain uncertain',async()=>{
 for(const rpc of [async()=>{throw new Error('network failure')},async()=>({data:null,error:{code:'network',message:'private detail'}}),async()=>({data:null,error:{code:'23505',message:'unknown unique violation'}})]) {
  await assert.rejects(()=>persistBooking({rpc},input,'stable-id'),/لم نتأكد/);
 }
});

const allDays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
test('empty, missing and unverified weekday settings fail closed',()=>{
 for(const settings of [undefined,{}, {allowedDays:[]}]) assert.equal(isDateClosed('2026-11-23',settings).isClosed,true);
});
test('the weekday allowlist matches every Cairo calendar weekday',()=>{
 const dates=['2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28'];
 for(let i=0;i<dates.length;i++) for(let j=0;j<allDays.length;j++) assert.equal(isDateClosed(dates[i],{allowedDays:[allDays[j]]}).isClosed,i!==j);
});
test('an open weekday does not override explicit closures or holidays',()=>{
 const base={allowedDays:allDays};
 assert.equal(isDateClosed('2026-11-23',{...base,closedDates:['2026-11-23']}).isClosed,true);
 assert.equal(isDateClosed(getCairoTodayString(),{...base,isClosedToday:true}).isClosed,true);
 assert.equal(isDateClosed('2026-11-23',{...base,holidays:[{startDate:'2026-11-23',endDate:'2026-11-24',title:'test',isActive:true}]}).isClosed,true);
 assert.equal(isDateClosed('2026-11-23',{...base,holidays:[{startDate:'2026-11-23',endDate:'2026-11-24',title:'test',isActive:false}]}).isClosed,false);
});
test('invalid dates fail closed',()=>{assert.equal(isDateClosed('invalid',{allowedDays:allDays}).isClosed,true);});
