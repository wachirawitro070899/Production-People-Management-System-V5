const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const {IDBFactory,IDBObjectStore}=require(process.env.FAKE_INDEXEDDB_MODULE||'fake-indexeddb');
const source=fs.readFileSync('error-guard-v652.js','utf8');
const pending='ppms_v3_pending_employee_saves',attendance='ppms_v3_attendance';
const photo='data:image/jpeg;base64,'+'A'.repeat(2400);
const edit=value=>JSON.stringify({TEST:{data:{id:'TEST',name:value,photoData:photo},originalId:'TEST'}});
async function open(factory,seed={},wait=true){
 const dom=new JSDOM('<body></body>',{url:'https://example.test',runScripts:'outside-only',storageQuota:550});
 const w=dom.window,nativeGet=w.Storage.prototype.getItem;
 for(const [key,value]of Object.entries(seed))w.localStorage.setItem(key,value);
 if(factory)w.indexedDB=factory;
 w.eval(source);
 if(wait&&w.ppmsErrorGuard.ready)await w.ppmsErrorGuard.ready;
 return {dom,w,snapshot:()=>{const out={};for(let i=0;i<w.localStorage.length;i++){const key=w.localStorage.key(i);out[key]=nativeGet.call(w.localStorage,key)}return out}};
}
(async()=>{
 const factory=new IDBFactory(),ledger=JSON.stringify([{employeeId:'TEST',pendingCloudSync:true,exception:{medicalCertificateFile:{dataUrl:'data:image/png;base64,KEEP'}}}]);
 let page=await open(factory,{[attendance]:ledger}),w=page.w;
 w.localStorage.setItem(pending,edit('FIRST'));
 assert.equal(w.localStorage.getItem(pending),edit('FIRST'));
 assert.equal(await w.ppmsErrorGuard.flushStorage([pending]),true,'A committed outbox is durable despite full Web Storage');
 assert.equal(w.localStorage.getItem(attendance),ledger,'Pending attendance and its attachment are not evicted');
 assert(!w.document.getElementById('ppmsStorageNotice'),'No false unsaved banner after IndexedDB commits');
 let seed=page.snapshot();assert.equal(seed[pending],'__ppms_indexeddb_v873__');page.dom.window.close();
 page=await open(factory,seed);w=page.w;
 assert.equal(w.localStorage.getItem(pending),edit('FIRST'),'Reload recovers the exact employee and photo');
 w.localStorage.setItem(pending,edit('SECOND'));w.localStorage.setItem(pending,edit('LATEST'));
 await w.ppmsErrorGuard.flushStorage();seed=page.snapshot();page.dom.window.close();
 page=await open(factory,seed);w=page.w;assert.equal(w.localStorage.getItem(pending),edit('LATEST'),'Rapid edits restore the newest revision');
 w.localStorage.setItem(pending,'{}');await w.ppmsErrorGuard.flushStorage();seed=page.snapshot();page.dom.window.close();
 page=await open(factory,seed);w=page.w;assert.equal(w.localStorage.getItem(pending),'{}','Acknowledged uploads do not return from IndexedDB');
 w.localStorage.setItem(pending,edit('REMOVE'));w.localStorage.removeItem(pending);await w.ppmsErrorGuard.flushStorage();seed=page.snapshot();page.dom.window.close();
 page=await open(factory,seed);w=page.w;assert.equal(w.localStorage.getItem(pending),null,'Removal wins over an outstanding asynchronous write');
 w.localStorage.setItem(pending,edit('CLEAR'));await w.ppmsErrorGuard.flushStorage();seed=page.snapshot();page.dom.window.close();
 page=await open(factory,seed,false);w=page.w;w.localStorage.clear();await w.ppmsErrorGuard.flushStorage();page.dom.window.close();
 page=await open(factory);assert.equal(page.w.localStorage.getItem(pending),null,'Clear during hydration cannot resurrect edits on the next reload');page.dom.window.close();
 page=await open(new IDBFactory());w=page.w;
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')};
 try{w.localStorage.setItem(pending,edit('FULL'));assert.equal(await w.ppmsErrorGuard.flushStorage([pending]),false);assert(w.document.getElementById('ppmsStorageNotice'),'A failed durable write is reported truthfully');assert.equal(w.localStorage.getItem(pending),edit('FULL'))}finally{IDBObjectStore.prototype.put=put;page.dom.window.close()}
 page=await open(null,{[attendance]:ledger});w=page.w;w.localStorage.setItem(pending,edit('NO DATABASE'));assert.equal(await w.ppmsErrorGuard.flushStorage([pending]),false);assert.equal(w.localStorage.getItem(attendance),ledger);assert(w.document.getElementById('ppmsStorageNotice'));page.dom.window.close();
 console.log('Passed: full mobile storage, durable photo outbox, reload recovery, newest revision, acknowledgment/removal/clear, and honest failure state without losing attendance attachments.');
})().catch(error=>{console.error(error);process.exitCode=1});
