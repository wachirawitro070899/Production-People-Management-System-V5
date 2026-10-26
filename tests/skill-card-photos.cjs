const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const photo='data:image/png;base64,TEST-PHOTO';
const employee=(id,fields={})=>({id,name:'MR. TEST '+id,section:'Stamping Section',position:'Operator',startDate:'2020-01-01',contractType:'Permanent',...fields});
const employees=[employee('DATA',{photoData:photo,photoUrl:'https://example.test/url.png',photo:'https://example.test/legacy.png'}),employee('URL',{photoUrl:'https://example.test/url.png'}),employee('LEGACY',{photo:'https://example.test/legacy.png'}),employee('NONE'),employee('ESCAPED',{name:'MR. O\'NEIL <QA> "STAFF"',photoData:photo})];
const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(p=>!/^https?:/.test(p)&&!/^vendor\/(html2canvas|jspdf|qrcode)/.test(p));
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,storageQuota:50*1024*1024});
 const w=dom.window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.CSS={escape:s=>String(s)};
 // Native rendering vendors are covered by skill-card-export.cjs in Chromium.
 // Drop observer callbacks queued during jsdom teardown after its document is gone.
 w.queueMicrotask=callback=>queueMicrotask(()=>{if(w.document)callback()});
 w.requestAnimationFrame=callback=>w.setTimeout(()=>{if(w.document)callback(Date.now())},16);
 Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 w.alert=()=>{};w.confirm=()=>false;w.prompt=()=>null;w.print=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 // All service calls return fixtures; the test never contacts production services.
 w.fetch=async url=>({ok:true,status:200,headers:{get:()=>null},json:async()=>String(url).includes('adminAccounts')?[{username:'tester',passwordHash:'test',active:true,owner:false}]:String(url).includes('/employees.json')?employees:String(url).includes('/deletedEmployeeIds.json')?[]:null});
 w.localStorage.setItem('ppms_v3_employees',JSON.stringify(employees));w.localStorage.setItem('ppms_v768_admin_device_id','test-device');
 w.sessionStorage.setItem('ppms_device_lock_verified','test-device');w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_admin_user','tester');
 w.sessionStorage.setItem('cardSection','Stamping Section');w.sessionStorage.setItem('cardEmp','__ALL__');
 try{
  for(const script of scripts)w.eval(fs.readFileSync(script,'utf8')+'\n//# sourceURL='+script);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(400);
  w.document.querySelector('#nav [data-page="cards"]').click();await wait(300);
  const fronts=w.document.querySelectorAll('.wallet-card-sheet .wallet-front');assert.equal(fronts.length,employees.length);
  for(const e of employees){
   const card=w.document.querySelector('.wallet-card-sheet .wallet-front[data-employee-id="'+e.id+'"]'),avatar=card.querySelector('.wallet-main .avatar');
   assert(avatar.classList.contains('avatar-lg'),'Photo and fallback both use the card portrait sizing');
   if(e.id==='NONE'){assert(avatar.classList.contains('avatar-fallback'));assert.equal(avatar.textContent,'TN')}
   else{assert.equal(avatar.tagName,'IMG');assert.equal(avatar.getAttribute('src'),e.photoData||e.photoUrl||e.photo);assert.equal(avatar.alt,e.name)}
  }
  assert.equal(w.document.querySelector('.wallet-front[data-employee-id="ESCAPED"] .wallet-person h2').textContent,employees.at(-1).name,'Names remain escaped text');
  assert.equal(w.document.querySelectorAll('.wallet-duplex-print .wallet-front .wallet-main img.avatar').length,4,'Duplex A4 uses the same photos');
  const image=w.document.querySelector('.wallet-card-sheet .wallet-front[data-employee-id="DATA"] .wallet-main img.avatar');
  image.dispatchEvent(new w.Event('error'));assert.equal(image.src,'https://example.test/url.png','A failed stored photo tries the saved URL');
  image.dispatchEvent(new w.Event('error'));assert.equal(image.src,'https://example.test/legacy.png','A failed URL tries the legacy photo');
  image.dispatchEvent(new w.Event('error'));assert.equal(image.isConnected,false);assert.equal(w.document.querySelector('.wallet-card-sheet .wallet-front[data-employee-id="DATA"] .avatar-fallback').textContent,'TD','All failures stop at initials');
  const select=w.document.getElementById('cardEmployee');select.value='DATA';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(200);
  assert.equal(w.document.querySelectorAll('.wallet-card-sheet .wallet-front').length,1);
  assert.equal(w.document.querySelector('.wallet-card-sheet .wallet-main img.avatar').getAttribute('src'),photo,'Individual view uses the saved upload');
  const print=new JSDOM('<body>'+w.walletCardMarkup(employees[0])+'</body>',{url:'https://example.test',runScripts:'dangerously'});
  try{const cloned=print.window.document.querySelector('.wallet-main img');cloned.dispatchEvent(new print.window.Event('error'));assert.equal(cloned.src,'https://example.test/url.png','Image fallbacks also work in the isolated print document without app scripts')}finally{print.window.close()}
  assert.deepEqual(errors,[],errors.join('\n'));
  console.log('Passed: actual Skill Card page, uploaded/URL/legacy photos, precedence, escaped names, missing and broken photos, individual/all-Section views, duplex print markup, and isolated print fallback. All service calls were mocked.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
