import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
// Synthetic loopback Auth responses only. This is not a hosted Auth integration test.
let active=true, browser; const requests=[]; const root=resolve('dist');
const uid='00000000-0000-4000-8000-000000000001';
const user={id:uid,aud:'authenticated',role:'authenticated',email:'synthetic@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const token='synthetic-fixture-access-token';
const api=createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:4175');
 res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'*');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Content-Type','application/json');
 if(req.method==='OPTIONS'){res.end();return;}
 requests.push({path:req.url,method:req.method,authorized:req.headers.authorization===`Bearer ${token}`});
 let body=[];
 if(req.url.startsWith('/auth/v1/token'))body={access_token:token,refresh_token:'synthetic-refresh-token',expires_in:3600,token_type:'bearer',user};
 else if(req.url.startsWith('/auth/v1/user'))body=user;
 else if(req.url.startsWith('/auth/v1/logout'))body={};
 else if(req.url.startsWith('/rest/v1/clinic_staff'))body=active&&req.headers.authorization===`Bearer ${token}`?{user_id:uid,role:'admin',name:'Synthetic admin',is_active:true}:null;
 else if(req.url.startsWith('/rest/v1/clinic_settings'))body={content:{doctor:{nameAr:'اختبار محلي معزول'},bookingSettings:{isEnabled:false}}};
 else if(!req.url.startsWith('/rest/v1/appointments')){res.statusCode=404;body={message:'Synthetic fixture endpoint not found'};}
 res.end(JSON.stringify(body));
});
const site=createServer(async(req,res)=>{let file=resolve(root,'.'+new URL(req.url,'http://127.0.0.1').pathname);if(!file.startsWith(root+'/')){res.writeHead(400);res.end();return;}let body;try{body=await readFile(file);}catch{file=resolve(root,'index.html');body=await readFile(file);}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(body);});
try{
 await new Promise(r=>api.listen(54321,'127.0.0.1',r));await new Promise(r=>site.listen(4175,'127.0.0.1',r));
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();await page.setViewport({width:1280,height:900});
 await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol))void r.continue();else void r.abort();});
 const login=async()=>{await page.waitForSelector('input[type=email]');await page.type('input[type=email]',user.email);await page.type('input[type=password]','synthetic-fixture-not-a-real-password');await page.click('form button[type=submit]');await page.waitForSelector('button[title="تسجيل الخروج"]');};
 await page.goto('http://127.0.0.1:4175/admin',{waitUntil:'networkidle0'});await login();
 assert.ok(await page.evaluate(()=>Object.keys(sessionStorage).some(k=>k.endsWith('-auth-token'))));
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.endsWith('-auth-token'))),false);
 const before=requests.filter(r=>r.path.startsWith('/rest/v1/clinic_staff')).length;
 for(let i=0;i<3;i++){await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('button[title="تسجيل الخروج"]');assert.equal(await page.$('input[type=email]'),null);}
 assert.ok(requests.filter(r=>r.path.startsWith('/rest/v1/clinic_staff')&&r.authorized).length>=before+3);
 console.log('PASS three reloads restore session and recheck authorized backend membership; no localStorage credential');
 await page.evaluate(()=>{const b=document.createElement('div');b.textContent='اختبار محلي معزول ببيانات وهمية: بعد ٣ مرات ريفريش';b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#fde68a;color:black;text-align:center;padding:12px';document.body.append(b);});
 await mkdir('review/screenshots',{recursive:true});await page.screenshot({path:'review/screenshots/session-refresh-synthetic.png',fullPage:false});
 const fresh=await browser.newPage();await fresh.goto('http://127.0.0.1:4175/admin',{waitUntil:'networkidle0'});await fresh.waitForSelector('input[type=email]');await fresh.close();console.log('PASS independent fresh tab has no persisted session');
 await page.click('button[title="تسجيل الخروج"]');await page.waitForSelector('input[type=email]');await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('input[type=email]');assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).some(k=>k.endsWith('-auth-token'))),false);console.log('PASS logout clears stored session and stays logged out after reload');
 await login();active=false;const patientBefore=requests.filter(r=>r.path.startsWith('/rest/v1/appointments')).length;
 await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('input[type=email]');assert.equal(await page.$('button[title="تسجيل الخروج"]'),null);assert.equal(requests.filter(r=>r.path.startsWith('/rest/v1/appointments')).length,patientBefore);console.log('PASS revoked staff membership refuses restored session before patient fetch');
 await page.evaluate(()=>{sessionStorage.clear();localStorage.setItem('drelattar_admin_session_v1',JSON.stringify({role:'admin'}));});await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('input[type=email]');assert.equal(await page.$('button[title="تسجيل الخروج"]'),null);console.log('PASS forged legacy UI session still cannot unlock admin');
}finally{if(browser)await browser.close();await new Promise(r=>site.close(r));await new Promise(r=>api.close(r));}
