import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeStaffHandler} from '../supabase/functions/clinic-staff/handler.ts';
function client(role='admin',active=true,failInsert=false) {
 const effects:string[]=[];
 const c:any={effects,auth:{getUser:async()=>({data:{user:{id:'owner'}}}),admin:{
 createUser:async()=>{effects.push('create');return {data:{user:{id:'new'}}}},
 deleteUser:async()=>{effects.push('delete');return {}},
 updateUserById:async()=>{effects.push('password');return {}},
 getUserById:async()=>({data:{user:{email:'test@example.com',created_at:'date',user_metadata:{}}}})
 }},from:()=>{let target=false;const q:any={select:()=>q,eq:(k:string,v:string)=>{if(v==='target')target=true;return q},maybeSingle:async()=>({data:target?{role:'secretary'}:{role,is_active:active}}),insert:async()=>{effects.push('insert');return {error:failInsert?{}:null}},update:()=>q,limit:async()=>({data:[]}),then:(resolve:any)=>resolve({})};return q;}};return c;
}
const req=(body:unknown,auth=true)=>new Request('https://example.invalid',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify(body)});
test('no auth and inactive/nonadmin cannot provision',async()=>{for(const c of [client('secretary'),client('admin',false)]){const r=await makeStaffHandler(c)(req({action:'create'}));assert.equal(r.status,403);assert.deepEqual(c.effects,[]);}assert.equal((await makeStaffHandler(client())(req({},false))).status,401)});
test('create provisions Auth then staff, no credentials returned',async()=>{const c=client();const r=await makeStaffHandler(c)(req({action:'create',email:'staff@example.com',name:'Synthetic Staff',password:'synthetic123'}));assert.equal(r.status,200);assert.deepEqual(c.effects,['create','insert']);assert.deepEqual(await r.json(),{ok:true})});
test('staff insert failure rolls auth creation back',async()=>{const c=client('admin',true,true);assert.equal((await makeStaffHandler(c)(req({action:'create',email:'staff@example.com',name:'Synthetic',password:'synthetic123'}))).status,500);assert.deepEqual(c.effects,['create','insert','delete'])});
test('invalid email or short password does nothing',async()=>{const c=client();assert.equal((await makeStaffHandler(c)(req({action:'create',email:'username',name:'Synthetic',password:'123'}))).status,400);assert.deepEqual(c.effects,[])});
test('admin cannot target another admin for update/delete',async()=>{const c=client();assert.equal((await makeStaffHandler(c)(req({action:'delete',id:'owner'}))).status,403);assert.deepEqual(c.effects,[])});
