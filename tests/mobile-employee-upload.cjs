const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const {IDBFactory}=require(process.env.FAKE_INDEXEDDB_MODULE||'fake-indexeddb');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(p=>!/^https?:/.test(p));
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc,storageQuota:2200});
 const w=dom.window,factory=new IDBFactory();w.indexedDB=factory;
 const db={employees:[{id:'TEST',name:'TEST EMPLOYEE',section:'Stamping Section',position:'Operator',startDate:'2020-01-01',contractType:'Permanent'}],deletedEmployeeIds:[]};let etag=0,failNetwork=false;
 const alerts=[],urls=new Map(),revoked=[];let urlIndex=0;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.CSS={escape:s=>String(s)};
 Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 w.alert=message=>alerts.push(message);w.confirm=()=>false;w.prompt=()=>null;w.print=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 w.URL.createObjectURL=file=>{const url='blob:test-'+(++urlIndex);urls.set(url,file);return url};w.URL.revokeObjectURL=url=>revoked.push(url);
 w.Image=class{set src(url){const file=urls.get(url);this.tag=file.name;this.naturalWidth=4032;this.naturalHeight=3024;setTimeout(()=>this.onload(),file.name==='first.jpg'?60:5)}};
 w.HTMLCanvasElement.prototype.getContext=function(){return {fillRect(){},drawImage:image=>{this.tag=image.tag}}};
 w.HTMLCanvasElement.prototype.toDataURL=function(){assert.equal(this.width,480);assert.equal(this.height,360);return 'data:image/jpeg;base64,'+Buffer.from(this.tag.repeat(100)).toString('base64')};
 w.fetch=async(url,options={})=>{
  if(failNetwork)throw Error('offline test');
  const path=new URL(url).pathname.replace('/ppms/','').replace('.json','');
  if(options.method==='PUT'){
   assert.equal(options.headers['if-match'],String(etag));db[path]=JSON.parse(options.body);etag++;
  }
  return {ok:true,status:200,headers:{get:()=>String(etag)},json:async()=>structuredClone(path==='adminAccounts'?[{username:'tester',passwordHash:'test',active:true,owner:false}]:db[path]??null)};
 };
 w.localStorage.setItem('ppms_v3_employees',JSON.stringify(db.employees));
 w.localStorage.setItem('ppms_v768_admin_device_id','test-device');w.sessionStorage.setItem('ppms_device_lock_verified','test-device');w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_admin_user','tester');
 try{
  for(const script of scripts)w.eval(fs.readFileSync(script,'utf8')+'\n//# sourceURL='+script);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await w.ppmsErrorGuard.ready;await wait(300);
  assert(w.PPMS_RUNTIME,'The application initializes after durable storage hydration');
  w.openEmployeeEditor('TEST');let form=w.document.getElementById('employeeForm'),input=form.querySelector('#photoInput');
  const first=new w.File(['FIRST'],'first.jpg',{type:'image/jpeg'}),latest=new w.File(['LATEST'],'latest.jpg',{type:''});
  Object.defineProperty(input,'files',{value:[first],configurable:true});const a=input.onchange();
  Object.defineProperty(input,'files',{value:[latest],configurable:true});const b=input.onchange();
  await form.onsubmit({preventDefault(){}});await Promise.all([a,b]);
  assert.equal(Buffer.from(db.employees[0].photoData.split(',')[1],'base64').toString(),'latest.jpg'.repeat(100),'Submitting during preparation uploads the latest selected phone photo');
  assert.equal(revoked.length,2,'Original camera object URLs are released');
  assert(alerts.some(message=>message.includes('อัปโหลดรูปและบันทึกข้อมูลขึ้น Firebase เรียบร้อย')));
  assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves')),{},'Confirmed upload clears only its completed outbox revision');
  w.openEmployeeEditor('TEST');form=w.document.getElementById('employeeForm');input=form.querySelector('#photoInput');
  const offline=new w.File(['OFFLINE'],'offline.jpg',{type:'image/jpeg'});Object.defineProperty(input,'files',{value:[offline],configurable:true});
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});failNetwork=true;
  await form.onsubmit({preventDefault(){}});await w.ppmsErrorGuard.flushStorage();
  const job=JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves')).TEST;
  assert.equal(Buffer.from(job.data.photoData.split(',')[1],'base64').toString(),'offline.jpg'.repeat(100));
  assert(!w.document.getElementById('ppmsStorageNotice'),'Full Web Storage still has a committed offline upload queue');
  assert(alerts.some(message=>message.includes('เก็บข้อมูลและรูปไว้ในเครื่องแล้ว')));
  assert.deepEqual(errors,[],errors.join('\n'));
  console.log('Passed: actual Admin form, phone filename without MIME, compression, rapid photo reselection, immediate submit, Firebase confirmation, and durable offline photo save with full Web Storage.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
