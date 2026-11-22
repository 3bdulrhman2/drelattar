import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {makeDatabase,role,callBooking} from './database.test.mjs';
const {db,date}=await makeDatabase();
const requests=[];const blocked=[];const requestIds=[];
let loseFirstResponse=true;let browser;
const root=resolve('dist');await mkdir('review/screenshots',{recursive:true});
const api=createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:4173');
 res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'apikey,authorization,content-type,x-client-info,prefer,accept,accept-profile,content-profile');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 res.setHeader('Content-Type','application/json');
 if(req.method==='OPTIONS'){res.end();return;}
 requests.push(req.url);
 try{
  let result;
  if(req.url.startsWith('/rest/v1/clinic_settings')){
   result=(await role(db,'anon',null,()=>db.query('SELECT content FROM clinic_settings'))).rows;
  }else if(req.url==='/rest/v1/rpc/get_booked_slots'){
   let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);
   result=(await role(db,'anon',null,()=>db.query('SELECT * FROM get_booked_slots($1::date)',[body.p_date]))).rows;
  }else if(req.url==='/rest/v1/rpc/book_appointment'){
   let raw='';for await(const c of req)raw+=c;const b=JSON.parse(raw);requestIds.push(b.p_request_id);
   result=(await role(db,'anon',null,()=>callBooking(db,b.p_date,b.p_time,b.p_request_id,b.p_patient_name,b.p_patient_phone))).rows;
   if(loseFirstResponse){loseFirstResponse=false;res.statusCode=503;res.end(JSON.stringify({message:'Synthetic lost response AFTER commit'}));return;}
  }else{res.statusCode=404;result={message:'Isolated mock has no other endpoint'};}
  res.end(JSON.stringify(result));
 }catch(e){res.statusCode=400;res.end(JSON.stringify({code:e.code,message:'Synthetic database rejected request'}));}
});
const site=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
  if(!path.startsWith(root+'/')&&path!==root)throw Error('Invalid path');
  let body,file=path;
  try{body=await readFile(file);}catch{file=resolve(root,'index.html');body=await readFile(file);}
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html'})[extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.statusCode=404;res.end();}
});
try{
 await new Promise(r=>api.listen(54321,'127.0.0.1',r));
 await new Promise(r=>site.listen(4173,'127.0.0.1',r));
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();
 page.on('console',msg=>{if(msg.type()==='error')console.log('BROWSER ERROR',msg.text());});
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));await page.setViewport({width:1365,height:1000});
 await page.setRequestInterception(true);
 page.on('request',r=>{
  const u=new URL(r.url());
  if(['data:','blob:'].includes(u.protocol)||['127.0.0.1','localhost'].includes(u.hostname)){void r.continue();}
  else{blocked.push(u.hostname);void r.abort();}
 });
 await page.goto('http://127.0.0.1:4173/booking',{waitUntil:'networkidle0'});
 await page.waitForSelector('.no-scrollbar button');
 const days=await page.$$('.no-scrollbar button');await days[1].click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('09:00')));
 const slot=await page.evaluateHandle(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('09:00')));
 await slot.asElement().click();
 await page.type('form input[type=text]','مريض اختبار محلي');
 await page.type('form input[type=tel]','01000000000');
 await page.click('form button[type=submit]');
 await page.waitForSelector('form [role=alert]');
 assert.equal(await page.evaluate(()=>document.body.innerText.includes('تم استلام طلب الحجز بنجاح')),false);
 assert.equal((await db.query('SELECT count(*)::int n FROM appointments')).rows[0].n,1);
 console.log('PASS lost database response does not show a false success, although synthetic save committed');
 await page.screenshot({path:'review/screenshots/booking-save-uncertain.png',fullPage:true});
 await page.click('form button[type=submit]');
 await page.waitForFunction(()=>document.body.innerText.includes('تم استلام طلب الحجز بنجاح'));
 assert.equal(requestIds.length,2);assert.equal(requestIds[0],requestIds[1]);
 const saved=(await db.query('SELECT id::text id FROM appointments')).rows[0].id;
 assert.ok((await page.evaluate(()=>document.body.innerText)).includes(saved));
 assert.equal((await db.query('SELECT count(*)::int n FROM appointments')).rows[0].n,1);
 console.log('PASS retry uses the same request ID, returns the saved UUID and creates no duplicate');
 assert.equal(await page.evaluate(()=>Array.from(document.querySelectorAll('a')).some(a=>(a.textContent||'').includes('التواصل الخارجي معطل')&&a.hasAttribute('href'))),false);
 const externalClickWasPrevented=await page.evaluate(()=>{
   const a=document.createElement('a');a.href='tel:0000000000';document.body.appendChild(a);
   const prevented=!a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));a.remove();return prevented;
 });
 assert.equal(externalClickWasPrevented,true);
 console.log('PASS isolated-mode contact action has no destination and external contact clicks are blocked');
 await page.screenshot({path:'review/screenshots/booking-receipt-desktop.png',fullPage:true});
 await page.setViewport({width:390,height:844});
 assert.ok((await page.evaluate(()=>document.body.innerText)).includes(saved));
 await page.screenshot({path:'review/screenshots/booking-receipt-mobile.png',fullPage:true});
 await page.evaluate(()=>{localStorage.setItem('drelattar_admin_session_v1',JSON.stringify({role:'admin',email:'forged@example.invalid'}));sessionStorage.setItem('drelattar_secretary_session',JSON.stringify({isActive:true}));});
 await page.goto('http://127.0.0.1:4173/admin',{waitUntil:'networkidle0'});
 await page.waitForSelector('input[type=password]');
 assert.equal(await page.evaluate(()=>localStorage.getItem('drelattar_admin_session_v1')),null);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('drelattar_secretary_session')),null);
 assert.equal(requests.filter(p=>p.startsWith('/rest/v1/appointments')).length,0);
 console.log('PASS forged old local sessions do not unlock admin or fetch patient records');
 await page.screenshot({path:'review/screenshots/admin-locked-mobile.png',fullPage:true});
 console.log('PASS all permitted network requests stayed on loopback; external asset requests were blocked');
 console.log('Browser tests passed. Date computed from local disposable DB:',date);
}finally{
 if(browser)await browser.close();
 await new Promise(r=>api.close(r));await new Promise(r=>site.close(r));await db.close();
}
