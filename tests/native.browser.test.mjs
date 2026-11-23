import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const fixture=JSON.parse(await readFile(process.env.CLINIC_NATIVE_BROWSER_FIXTURE,'utf8'));
const requests=[],blocked=[];const root=resolve('dist');let browser;
const site=createServer(async(req,res)=>{
 try{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
  assert.ok(file.startsWith(root+'/')||file===root);let body;
  try{body=await readFile(file);}catch{file=resolve(root,'index.html');body=await readFile(file);}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.statusCode=404;res.end();}
});
try{
 await new Promise(r=>site.listen(4174,'127.0.0.1',r));
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1365,height:1000});
 await page.setRequestInterception(true);page.on('request',r=>{
  const u=new URL(r.url());
  if(['data:','blob:'].includes(u.protocol)||u.hostname==='127.0.0.1'){
   requests.push({path:u.pathname,method:r.method()});void r.continue();
  }else{blocked.push(u.hostname);void r.abort();}
 });
 await page.goto('http://127.0.0.1:4174/admin',{waitUntil:'networkidle0'});
 await page.waitForSelector('input[type=email]');
 await page.type('input[type=email]',fixture.admin.email);await page.type('input[type=password]',fixture.admin.password);
 await page.click('form button[type=submit]');await page.waitForSelector('button[title="تسجيل الخروج"]',{timeout:15000});
 await page.waitForFunction(()=>document.body.innerText.includes('نظرة عامة'));
 assert.ok(requests.some(r=>r.path==='/auth/v1/token'));
 assert.ok(requests.some(r=>r.path==='/rest/v1/clinic_staff'));
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/rest/v1/appointments')));
 console.log('PASS actual web admin login resolves real Auth membership and requests protected rows');
 const publicPage=await browser.newPage();const publicResponses=[];publicPage.on('response',async r=>{if(r.url().includes('/rest/v1/clinic_settings')){try{const d=await r.json();publicResponses.push({status:r.status(),name:d?.content?.doctor?.nameAr||d?.[0]?.content?.doctor?.nameAr});}catch{}}});
 await publicPage.setRequestInterception(true);publicPage.on('request',r=>{const u=new URL(r.url());if(['data:','blob:'].includes(u.protocol)||u.hostname==='127.0.0.1')void r.continue();else void r.abort();});
 publicPage.on('console',msg=>console.log('PUBLIC_CONSOLE',msg.type(),msg.text()));
 await publicPage.goto('http://127.0.0.1:4174/',{waitUntil:'networkidle0'});
 await page.bringToFront();
 await page.waitForSelector('button[title="تسجيل الخروج"]');
 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('بيانات الطبيب')).click());

 await page.waitForSelector('form input[type=text]');
 const changed='طبيب اختبار مزامنة '+Date.now();
 const committed=page.waitForResponse(r=>r.url().includes('/rest/v1/clinic_settings')&&r.request().method()==='PATCH'&&r.status()===200);
 await page.locator('form input[type=text]').fill(changed);
 await committed;

 await page.waitForSelector('[title="تم الحفظ من الخادم"]');

 try{await publicPage.waitForFunction(value=>document.body.innerText.includes(value),{timeout:6000,polling:'mutation'},changed);}catch(e){console.log('PUBLIC_VALUES',changed,publicResponses);console.log('PUBLIC_DEBUG',await publicPage.evaluate(()=>({names:document.body.innerText.match(/طبيب اختبار مزامنة [0-9]+/g),head:document.body.innerText.slice(0,420),api:performance.getEntriesByType('resource').filter(r=>r.name.includes('clinic_settings')).map(r=>({url:r.name,ms:r.duration}))})));throw e;}
 console.log('PASS real admin edit is acknowledged by the database and propagates to an already-open public page');
 await page.screenshot({path:'review/screenshots/native-sync-admin.png',fullPage:true});await publicPage.screenshot({path:'review/screenshots/native-sync-public.png',fullPage:true});

 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('6. مواعيد العمل')).click());
 await page.waitForSelector('form input[type=text]');
 const originalHours=await page.$eval('form input[type=text]',e=>e.value);
 const testHours='مواعيد اختبار محلي '+Date.now();
 const hoursSaved=page.waitForResponse(r=>r.url().includes('/rest/v1/clinic_settings')&&r.request().method()==='PATCH'&&r.status()===200);
 await page.locator('form input[type=text]').fill(testHours);await hoursSaved;
 await publicPage.waitForFunction(v=>document.body.innerText.includes(v),{timeout:6000,polling:'mutation'},testHours);
 console.log('PASS actual admin hours edit reaches an already-open public website without refresh');
 const bookingPage=await browser.newPage();await bookingPage.setRequestInterception(true);bookingPage.on('request',r=>{const u=new URL(r.url());if(['data:','blob:'].includes(u.protocol)||u.hostname==='127.0.0.1')void r.continue();else void r.abort();});
 await bookingPage.goto('http://127.0.0.1:4174/booking',{waitUntil:'networkidle0'});await bookingPage.waitForSelector('.no-scrollbar button');await (await bookingPage.$$('.no-scrollbar button'))[1].click();
 await bookingPage.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('09:00')),{polling:'mutation'});
 assert.equal(await bookingPage.evaluate(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('09:30'))),false);
 await page.bringToFront();const gapSaved=page.waitForResponse(r=>r.url().includes('/rest/v1/clinic_settings')&&r.request().method()==='PATCH'&&r.status()===200);
 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('كل نصف ساعة')).click());await gapSaved;
 await bookingPage.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('09:30')),{timeout:6000,polling:'mutation'});
 console.log('PASS actual admin gap edit changes an already-open booking page from hourly to half-hour slots without refresh');
 await page.screenshot({path:'review/screenshots/native-hours-gap-admin.png',fullPage:false});await bookingPage.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('09:30')).scrollIntoView({block:'center'}));await bookingPage.screenshot({path:'review/screenshots/native-hours-gap-client.png',fullPage:false});
 const gapRestore=page.waitForResponse(r=>r.url().includes('/rest/v1/clinic_settings')&&r.request().method()==='PATCH'&&r.status()===200);
 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('كل ساعة')&&!b.textContent.includes('إلا')).click());await gapRestore;
 const hoursRestore=page.waitForResponse(r=>r.url().includes('/rest/v1/clinic_settings')&&r.request().method()==='PATCH'&&r.status()===200);await page.locator('form input[type=text]').fill(originalHours);await hoursRestore;
 await publicPage.waitForFunction(v=>document.body.innerText.includes(v),{timeout:6000,polling:'mutation'},originalHours);await bookingPage.close();
 console.log('PASS test hours and gap restored through the same UI; no booking submitted');
 await publicPage.close();

 await page.evaluate(()=>{
  const banner=document.createElement('div');banner.textContent='اختبار محلي معزول ببيانات وهمية، الدخول تم عبر Auth محلي حقيقي.';
  banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px;text-align:center;background:#fde68a;font-weight:bold';document.body.appendChild(banner);
 });
 await mkdir('review/screenshots',{recursive:true});await page.screenshot({path:'review/screenshots/native-auth-admin-desktop.png',fullPage:true});
 await page.reload({waitUntil:'networkidle0'});
 await page.waitForSelector('button[title="تسجيل الخروج"]');
 assert.equal(await page.$('input[type=email]'),null);
 console.log('PASS genuine Auth session survives same-tab reload with backend staff validation');
 await page.waitForSelector('button[title="تسجيل الخروج"]');await page.click('button[title="تسجيل الخروج"]');await page.waitForSelector('input[type=email]');
 assert.equal(await page.evaluate(()=>document.body.innerText.includes('مريض اصطناعي محلي')),false);
 console.log('PASS actual web logout removes protected dashboard and synthetic patient text');
 const before=requests.filter(r=>r.path==='/rest/v1/appointments').length;
 await page.type('input[type=email]',fixture.outsider.email);await page.type('input[type=password]',fixture.outsider.password);await page.click('form button[type=submit]');
 await page.waitForFunction(()=>document.body.innerText.includes('تعذر تسجيل الدخول بحساب موظف مخول'));
 assert.equal(await page.$('button[title="تسجيل الخروج"]'),null);
 assert.equal(requests.filter(r=>r.path==='/rest/v1/appointments').length,before);
 console.log('PASS valid non-staff Auth identity is rejected by web UI without a patient fetch');
 for(const selector of ['input[type=email]','input[type=password]']){
  await page.click(selector);await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
 }
 await page.setViewport({width:390,height:908});await page.screenshot({path:'review/screenshots/native-auth-denied-mobile.png',fullPage:true});
 assert.ok(requests.every(r=>!r.path.includes('/invite')));
 console.log('Actual local Auth/sync browser checks: 8 passed. External requests blocked:',blocked.length);
}finally{if(browser)await browser.close();await new Promise(r=>site.close(r));}
