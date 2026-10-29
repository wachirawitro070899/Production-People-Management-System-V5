const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dom=new JSDOM('<html><head></head><body><header></header><main>'+Array.from({length:1200},(_,i)=>'<p data-test-row="'+i+'">Safety</p>').join('')+'<span id="status">Safety</span></main></body></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let visits=0;const create=w.document.createTreeWalker.bind(w.document);w.document.createTreeWalker=(...args)=>{const walker=create(...args),next=walker.nextNode.bind(walker);walker.nextNode=()=>{visits++;return next()};return walker};
 w.alert=()=>{};w.confirm=()=>false;w.prompt=()=>'';w.eval(fs.readFileSync('language-v843.js','utf8'));w.PPMSLanguage.setLanguage('en');await wait(70);
 visits=0;w.document.getElementById('status').textContent='กรุณาระบุเวลาเข้าจริง';await wait(70);assert.equal(w.document.getElementById('status').textContent,'Enter the actual arrival time');assert(visits<20,'One changed label must not scan the 1,200 unchanged rows: '+visits);
 visits=0;const row=w.document.querySelector('[data-test-row]');row.setAttribute('title','กรุณาระบุเวลาเข้าจริง');await wait(70);assert.equal(row.title,'Enter the actual arrival time');assert(visits<20,'One changed attribute must stay local');
 visits=0;w.PPMSLanguage.setLanguage('th');assert(visits>1200,'Explicit language switch still translates the whole page');assert.equal(row.textContent,'ความปลอดภัย');dom.window.close();
 const db=new JSDOM('<html><body></body></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),v=db.window;let requests=[];
 v.PPMS_FIREBASE_CONFIG={databaseURL:'https://database.test'};let connected=true;
 v.getAppHealth=()=>({cloudReady:true,cloudConnected:connected});v.PPMS_RUNTIME={employeeRosterRevision:()=>1,applyEmployeeRosterSnapshot(){},applyEmployeeDeletionSnapshot(){}};
 v.fetch=async(url)=>{requests.push(String(url));return {ok:true,status:200,headers:{get:()=>null},json:async()=>({})}};
 v.eval(fs.readFileSync('employee-delete-v823.js','utf8'));v.dispatchEvent(new v.Event('focus'));await wait(40);assert.equal(requests.length,0,'Healthy realtime connection avoids duplicate full-roster polling');
 connected=false;v.dispatchEvent(new v.Event('focus'));await wait(40);assert(requests.some(url=>url.includes('/employees.json')),'REST roster fallback still works when realtime is disconnected');
 requests=[];Object.defineProperty(v.document,'visibilityState',{value:'hidden',configurable:true});v.dispatchEvent(new v.Event('focus'));await wait(40);assert.equal(requests.length,0,'Hidden pages do not download the full roster');v.close();
 console.log('PASS: small text/attribute changes scan only changed content; full TH/EN switching retained; no duplicate roster downloads during realtime sync; disconnected fallback retained; hidden pages idle.');
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
